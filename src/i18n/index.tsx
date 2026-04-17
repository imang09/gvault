import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { Locale } from '../types';

/* ===== Clipboard Utility (HTTP fallback) ===== */
export async function copyToClipboard(text: string): Promise<boolean> {
  // Try modern API first
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch { /* fallback below */ }
  }
  // Fallback for HTTP
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    return true;
  } catch {
    return false;
  }
}

/* ===== Country → Locale mapping ===== */
const COUNTRY_LOCALE_MAP: Record<string, Locale> = {
  KR: 'ko',
  RU: 'ru', BY: 'ru', KZ: 'ru', UA: 'ru',
  TW: 'zh-TW', HK: 'zh-TW', MO: 'zh-TW',
  CN: 'zh', SG: 'zh',
  VN: 'vi',
  TH: 'th',
  JP: 'ja',
  ES: 'es', MX: 'es', AR: 'es', CO: 'es', CL: 'es', PE: 'es',
  US: 'en', GB: 'en', AU: 'en', CA: 'en', NZ: 'en', IN: 'en',
};

const ALL_LOCALES: Locale[] = ['ko', 'en', 'ja', 'zh', 'zh-TW', 'ru', 'vi', 'th', 'es'];

async function detectLocaleByIP(): Promise<Locale> {
  try {
    const res = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(3000) });
    const data = await res.json();
    const country = data.country_code as string;
    return COUNTRY_LOCALE_MAP[country] || 'en';
  } catch {
    return 'en';
  }
}

/* ===== Translation Data ===== */
const ko: Record<string, string> = {
  'nav.home': '홈',
  'nav.coupons': '쿠폰',
  'nav.games': '게임',
  'nav.play': '웹 게임',
  'nav.resell': '리세마라 매물',
  'nav.memorial': '추모관',

  'home.coupons.title': '🎫 최신 쿠폰',
  'home.coupons.viewAll': '전체 보기',
  'home.games.title': '🎮 등록된 게임',
  'home.play.title': '🌐 웹 게임 바로가기',
  'home.resell.title': '💎 리세마라 매물',
  'home.schedule.title': '📅 신작 출시 일정',
  'home.memorial.title': '🕯️ 서비스 종료 게임',

  'coupons.title': '전체 쿠폰',
  'coupons.filter.all': '전체',
  'coupons.selectGame': '🎮 게임 선택',
  'coupons.filter.active': '유효',
  'coupons.filter.expired': '만료',
  'coupons.copy': '복사',
  'coupons.copied': '복사됨!',
  'coupons.unknown': '미정',
  'coupons.expired': '만료됨',
  'coupons.active': '유효',
  'coupons.noCoupons': '등록된 쿠폰이 없습니다.',
  'coupons.activeCoupons': '개의 유효한 쿠폰',

  'game.platforms': '플랫폼',
  'game.officialSite': '공식 사이트',
  'game.store': '스토어',
  'game.coupons': '쿠폰 보기',
  'game.characters': '캐릭터 정보',
  'game.play': '웹 게임',
  'game.resell': '리세마라 매물',
  'game.releaseDate': '출시일',
  'game.genre': '장르',
  'game.webPlayable': '웹 플레이 가능',
  'game.notFound': '게임을 찾을 수 없습니다.',

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

  'resell.title': '리세마라 계정 매물',
  'resell.disclaimer': '이 사이트는 중개가 아닌 정보 정리/연결 목적입니다. 거래 시 주의하세요.',
  'resell.server': '서버',
  'resell.level': '레벨',
  'resell.ssr': 'SSR',
  'resell.sr': 'SR',
  'resell.price': '가격',
  'resell.contact': '연락처',
  'resell.noListings': '등록된 매물이 없습니다.',

  'play.title': '웹 게임 바로가기',
  'play.subtitle': '브라우저에서 바로 플레이할 수 있는 게임 링크 모음',
  'play.button': '지금 플레이',
  'play.noGames': '웹 게임 링크가 없습니다.',

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

  'common.loading': '로딩 중...',
  'common.error': '오류가 발생했습니다.',
  'common.back': '뒤로',
  'common.viewMore': '더 보기',
  'common.search': '검색...',
  'common.noResults': '결과가 없습니다.',

  'footer.description': '객관적인 게임 정보만을 제공합니다.',
  'footer.links': '바로가기',
  'footer.legal': '법적 고지',
  'footer.copyright': '© 2026 Gvault. All rights reserved.',
  'footer.disclaimer': '이 사이트는 비공식 팬 사이트입니다.',
};

const en: Record<string, string> = {
  'nav.home': 'Home',
  'nav.coupons': 'Coupons',
  'nav.games': 'Games',
  'nav.play': 'Web Games',
  'nav.resell': 'Reroll Market',
  'nav.memorial': 'Memorial',

  'home.coupons.title': '🎫 Latest Coupons',
  'home.coupons.viewAll': 'View All',
  'home.games.title': '🎮 Registered Games',
  'home.play.title': '🌐 Web Game Links',
  'home.resell.title': '💎 Reroll Listings',
  'home.schedule.title': '📅 Upcoming Releases',
  'home.memorial.title': '🕯️ Discontinued Games',

  'coupons.title': 'All Coupons',
  'coupons.filter.all': 'All',
  'coupons.selectGame': '🎮 Select Game',
  'coupons.filter.active': 'Active',
  'coupons.filter.expired': 'Expired',
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
  'game.play': 'Web Game',
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
  'resell.disclaimer': 'This site is for information only, not brokering. Trade at your own risk.',
  'resell.server': 'Server',
  'resell.level': 'Level',
  'resell.ssr': 'SSR',
  'resell.sr': 'SR',
  'resell.price': 'Price',
  'resell.contact': 'Contact',
  'resell.noListings': 'No listings available.',

  'play.title': 'Web Game Links',
  'play.subtitle': 'Games you can play directly in your browser',
  'play.button': 'Play Now',
  'play.noGames': 'No web games available.',

  'memorial.title': 'Memorial',
  'memorial.subtitle': 'Remembering discontinued games. Honoring the time we shared.',
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
};

const ja: Record<string, string> = {
  'nav.home': 'ホーム', 'nav.coupons': 'クーポン', 'nav.games': 'ゲーム',
  'nav.play': 'Webゲーム', 'nav.resell': 'リセマラ', 'nav.memorial': '追悼',
  'home.coupons.title': '🎫 最新クーポン', 'home.coupons.viewAll': 'すべて見る',
  'home.games.title': '🎮 登録ゲーム', 'home.play.title': '🌐 Webゲームリンク',
  'home.resell.title': '💎 リセマラ販売', 'home.schedule.title': '📅 新作リリース予定',
  'home.memorial.title': '🕯️ サービス終了ゲーム',
  'coupons.title': '全クーポン', 'coupons.filter.all': 'すべて',
  'coupons.selectGame': '🎮 ゲーム選択',
  'coupons.filter.active': '有効', 'coupons.filter.expired': '期限切れ',
  'coupons.copy': 'コピー', 'coupons.copied': 'コピー済み!',
  'coupons.unknown': '未定', 'coupons.expired': '期限切れ', 'coupons.active': '有効',
  'coupons.noCoupons': '登録クーポンなし。', 'coupons.activeCoupons': '有効クーポン',
  'game.platforms': 'プラットフォーム', 'game.officialSite': '公式サイト',
  'game.store': 'ストア', 'game.coupons': 'クーポン', 'game.characters': 'キャラ情報',
  'game.play': 'Webゲーム', 'game.resell': 'リセマラ販売',
  'game.releaseDate': 'リリース日', 'game.genre': 'ジャンル',
  'game.webPlayable': 'Webプレイ可能', 'game.notFound': 'ゲームが見つかりません。',
  'characters.title': 'キャラクター一覧', 'characters.stats': '基本ステータス',
  'characters.skills': 'スキル情報', 'characters.decks': 'おすすめデッキ',
  'characters.gear': 'おすすめ装備', 'characters.attack': '攻撃力', 'characters.hp': 'HP',
  'characters.defense': '防御力', 'characters.speed': '速度',
  'characters.critRate': 'クリ率', 'characters.critDamage': 'クリダメ',
  'characters.active': 'アクティブ', 'characters.passive': 'パッシブ',
  'characters.ultimate': '必殺技', 'characters.cooldown': 'クールダウン',
  'characters.notFound': 'キャラが見つかりません。',
  'resell.title': 'リセマラアカウント販売',
  'resell.disclaimer': '情報提供目的です。取引にご注意ください。',
  'resell.server': 'サーバー', 'resell.level': 'レベル',
  'resell.ssr': 'SSR', 'resell.sr': 'SR', 'resell.price': '価格',
  'resell.contact': '連絡先', 'resell.noListings': '販売品なし。',
  'play.title': 'Webゲームリンク', 'play.subtitle': 'ブラウザですぐプレイできるゲームリンク',
  'play.button': '今すぐプレイ', 'play.noGames': 'Webゲームなし。',
  'memorial.title': '追悼', 'memorial.subtitle': 'サービス終了したゲームを覚えています。',
  'memorial.shutdownDate': 'サービス終了日', 'memorial.noGames': 'サービス終了ゲームなし。',
  'memorial.restInPeace': '永遠に記憶します',
  'memorial.servicePeriod': 'サービス期間', 'memorial.developer': '開発社',
  'memorial.peakPlayers': '最大同時接続', 'memorial.lastEvent': '最後のイベント',
  'memorial.description': '概要', 'memorial.timeline': '主な沿革',
  'memorial.shutdownReason': '終了理由',
  'common.loading': '読み込み中...', 'common.error': 'エラー。', 'common.back': '戻る',
  'common.viewMore': 'もっと見る', 'common.search': '検索...', 'common.noResults': '結果なし。',
  'footer.description': '客観的なゲーム情報のみ提供。', 'footer.links': 'クイックリンク',
  'footer.legal': '法的事項', 'footer.copyright': '© 2026 Gvault. All rights reserved.',
  'footer.disclaimer': '非公式ファンサイトです。',
};

const zh: Record<string, string> = {
  'nav.home': '首页', 'nav.coupons': '兑换码', 'nav.games': '游戏',
  'nav.play': '网页游戏', 'nav.resell': '初始号', 'nav.memorial': '追忆',
  'home.coupons.title': '🎫 最新兑换码', 'home.coupons.viewAll': '查看全部',
  'home.games.title': '🎮 已收录游戏', 'home.play.title': '🌐 网页游戏链接',
  'home.resell.title': '💎 初始号', 'home.schedule.title': '📅 新游上线日程',
  'home.memorial.title': '🕯️ 已停服游戏',
  'coupons.title': '全部兑换码', 'coupons.filter.all': '全部',
  'coupons.selectGame': '🎮 选择游戏',
  'coupons.filter.active': '有效', 'coupons.filter.expired': '已过期',
  'coupons.copy': '复制', 'coupons.copied': '已复制！',
  'coupons.unknown': '待定', 'coupons.expired': '已过期', 'coupons.active': '有效',
  'coupons.noCoupons': '暂无兑换码。', 'coupons.activeCoupons': '个有效兑换码',
  'game.platforms': '平台', 'game.officialSite': '官网', 'game.store': '商店',
  'game.coupons': '查看兑换码', 'game.characters': '角色信息',
  'game.play': '网页游戏', 'game.resell': '初始号',
  'game.releaseDate': '上线日期', 'game.genre': '类型',
  'game.webPlayable': '网页可玩', 'game.notFound': '未找到游戏。',
  'characters.title': '角色列表', 'characters.stats': '基础属性',
  'characters.skills': '技能信息', 'characters.decks': '推荐阵容',
  'characters.gear': '推荐装备', 'characters.attack': '攻击力', 'characters.hp': 'HP',
  'characters.defense': '防御力', 'characters.speed': '速度',
  'characters.critRate': '暴击率', 'characters.critDamage': '暴击伤害',
  'characters.active': '主动', 'characters.passive': '被动',
  'characters.ultimate': '终极技', 'characters.cooldown': '冷却',
  'characters.notFound': '未找到角色。',
  'resell.title': '初始号交易', 'resell.disclaimer': '本站仅提供信息，请谨慎交易。',
  'resell.server': '服务器', 'resell.level': '等级',
  'resell.ssr': 'SSR', 'resell.sr': 'SR', 'resell.price': '价格',
  'resell.contact': '联系方式', 'resell.noListings': '暂无交易信息。',
  'play.title': '网页游戏链接', 'play.subtitle': '可在浏览器中直接体验的游戏',
  'play.button': '立即体验', 'play.noGames': '暂无网页游戏。',
  'memorial.title': '追忆', 'memorial.subtitle': '纪念已停服的游戏。',
  'memorial.shutdownDate': '停服日期', 'memorial.noGames': '暂无停服游戏。',
  'memorial.restInPeace': '永远铭记',
  'memorial.servicePeriod': '运营时间', 'memorial.developer': '开发商',
  'memorial.peakPlayers': '最高在线', 'memorial.lastEvent': '最后活动',
  'memorial.description': '简介', 'memorial.timeline': '重要里程碑',
  'memorial.shutdownReason': '停服原因',
  'common.loading': '加载中...', 'common.error': '发生错误。', 'common.back': '返回',
  'common.viewMore': '查看更多', 'common.search': '搜索...', 'common.noResults': '无结果。',
  'footer.description': '只提供客观的游戏信息。', 'footer.links': '快速链接',
  'footer.legal': '法律声明', 'footer.copyright': '© 2026 Gvault. All rights reserved.',
  'footer.disclaimer': '非官方粉丝网站。',
};

// Traditional Chinese (Taiwan)
const zhTW: Record<string, string> = {
  'nav.home': '首頁', 'nav.coupons': '兌換碼', 'nav.games': '遊戲',
  'nav.play': '網頁遊戲', 'nav.resell': '初始帳號', 'nav.memorial': '追憶',
  'home.coupons.title': '🎫 最新兌換碼', 'home.coupons.viewAll': '查看全部',
  'home.games.title': '🎮 已收錄遊戲', 'home.play.title': '🌐 網頁遊戲連結',
  'home.resell.title': '💎 初始帳號', 'home.schedule.title': '📅 新遊上線日程',
  'home.memorial.title': '🕯️ 已停服遊戲',
  'coupons.title': '全部兌換碼', 'coupons.filter.all': '全部',
  'coupons.selectGame': '🎮 選擇遊戲',
  'coupons.filter.active': '有效', 'coupons.filter.expired': '已過期',
  'coupons.copy': '複製', 'coupons.copied': '已複製！',
  'coupons.unknown': '待定', 'coupons.expired': '已過期', 'coupons.active': '有效',
  'coupons.noCoupons': '暫無兌換碼。', 'coupons.activeCoupons': '個有效兌換碼',
  'game.platforms': '平台', 'game.officialSite': '官網', 'game.store': '商店',
  'game.coupons': '查看兌換碼', 'game.characters': '角色資訊',
  'game.play': '網頁遊戲', 'game.resell': '初始帳號',
  'game.releaseDate': '上線日期', 'game.genre': '類型',
  'game.webPlayable': '網頁可玩', 'game.notFound': '未找到遊戲。',
  'characters.title': '角色列表', 'characters.stats': '基礎屬性',
  'characters.skills': '技能資訊', 'characters.decks': '推薦陣容',
  'characters.gear': '推薦裝備', 'characters.attack': '攻擊力', 'characters.hp': 'HP',
  'characters.defense': '防禦力', 'characters.speed': '速度',
  'characters.critRate': '暴擊率', 'characters.critDamage': '暴擊傷害',
  'characters.active': '主動', 'characters.passive': '被動',
  'characters.ultimate': '終極技', 'characters.cooldown': '冷卻',
  'characters.notFound': '未找到角色。',
  'resell.title': '初始帳號交易', 'resell.disclaimer': '本站僅提供資訊，請謹慎交易。',
  'resell.server': '伺服器', 'resell.level': '等級',
  'resell.ssr': 'SSR', 'resell.sr': 'SR', 'resell.price': '價格',
  'resell.contact': '聯繫方式', 'resell.noListings': '暫無交易資訊。',
  'play.title': '網頁遊戲連結', 'play.subtitle': '可在瀏覽器中直接體驗的遊戲',
  'play.button': '立即體驗', 'play.noGames': '暫無網頁遊戲。',
  'memorial.title': '追憶', 'memorial.subtitle': '紀念已停服的遊戲。',
  'memorial.shutdownDate': '停服日期', 'memorial.noGames': '暫無停服遊戲。',
  'memorial.restInPeace': '永遠銘記',
  'memorial.servicePeriod': '營運時間', 'memorial.developer': '開發商',
  'memorial.peakPlayers': '最高在線', 'memorial.lastEvent': '最後活動',
  'memorial.description': '簡介', 'memorial.timeline': '重要里程碑',
  'memorial.shutdownReason': '停服原因',
  'common.loading': '載入中...', 'common.error': '發生錯誤。', 'common.back': '返回',
  'common.viewMore': '查看更多', 'common.search': '搜尋...', 'common.noResults': '無結果。',
  'footer.description': '只提供客觀的遊戲資訊。', 'footer.links': '快速連結',
  'footer.legal': '法律聲明', 'footer.copyright': '© 2026 Gvault. All rights reserved.',
  'footer.disclaimer': '非官方粉絲網站。',
};

const ru: Record<string, string> = {
  'nav.home': 'Главная', 'nav.coupons': 'Купоны', 'nav.games': 'Игры',
  'nav.play': 'Веб-игры', 'nav.resell': 'Рероллы', 'nav.memorial': 'Мемориал',
  'home.coupons.title': '🎫 Последние купоны', 'home.coupons.viewAll': 'Все',
  'home.games.title': '🎮 Зарегистрированные игры', 'home.play.title': '🌐 Ссылки на веб-игры',
  'home.resell.title': '💎 Рероллы', 'home.schedule.title': '📅 Предстоящие релизы',
  'home.memorial.title': '🕯️ Закрытые игры',
  'coupons.title': 'Все купоны', 'coupons.filter.all': 'Все',
  'coupons.selectGame': '🎮 Выбрать игру',
  'coupons.filter.active': 'Активные', 'coupons.filter.expired': 'Истёкшие',
  'coupons.copy': 'Копировать', 'coupons.copied': 'Скопировано!',
  'coupons.unknown': 'Неизвестно', 'coupons.expired': 'Истёк', 'coupons.active': 'Активен',
  'coupons.noCoupons': 'Нет купонов.', 'coupons.activeCoupons': 'активных купонов',
  'game.platforms': 'Платформы', 'game.officialSite': 'Официальный сайт',
  'game.store': 'Магазин', 'game.coupons': 'Купоны', 'game.characters': 'Персонажи',
  'game.play': 'Веб-игра', 'game.resell': 'Рероллы',
  'game.releaseDate': 'Дата выхода', 'game.genre': 'Жанр',
  'game.webPlayable': 'Играть в браузере', 'game.notFound': 'Игра не найдена.',
  'characters.title': 'Персонажи', 'characters.stats': 'Базовые характеристики',
  'characters.skills': 'Навыки', 'characters.decks': 'Рекомендуемые колоды',
  'characters.gear': 'Рекомендуемое снаряжение', 'characters.attack': 'АТК', 'characters.hp': 'HP',
  'characters.defense': 'ЗАЩ', 'characters.speed': 'СКР',
  'characters.critRate': 'Шанс крита', 'characters.critDamage': 'Крит. урон',
  'characters.active': 'Активный', 'characters.passive': 'Пассивный',
  'characters.ultimate': 'Ульта', 'characters.cooldown': 'Перезарядка',
  'characters.notFound': 'Персонаж не найден.',
  'resell.title': 'Рынок реролл-аккаунтов', 'resell.disclaimer': 'Только информация. Будьте осторожны.',
  'resell.server': 'Сервер', 'resell.level': 'Уровень',
  'resell.ssr': 'SSR', 'resell.sr': 'SR', 'resell.price': 'Цена',
  'resell.contact': 'Контакт', 'resell.noListings': 'Нет объявлений.',
  'play.title': 'Ссылки на веб-игры', 'play.subtitle': 'Игры прямо в браузере',
  'play.button': 'Играть', 'play.noGames': 'Нет веб-игр.',
  'memorial.title': 'Мемориал', 'memorial.subtitle': 'Помним закрытые игры.',
  'memorial.shutdownDate': 'Дата закрытия', 'memorial.noGames': 'Нет закрытых игр.',
  'memorial.restInPeace': 'Навсегда в памяти',
  'memorial.servicePeriod': 'Период работы', 'memorial.developer': 'Разработчик',
  'memorial.peakPlayers': 'Пик игроков', 'memorial.lastEvent': 'Последнее событие',
  'memorial.description': 'Описание', 'memorial.timeline': 'Ключевые даты',
  'memorial.shutdownReason': 'Причина закрытия',
  'common.loading': 'Загрузка...', 'common.error': 'Ошибка.', 'common.back': 'Назад',
  'common.viewMore': 'Ещё', 'common.search': 'Поиск...', 'common.noResults': 'Нет результатов.',
  'footer.description': 'Объективная информация об играх.',
  'footer.links': 'Быстрые ссылки', 'footer.legal': 'Правовая информация',
  'footer.copyright': '© 2026 Gvault. All rights reserved.', 'footer.disclaimer': 'Неофициальный фан-сайт.',
};

const vi: Record<string, string> = {
  'nav.home': 'Trang chủ', 'nav.coupons': 'Mã giảm giá', 'nav.games': 'Trò chơi',
  'nav.play': 'Game Web', 'nav.resell': 'Acc Reroll', 'nav.memorial': 'Tưởng niệm',
  'home.coupons.title': '🎫 Mã mới nhất', 'home.coupons.viewAll': 'Xem tất cả',
  'home.games.title': '🎮 Game đã đăng ký', 'home.play.title': '🌐 Link Game Web',
  'home.resell.title': '💎 Acc Reroll', 'home.schedule.title': '📅 Sắp ra mắt',
  'home.memorial.title': '🕯️ Game đã đóng',
  'coupons.title': 'Tất cả mã', 'coupons.filter.all': 'Tất cả',
  'coupons.selectGame': '🎮 Chọn game',
  'coupons.filter.active': 'Còn hiệu lực', 'coupons.filter.expired': 'Hết hạn',
  'coupons.copy': 'Sao chép', 'coupons.copied': 'Đã sao chép!',
  'coupons.unknown': 'Chưa rõ', 'coupons.expired': 'Hết hạn', 'coupons.active': 'Còn hiệu lực',
  'coupons.noCoupons': 'Không có mã.', 'coupons.activeCoupons': 'mã còn hiệu lực',
  'game.platforms': 'Nền tảng', 'game.officialSite': 'Trang chính thức',
  'game.store': 'Cửa hàng', 'game.coupons': 'Xem mã', 'game.characters': 'Nhân vật',
  'game.play': 'Game Web', 'game.resell': 'Acc Reroll',
  'game.releaseDate': 'Ngày ra mắt', 'game.genre': 'Thể loại',
  'game.webPlayable': 'Chơi trên web', 'game.notFound': 'Không tìm thấy game.',
  'characters.title': 'Danh sách nhân vật', 'characters.stats': 'Chỉ số cơ bản',
  'characters.skills': 'Kỹ năng', 'characters.decks': 'Đội hình đề xuất',
  'characters.gear': 'Trang bị đề xuất', 'characters.attack': 'ATK', 'characters.hp': 'HP',
  'characters.defense': 'DEF', 'characters.speed': 'SPD',
  'characters.critRate': 'Tỉ lệ bạo', 'characters.critDamage': 'Sát thương bạo',
  'characters.active': 'Chủ động', 'characters.passive': 'Bị động',
  'characters.ultimate': 'Tối thượng', 'characters.cooldown': 'Hồi chiêu',
  'characters.notFound': 'Không tìm thấy nhân vật.',
  'resell.title': 'Chợ tài khoản Reroll', 'resell.disclaimer': 'Chỉ cung cấp thông tin. Giao dịch cẩn thận.',
  'resell.server': 'Máy chủ', 'resell.level': 'Cấp độ',
  'resell.ssr': 'SSR', 'resell.sr': 'SR', 'resell.price': 'Giá',
  'resell.contact': 'Liên hệ', 'resell.noListings': 'Không có sản phẩm.',
  'play.title': 'Link Game Web', 'play.subtitle': 'Game chơi trực tiếp trên trình duyệt',
  'play.button': 'Chơi ngay', 'play.noGames': 'Không có game web.',
  'memorial.title': 'Tưởng niệm', 'memorial.subtitle': 'Ghi nhớ những game đã đóng cửa.',
  'memorial.shutdownDate': 'Ngày đóng cửa', 'memorial.noGames': 'Không có game đã đóng.',
  'memorial.restInPeace': 'Mãi ghi nhớ',
  'memorial.servicePeriod': 'Thời gian hoạt động', 'memorial.developer': 'Nhà phát triển',
  'memorial.peakPlayers': 'Cao điểm', 'memorial.lastEvent': 'Sự kiện cuối',
  'memorial.description': 'Mô tả', 'memorial.timeline': 'Mốc quan trọng',
  'memorial.shutdownReason': 'Lý do đóng cửa',
  'common.loading': 'Đang tải...', 'common.error': 'Lỗi.', 'common.back': 'Quay lại',
  'common.viewMore': 'Xem thêm', 'common.search': 'Tìm kiếm...', 'common.noResults': 'Không có kết quả.',
  'footer.description': 'Chỉ cung cấp thông tin game khách quan.',
  'footer.links': 'Liên kết nhanh', 'footer.legal': 'Pháp lý',
  'footer.copyright': '© 2026 Gvault. All rights reserved.', 'footer.disclaimer': 'Trang fan không chính thức.',
};

const th: Record<string, string> = {
  'nav.home': 'หน้าหลัก', 'nav.coupons': 'คูปอง', 'nav.games': 'เกม',
  'nav.play': 'เกมเว็บ', 'nav.resell': 'รีโรล', 'nav.memorial': 'อนุสรณ์',
  'home.coupons.title': '🎫 คูปองล่าสุด', 'home.coupons.viewAll': 'ดูทั้งหมด',
  'home.games.title': '🎮 เกมที่ลงทะเบียน', 'home.play.title': '🌐 ลิงก์เกมเว็บ',
  'home.resell.title': '💎 บัญชีรีโรล', 'home.schedule.title': '📅 เกมเร็วๆ นี้',
  'home.memorial.title': '🕯️ เกมที่ปิดให้บริการ',
  'coupons.title': 'คูปองทั้งหมด', 'coupons.filter.all': 'ทั้งหมด',
  'coupons.selectGame': '🎮 เลือกเกม',
  'coupons.filter.active': 'ใช้ได้', 'coupons.filter.expired': 'หมดอายุ',
  'coupons.copy': 'คัดลอก', 'coupons.copied': 'คัดลอกแล้ว!',
  'coupons.unknown': 'ไม่ทราบ', 'coupons.expired': 'หมดอายุ', 'coupons.active': 'ใช้ได้',
  'coupons.noCoupons': 'ไม่มีคูปอง', 'coupons.activeCoupons': 'คูปองที่ใช้ได้',
  'game.platforms': 'แพลตฟอร์ม', 'game.officialSite': 'เว็บทางการ',
  'game.store': 'สโตร์', 'game.coupons': 'ดูคูปอง', 'game.characters': 'ตัวละคร',
  'game.play': 'เกมเว็บ', 'game.resell': 'รีโรล',
  'game.releaseDate': 'วันเปิดตัว', 'game.genre': 'ประเภท',
  'game.webPlayable': 'เล่นบนเว็บได้', 'game.notFound': 'ไม่พบเกม',
  'characters.title': 'รายชื่อตัวละคร', 'characters.stats': 'สถิติพื้นฐาน',
  'characters.skills': 'ทักษะ', 'characters.decks': 'เด็คแนะนำ',
  'characters.gear': 'อุปกรณ์แนะนำ', 'characters.attack': 'ATK', 'characters.hp': 'HP',
  'characters.defense': 'DEF', 'characters.speed': 'SPD',
  'characters.critRate': 'อัตราคริ', 'characters.critDamage': 'ดาเมจคริ',
  'characters.active': 'แอคทีฟ', 'characters.passive': 'พาสซีฟ',
  'characters.ultimate': 'อัลติเมท', 'characters.cooldown': 'คูลดาวน์',
  'characters.notFound': 'ไม่พบตัวละคร',
  'resell.title': 'ตลาดบัญชีรีโรล', 'resell.disclaimer': 'ข้อมูลเท่านั้น ระวังการซื้อขาย',
  'resell.server': 'เซิร์ฟเวอร์', 'resell.level': 'เลเวล',
  'resell.ssr': 'SSR', 'resell.sr': 'SR', 'resell.price': 'ราคา',
  'resell.contact': 'ติดต่อ', 'resell.noListings': 'ไม่มีรายการ',
  'play.title': 'ลิงก์เกมเว็บ', 'play.subtitle': 'เกมที่เล่นได้ในเบราว์เซอร์',
  'play.button': 'เล่นเลย', 'play.noGames': 'ไม่มีเกมเว็บ',
  'memorial.title': 'อนุสรณ์', 'memorial.subtitle': 'จดจำเกมที่ปิดให้บริการ',
  'memorial.shutdownDate': 'วันปิดบริการ', 'memorial.noGames': 'ไม่มีเกมที่ปิด',
  'memorial.restInPeace': 'จดจำตลอดไป',
  'memorial.servicePeriod': 'ช่วงเปิดให้บริการ', 'memorial.developer': 'ผู้พัฒนา',
  'memorial.peakPlayers': 'ผู้เล่นสูงสุด', 'memorial.lastEvent': 'อีเวนต์สุดท้าย',
  'memorial.description': 'รายละเอียด', 'memorial.timeline': 'เหตุการณ์สำคัญ',
  'memorial.shutdownReason': 'สาเหตุปิดบริการ',
  'common.loading': 'กำลังโหลด...', 'common.error': 'เกิดข้อผิดพลาด', 'common.back': 'กลับ',
  'common.viewMore': 'ดูเพิ่ม', 'common.search': 'ค้นหา...', 'common.noResults': 'ไม่พบผลลัพธ์',
  'footer.description': 'ข้อมูลเกมที่เป็นกลาง',
  'footer.links': 'ลิงก์ด่วน', 'footer.legal': 'กฎหมาย',
  'footer.copyright': '© 2026 Gvault. All rights reserved.', 'footer.disclaimer': 'เว็บแฟนไม่เป็นทางการ',
};

const es: Record<string, string> = {
  'nav.home': 'Inicio', 'nav.coupons': 'Cupones', 'nav.games': 'Juegos',
  'nav.play': 'Juegos Web', 'nav.resell': 'Reroll', 'nav.memorial': 'Memorial',
  'home.coupons.title': '🎫 Cupones recientes', 'home.coupons.viewAll': 'Ver todos',
  'home.games.title': '🎮 Juegos registrados', 'home.play.title': '🌐 Enlaces de juegos web',
  'home.resell.title': '💎 Cuentas Reroll', 'home.schedule.title': '📅 Próximos lanzamientos',
  'home.memorial.title': '🕯️ Juegos cerrados',
  'coupons.title': 'Todos los cupones', 'coupons.filter.all': 'Todos',
  'coupons.selectGame': '🎮 Seleccionar juego',
  'coupons.filter.active': 'Activos', 'coupons.filter.expired': 'Expirados',
  'coupons.copy': 'Copiar', 'coupons.copied': '¡Copiado!',
  'coupons.unknown': 'Indefinido', 'coupons.expired': 'Expirado', 'coupons.active': 'Activo',
  'coupons.noCoupons': 'No hay cupones.', 'coupons.activeCoupons': 'cupones activos',
  'game.platforms': 'Plataformas', 'game.officialSite': 'Sitio oficial',
  'game.store': 'Tienda', 'game.coupons': 'Ver cupones', 'game.characters': 'Personajes',
  'game.play': 'Juego Web', 'game.resell': 'Reroll',
  'game.releaseDate': 'Fecha de lanzamiento', 'game.genre': 'Género',
  'game.webPlayable': 'Jugable en web', 'game.notFound': 'Juego no encontrado.',
  'characters.title': 'Personajes', 'characters.stats': 'Estadísticas base',
  'characters.skills': 'Habilidades', 'characters.decks': 'Mazos recomendados',
  'characters.gear': 'Equipo recomendado', 'characters.attack': 'ATQ', 'characters.hp': 'HP',
  'characters.defense': 'DEF', 'characters.speed': 'VEL',
  'characters.critRate': 'Prob. crítico', 'characters.critDamage': 'Daño crítico',
  'characters.active': 'Activa', 'characters.passive': 'Pasiva',
  'characters.ultimate': 'Definitiva', 'characters.cooldown': 'Enfriamiento',
  'characters.notFound': 'Personaje no encontrado.',
  'resell.title': 'Mercado de cuentas Reroll', 'resell.disclaimer': 'Solo información. Comercia con precaución.',
  'resell.server': 'Servidor', 'resell.level': 'Nivel',
  'resell.ssr': 'SSR', 'resell.sr': 'SR', 'resell.price': 'Precio',
  'resell.contact': 'Contacto', 'resell.noListings': 'Sin anuncios.',
  'play.title': 'Enlaces de juegos web', 'play.subtitle': 'Juegos que puedes jugar en tu navegador',
  'play.button': 'Jugar', 'play.noGames': 'No hay juegos web.',
  'memorial.title': 'Memorial', 'memorial.subtitle': 'Recordando juegos cerrados.',
  'memorial.shutdownDate': 'Fecha de cierre', 'memorial.noGames': 'No hay juegos cerrados.',
  'memorial.restInPeace': 'Siempre recordados',
  'memorial.servicePeriod': 'Período de servicio', 'memorial.developer': 'Desarrollador',
  'memorial.peakPlayers': 'Pico de jugadores', 'memorial.lastEvent': 'Último evento',
  'memorial.description': 'Resumen', 'memorial.timeline': 'Hitos clave',
  'memorial.shutdownReason': 'Razón del cierre',
  'common.loading': 'Cargando...', 'common.error': 'Error.', 'common.back': 'Atrás',
  'common.viewMore': 'Ver más', 'common.search': 'Buscar...', 'common.noResults': 'Sin resultados.',
  'footer.description': 'Información objetiva sobre juegos.',
  'footer.links': 'Enlaces rápidos', 'footer.legal': 'Legal',
  'footer.copyright': '© 2026 Gvault. All rights reserved.', 'footer.disclaimer': 'Sitio fan no oficial.',
};

/* ===== Translations Map ===== */
const translations: Record<Locale, Record<string, string>> = {
  ko, en, ja, zh, 'zh-TW': zhTW, ru, vi, th, es,
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
    if (saved && ALL_LOCALES.includes(saved as Locale)) {
      return saved as Locale;
    }
    return 'en'; // temporary default, IP detection will override
  });

  const [detected, setDetected] = useState(false);

  // IP-based language detection (only on first visit)
  useEffect(() => {
    const saved = localStorage.getItem('gvault-locale');
    if (saved && ALL_LOCALES.includes(saved as Locale)) {
      setDetected(true);
      return;
    }
    detectLocaleByIP().then(detectedLocale => {
      setLocale(detectedLocale);
      localStorage.setItem('gvault-locale', detectedLocale);
      document.documentElement.lang = detectedLocale;
      setDetected(true);
    });
  }, []);

  const handleSetLocale = useCallback((newLocale: Locale) => {
    setLocale(newLocale);
    localStorage.setItem('gvault-locale', newLocale);
    document.documentElement.lang = newLocale;
  }, []);

  const t = useCallback((key: string): string => {
    return translations[locale]?.[key] || translations['en']?.[key] || key;
  }, [locale]);

  if (!detected) return null; // don't render until locale is determined

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
  zh: '简体中文',
  'zh-TW': '繁體中文',
  ru: 'Русский',
  vi: 'Tiếng Việt',
  th: 'ไทย',
  es: 'Español',
};
