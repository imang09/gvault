// Game data structure for EroArchive
export interface Game {
  id: string;
  name: string;
  description: string;
  category: 'male-oriented' | 'female-oriented' | 'diverse' | 'casual';
  platforms: ('android' | 'ios' | 'windows' | 'mac' | 'browser')[];
  link: string;
  imageUrl?: string;
  status: 'active' | 'terminated';
  terminatedDate?: string;
}

export interface CouponCode {
  id: string;
  gameId: string;
  code: string;
  reward: string;
  expiryDate: string;
  isExpired: boolean;
}

// Active Games
export const activeGames: Game[] = [
  {
    id: 'cherry-tale',
    name: 'Cherry Tale',
    description: 'Adult Fairytale RPG - A visual and audio smorgasbord. Adventure, fight, and romp as the Archfiend.',
    category: 'male-oriented',
    platforms: ['android', 'ios', 'windows'],
    link: 'https://www.ero-labs.com/en/game/cherry-tale',
    status: 'active',
  },
  {
    id: 'ark-recode',
    name: 'Ark Re:Code',
    description: 'Sci-fi RPG - In the year 2122, the Earth was destroyed by a meteor disaster.',
    category: 'male-oriented',
    platforms: ['android', 'ios', 'windows'],
    link: 'https://www.ero-labs.com/en/game/ark-recode',
    status: 'active',
  },
  {
    id: 'nu-carnival',
    name: 'NU: Carnival',
    description: 'BL RPG - Hundreds of years ago, the elemental spirits on the Klein Continent were causing mayhem.',
    category: 'diverse',
    platforms: ['android', 'ios', 'windows'],
    link: 'https://www.ero-labs.com/en/game/nu-carnival',
    status: 'active',
  },
  {
    id: 'tenkafuma',
    name: 'TenkafuMA: Diablo\'s Harem',
    description: 'RPG - Play as Caesar, the most powerful Archdemon in hell.',
    category: 'male-oriented',
    platforms: ['android', 'ios', 'windows'],
    link: 'https://www.ero-labs.com/en/game/tenkafuma-diablo-harem',
    status: 'active',
  },
  {
    id: 'rise-of-eros',
    name: 'Rise of Eros',
    description: 'High-quality 3D RPG - At the dawn of the world, two originary deities were created.',
    category: 'male-oriented',
    platforms: ['android', 'ios', 'windows'],
    link: 'https://www.ero-labs.com/en/game/rise-of-eros',
    status: 'active',
  },
  {
    id: 'throne-of-desire',
    name: 'Throne of Desire',
    description: 'Fantasy RPG - Several years ago, King Arthur bore the power of kings.',
    category: 'male-oriented',
    platforms: ['android', 'ios', 'windows'],
    link: 'https://www.ero-labs.com/en/game/throne-of-desire',
    status: 'active',
  },
  {
    id: 'megaha-re',
    name: 'Megaha:Re',
    description: 'Isekai Harem RPG - When I\'m summoned by the goddess, am I supposed to make money and build a harem?',
    category: 'female-oriented',
    platforms: ['android', 'ios', 'windows'],
    link: 'https://www.ero-labs.com/en/game/megaha-re',
    status: 'active',
  },
  {
    id: 'crave-saga-x',
    name: 'Crave Saga X',
    description: 'Male Leads RPG - Protect the world through the power of bonds!',
    category: 'male-oriented',
    platforms: ['android', 'ios', 'windows'],
    link: 'https://www.ero-labs.com/en/game/crave-saga-x',
    status: 'active',
  },
  {
    id: 'horizon-walker',
    name: 'Horizon Walker',
    description: 'Turn-based RPG - A unique storyline and captivating graphics.',
    category: 'male-oriented',
    platforms: ['android', 'ios', 'windows'],
    link: 'https://www.ero-labs.com/en/game/horizon-walker',
    status: 'active',
  },
  {
    id: 'what-in-hell-is-bad',
    name: 'What in Hell is Bad',
    description: 'Hell-themed RPG - Cruel angels that invaded Hell.',
    category: 'male-oriented',
    platforms: ['android', 'ios', 'windows'],
    link: 'https://www.ero-labs.com/en/game/what-in-hell-is-bad',
    status: 'active',
  },
];

// Current Coupon Codes
export const couponCodes: CouponCode[] = [
  {
    id: 'hw-100k-dl',
    gameId: 'horizon-walker',
    code: 'hw100000download',
    reward: '100,000 Downloads Celebration Reward',
    expiryDate: '2026-12-31',
    isExpired: false,
  },
  {
    id: 'hw-anniversary',
    gameId: 'horizon-walker',
    code: 'HW1STANNIVER',
    reward: '1st Anniversary Special',
    expiryDate: '2026-10-01',
    isExpired: false,
  },
  {
    id: 'hw-ero-burn',
    gameId: 'horizon-walker',
    code: 'HWEROEROBURN',
    reward: 'Ero Burn Event Reward',
    expiryDate: '2026-11-01',
    isExpired: false,
  },
];

// Terminated Games (Memorial)
export const terminatedGames: Game[] = [
  {
    id: 'lust-goddess',
    name: 'Lust Goddess',
    description: 'You were the newly appointed Captain of a skilled mercenary squad, tasked with liberating captives.',
    category: 'male-oriented',
    platforms: ['android', 'ios'],
    link: '#',
    status: 'terminated',
    terminatedDate: '2024-06-15',
  },
  {
    id: 'immortal-realm',
    name: 'Immortal Realm of Desire',
    description: 'A fantasy RPG with rich storytelling and character development.',
    category: 'male-oriented',
    platforms: ['android', 'ios'],
    link: '#',
    status: 'terminated',
    terminatedDate: '2023-12-01',
  },
];
