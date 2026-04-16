import type { Game, Coupon, Character, ResellListing } from '../types';
import gamesData from '../data/games.json';
import couponsData from '../data/coupons.json';
import charactersData from '../data/characters.json';
import resellData from '../data/resell.json';

// Type assertions for JSON imports
const games = gamesData as Game[];
const coupons = couponsData as Coupon[];
const characters = charactersData as Character[];
const resellListings = resellData as ResellListing[];

/* ===== Games ===== */
export function getAllGames(): Game[] {
  return games.filter(g => !g.isShutdown);
}

export function getGameBySlug(slug: string): Game | undefined {
  return games.find(g => g.slug === slug);
}

export function getWebPlayableGames(): Game[] {
  return games.filter(g => g.webPlayable && !g.isShutdown);
}

export function getShutdownGames(): Game[] {
  return games.filter(g => g.isShutdown);
}

export function getUpcomingGames(): Game[] {
  const today = new Date().toISOString().split('T')[0];
  return games.filter(g => g.releaseDate > today && !g.isShutdown);
}

/* ===== Coupons ===== */
export function getAllCoupons(): Coupon[] {
  return coupons;
}

export function getActiveCoupons(): Coupon[] {
  return coupons.filter(c => !c.expired);
}

export function getCouponsByGame(gameSlug: string): Coupon[] {
  return coupons.filter(c => c.gameSlug === gameSlug);
}

export function getRecentCoupons(limit: number = 5): Coupon[] {
  return [...coupons]
    .filter(c => !c.expired)
    .sort((a, b) => b.issuedDate.localeCompare(a.issuedDate))
    .slice(0, limit);
}

export function getTodayCoupons(): Coupon[] {
  const today = new Date().toISOString().split('T')[0];
  return coupons.filter(c => c.issuedDate === today && !c.expired);
}

/* ===== Characters ===== */
export function getCharactersByGame(gameSlug: string): Character[] {
  return characters.filter(c => c.gameSlug === gameSlug);
}

export function getCharacterById(id: string): Character | undefined {
  return characters.find(c => c.id === id);
}

/* ===== Resell ===== */
export function getAllResellListings(): ResellListing[] {
  return resellListings;
}

export function getResellByGame(gameSlug: string): ResellListing[] {
  return resellListings.filter(r => r.gameSlug === gameSlug);
}

/* ===== Helpers ===== */
export function getGameName(slug: string, locale: string = 'ko'): string {
  const game = getGameBySlug(slug);
  if (!game) return slug;
  return locale === 'ko' ? game.name : game.nameEn;
}

export function formatDate(dateStr: string | null, locale: string = 'ko'): string {
  if (!dateStr) return locale === 'ko' ? '미정' : 'TBD';
  const date = new Date(dateStr);
  return date.toLocaleDateString(locale === 'ko' ? 'ko-KR' : locale === 'ja' ? 'ja-JP' : locale === 'zh' ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function getSourceIcon(source: string): string {
  const icons: Record<string, string> = {
    discord: '💬',
    youtube: '📺',
    twitter: '🐦',
    official: '🏛️',
    reddit: '🔶',
    other: '🔗',
  };
  return icons[source] || '🔗';
}

export function getSourceLabel(source: string): string {
  const labels: Record<string, string> = {
    discord: 'Discord',
    youtube: 'YouTube',
    twitter: 'Twitter/X',
    official: 'Official',
    reddit: 'Reddit',
    other: 'Other',
  };
  return labels[source] || source;
}
