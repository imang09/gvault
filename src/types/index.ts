/* ===== Game Types ===== */

export interface Game {
  slug: string;
  name: string;
  nameEn: string;
  thumbnail: string;
  platforms: Platform[];
  webPlayable: boolean;
  webPlayUrl?: string;
  officialSite: string;
  storeLinks: {
    android?: string;
    ios?: string;
  };
  releaseDate: string;
  genre: string;
  activeCouponCount: number;
  isShutdown?: boolean;
  shutdownDate?: string;
  description?: string;
  descriptionEn?: string;
  // Memorial-specific fields
  developer?: string;
  peakPlayers?: string;
  lastEvent?: string;
  lastEventEn?: string;
  shutdownReason?: string;
  shutdownReasonEn?: string;
  timeline?: { date: string; event: string; eventEn?: string }[];
}

export type Platform = 'Android' | 'iOS' | 'Web';

/* ===== Coupon Types ===== */

export interface Coupon {
  id: string;
  gameSlug: string;
  code: string;
  description: string;
  descriptionEn?: string;
  issuedDate: string;
  expiryDate: string | null; // null = 미정
  expired: boolean;
  source: CouponSource;
  sourceUrl?: string;
}

export type CouponSource = 'discord' | 'youtube' | 'twitter' | 'official' | 'reddit' | 'other';

/* ===== Character Types ===== */

export interface Character {
  id: string;
  gameSlug: string;
  name: string;
  nameEn?: string;
  rarity: Rarity;
  element: string;
  elementEn?: string;
  role: string;
  roleEn?: string;
  thumbnail: string;
  stats: CharacterStats;
  skills: Skill[];
  recommendedDecks: DeckRecommendation[];
  recommendedGear: GearRecommendation[];
}

export type Rarity = 'SSR' | 'SR' | 'R' | 'N';

export interface CharacterStats {
  attack: number;
  hp: number;
  defense: number;
  speed: number;
  critRate: number;
  critDamage: number;
}

export interface Skill {
  name: string;
  nameEn?: string;
  type: 'active' | 'passive' | 'ultimate';
  description: string;
  descriptionEn?: string;
  cooldown?: number;
}

export interface DeckRecommendation {
  deckName: string;
  deckNameEn?: string;
  description: string;
  descriptionEn?: string;
}

export interface GearRecommendation {
  setName: string;
  setNameEn?: string;
  options: string;
  optionsEn?: string;
  reason: string;
  reasonEn?: string;
}

/* ===== Resell Types ===== */

export interface ResellListing {
  id: string;
  gameSlug: string;
  server: string;
  serverEn?: string;
  accountLevel: number;
  ssrCount: number;
  srCount: number;
  description: string;
  descriptionEn?: string;
  price: string;
  source: string;
  sourceUrl?: string;
  contact: string;
  postedDate: string;
}

/* ===== i18n Types ===== */

export type Locale = 'ko' | 'en' | 'ja' | 'zh';

export interface TranslationStrings {
  [key: string]: string | TranslationStrings;
}
