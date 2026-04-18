import { RouletteNumber } from './types';
import { 
  Zap, 
  Activity, 
  Target, 
  TrendingUp, 
  BarChart3, 
  RotateCcw, 
  History, 
  Settings, 
  Plus, 
  Trash2, 
  LineChart as LineChartIcon 
} from 'lucide-react';

export const COLORS = {
  red: 'bg-red-600 text-white',
  black: 'bg-zinc-900 text-white',
  green: 'bg-green-600 text-white'
};

export const ROULETTE_NUMBERS: Record<number, RouletteNumber> = {
  0: { num: 0, color: 'green', sector: 'voisins', terminal: 0, family: '0', mirror: 0, isEven: false, isHigh: false, dozen: 1, column: 1 },
  1: { num: 1, color: 'red', sector: 'orphelins', terminal: 1, family: '1', mirror: 1, isEven: false, isHigh: false, dozen: 1, column: 1 },
  2: { num: 2, color: 'black', sector: 'voisins', terminal: 2, family: '2', mirror: 2, isEven: true, isHigh: false, dozen: 1, column: 2 },
  3: { num: 3, color: 'red', sector: 'voisins', terminal: 3, family: '3', mirror: 3, isEven: false, isHigh: false, dozen: 1, column: 3 },
  4: { num: 4, color: 'black', sector: 'voisins', terminal: 4, family: '4', mirror: 4, isEven: true, isHigh: false, dozen: 1, column: 1 },
  5: { num: 5, color: 'red', sector: 'tiers', terminal: 5, family: '5', mirror: 5, isEven: false, isHigh: false, dozen: 1, column: 2 },
  6: { num: 6, color: 'black', sector: 'orphelins', terminal: 6, family: '6', mirror: 6, isEven: true, isHigh: false, dozen: 1, column: 3 },
  7: { num: 7, color: 'red', sector: 'voisins', terminal: 7, family: '7', mirror: 7, isEven: false, isHigh: false, dozen: 1, column: 1 },
  8: { num: 8, color: 'black', sector: 'tiers', terminal: 8, family: '8', mirror: 8, isEven: true, isHigh: false, dozen: 1, column: 2 },
  9: { num: 9, color: 'red', sector: 'orphelins', terminal: 9, family: '9', mirror: 9, isEven: false, isHigh: false, dozen: 1, column: 3 },
  10: { num: 10, color: 'black', sector: 'tiers', terminal: 0, family: '0', mirror: 0, isEven: true, isHigh: false, dozen: 1, column: 1 },
  11: { num: 11, color: 'black', sector: 'tiers', terminal: 1, family: '1', mirror: 1, isEven: false, isHigh: false, dozen: 1, column: 2 },
  12: { num: 12, color: 'red', sector: 'voisins', terminal: 2, family: '2', mirror: 2, isEven: true, isHigh: false, dozen: 1, column: 3 },
  13: { num: 13, color: 'black', sector: 'tiers', terminal: 3, family: '3', mirror: 3, isEven: false, isHigh: false, dozen: 2, column: 1 },
  14: { num: 14, color: 'red', sector: 'orphelins', terminal: 4, family: '4', mirror: 4, isEven: true, isHigh: false, dozen: 2, column: 2 },
  15: { num: 15, color: 'black', sector: 'voisins', terminal: 5, family: '5', mirror: 5, isEven: false, isHigh: false, dozen: 2, column: 3 },
  16: { num: 16, color: 'red', sector: 'tiers', terminal: 6, family: '6', mirror: 6, isEven: true, isHigh: false, dozen: 2, column: 1 },
  17: { num: 17, color: 'black', sector: 'orphelins', terminal: 7, family: '7', mirror: 7, isEven: false, isHigh: false, dozen: 2, column: 2 },
  18: { num: 18, color: 'red', sector: 'voisins', terminal: 8, family: '8', mirror: 8, isEven: true, isHigh: false, dozen: 2, column: 3 },
  19: { num: 19, color: 'red', sector: 'voisins', terminal: 9, family: '9', mirror: 9, isEven: false, isHigh: true, dozen: 2, column: 1 },
  20: { num: 20, color: 'black', sector: 'orphelins', terminal: 0, family: '0', mirror: 0, isEven: true, isHigh: true, dozen: 2, column: 2 },
  21: { num: 21, color: 'red', sector: 'voisins', terminal: 1, family: '1', mirror: 1, isEven: false, isHigh: true, dozen: 2, column: 3 },
  22: { num: 22, color: 'black', sector: 'voisins', terminal: 2, family: '2', mirror: 2, isEven: true, isHigh: true, dozen: 2, column: 1 },
  23: { num: 23, color: 'red', sector: 'tiers', terminal: 3, family: '3', mirror: 3, isEven: false, isHigh: true, dozen: 2, column: 2 },
  24: { num: 24, color: 'black', sector: 'tiers', terminal: 4, family: '4', mirror: 4, isEven: true, isHigh: true, dozen: 2, column: 3 },
  25: { num: 25, color: 'red', sector: 'voisins', terminal: 5, family: '5', mirror: 5, isEven: false, isHigh: true, dozen: 3, column: 1 },
  26: { num: 26, color: 'black', sector: 'voisins', terminal: 6, family: '6', mirror: 6, isEven: true, isHigh: true, dozen: 3, column: 2 },
  27: { num: 27, color: 'red', sector: 'tiers', terminal: 7, family: '7', mirror: 7, isEven: false, isHigh: true, dozen: 3, column: 3 },
  28: { num: 28, color: 'black', sector: 'voisins', terminal: 8, family: '8', mirror: 8, isEven: true, isHigh: true, dozen: 3, column: 1 },
  29: { num: 29, color: 'black', sector: 'voisins', terminal: 9, family: '9', mirror: 9, isEven: false, isHigh: true, dozen: 3, column: 2 },
  30: { num: 30, color: 'red', sector: 'tiers', terminal: 0, family: '0', mirror: 0, isEven: true, isHigh: true, dozen: 3, column: 3 },
  31: { num: 31, color: 'black', sector: 'orphelins', terminal: 1, family: '1', mirror: 1, isEven: false, isHigh: true, dozen: 3, column: 1 },
  32: { num: 32, color: 'red', sector: 'voisins', terminal: 2, family: '2', mirror: 2, isEven: true, isHigh: true, dozen: 3, column: 2 },
  33: { num: 33, color: 'black', sector: 'tiers', terminal: 3, family: '3', mirror: 3, isEven: false, isHigh: true, dozen: 3, column: 3 },
  34: { num: 34, color: 'red', sector: 'orphelins', terminal: 4, family: '4', mirror: 4, isEven: true, isHigh: true, dozen: 3, column: 1 },
  35: { num: 35, color: 'black', sector: 'voisins', terminal: 5, family: '5', mirror: 5, isEven: false, isHigh: true, dozen: 3, column: 2 },
  36: { num: 36, color: 'red', sector: 'tiers', terminal: 6, family: '6', mirror: 6, isEven: true, isHigh: true, dozen: 3, column: 3 }
};

export const WHEEL_ORDER = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];

export const SECTORS = {
  voisins: [22, 18, 29, 7, 28, 12, 35, 3, 26, 0, 32, 15, 19, 4, 21, 2, 25],
  tiers: [27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33],
  orphelins: [1, 20, 14, 31, 9, 17, 34, 6],
  jeuZero: [12, 35, 3, 26, 0, 32, 15]
};

export const SECTOR_PROBABILITIES = {
  voisins: 17/37,
  tiers: 12/37,
  orphelins: 8/37,
  jeuZero: 7/37
};

export const FAMILIAS_CFG = {
  f147: [0, 1, 4, 7],
  f258: [2, 5, 8],
  f369: [3, 6, 9]
};

export const ESPELHOS_CFG = {
  pairs: [[1, 9], [2, 8], [3, 7], [4, 6], [5, 0]],
  digitMirrorPairs: [[16, 19], [12, 21], [13, 31], [23, 32], [6, 9]],
  setorZero: [0, 2, 3, 5, 8]
};

export const CAMUFLADOS_NUMBERS = [14, 13, 31, 12, 21, 33, 16, 19, 22, 2, 32, 23, 26, 29, 6, 9, 11, 1, 3, 4, 5, 7, 8];

export const MIRROR_NUMBERS_LIST = [16, 19, 12, 21, 13, 31, 23, 32, 6, 9];

export const ALERT_TYPES = [
  { id: 'streak', title: 'Sequência Detectada', icon: Zap, color: 'text-gold-primary' },
  { id: 'delay', title: 'Atraso Crítico', icon: Activity, color: 'text-red-500' },
  { id: 'bias', title: 'Viés Estatístico', icon: TrendingUp, color: 'text-emerald-500' },
  { id: 'omega', title: 'Omega Alert', icon: Target, color: 'text-emerald-500' }
];
