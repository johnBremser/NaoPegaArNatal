export type GameState = 'TITLE_MENU' | 'PLAYING' | 'PAUSED' | 'GAME_OVER';

export type NatalMood =
  | 'normal'
  | 'happy'
  | 'angry'
  | 'very_angry'
  | 'floating'
  | 'relieved';

export type ItemCategory = 'desired' | 'unwanted';

export type FoodItemId =
  | 'hamburguer'
  | 'pizza'
  | 'batata_frita'
  | 'chocolate'
  | 'sorvete'
  | 'milkshake'
  | 'coxinha'
  | 'salada'
  | 'suco_detox';

export interface FoodItemDef {
  id: FoodItemId;
  name: string;
  category: ItemCategory;
  accentColor: string;
  radius: number;
}

export const FOOD_ITEMS: readonly FoodItemDef[] = [
  { id: 'hamburguer', name: 'Hambúrguer', category: 'desired', accentColor: '#D97706', radius: 24 },
  { id: 'pizza', name: 'Pizza', category: 'desired', accentColor: '#EA580C', radius: 24 },
  { id: 'batata_frita', name: 'Batata frita', category: 'desired', accentColor: '#EAB308', radius: 23 },
  { id: 'chocolate', name: 'Chocolate', category: 'desired', accentColor: '#78350F', radius: 22 },
  { id: 'sorvete', name: 'Sorvete', category: 'desired', accentColor: '#EC4899', radius: 23 },
  { id: 'milkshake', name: 'Milk-shake', category: 'desired', accentColor: '#F43F5E', radius: 24 },
  { id: 'coxinha', name: 'Coxinha', category: 'desired', accentColor: '#CA8A04', radius: 22 },
  { id: 'salada', name: 'Salada', category: 'unwanted', accentColor: '#16A34A', radius: 24 },
  { id: 'suco_detox', name: 'Suco detox', category: 'unwanted', accentColor: '#10B981', radius: 23 },
] as const;

export const DESIRED_ITEMS = FOOD_ITEMS.filter((i) => i.category === 'desired');
export const UNWANTED_ITEMS = FOOD_ITEMS.filter((i) => i.category === 'unwanted');

export interface HudSnapshot {
  score: number;
  highScore: number;
  anger: number;
  streak: number;
  itemTimer: number;
  maxItemTimer: number;
  timerExpired: boolean;
  currentItem: FoodItemDef;
  natalMood: NatalMood;
  inFlight: boolean;
}

export const GAME_CONFIG = {
  POINTS_PER_DESIRED_HIT: 10,
  POINTS_COMBO_BONUS: 25,
  STREAK_TARGET: 5,

  ANGER_MISS_DESIRED: 15,
  ANGER_HIT_UNWANTED: 20,
  ANGER_TIMER_EXPIRED_PER_SEC: 5,
  ANGER_COMBO_RELIEF: 30,

  BASE_ITEM_TIME_SEC: 8,
  MIN_ITEM_TIME_SEC: 3,
  TIME_REDUCTION_PER_100_PTS: 0.5,

  BASE_UNWANTED_CHANCE: 0.2,
  MAX_UNWANTED_CHANCE: 0.35,

  HIGH_SCORE_STORAGE_KEY: 'nao_pega_ar_natal_highscore_v1',
  MUTE_STORAGE_KEY: 'nao_pega_ar_natal_muted_v1',
} as const;
