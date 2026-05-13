/**
 * React Hooks for API Data Fetching
 *
 * Simple SWR-like hooks with caching, loading states, and error handling.
 * Replaces synchronous JSON imports with async API calls.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import api, { type GameResponse, type CouponsListResponse } from '../utils/api';

// Simple in-memory cache
const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 60_000; // 1 minute

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCache(key: string, data: unknown) {
  cache.set(key, { data, timestamp: Date.now() });
}

/* ===== useGames ===== */
export function useGames(includeShutdown = false) {
  const [games, setGames] = useState<GameResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const cacheKey = `games-${includeShutdown}`;
    const cached = getCached<GameResponse[]>(cacheKey);
    if (cached) {
      setGames(cached);
      setLoading(false);
      return;
    }

    let cancelled = false;
    api.getGames(includeShutdown)
      .then((data: GameResponse[]) => {
        if (!cancelled) {
          setGames(data);
          setCache(cacheKey, data);
          setLoading(false);
        }
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setError(err);
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [includeShutdown]);

  return { games, loading, error };
}

/* ===== useGame ===== */
export function useGame(slug: string | undefined) {
  const [game, setGame] = useState<GameResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }

    const cacheKey = `game-${slug}`;
    const cached = getCached<GameResponse>(cacheKey);
    if (cached) {
      setGame(cached);
      setLoading(false);
      return;
    }

    let cancelled = false;
    api.getGame(slug)
      .then((data: GameResponse) => {
        if (!cancelled) {
          setGame(data);
          setCache(cacheKey, data);
          setLoading(false);
        }
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setError(err);
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [slug]);

  return { game, loading, error };
}

/* ===== useCoupons ===== */
export function useCoupons(params?: {
  game?: string;
  status?: 'all' | 'active' | 'expired';
  page?: number;
  limit?: number;
}) {
  const [data, setData] = useState<CouponsListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const paramsRef = useRef(params);
  paramsRef.current = params;

  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api.getCoupons(paramsRef.current);
      setData(result);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [params?.game, params?.status, params?.page, params?.limit]);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  return {
    coupons: data?.coupons ?? [],
    pagination: data?.pagination ?? { page: 1, limit: 50, total: 0, totalPages: 0 },
    loading,
    error,
    refetch: fetchCoupons,
  };
}

/* ===== Helper: get game name from cached games ===== */
export function useGameName() {
  const { games } = useGames(true);
  return useCallback((slug: string, _locale: string = 'en') => {
    const game = games.find(g => g.slug === slug);
    return game?.nameEn || game?.name || slug;
  }, [games]);
}
