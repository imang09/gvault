/**
 * API Client
 *
 * Centralized fetch wrapper for communicating with the Gvault API server.
 * In development, Vite proxy routes /api → localhost:4000.
 * In production, same origin (Express serves both SPA and API).
 */

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

interface ApiOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
}

class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(status: number, message: string, data?: unknown) {
    super(message);
    this.status = status;
    this.data = data;
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {} } = options;

  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };

  if (body && method !== 'GET') {
    config.body = JSON.stringify(body);
  }

  const url = `${API_BASE}${path}`;
  const response = await fetch(url, config);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(
      response.status,
      (errorData as Record<string, string>).error || `HTTP ${response.status}`,
      errorData,
    );
  }

  return response.json() as Promise<T>;
}

/* ===== Coupons ===== */

export interface CouponResponse {
  id: string;
  gameSlug: string;
  code: string;
  description: string;
  descriptionEn: string;
  reward: string;
  rewardEn: string;
  issuedDate: string;
  expiryDate: string | null;
  expired: boolean;
  verified: boolean;
  source: string;
  sourceUrl: string;
  confidence: number;
  createdAt: string;
  updatedAt: string;
}

export interface CouponsListResponse {
  coupons: CouponResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface GameResponse {
  slug: string;
  name: string;
  nameEn: string;
  thumbnail: string;
  platforms: string[];
  webPlayable: boolean;
  webPlayUrl: string;
  officialSite: string;
  storeLinks: Record<string, string>;
  releaseDate: string;
  genre: string;
  activeCouponCount: number;
  isShutdown: boolean;
  shutdownDate?: string;
  description: string;
  descriptionEn: string;
  developer: string;
  peakPlayers: string;
  lastEvent: string;
  lastEventEn: string;
  shutdownReason: string;
  shutdownReasonEn: string;
  timeline: { date: string; event: string; eventEn?: string }[];
}

export interface ReportSubmission {
  gameSlug: string;
  code: string;
  description?: string;
  reward?: string;
  sourceUrl?: string;
  honeypot?: string;
}

export interface StatsResponse {
  totalCoupons: number;
  activeCoupons: number;
  totalGames: number;
  pendingReports: number;
  timestamp: string;
}

/* ===== API Functions ===== */

export const api = {
  // Games
  getGames: (includeShutdown = false) =>
    request<GameResponse[]>(`/games${includeShutdown ? '?includeShutdown=true' : ''}`),

  getGame: (slug: string) =>
    request<GameResponse>(`/games/${slug}`),

  // Coupons
  getCoupons: (params?: {
    game?: string;
    status?: 'all' | 'active' | 'expired';
    page?: number;
    limit?: number;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.game && params.game !== 'all') searchParams.set('game', params.game);
    if (params?.status) searchParams.set('status', params.status);
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    const qs = searchParams.toString();
    return request<CouponsListResponse>(`/coupons${qs ? `?${qs}` : ''}`);
  },

  getCoupon: (id: string) =>
    request<CouponResponse>(`/coupons/${id}`),

  // Reports (user submissions)
  submitReport: (report: ReportSubmission) =>
    request<{ success: boolean; reportId: number; message: string }>(
      '/reports',
      { method: 'POST', body: report },
    ),

  // Stats
  getStats: () =>
    request<StatsResponse>('/stats'),

  // Health
  getHealth: () =>
    request<{ status: string; timestamp: string }>('/health'),
};

export { ApiError };
export default api;
