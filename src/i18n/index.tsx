import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { Locale } from '../types';

/* ===== Translation Data ===== */
const translations: Record<Locale, Record<string, string>> = {
  ko: {
    // Navigation
    'nav.home': '홈',
    'nav.coupons': '쿠폰',
    'nav.games': '게임',
    'nav.play': '웹 체험',
    'nav.resell': '리세마라 매물',
    'nav.memorial': '추모관',

    // Home
    'home.hero.title': '게임 정보, 한눈에',
    'home.hero.subtitle': '쿠폰, 캐릭터 정보, 리세마라 매물까지 — 객관적인 데이터만 모았습니다.',
    'home.coupons.title': '🎫 오늘의 새 쿠폰',
    'home.coupons.viewAll': '전체 보기',
    'home.games.title': '🎮 등록된 게임',
    'home.play.title': '🌐 웹에서 바로 체험',
    'home.resell.title': '💎 리세마라 매물',
    'home.schedule.title': '📅 신작 출시 일정',
    'home.memorial.title': '🕯️ 서비스 종료 게임',

    // Coupons
    'coupons.title': '전체 쿠폰',
    'coupons.filter.all': '전체',
    'coupons.selectGame': '🎮 게임 선택',
    'coupons.filter.active': '유효',
    'coupons.filter.expired': '만료',
    'coupons.code': '코드',
    'coupons.game': '게임',
    'coupons.issued': '발행일',
    'coupons.expiry': '만료일',
    'coupons.source': '출처',
    'coupons.copy': '복사',
    'coupons.copied': '복사됨!',
    'coupons.unknown': '미정',
    'coupons.expired': '만료됨',
    'coupons.active': '유효',
    'coupons.noCoupons': '등록된 쿠폰이 없습니다.',
    'coupons.activeCoupons': '개의 유효한 쿠폰',

    // Game Detail
    'game.platforms': '플랫폼',
    'game.officialSite': '공식 사이트',
    'game.store': '스토어',
    'game.coupons': '쿠폰 보기',
    'game.characters': '캐릭터 정보',
    'game.play': '웹 체험',
    'game.resell': '리세마라 매물',
    'game.releaseDate': '출시일',
    'game.genre': '장르',
    'game.webPlayable': '웹 플레이 가능',
    'game.notFound': '게임을 찾을 수 없습니다.',

    // Characters
    'characters.title': '캐릭터 목록',
    'characters.stats': '기본 스탯',
    'characters.skills': '스킬 정보',
    'characters.decks': '추천 덱 조합',
    'characters.gear': '추천 장비',
    'characters.attack': '공격력',
    'characters.hp': 'HP',
    'characters.defense': '방어력',
    'characters.speed': '속도',
    'characters.critRate': '치명타 확률',
    'characters.critDamage': '치명타 피해',
    'characters.active': '액티브',
    'characters.passive': '패시브',
    'characters.ultimate': '궁극기',
    'characters.cooldown': '쿨다운',
    'characters.notFound': '캐릭터를 찾을 수 없습니다.',

    // Resell
    'resell.title': '리세마라 계정 매물',
    'resell.disclaimer': '이 사이트는 중개가 아닌 정보 정리/연결 목적입니다. 거래 시 주의하세요.',
    'resell.server': '서버',
    'resell.level': '레벨',
    'resell.ssr': 'SSR',
    'resell.sr': 'SR',
    'resell.price': '가격',
    'resell.contact': '연락처',
    'resell.posted': '등록일',
    'resell.noListings': '등록된 매물이 없습니다.',

    // Play
    'play.title': '웹에서 바로 체험',
    'play.subtitle': '브라우저에서 바로 플레이할 수 있는 게임 모음',
    'play.button': '지금 플레이',
    'play.noGames': '웹 체험 가능한 게임이 없습니다.',

    // Memorial
    'memorial.title': '추모관',
    'memorial.subtitle': '서비스가 종료된 게임들을 기억합니다. 함께했던 시간을 되돌아봅니다.',
    'memorial.shutdownDate': '서비스 종료일',
    'memorial.noGames': '서비스 종료된 게임이 없습니다.',
    'memorial.restInPeace': '영원히 기억합니다',
    'memorial.servicePeriod': '서비스 기간',
    'memorial.developer': '개발사',
    'memorial.peakPlayers': '최대 동접',
    'memorial.lastEvent': '마지막 이벤트',
    'memorial.description': '한줄 소개',
    'memorial.timeline': '주요 연혁',
    'memorial.shutdownReason': '종료 사유',

    // Common
    'common.loading': '로딩 중...',
    'common.error': '오류가 발생했습니다.',
    'common.back': '뒤로',
    'common.viewMore': '더 보기',
    'common.search': '검색...',
    'common.noResults': '결과가 없습니다.',

    // Footer
    'footer.description': '객관적인 게임 정보만을 제공합니다.',
    'footer.links': '바로가기',
    'footer.legal': '법적 고지',
    'footer.copyright': '© 2026 Gvault. All rights reserved.',
    'footer.disclaimer': '이 사이트는 비공식 팬 사이트입니다.',
  },

  en: {
    'nav.home': 'Home',
    'nav.coupons': 'Coupons',
    'nav.games': 'Games',
    'nav.play': 'Web Play',
    'nav.resell': 'Reroll Market',
    'nav.memorial': 'Memorial',

    'home.hero.title': 'Game Info at a Glance',
    'home.hero.subtitle': 'Coupons, character data, reroll listings — objective data only.',
    'home.coupons.title': '🎫 New Coupons Today',
    'home.coupons.viewAll': 'View All',
    'home.games.title': '🎮 Registered Games',
    'home.play.title': '🌐 Play on Web',
    'home.resell.title': '💎 Reroll Listings',
    'home.schedule.title': '📅 Upcoming Releases',
    'home.memorial.title': '🕯️ Discontinued Games',

    'coupons.title': 'All Coupons',
    'coupons.filter.all': 'All',
    'coupons.selectGame': '🎮 Select Game',
    'coupons.filter.active': 'Active',
    'coupons.filter.expired': 'Expired',
    'coupons.code': 'Code',
    'coupons.game': 'Game',
    'coupons.issued': 'Issued',
    'coupons.expiry': 'Expires',
    'coupons.source': 'Source',
    'coupons.copy': 'Copy',
    'coupons.copied': 'Copied!',
    'coupons.unknown': 'TBD',
    'coupons.expired': 'Expired',
    'coupons.active': 'Active',
    'coupons.noCoupons': 'No coupons available.',
    'coupons.activeCoupons': 'active coupons',

    'game.platforms': 'Platforms',
    'game.officialSite': 'Official Site',
    'game.store': 'Store',
    'game.coupons': 'View Coupons',
    'game.characters': 'Characters',
    'game.play': 'Web Play',
    'game.resell': 'Reroll Listings',
    'game.releaseDate': 'Release Date',
    'game.genre': 'Genre',
    'game.webPlayable': 'Web Playable',
    'game.notFound': 'Game not found.',

    'characters.title': 'Characters',
    'characters.stats': 'Base Stats',
    'characters.skills': 'Skills',
    'characters.decks': 'Recommended Decks',
    'characters.gear': 'Recommended Gear',
    'characters.attack': 'ATK',
    'characters.hp': 'HP',
    'characters.defense': 'DEF',
    'characters.speed': 'SPD',
    'characters.critRate': 'Crit Rate',
    'characters.critDamage': 'Crit DMG',
    'characters.active': 'Active',
    'characters.passive': 'Passive',
    'characters.ultimate': 'Ultimate',
    'characters.cooldown': 'Cooldown',
    'characters.notFound': 'Character not found.',

    'resell.title': 'Reroll Account Market',
    'resell.disclaimer': 'This site is for information purposes only, not for brokering. Trade at your own risk.',
    'resell.server': 'Server',
    'resell.level': 'Level',
    'resell.ssr': 'SSR',
    'resell.sr': 'SR',
    'resell.price': 'Price',
    'resell.contact': 'Contact',
    'resell.posted': 'Posted',
    'resell.noListings': 'No listings available.',

    'play.title': 'Play on Web',
    'play.subtitle': 'Games you can play right in your browser',
    'play.button': 'Play Now',
    'play.noGames': 'No web-playable games available.',

    'memorial.title': 'Memorial',
    'memorial.subtitle': 'Remembering games that have been discontinued. Honoring the time we shared.',
    'memorial.shutdownDate': 'Shutdown Date',
    'memorial.noGames': 'No discontinued games.',
    'memorial.restInPeace': 'Forever remembered',
    'memorial.servicePeriod': 'Service Period',
    'memorial.developer': 'Developer',
    'memorial.peakPlayers': 'Peak Players',
    'memorial.lastEvent': 'Last Event',
    'memorial.description': 'Summary',
    'memorial.timeline': 'Key Milestones',
    'memorial.shutdownReason': 'Shutdown Reason',

    'common.loading': 'Loading...',
    'common.error': 'An error occurred.',
    'common.back': 'Back',
    'common.viewMore': 'View More',
    'common.search': 'Search...',
    'common.noResults': 'No results.',

    'footer.description': 'Providing objective game information only.',
    'footer.links': 'Quick Links',
    'footer.legal': 'Legal',
    'footer.copyright': '© 2026 Gvault. All rights reserved.',
    'footer.disclaimer': 'This is an unofficial fan site.',
  },

  ja: {
    'nav.home': 'ホーム',
    'nav.coupons': 'クーポン',
    'nav.games': 'ゲーム',
    'nav.play': 'Web体験',
    'nav.resell': 'リセマラ',
    'nav.memorial': '追悼',

    'home.hero.title': 'ゲーム情報を一目で',
    'home.hero.subtitle': 'クーポン、キャラ情報、リセマラ — 客観的データのみ。',
    'home.coupons.title': '🎫 本日の新クーポン',
    'home.coupons.viewAll': 'すべて見る',
    'home.games.title': '🎮 登録ゲーム',
    'home.play.title': '🌐 Webで体験',
    'home.resell.title': '💎 リセマラ販売',
    'home.schedule.title': '📅 新作リリース予定',
    'home.memorial.title': '🕯️ サービス終了ゲーム',

    'coupons.title': '全クーポン',
    'coupons.filter.all': 'すべて',
    'coupons.selectGame': '🎮 ゲーム選択',
    'coupons.filter.active': '有効',
    'coupons.filter.expired': '期限切れ',
    'coupons.code': 'コード',
    'coupons.game': 'ゲーム',
    'coupons.issued': '発行日',
    'coupons.expiry': '有効期限',
    'coupons.source': 'ソース',
    'coupons.copy': 'コピー',
    'coupons.copied': 'コピー済み!',
    'coupons.unknown': '未定',
    'coupons.expired': '期限切れ',
    'coupons.active': '有効',
    'coupons.noCoupons': '登録されたクーポンはありません。',
    'coupons.activeCoupons': '有効クーポン',

    'game.platforms': 'プラットフォーム',
    'game.officialSite': '公式サイト',
    'game.store': 'ストア',
    'game.coupons': 'クーポン',
    'game.characters': 'キャラ情報',
    'game.play': 'Web体験',
    'game.resell': 'リセマラ販売',
    'game.releaseDate': 'リリース日',
    'game.genre': 'ジャンル',
    'game.webPlayable': 'Webプレイ可能',
    'game.notFound': 'ゲームが見つかりません。',

    'characters.title': 'キャラクター一覧',
    'characters.stats': '基本ステータス',
    'characters.skills': 'スキル情報',
    'characters.decks': 'おすすめデッキ',
    'characters.gear': 'おすすめ装備',
    'characters.attack': '攻撃力',
    'characters.hp': 'HP',
    'characters.defense': '防御力',
    'characters.speed': '速度',
    'characters.critRate': 'クリ率',
    'characters.critDamage': 'クリダメ',
    'characters.active': 'アクティブ',
    'characters.passive': 'パッシブ',
    'characters.ultimate': '必殺技',
    'characters.cooldown': 'クールダウン',
    'characters.notFound': 'キャラが見つかりません。',

    'resell.title': 'リセマラアカウント販売',
    'resell.disclaimer': 'このサイトは仲介ではなく、情報提供目的です。取引にご注意ください。',
    'resell.server': 'サーバー',
    'resell.level': 'レベル',
    'resell.ssr': 'SSR',
    'resell.sr': 'SR',
    'resell.price': '価格',
    'resell.contact': '連絡先',
    'resell.posted': '登録日',
    'resell.noListings': '登録された販売品はありません。',

    'play.title': 'Webで体験',
    'play.subtitle': 'ブラウザですぐプレイできるゲーム',
    'play.button': '今すぐプレイ',
    'play.noGames': 'Web体験可能なゲームはありません。',

    'memorial.title': '追悼',
    'memorial.subtitle': 'サービスが終了したゲームを覚えています。共にした時間を振り返ります。',
    'memorial.shutdownDate': 'サービス終了日',
    'memorial.noGames': 'サービス終了したゲームはありません。',
    'memorial.restInPeace': '永遠に記憶します',
    'memorial.servicePeriod': 'サービス期間',
    'memorial.developer': '開発社',
    'memorial.peakPlayers': '最大同時接続',
    'memorial.lastEvent': '最後のイベント',
    'memorial.description': '概要',
    'memorial.timeline': '主な沿革',
    'memorial.shutdownReason': '終了理由',

    'common.loading': '読み込み中...',
    'common.error': 'エラーが発生しました。',
    'common.back': '戻る',
    'common.viewMore': 'もっと見る',
    'common.search': '検索...',
    'common.noResults': '結果がありません。',

    'footer.description': '客観的なゲーム情報のみ提供します。',
    'footer.links': 'クイックリンク',
    'footer.legal': '法的事項',
    'footer.copyright': '© 2026 Gvault. All rights reserved.',
    'footer.disclaimer': 'これは非公式ファンサイトです。',
  },

  zh: {
    'nav.home': '首页',
    'nav.coupons': '兑换码',
    'nav.games': '游戏',
    'nav.play': '在线体验',
    'nav.resell': '初始号',
    'nav.memorial': '追忆',

    'home.hero.title': '游戏信息一目了然',
    'home.hero.subtitle': '兑换码、角色数据、初始号 — 只提供客观数据。',
    'home.coupons.title': '🎫 今日新兑换码',
    'home.coupons.viewAll': '查看全部',
    'home.games.title': '🎮 已收录游戏',
    'home.play.title': '🌐 在线体验',
    'home.resell.title': '💎 初始号',
    'home.schedule.title': '📅 新游上线日程',
    'home.memorial.title': '🕯️ 已停服游戏',

    'coupons.title': '全部兑换码',
    'coupons.filter.all': '全部',
    'coupons.selectGame': '🎮 选择游戏',
    'coupons.filter.active': '有效',
    'coupons.filter.expired': '已过期',
    'coupons.code': '兑换码',
    'coupons.game': '游戏',
    'coupons.issued': '发布日期',
    'coupons.expiry': '截止日期',
    'coupons.source': '来源',
    'coupons.copy': '复制',
    'coupons.copied': '已复制！',
    'coupons.unknown': '待定',
    'coupons.expired': '已过期',
    'coupons.active': '有效',
    'coupons.noCoupons': '暂无兑换码。',
    'coupons.activeCoupons': '个有效兑换码',

    'game.platforms': '平台',
    'game.officialSite': '官网',
    'game.store': '商店',
    'game.coupons': '查看兑换码',
    'game.characters': '角色信息',
    'game.play': '在线体验',
    'game.resell': '初始号',
    'game.releaseDate': '上线日期',
    'game.genre': '类型',
    'game.webPlayable': '网页可玩',
    'game.notFound': '未找到游戏。',

    'characters.title': '角色列表',
    'characters.stats': '基础属性',
    'characters.skills': '技能信息',
    'characters.decks': '推荐阵容',
    'characters.gear': '推荐装备',
    'characters.attack': '攻击力',
    'characters.hp': 'HP',
    'characters.defense': '防御力',
    'characters.speed': '速度',
    'characters.critRate': '暴击率',
    'characters.critDamage': '暴击伤害',
    'characters.active': '主动',
    'characters.passive': '被动',
    'characters.ultimate': '终极技',
    'characters.cooldown': '冷却',
    'characters.notFound': '未找到角色。',

    'resell.title': '初始号交易',
    'resell.disclaimer': '本站仅提供信息整理，不进行中介交易，请谨慎交易。',
    'resell.server': '服务器',
    'resell.level': '等级',
    'resell.ssr': 'SSR',
    'resell.sr': 'SR',
    'resell.price': '价格',
    'resell.contact': '联系方式',
    'resell.posted': '发布日期',
    'resell.noListings': '暂无交易信息。',

    'play.title': '在线体验',
    'play.subtitle': '可在浏览器中直接体验的游戏',
    'play.button': '立即体验',
    'play.noGames': '暂无可在线体验的游戏。',

    'memorial.title': '追忆',
    'memorial.subtitle': '纪念已停服的游戏。回顾我们一起走过的时光。',
    'memorial.shutdownDate': '停服日期',
    'memorial.noGames': '暂无停服游戏。',
    'memorial.restInPeace': '永远铭记',
    'memorial.servicePeriod': '运营时间',
    'memorial.developer': '开发商',
    'memorial.peakPlayers': '最高在线',
    'memorial.lastEvent': '最后活动',
    'memorial.description': '简介',
    'memorial.timeline': '重要里程碑',
    'memorial.shutdownReason': '停服原因',

    'common.loading': '加载中...',
    'common.error': '发生错误。',
    'common.back': '返回',
    'common.viewMore': '查看更多',
    'common.search': '搜索...',
    'common.noResults': '无结果。',

    'footer.description': '只提供客观的游戏信息。',
    'footer.links': '快速链接',
    'footer.legal': '法律声明',
    'footer.copyright': '© 2026 Gvault. All rights reserved.',
    'footer.disclaimer': '这是一个非官方粉丝网站。',
  },
};

/* ===== i18n Context ===== */
interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(() => {
    const saved = localStorage.getItem('gvault-locale');
    if (saved && ['ko', 'en', 'ja', 'zh'].includes(saved)) {
      return saved as Locale;
    }
    const browserLang = navigator.language.slice(0, 2);
    if (['ko', 'en', 'ja', 'zh'].includes(browserLang)) {
      return browserLang as Locale;
    }
    return 'ko';
  });

  const handleSetLocale = useCallback((newLocale: Locale) => {
    setLocale(newLocale);
    localStorage.setItem('gvault-locale', newLocale);
    document.documentElement.lang = newLocale;
  }, []);

  const t = useCallback((key: string): string => {
    return translations[locale]?.[key] || translations['ko']?.[key] || key;
  }, [locale]);

  return (
    <I18nContext.Provider value={{ locale, setLocale: handleSetLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

export const LOCALE_LABELS: Record<Locale, string> = {
  ko: '한국어',
  en: 'English',
  ja: '日本語',
  zh: '中文',
};
