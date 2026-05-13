/**
 * Data Utilities
 *
 * Helper functions shared across components.
 * Data fetching has moved to src/hooks/useApi.ts
 * This file retains formatting/display helpers only.
 */

/* ===== Helpers ===== */

export function formatDate(dateStr: string | null | undefined, locale: string = 'ko'): string {
  if (!dateStr) return 'TBD';
  const date = new Date(dateStr);
  const localeMap: Record<string, string> = {
    ko: 'ko-KR', en: 'en-US', ja: 'ja-JP', zh: 'zh-CN', 'zh-TW': 'zh-TW',
    ru: 'ru-RU', vi: 'vi-VN', th: 'th-TH', es: 'es-ES',
  };
  return date.toLocaleDateString(localeMap[locale] || 'en-US', {
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
    community: '👥',
    scraper: '🤖',
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
    community: 'Community',
    scraper: 'Auto',
    other: 'Other',
  };
  return labels[source] || source;
}
