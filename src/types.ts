import { LucideIcon } from 'lucide-react';

export interface History {
  id: string;
  number: number;
  timestamp: number;
  color: 'red' | 'black' | 'green';
  dropPoint?: number;
}

export type TabType = 'TERMINAIS' | 'RADAR' | 'DASHBOARD' | 'ANALISE' | 'SETORIAIS' | 'ESTATISTICAS' | 'HISTORICO';

export interface RouletteNumber {
  num: number;
  color: 'red' | 'black' | 'green';
  sector: 'voisins' | 'tiers' | 'orphelins';
  terminal: number;
  family: string;
  mirror: number;
  isEven: boolean;
  isHigh: boolean;
  dozen: 1 | 2 | 3;
  column: 1 | 2 | 3;
}

export interface Prediction {
  terminal: number;
  confidence: number;
  targets: number[];
  targetsWithConfidence: { num: number; confidence: number }[];
  isConcentrated: boolean;
  mainTarget: number | null;
  isSniper: boolean;
  betPercentage: number;
}

export interface Bias {
  type: string;
  value: string;
  confidence: number;
}

export interface Stats {
  total: number;
  counts: {
    red: number;
    black: number;
    green: number;
    even: number;
    odd: number;
    high: number;
    low: number;
    dozen1: number;
    dozen2: number;
    dozen3: number;
    col1: number;
    col2: number;
    col3: number;
    termGroup1: number;
    termGroup2: number;
    termGroup3: number;
  };
  terminalFrequency: Record<number, number>;
  terminalVacuum: number[];
  terminalGaps: { lastCompletedGap: number; currentOngoingGap: number }[];
  sectorCounts: { voisins: number; tiers: number; orphelins: number; jeuZero: number };
  prediction: Prediction;
  biases: Bias[];
  barChartData: { number: number; frequency: number; color: string }[];
  trendData: { index: number; value: number; color: string }[];
  terminalAnalysis: {
    families: { key: string; nums: number[]; lastSeen: number }[];
    mirrors: { pair: number[]; f0: number; f1: number }[];
  };
  terminalGroupData: { name: string; value: number; color: string }[];
  dealerSignature: {
    avgDist: number;
    variance: number;
    distances: number[];
  } | null;
  sectorTrends: { index: number; voisins: number; tiers: number; orphelins: number }[];
  groupPredictions: { name: string; score: number; terminals: number[]; color: string; confidence: number; lastSeen: number }[];
  sequences: {
    color: { current: number; max: number; type: 'red' | 'black' | 'none' };
    parity: { current: number; max: number; type: 'even' | 'odd' | 'none' };
    highLow: { current: number; max: number; type: 'high' | 'low' | 'none' };
  };
  tableHeatmap: { num: number; frequency: number; color: string }[];
  contextTargets: number[];
}

export type AlertType = 'color' | 'parity' | 'highlow' | 'dozen' | 'column' | 'terminal' | 'terminalGroup';

export interface CustomAlertRule {
  id: string;
  type: AlertType;
  value: string;
  threshold: number;
  enabled: boolean;
}
