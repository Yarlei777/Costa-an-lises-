import React, { useState, useMemo, useEffect, useRef, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import RouletteWheelVisual from './components/RouletteWheelVisual';

// import ErrorBoundary from './components/ErrorBoundary';
import { 
  History, 
  TrendingUp, 
  AlertTriangle, 
  RotateCcw, 
  Trash2, 
  ChevronRight,
  BarChart3,
  Activity,
  Trophy,
  LineChart as LineChartIcon,
  ShieldCheck,
  Zap,
  Target,
  Radar,
  Eye,
  Settings,
  Plus,
  Bell,
  BellOff,
  Check,
  X,
  Smartphone,
  Monitor,
  Cpu,
  Layers,
  Globe,
  Lock,
  ChevronDown,
  ChevronUp,
  Play,
  Pause,
  Maximize2,
  Minimize2,
  Download,
  Share2,
  HelpCircle,
  MessageSquare,
  Star,
  Award,
  ZapOff,
  Camera
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
  PieChart as RePieChart,
  Pie,
  Radar as ReRadar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  RadarChart
} from 'recharts';
import { 
  ROULETTE_NUMBERS, 
  WHEEL_ORDER, 
  ALERT_TYPES,
  SECTORS,
  SECTOR_PROBABILITIES,
  FAMILIAS_CFG,
  ESPELHOS_CFG,
  MIRROR_NUMBERS_LIST
} from './constants';

// Utility functions moved outside to prevent re-creation and improve performance
const calculateSequence = <T extends string>(history: number[], check: (n: number) => boolean, typeA: T, typeB: T) => {
  if (history.length === 0) return { current: 0, max: 0, type: 'none' as const };
  let current = 0;
  let max = 0;
  
  const first = history[0];
  const firstIsA = check(first);
  const currentType = firstIsA ? typeA : typeB;
  
  for (let i = 0; i < history.length; i++) {
    if (check(history[i]) === firstIsA) {
      current++;
    } else {
      break;
    }
  }

  let streak = 0;
  let lastWasA = check(history[0]);
  for (let i = 0; i < history.length; i++) {
    const isA = check(history[i]);
    if (isA === lastWasA) {
      streak++;
    } else {
      max = Math.max(max, streak);
      streak = 1;
      lastWasA = isA;
    }
  }
  max = Math.max(max, streak);

  return { current, max, type: currentType };
};

const calculateGaps = (history: number[], targetNums: number[]) => {
  const gaps: number[] = [];
  let currentGap = 0;
  let foundFirst = false;
  
  for (let i = history.length - 1; i >= 0; i--) {
    if (targetNums.includes(history[i])) {
      if (foundFirst) {
        gaps.push(currentGap);
      }
      currentGap = 0;
      foundFirst = true;
    } else if (foundFirst) {
      currentGap++;
    }
  }
  return gaps;
};

const getSector = (n: number) => {
  if (SECTORS.voisins.includes(n)) return 'VOISINS';
  if (SECTORS.tiers.includes(n)) return 'TIERS';
  if (SECTORS.orphelins.includes(n)) return 'ORPHELINS';
  return 'UNKNOWN';
};
import { Toaster, toast } from 'sonner';
import { Stats, CustomAlertRule, AlertType } from './types';
import { neuralEngine } from './services/neuralEngine';
import { auth, loginWithGoogle, logout, saveUserSession, getUserSession } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

// Lazy-loaded components
const DashboardTab = lazy(() => import("./components/DashboardTab"));
const AnaliseTab = lazy(() => import("./components/AnaliseTab"));
const SetoriaisTab = lazy(() => import("./components/SetoriaisTab"));
const EstatisticasTab = lazy(() => import("./components/EstatisticasTab"));
const HistoricoTab = lazy(() => import("./components/HistoricoTab"));
const TerminaisTab = lazy(() => import("./components/TerminaisTab"));
const RadarTab = lazy(() => import("./components/RadarTab"));
const LegalModal = lazy(() => import("./components/LegalModals"));

// Loading fallback component
const TabLoading = () => (
  <div className="flex flex-col items-center justify-center py-40 space-y-4">
    <div className="w-12 h-12 rounded-full border-2 border-gold-primary/20 border-t-gold-primary animate-spin" />
    <span className="text-[10px] font-black text-gold-primary uppercase tracking-[0.3em] animate-pulse">Carregando Módulo...</span>
  </div>
);

const COLORS = {
  red: 'bg-red-600',
  black: 'bg-zinc-900',
  green: 'bg-emerald-600',
};

const GOLD_GRADIENT = "linear-gradient(135deg, #BF953F, #FCF6BA, #B38728, #FBF5B7, #AA771C)";

const ALERT_CONFIG_TYPES = [
  { id: 'color', label: 'Cor', values: [{id: 'red', label: 'Vermelho'}, {id: 'black', label: 'Preto'}] },
  { id: 'parity', label: 'Paridade', values: [{id: 'even', label: 'Par'}, {id: 'odd', label: 'Ímpar'}] },
  { id: 'highlow', label: 'Alto/Baixo', values: [{id: 'high', label: 'Alto'}, {id: 'low', label: 'Baixo'}] },
  { id: 'dozen', label: 'Dúzia', values: [{id: '1', label: '1ª Dúzia'}, {id: '2', label: '2ª Dúzia'}, {id: '3', label: '3ª Dúzia'}] },
  { id: 'column', label: 'Coluna', values: [{id: '1', label: '1ª Coluna'}, {id: '2', label: '2ª Coluna'}, {id: '3', label: '3ª Coluna'}] },
  { id: 'terminalGroup', label: 'Grupo Terminal', values: [{id: '1', label: 'G1 (1,4,7)'}, {id: '2', label: 'G2 (2,5,8)'}, {id: '3', label: 'G3 (3,6,9)'}] },
  { id: 'terminal', label: 'Terminal', values: Array.from({length: 10}, (_, i) => ({id: i.toString(), label: `T-${i}`})) },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('DASHBOARD');
  const [legalModal, setLegalModal] = useState<{ open: boolean; type: 'terms' | 'privacy' }>({ open: false, type: 'terms' });
  const [history, setHistory] = useState<number[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [customRules, setCustomRules] = useState<CustomAlertRule[]>([
    { id: '1', type: 'color', value: 'red', threshold: 5, enabled: true },
    { id: '2', type: 'color', value: 'black', threshold: 5, enabled: true },
    { id: '3', type: 'dozen', value: '1', threshold: 3, enabled: true },
  ]);
  const [isAddingRule, setIsAddingRule] = useState(false);
  const [newRule, setNewRule] = useState<Partial<CustomAlertRule>>({
    type: 'color',
    value: 'red',
    threshold: 5,
    enabled: true
  });
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);
  const [engineWeights, setEngineWeights] = useState({
    neural: 1.0,
    markov: 1.0,
    bias: 1.0,
    sector: 1.0,
    shortTerm: 1.0
  });
  const [ballisticMode, setBallisticMode] = useState(false);
  const [currentDropPoint, setCurrentDropPoint] = useState<number | null>(null);

  // --- AUTOMATIC WEIGHT BALANCING (BRAIN ADAPTATION) ---
  useEffect(() => {
    if (history.length < 10) return;

    // Calculate Chaos Index (Volatility)
    const unique15 = new Set(history.slice(0, 15)).size;
    const chaos = unique15 / 15;

    // Calculate Sector Concentration
    const last10 = history.slice(0, 10);
    const sectorCounts: Record<string, number> = { voisins: 0, tiers: 0, orphelins: 0, jeuZero: 0 };
    last10.forEach(num => {
      if (SECTORS.voisins.includes(num)) sectorCounts.voisins++;
      if (SECTORS.tiers.includes(num)) sectorCounts.tiers++;
      if (SECTORS.orphelins.includes(num)) sectorCounts.orphelins++;
      if (SECTORS.jeuZero.includes(num)) sectorCounts.jeuZero++;
    });
    const maxSectorCount = Math.max(...Object.values(sectorCounts));

    // Adjust weights based on table behavior
    setEngineWeights(prev => {
      const newWeights = { ...prev };

      // 1. If table is very chaotic (high unique numbers), reduce Neural/Markov and increase Sector/Bias
      if (chaos > 0.8) {
        newWeights.neural = 0.7;
        newWeights.markov = 0.6;
        newWeights.sector = 1.4;
        newWeights.bias = 1.3;
        newWeights.shortTerm = 1.5; // Increase short-term focus in chaos
      } 
      // 2. If table is repeating (low unique numbers), increase Neural/Markov
      else if (chaos < 0.4) {
        newWeights.neural = 1.5;
        newWeights.markov = 1.4;
        newWeights.sector = 0.8;
        newWeights.bias = 0.8;
        newWeights.shortTerm = 0.9;
      }
      // 3. If there is strong sector concentration, boost Sector weight
      if (maxSectorCount >= 5) {
        newWeights.sector = Math.min(newWeights.sector + 0.3, 2.0);
        newWeights.shortTerm = Math.min(newWeights.shortTerm + 0.2, 1.8);
      }

      // 4. History length factor
      if (history.length > 100) {
        newWeights.markov = Math.min(newWeights.markov + 0.2, 1.8);
        newWeights.neural = Math.min(newWeights.neural + 0.1, 1.8);
      }

      return newWeights;
    });
  }, [history]);
  const [isMuted, setIsMuted] = useState(false);
  const [searchResults, setSearchResults] = useState<string | null>(null);
  const [isSearchingGoogle, setIsSearchingGoogle] = useState(false);
  const [browserUrl, setBrowserUrl] = useState<string | null>(null);
  const [lastNumber, setLastNumber] = useState<number | null>(null);

  const handleGoogleSearch = React.useCallback(async (query: string) => {
    if (!query) {
      setBrowserUrl(null);
      setSearchResults(null);
      return;
    }
    setIsSearchingGoogle(true);
    setSearchResults(null);

    const trimmedQuery = query.trim();
    const isUrl = (trimmedQuery.includes('.') && !trimmedQuery.includes(' ')) || trimmedQuery.startsWith('http');
    
    if (isUrl) {
      let url = trimmedQuery;
      if (!url.startsWith('http')) url = 'https://' + url;
      setBrowserUrl(url);
      setIsSearchingGoogle(false);
      return;
    }

    setSearchResults("Pesquisa desativada. Use apenas entrada manual ou URLs diretas.");
    setIsSearchingGoogle(false);
  }, []);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const session = await getUserSession(currentUser.uid);
          if (session && session.history) {
            setHistory(session.history);
          }
        } catch (err) {
          console.error("Error fetching session:", err);
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Sync history to Firestore (Debounced)
  useEffect(() => {
    if (!user || history.length === 0) return;
    
    const timer = setTimeout(() => {
      saveUserSession(user.uid, history).catch(err => {
        console.error("Error saving session:", err);
      });
    }, 5000); // Sync every 5 seconds of inactivity

    return () => clearTimeout(timer);
  }, [history, user]);

  // Dynamic Weight Balancing Logic (Optimized)
  useEffect(() => {
    if (history.length < 20) return;

    const lastNum = history[0];
    const prevHistory = history.slice(1, 101); // Limit to last 100 for evaluation

    // Evaluate Neural Engine
    const neuralProbs = neuralEngine.predict(prevHistory);
    const neuralHit = neuralProbs.indexOf(Math.max(...neuralProbs)) === lastNum;

    // Evaluate Markov
    let markovHit = false;
    const prevLastNum = prevHistory[0];
    const transitions: Record<number, number> = {};
    // Only look at the last 50 transitions for speed
    const transitionHistory = prevHistory.slice(0, 50);
    for (let i = 0; i < transitionHistory.length - 1; i++) {
      if (transitionHistory[i+1] === prevLastNum) {
        const next = transitionHistory[i];
        transitions[next] = (transitions[next] || 0) + 1;
      }
    }
    const topMarkov = Object.entries(transitions).sort((a, b) => b[1] - a[1])[0];
    if (topMarkov && Number(topMarkov[0]) === lastNum) markovHit = true;

    setEngineWeights(prev => ({
      neural: Math.max(0.5, Math.min(2.0, prev.neural + (neuralHit ? 0.1 : -0.02))),
      markov: Math.max(0.5, Math.min(2.0, prev.markov + (markovHit ? 0.1 : -0.02))),
      bias: prev.bias,
      sector: prev.sector,
      shortTerm: prev.shortTerm
    }));
  }, [history]);

  // Train neural engine when history changes
  useEffect(() => {
    if (history.length >= 20) {
      neuralEngine.train(history);
    }
  }, [history]);

  const addNumber = React.useCallback((num: number) => {
    // Simulate haptic feedback
    if (window.navigator.vibrate) {
      window.navigator.vibrate(20);
    }
    
    if (ballisticMode) {
      if (currentDropPoint === null) {
        setCurrentDropPoint(num);
        toast.success(`Ponto de soltura: ${num}. Agora selecione onde caiu.`);
        return;
      } else {
        // We have both drop point and landed number
        // In a real app, we'd store this in a more complex history object.
        // For now, we'll just store the landed number in the main history,
        // but we could extend the history state to hold objects if needed.
        // Let's keep it simple for this iteration and just log it or use it for immediate prediction.
        const drop = currentDropPoint;
        const landed = num;
        
        // Calculate distance
        const dropIdx = WHEEL_ORDER.indexOf(drop);
        const landedIdx = WHEEL_ORDER.indexOf(landed);
        let distance = (landedIdx - dropIdx + 37) % 37;
        
        toast.success(`Bola viajou ${distance} casas. (Soltura: ${drop} -> Caiu: ${landed})`);
        
        setCurrentDropPoint(null);
        setLastNumber(num);
        setHistory(prev => [num, ...prev].slice(0, 500));
        return;
      }
    }

    setLastNumber(num);
    setHistory(prev => [num, ...prev].slice(0, 500));
  }, [ballisticMode, currentDropPoint]);

  const clearHistory = React.useCallback(() => {
    setHistory([]);
    setDismissedAlerts([]);
  }, []);

  const removeLast = React.useCallback(() => {
    setHistory(prev => prev.slice(1));
  }, []);

  const addCustomRule = () => {
    if (!newRule.type || !newRule.value || !newRule.threshold) return;
    const rule: CustomAlertRule = {
      id: Math.random().toString(36).substr(2, 9),
      type: newRule.type as AlertType,
      value: newRule.value,
      threshold: Number(newRule.threshold),
      enabled: true
    };
    setCustomRules(prev => [...prev, rule]);
    setIsAddingRule(false);
  };

  const removeCustomRule = (id: string) => {
    setCustomRules(prev => prev.filter(r => r.id !== id));
  };

  const toggleRule = (id: string) => {
    setCustomRules(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  };

  // Advanced Statistics & Prediction Engine (Ensemble Module)
  const stats = useMemo(() => {
    if (history.length === 0) return null;

    const historyTotal = history.length;
    const counts = {
      red: 0, black: 0, green: 0,
      even: 0, odd: 0,
      high: 0, low: 0,
      dozen1: 0, dozen2: 0, dozen3: 0,
      col1: 0, col2: 0, col3: 0,
      termGroup1: 0, termGroup2: 0, termGroup3: 0,
    };

    const correlations = {
      redEven: 0, redOdd: 0, blackEven: 0, blackOdd: 0,
      redHigh: 0, redLow: 0, blackHigh: 0, blackLow: 0,
      evenHigh: 0, evenLow: 0, oddHigh: 0, oddLow: 0
    };

    const numberFrequency: Record<number, number> = {};
    const terminalFrequency: Record<number, number> = {};
    
    // Sector Analysis (Voisins, Tiers, Orphelins, Jeu Zero)
    const sectorCounts = { voisins: 0, tiers: 0, orphelins: 0, jeuZero: 0 };
    
    // Last 50 frequency for Bar Chart
    const last50 = history.slice(0, 50);
    const freq50: Record<number, number> = {};
    last50.forEach(n => freq50[n] = (freq50[n] || 0) + 1);
    const barChartData = Array.from({ length: 37 }, (_, i) => ({
      number: i,
      frequency: freq50[i] || 0,
      color: ROULETTE_NUMBERS[i].color === 'red' ? '#ef4444' : ROULETTE_NUMBERS[i].color === 'black' ? '#18181b' : '#22c55e'
    }));

    // Sector Trends (Last 100 divided into 10 blocks of 10)
    const last100 = history.slice(0, 100);
    const sectorTrends: { index: number; voisins: number; tiers: number; orphelins: number }[] = [];
    const voisinsSet = new Set(SECTORS.voisins);
    const tiersSet = new Set(SECTORS.tiers);
    const orphelinsSet = new Set(SECTORS.orphelins);
    const jeuZeroSet = new Set(SECTORS.jeuZero);

    for (let i = 0; i < 10; i++) {
      const block = last100.slice(i * 10, (i + 1) * 10);
      if (block.length === 0) break;
      const bCounts = { voisins: 0, tiers: 0, orphelins: 0 };
      for (const n of block) {
        if (voisinsSet.has(n)) bCounts.voisins++;
        else if (tiersSet.has(n)) bCounts.tiers++;
        else if (orphelinsSet.has(n)) bCounts.orphelins++;
      }
      sectorTrends.unshift({
        index: 10 - i,
        voisins: bCounts.voisins,
        tiers: bCounts.tiers,
        orphelins: bCounts.orphelins
      });
    }

    const last200 = history.slice(0, 200);
    const total200 = last200.length || 1;

    last200.forEach((num) => {
      const data = ROULETTE_NUMBERS[num];
      if (data.color === 'red') counts.red++;
      else if (data.color === 'black') counts.black++;
      else counts.green++;

      if (num !== 0) {
        if (data.isEven) counts.even++; else counts.odd++;
        if (data.isHigh) counts.high++; else counts.low++;
        
        // Correlation Tracking
        if (data.color === 'red') {
          if (data.isEven) correlations.redEven++;
          else correlations.redOdd++;
          if (data.isHigh) correlations.redHigh++;
          else correlations.redLow++;
        } else if (data.color === 'black') {
          if (data.isEven) correlations.blackEven++;
          else correlations.blackOdd++;
          if (data.isHigh) correlations.blackHigh++;
          else correlations.blackLow++;
        }
        
        if (data.isEven) {
          if (data.isHigh) correlations.evenHigh++;
          else correlations.evenLow++;
        } else {
          if (data.isHigh) correlations.oddHigh++;
          else correlations.oddLow++;
        }

        if (data.dozen === 1) counts.dozen1++;
        else if (data.dozen === 2) counts.dozen2++;
        else counts.dozen3++;
        
        if (data.column === 1) counts.col1++;
        else if (data.column === 2) counts.col2++;
        else counts.col3++;

        const terminal = num % 10;
        if (terminal === 1 || terminal === 4 || terminal === 7) counts.termGroup1++;
        else if (terminal === 2 || terminal === 5 || terminal === 8) counts.termGroup2++;
        else if (terminal === 3 || terminal === 6 || terminal === 9) counts.termGroup3++;
      }
      numberFrequency[num] = (numberFrequency[num] || 0) + 1;
      const terminal = num % 10;
      terminalFrequency[terminal] = (terminalFrequency[terminal] || 0) + 1;

      if (voisinsSet.has(num)) sectorCounts.voisins++;
      else if (tiersSet.has(num)) sectorCounts.tiers++;
      else if (orphelinsSet.has(num)) sectorCounts.orphelins++;
      
      if (jeuZeroSet.has(num)) sectorCounts.jeuZero++;
    });

    // --- BIAS DETECTION ENGINE ---
    const detectedBiases: { type: string; value: string; confidence: number }[] = [];
    
    Object.entries(sectorCounts).forEach(([sector, count]) => {
      const actualProb = count / total200;
      const expectedProb = SECTOR_PROBABILITIES[sector as keyof typeof SECTOR_PROBABILITIES];
      const deviation = (actualProb - expectedProb) / expectedProb;
      
      if (deviation > 0.25 && total200 > 10) {
        detectedBiases.push({ 
          type: 'Setor', 
          value: sector.toUpperCase(), 
          confidence: Math.min(Math.round(deviation * 100), 100) 
        });
      }
    });

    // 2. Color/Parity/High-Low Bias
    const simpleBets = [
      { name: 'Vermelho', count: counts.red, expected: 18/37 },
      { name: 'Preto', count: counts.black, expected: 18/37 },
      { name: 'Par', count: counts.even, expected: 18/37 },
      { name: 'Ímpar', count: counts.odd, expected: 18/37 },
      { name: 'Alto', count: counts.high, expected: 18/37 },
      { name: 'Baixo', count: counts.low, expected: 18/37 },
    ];

    simpleBets.forEach(bet => {
      const actualProb = bet.count / total200;
      const deviation = (actualProb - bet.expected) / bet.expected;
      if (deviation > 0.3 && total200 > 15) {
        detectedBiases.push({ 
          type: 'Tendência', 
          value: bet.name, 
          confidence: Math.min(Math.round(deviation * 100), 100) 
        });
      }
    });

    // 2.1 Correlation Bias (Refined Algorithm)
    const correlationBets = [
      { name: 'Vermelho/Par', count: correlations.redEven, expected: 9/37 },
      { name: 'Vermelho/Ímpar', count: correlations.redOdd, expected: 9/37 },
      { name: 'Preto/Par', count: correlations.blackEven, expected: 9/37 },
      { name: 'Preto/Ímpar', count: correlations.blackOdd, expected: 9/37 },
      { name: 'Vermelho/Alto', count: correlations.redHigh, expected: 9/37 },
      { name: 'Vermelho/Baixo', count: correlations.redLow, expected: 9/37 },
      { name: 'Preto/Alto', count: correlations.blackHigh, expected: 9/37 },
      { name: 'Preto/Baixo', count: correlations.blackLow, expected: 9/37 },
      { name: 'Par/Alto', count: correlations.evenHigh, expected: 9/37 },
      { name: 'Par/Baixo', count: correlations.evenLow, expected: 9/37 },
      { name: 'Ímpar/Alto', count: correlations.oddHigh, expected: 9/37 },
      { name: 'Ímpar/Baixo', count: correlations.oddLow, expected: 9/37 },
    ];

    correlationBets.forEach(bet => {
      const actualProb = bet.count / total200;
      const deviation = (actualProb - bet.expected) / bet.expected;
      // Correlation bias is harder to detect, so we use a slightly lower threshold but higher total requirement
      if (deviation > 0.4 && total200 > 25) {
        detectedBiases.push({ 
          type: 'Correlação', 
          value: bet.name, 
          confidence: Math.min(Math.round(deviation * 100), 100) 
        });
      }
    });

    // 3. Terminal Bias
    const terminalGroups = [
      { name: 'G1 (1,4,7)', count: counts.termGroup1, expected: 12/37 },
      { name: 'G2 (2,5,8)', count: counts.termGroup2, expected: 12/37 },
      { name: 'G3 (3,6,9)', count: counts.termGroup3, expected: 12/37 },
    ];

    terminalGroups.forEach(group => {
      const actualProb = group.count / total200;
      const deviation = (actualProb - group.expected) / group.expected;
      if (deviation > 0.35 && total200 > 20) {
        detectedBiases.push({ 
          type: 'Terminal G', 
          value: group.name, 
          confidence: Math.min(Math.round(deviation * 100), 100) 
        });
      }
    });

    Object.entries(terminalFrequency).forEach(([terminal, count]) => {
      const actualProb = count / total200;
      const expectedProb = 1/10;
      const deviation = (actualProb - expectedProb) / expectedProb;
      if (deviation > 0.5 && total200 > 20) {
        detectedBiases.push({ 
          type: 'Terminal', 
          value: `T-${terminal}`, 
          confidence: Math.min(Math.round(deviation * 100), 100) 
        });
      }
    });

    // 4. Dealer Signature (Distance Analysis)
    // Calculate distance between consecutive numbers on the wheel
    if (history.length >= 5) {
      const distances: number[] = [];
      for (let i = 0; i < 4; i++) {
        const currentIdx = WHEEL_ORDER.indexOf(history[i]);
        const prevIdx = WHEEL_ORDER.indexOf(history[i+1]);
        let dist = currentIdx - prevIdx;
        if (dist < 0) dist += 37;
        distances.push(dist);
      }
      // If distances are similar (within a range of 3), it's a signature
      const avgDist = distances.reduce((a, b) => a + b, 0) / distances.length;
      const variance = distances.reduce((a, b) => a + Math.pow(b - avgDist, 2), 0) / distances.length;
      
      if (variance < 15) {
        // Higher confidence for lower variance
        const signatureConfidence = Math.min(Math.round((15 - variance) * 6.66), 100);
        detectedBiases.push({ 
          type: 'Assinatura', 
          value: `Salto ~${Math.round(avgDist)}`, 
          confidence: signatureConfidence 
        });
      }
    }

    // 5. Refined Hot/Cold Analysis (Last 100)
    const last100Full = (history || []).slice(0, 100);
    const total100 = last100Full.length;
    if (total100 >= 30) {
      const freq100: Record<number, number> = {};
      last100Full.forEach(n => freq100[n] = (freq100[n] || 0) + 1);
      
      const expected100 = total100 / 37;
      const stdDev = Math.sqrt(total100 * (1/37) * (36/37));
      
      Object.entries(freq100).forEach(([num, count]) => {
        const n = Number(num);
        const zScore = (count - expected100) / stdDev;
        
        if (zScore > 2.0) {
          detectedBiases.push({ 
            type: 'Hiper-Quente', 
            value: `#${n}`, 
            confidence: Math.min(Math.round(zScore * 30), 100) 
          });
        }
      });

      const missingInLast100 = Array.from({ length: 37 }, (_, i) => i).filter(num => {
        const lastSeen = history.indexOf(num);
        return lastSeen >= 100 || lastSeen === -1;
      });
      
      if (missingInLast100.length > 8) {
        detectedBiases.push({ 
          type: 'Anomalia', 
          value: 'Vácuo de Números', 
          confidence: 75 
        });
      }
    }

    // 6. Detecção de Padrão Visual
    if (history.length >= 4) {
      const last4 = (history || []).slice(0, 4);
      
      // Padrão de Cores (Sequência Longa)
      const colors = last4.map(n => ROULETTE_NUMBERS[n].color);
      if (colors.every(c => c === 'red') || colors.every(c => c === 'black')) {
        detectedBiases.push({
          type: 'Padrão Visual',
          value: `Sequência ${colors[0] === 'red' ? 'Vermelha' : 'Preta'}`,
          confidence: 85
        });
      }

      // Padrão de Linha (Mesma Fila/Row no Layout)
      const rows = last4.filter(n => n > 0).map(n => (n - 1) % 3);
      if (rows.length === 4 && rows.every(r => r === rows[0])) {
        detectedBiases.push({
          type: 'Padrão Visual',
          value: `Linha Horizontal (Fila ${rows[0] + 1})`,
          confidence: 90
        });
      }

      // Padrão de Coluna (Mesma Coluna no Layout)
      const cols = last4.filter(n => n > 0).map(n => Math.floor((n - 1) / 3));
      if (cols.length === 4 && cols.every(c => c === cols[0])) {
        detectedBiases.push({
          type: 'Padrão Visual',
          value: `Coluna Vertical`,
          confidence: 90
        });
      }

      // Padrão de Escada (Diagonal no Layout)
      let isDiagonal = true;
      for (let i = 0; i < 3; i++) {
        if (history[i] === 0 || history[i+1] === 0) { isDiagonal = false; break; }
        const r1 = (history[i] - 1) % 3;
        const r2 = (history[i+1] - 1) % 3;
        const c1 = Math.floor((history[i] - 1) / 3);
        const c2 = Math.floor((history[i+1] - 1) / 3);
        if (Math.abs(r1 - r2) !== 1 || Math.abs(c1 - c2) !== 1) {
          isDiagonal = false;
          break;
        }
      }
      if (isDiagonal) {
        detectedBiases.push({
          type: 'Padrão Visual',
          value: 'Escada Diagonal',
          confidence: 95
        });
      }
    }

    // --- ENSEMBLE PREDICTION ENGINE (V2) ---
    const numberScores = new Array(37).fill(0);
    let scores = new Array(10).fill(0); // Scores para terminais 0-9
    
    // --- CAMADA 1: ANÁLISE DE FAMÍLIAS (1.4.7) ---
    Object.keys(FAMILIAS_CFG).forEach(key => {
      const familia = FAMILIAS_CFG[key as keyof typeof FAMILIAS_CFG];
      const ultimoVisto = history.findIndex(n => familia.includes(n % 10));
      
      // Se a família não sai há mais de 7 rodadas, aumenta o peso
      if (ultimoVisto > 7 || ultimoVisto === -1) {
        familia.forEach(t => scores[t] += 40); 
      }
      // Se a família acabou de sair (repetição/tendência), aumenta o peso
      if (ultimoVisto < 2 && ultimoVisto !== -1) {
        familia.forEach(t => scores[t] += 25);
      }
    });

    // --- CAMADA 2: ANÁLISE DE ESPELHOS E SETOR ZERO ---
    // 2.1 Espelhos de Terminais (Soma 10)
    ESPELHOS_CFG.pairs.forEach(pair => {
      const f0 = last50.filter(n => n % 10 === pair[0]).length;
      const f1 = last50.filter(n => n % 10 === pair[1]).length;
      const diff = Math.abs(f0 - f1);
      
      if (diff >= 5) { // Desequilíbrio significativo detectado
        const terminalAtrasado = f0 < f1 ? pair[0] : pair[1];
        const terminalForte = f0 < f1 ? pair[1] : pair[0];
        scores[terminalAtrasado] += 50 * engineWeights.bias;
        
        detectedBiases.push({
          type: 'Desequilíbrio Espelho',
          value: `Terminal ${terminalAtrasado} (Atrasado vs ${terminalForte})`,
          confidence: Math.min(diff * 18, 99)
        });
      }
    });

    // 2.2 Espelhos de Dígitos (12/21, 13/31, etc.) - REQUERIMENTO DO USUÁRIO
    if (history.length > 0) {
      const lastNum = history[0];
      ESPELHOS_CFG.digitMirrorPairs.forEach(pair => {
        if (pair.includes(lastNum)) {
          const counterpart = pair[0] === lastNum ? pair[1] : pair[0];
          // Bônus agressivo para o espelho direto
          numberScores[counterpart] += 150 * engineWeights.bias;
          
          detectedBiases.push({
            type: 'Espelho Direto',
            value: `${lastNum} ➔ ${counterpart}`,
            confidence: 95
          });
        }
      });
    }

    // Verifica densidade no Setor Zero (Últimas 20 rodadas)
    const last20 = history.slice(0, 20);
    const contagemSetorZero = last20.filter(n => ESPELHOS_CFG.setorZero.includes(n % 10)).length;
    if (contagemSetorZero >= 7) { // Densidade incomum (>= 35% das rodadas)
      ESPELHOS_CFG.setorZero.forEach(t => scores[t] += 40);
      
      detectedBiases.push({
        type: 'Densidade Setor Zero',
        value: `${contagemSetorZero}/20 giros`,
        confidence: Math.min(contagemSetorZero * 12, 100)
      });
    }

    // --- CAMADA 3: ANÁLISE DE CALOR E MOMENTUM (MELHORIA) ---
    // Identifica terminais "quentes" nas últimas 15 rodadas
    const last15 = (history || []).slice(0, 15);
    for (let i = 0; i < 10; i++) {
      const freq = last15.filter(n => n % 10 === i).length;
      if (freq >= 3) { // Terminal com alta frequência
        scores[i] += 20; // Bônus de momentum
      }
    }

    // Detecção de Repetição Imediata
    if (history.length >= 2) {
      const t1 = history[0] % 10;
      const t2 = history[1] % 10;
      const t3 = history.length >= 3 ? history[2] % 10 : -1;
      
      if (t1 === t2 && t2 === t3) {
        // Se o terminal se repetiu nas TRÊS últimas rodadas (ex: 6, 26, 16)
        scores[t1] += 500 * engineWeights.bias; // Bônus extremo
        
        detectedBiases.push({
          type: 'Terminal Triplo',
          value: `Terminal ${t1} chamou 3x seguidas`,
          confidence: 99
        });
      } else if (t1 === t2) {
        // Se o terminal se repetiu nas DUAS últimas rodadas
        scores[t1] += 300 * engineWeights.bias; // Bônus massivo para o terminal
        
        detectedBiases.push({
          type: 'Terminal Repetido',
          value: `Terminal ${t1} chamando Terminal ${t1}`,
          confidence: 99
        });
      } else {
        // Fallback para a lógica antiga de repetição em 3 rodadas (não consecutivas)
        const countLast3 = (history || []).slice(0, 3).filter(n => n % 10 === t1).length;
        if (countLast3 >= 2) {
          scores[t1] += 15;
        }
      }
    }

    // --- CAMADA 4: MOMENTUM DE VIZINHANÇA (OPTIMIZED) ---
    const last10Momentum = history.slice(0, 10);
    const last10Set = new Set(last10Momentum);
    
    for (let j = 0; j < 37; j++) {
      const n = WHEEL_ORDER[j];
      const terminal = n % 10;
      if (scores[terminal] > 50) {
        const prev = WHEEL_ORDER[(j - 1 + 37) % 37];
        const next = WHEEL_ORDER[(j + 1) % 37];
        if (last10Set.has(prev)) scores[terminal] += 10;
        if (last10Set.has(next)) scores[terminal] += 10;
      }
    }
    const maxScore = Math.max(...scores);
    const targetTerminal = scores.indexOf(maxScore);
    const confidence = Math.min(maxScore, 99); // Cap em 99%

    // --- CALCULO DE ALVOS ESPECÍFICOS (TOP 5) ---
    for (let i = 0; i <= 36; i++) {
      numberScores[i] += scores[i % 10]; // Base score do terminal
    }

    // Adiciona bônus de vieses detectados
    detectedBiases.forEach(bias => {
      if (bias.type === 'Setor') {
        const sectorMap: Record<string, number[]> = {
          VOISINS: [22, 18, 29, 7, 28, 12, 35, 3, 26, 0, 32, 15, 19, 4, 21, 2, 25],
          TIERS: [27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33],
          ORPHELINS: [1, 20, 14, 31, 9, 17, 34, 6],
          JEUZERO: [12, 35, 3, 26, 0, 32, 15]
        };
        const sectorNumbers = sectorMap[bias.value as keyof typeof sectorMap];
        if (sectorNumbers) {
          sectorNumbers.forEach(n => numberScores[n] += (bias.confidence / 2) * engineWeights.bias);
        }
      }
      if (bias.type === 'Hiper-Quente') {
        const num = parseInt(bias.value.replace('#', ''));
        if (!isNaN(num)) numberScores[num] += bias.confidence * engineWeights.bias;
      }
      if (bias.type === 'Assinatura' && history.length > 0) {
        const lastNum = history[0];
        const lastIdx = WHEEL_ORDER.indexOf(lastNum);
        const jump = parseInt(bias.value.replace('Salto ~', ''));
        if (!isNaN(jump)) {
          const targetIdx = (lastIdx + jump) % 37;
          for (let offset = -2; offset <= 2; offset++) {
            const idx = (targetIdx + offset + 37) % 37;
            numberScores[WHEEL_ORDER[idx]] += (bias.confidence / (Math.abs(offset) + 1)) * engineWeights.bias;
          }
        }
      }
      if (bias.type === 'Padrão Visual') {
        // Se for sequência de cor, reforça a quebra de padrão (cor oposta)
        if (bias.value.includes('Sequência')) {
          const colorToAvoid = bias.value.includes('Vermelha') ? 'red' : 'black';
          const oppositeColor = colorToAvoid === 'red' ? 'black' : 'red';
          for (let i = 0; i <= 36; i++) {
            if (ROULETTE_NUMBERS[i].color === oppositeColor) numberScores[i] += 20 * engineWeights.bias;
          }
        }
        // Se for linha/coluna/escada, reforça números que continuam ou cercam o padrão
        if (bias.value.includes('Linha') || bias.value.includes('Coluna') || bias.value.includes('Escada')) {
          for (let i = 0; i <= 36; i++) {
            numberScores[i] += 10 * engineWeights.bias; // Bônus geral para números do motor central
          }
        }
      }
    });

    // --- CAMADA 5: NEURAL ENGINE (TENSORFLOW) ---
    const neuralProbs = neuralEngine.predict(history);
    neuralProbs.forEach((prob, num) => {
      numberScores[num] += prob * 180 * engineWeights.neural; // Dynamic weight
    });

    // --- CAMADA 6: MARKOV CHAIN (TRANSITIONS) ---
    if (history.length > 10) {
      const lastNum = history[0];
      const transitions: Record<number, number> = {};
      for (let i = 0; i < history.length - 1; i++) {
        if (history[i+1] === lastNum) {
          const next = history[i];
          transitions[next] = (transitions[next] || 0) + 1;
        }
      }
      Object.entries(transitions).forEach(([num, count]) => {
        numberScores[Number(num)] += (count / history.length) * 200 * engineWeights.markov;
      });
    }

    // --- CAMADA 7: SECTOR VELOCITY & MOMENTUM ---
    const recentSectorCounts: Record<string, number> = {};
    for (let i = 0; i < Math.min(history.length, 5); i++) {
      const s = getSector(history[i]);
      recentSectorCounts[s] = (recentSectorCounts[s] || 0) + 1;
    }
    
    const dominantSector = Object.entries(recentSectorCounts).sort((a, b) => b[1] - a[1])[0];
    if (dominantSector && dominantSector[1] >= 3) {
      const nums = SECTORS[dominantSector[0].toLowerCase() as keyof typeof SECTORS];
      if (nums) {
        for (const n of nums) numberScores[n] += 40 * engineWeights.sector;
      }
    }

    // --- CAMADA 8: VIZINHOS HISTÓRICOS (TEMPORAIS) ---
    const contextTargets: number[] = [];
    if (history.length > 2) {
      const currentNum = history[0];
      const historicalNeighbors: Record<number, number> = {};
      
      for (let i = 1; i < history.length - 1; i++) {
        if (history[i] === currentNum) {
          const before = history[i + 1];
          const after = history[i - 1];
          
          if (before !== undefined) historicalNeighbors[before] = (historicalNeighbors[before] || 0) + 1;
          if (after !== undefined) historicalNeighbors[after] = (historicalNeighbors[after] || 0) + 1;
        }
      }
      
      Object.entries(historicalNeighbors).forEach(([num, count]) => {
        const n = Number(num);
        if (count >= 2) {
          contextTargets.push(n);
        }
      });
    }

    // --- CAMADA 9: VÁCUO RECORRENTE (GAP ANALYSIS) ---
    // Análise para Terminais (0-9)
    for (let t = 0; t < 10; t++) {
      const terminalNums = Array.from({length: 37}, (_, i) => i).filter(n => n % 10 === t);
      const pastGaps = calculateGaps(history, terminalNums);
      
      if (pastGaps.length > 0) {
        const lastCompletedGap = pastGaps[pastGaps.length - 1];
        const currentOngoingGap = history.findIndex(n => terminalNums.includes(n));
        
        // Se o vácuo atual está chegando perto ou é igual ao último vácuo
        if (currentOngoingGap !== -1 && currentOngoingGap >= lastCompletedGap - 1 && currentOngoingGap <= lastCompletedGap + 1 && lastCompletedGap > 0) {
          scores[t] += 45 * engineWeights.bias;
          
          detectedBiases.push({
            type: 'Vácuo Recorrente',
            value: `Terminal ${t} (Gap ${lastCompletedGap})`,
            confidence: currentOngoingGap === lastCompletedGap ? 95 : 85
          });
        }
      }
    }

    // Análise para Famílias (147, 258, 369)
    Object.entries(FAMILIAS_CFG).forEach(([name, terminals]) => {
      const familyNums = Array.from({length: 37}, (_, i) => i).filter(n => terminals.includes(n % 10));
      const pastGaps = calculateGaps(history, familyNums);
      
      if (pastGaps.length > 0) {
        const lastCompletedGap = pastGaps[pastGaps.length - 1];
        const currentOngoingGap = history.findIndex(n => familyNums.includes(n));
        
        if (currentOngoingGap !== -1 && currentOngoingGap >= lastCompletedGap - 1 && currentOngoingGap <= lastCompletedGap + 1 && lastCompletedGap > 0) {
          terminals.forEach(t => scores[t] += 50 * engineWeights.bias);
          
          detectedBiases.push({
            type: 'Vácuo Recorrente',
            value: `Família ${name} (Gap ${lastCompletedGap})`,
            confidence: currentOngoingGap === lastCompletedGap ? 98 : 90
          });
        }
      }
    });

    // --- CAMADA 10: SEQUENCE ANALYSIS ---
    const sequences = {
      color: calculateSequence(history, n => ROULETTE_NUMBERS[n].color === 'red', 'red', 'black'),
      parity: calculateSequence(history, n => ROULETTE_NUMBERS[n].isEven, 'even', 'odd'),
      highLow: calculateSequence(history, n => ROULETTE_NUMBERS[n].isHigh, 'high', 'low')
    };

    // --- CAMADA 11: TABLE HEATMAP ---
    const tableHeatmap = Array.from({ length: 37 }, (_, i) => ({
      num: i,
      frequency: numberFrequency[i] || 0,
      color: ROULETTE_NUMBERS[i].color
    }));

    // --- CAMADA 12: HISTORICAL GAP PATTERN (INDIVIDUAL NUMBERS) ---
    for (let i = 0; i <= 36; i++) {
      const gaps = calculateGaps(history, [i]);
      if (gaps.length >= 2) {
        const currentGap = history.indexOf(i);
        if (currentGap !== -1) {
          // Conta frequencia de cada gap histórico
          const gapFreq: Record<number, number> = {};
          gaps.forEach(g => gapFreq[g] = (gapFreq[g] || 0) + 1);
          
          // Verifica se o gap atual é um gap recorrente (veio pelo menos 2 vezes com esse gap)
          if (gapFreq[currentGap] >= 2) {
            numberScores[i] += 80 * engineWeights.bias;
            
            detectedBiases.push({
              type: 'Padrão de Vácuo',
              value: `Número ${i} (Gap ${currentGap} Recorrente)`,
              confidence: 90 + (gapFreq[currentGap] * 2)
            });
          }
        }
      }
    }

    // --- CAMADA 13: DEALER SIGNATURE (ASSINATURA DO CRUPIÊ) ---
    if (history.length >= 5) {
      const distances: number[] = [];
      for (let i = 0; i < 4; i++) {
        const currentIdx = WHEEL_ORDER.indexOf(history[i]);
        const prevIdx = WHEEL_ORDER.indexOf(history[i+1]);
        let dist = currentIdx - prevIdx;
        if (dist < 0) dist += 37;
        distances.push(dist);
      }
      const avgDist = distances.reduce((a, b) => a + b, 0) / distances.length;
      const variance = distances.reduce((a, b) => a + Math.pow(b - avgDist, 2), 0) / distances.length;
      
      // Se a variância for baixa, o crupiê está sendo mecânico
      if (variance < 15) {
        const lastIdx = WHEEL_ORDER.indexOf(history[0]);
        const predictedIdx = (lastIdx + Math.round(avgDist)) % 37;
        const predictedNum = WHEEL_ORDER[predictedIdx];
        
        numberScores[predictedNum] += 100 * engineWeights.bias;
        // Vizinhos da assinatura
        for (let offset = -1; offset <= 1; offset++) {
          const idx = (predictedIdx + offset + 37) % 37;
          numberScores[WHEEL_ORDER[idx]] += 40 * engineWeights.bias;
        }

        detectedBiases.push({
          type: 'Assinatura',
          value: `Salto Constante ~${Math.round(avgDist)} casas`,
          confidence: Math.min(100 - variance, 98)
        });
      }
    }

    // --- CAMADA 13.5: BALLISTIC MODE (PONTO DE SOLTURA) ---
    // If ballistic mode is active and we have a drop point waiting, we predict based on historical distances.
    // Since we don't have a complex history object with drop points yet, we'll use the basic dealer signature
    // average distance calculated above, but applied to the *currentDropPoint* instead of the last landed number.
    if (ballisticMode && currentDropPoint !== null) {
      // Calculate average distance from recent history (assuming last number was the drop point for the current number)
      // This is a simplified ballistic model. A full model would require storing drop points in history.
      const distances: number[] = [];
      for (let i = 0; i < Math.min(10, history.length - 1); i++) {
        const currentIdx = WHEEL_ORDER.indexOf(history[i]);
        const prevIdx = WHEEL_ORDER.indexOf(history[i+1]);
        let dist = currentIdx - prevIdx;
        if (dist < 0) dist += 37;
        distances.push(dist);
      }
      
      if (distances.length > 0) {
        // Find most frequent distance (mode) or use average if variance is low
        const distFreq: Record<number, number> = {};
        distances.forEach(d => distFreq[d] = (distFreq[d] || 0) + 1);
        const mostFrequentDist = parseInt(Object.keys(distFreq).reduce((a, b) => distFreq[parseInt(a)] > distFreq[parseInt(b)] ? a : b));
        
        const dropIdx = WHEEL_ORDER.indexOf(currentDropPoint);
        const predictedIdx = (dropIdx + mostFrequentDist) % 37;
        const predictedNum = WHEEL_ORDER[predictedIdx];
        
        // Massive boost for ballistic prediction
        numberScores[predictedNum] += 500; 
        
        // Boost neighbors
        for (let offset = -2; offset <= 2; offset++) {
          if (offset === 0) continue;
          const idx = (predictedIdx + offset + 37) % 37;
          numberScores[WHEEL_ORDER[idx]] += 200;
        }

        detectedBiases.push({
          type: 'Balística Ativa',
          value: `Alvo: ${predictedNum} (Salto: +${mostFrequentDist})`,
          confidence: 99
        });
      }
    }

    // --- CAMADA 14: Z-SCORE (DESVIO PADRÃO ESTATÍSTICO) ---
    const expectedFreq = history.length / 37;
    const terminalExpectedFreq = history.length / 10;
    
    // Z-Score para Terminais
    for (let t = 0; t < 10; t++) {
      const actual = history.filter(n => n % 10 === t).length;
      const zScore = (actual - terminalExpectedFreq) / Math.sqrt(terminalExpectedFreq || 1);
      
      if (zScore < -1.5) { // Terminal muito atrasado (Anomalia)
        scores[t] += 60 * engineWeights.bias;
        detectedBiases.push({
          type: 'Desvio Padrão',
          value: `Terminal ${t} Sub-representado`,
          confidence: Math.min(Math.abs(zScore) * 30, 95)
        });
      }
    }

    // --- CAMADA 15: CLUSTER ANALYSIS (VIZINHOS DE QUEDA) ---
    const recentHits = history.slice(0, 8);
    const sectorHits: Record<string, number> = { VOISINS: 0, TIERS: 0, ORPHELINS: 0, JEUZERO: 0 };
    
    recentHits.forEach(num => {
      const sector = getSector(num);
      if (sectorHits[sector] !== undefined) sectorHits[sector]++;
    });

    Object.entries(sectorHits).forEach(([sector, count]) => {
      if (count >= 4) { // Cluster detectado
        const nums = SECTORS[sector.toLowerCase() as keyof typeof SECTORS];
        if (nums) {
          nums.forEach(n => numberScores[n] += 45 * engineWeights.sector);
          detectedBiases.push({
            type: 'Setor',
            value: `Cluster em ${sector}`,
            confidence: 70 + (count * 5)
          });
        }
      }
    });

    // --- CAMADA 16: CHAOS INDEX (VOLATILIDADE) ---
    const chaosIndex = (() => {
      if (history.length < 10) return 0.5;
      const uniqueNums = new Set(history.slice(0, 15)).size;
      return uniqueNums / 15; // 1.0 = Caos total, 0.1 = Padrão repetitivo
    })();

    // --- CAMADA 17: DYNAMIC CROSS-TERMINAL CONVERGENCE (HISTORICAL ANALYSIS) ---
    if (history.length >= 5) {
      const currentTerminal = history[0] % 10;
      const nextTerminalCounts: Record<number, number> = {};
      
      // Analisa o histórico para ver qual terminal costuma vir DEPOIS do terminal atual
      // history[0] é o atual. history[1] é o anterior.
      // Se history[i] é o terminal atual, o que veio depois dele é history[i-1]
      for (let i = 1; i < history.length; i++) {
        if (history[i] % 10 === currentTerminal) {
          const nextT = history[i - 1] % 10;
          nextTerminalCounts[nextT] = (nextTerminalCounts[nextT] || 0) + 1;
        }
      }

      let maxCount = 0;
      let bestNextTerminals: number[] = [];
      
      Object.entries(nextTerminalCounts).forEach(([tStr, count]) => {
        if (count > maxCount) {
          maxCount = count;
          bestNextTerminals = [Number(tStr)];
        } else if (count === maxCount && count > 0) {
          bestNextTerminals.push(Number(tStr));
        }
      });

      // Se o terminal atual tem um histórico de chamar um terminal específico (incluindo ele mesmo)
      if (maxCount >= 2) {
        bestNextTerminals.forEach(t => {
          scores[t] += 120 * engineWeights.bias; // Bônus forte para convergência histórica
        });
        
        detectedBiases.push({
          type: 'Sequência Histórica',
          value: `T${currentTerminal} chama T${bestNextTerminals.join(', T')} (${maxCount}x no histórico)`,
          confidence: Math.min(75 + (maxCount * 8), 99)
        });
      }
      
      // Mantém a lógica de padrões comuns como fallback
      const terminalCalls: Record<number, number[]> = {
        1: [4, 7], 2: [5, 8], 3: [6, 9],
        0: [0, 5], 5: [0, 5], 8: [2, 1]
      };
      
      if (history.length >= 2) {
        const prevT = history[1] % 10;
        if (terminalCalls[prevT]?.includes(currentTerminal)) {
          const nextPossible = terminalCalls[currentTerminal] || [];
          nextPossible.forEach(t => {
            scores[t] += 35 * engineWeights.bias;
          });
        }
      }
    }

    // --- CAMADA 18: APPROXIMATION ENGINE (BUSCA DE TERMINAL POR VIZINHOS) ---
    if (history.length >= 10) {
      const scanLength = Math.min(30, history.length);
      const recentSpins = history.slice(0, scanLength); // Analisa até os últimos 30 giros
      const terminalApproximations: Record<number, number> = {};
      
      // Para cada terminal de 0 a 9, verifica se os vizinhos dos números desse terminal caíram recentemente
      for (let t = 0; t <= 9; t++) {
        const terminalNums = Array.from({length: 37}, (_, i) => i).filter(n => n % 10 === t);
        let neighborHits = 0;
        
        terminalNums.forEach(tNum => {
          const idx = WHEEL_ORDER.indexOf(tNum);
          if (idx !== -1) {
            const leftNeighbor = WHEEL_ORDER[(idx - 1 + 37) % 37];
            const rightNeighbor = WHEEL_ORDER[(idx + 1) % 37];
            
            // Conta todas as vezes que os vizinhos caíram na janela de 30 giros
            neighborHits += recentSpins.filter(n => n === leftNeighbor).length;
            neighborHits += recentSpins.filter(n => n === rightNeighbor).length;
          }
        });
        
        // Expectativa matemática: (número de vizinhos) * (giros / 37)
        const expectedHits = (terminalNums.length * 2) * (scanLength / 37);
        
        // Dispara se os acertos nos vizinhos forem significativamente maiores que o esperado (50% a mais)
        if (neighborHits >= expectedHits * 1.5 && neighborHits >= 5) {
          terminalApproximations[t] = neighborHits;
        }
      }
      
      Object.entries(terminalApproximations).forEach(([tStr, hits]) => {
        const t = Number(tStr);
        scores[t] += 150 * engineWeights.bias; // Peso muito alto para essa assinatura
        
        // Adiciona pontuação direta aos números do terminal
        Array.from({length: 37}, (_, i) => i).filter(n => n % 10 === t).forEach(n => {
          numberScores[n] += 100 * engineWeights.bias;
        });

        detectedBiases.push({
          type: 'Assinatura',
          value: `Aproximação: Buscando Terminal ${t} (${hits} vizinhos em ${scanLength} giros)`,
          confidence: Math.min(75 + (hits * 2), 99)
        });
      });
    }

    // --- CAMADA 19: SHORT-TERM CONVERGENCE (LAST 10) ---
    const last10Convergence = history.slice(0, 10);
    if (last10Convergence.length >= 5) {
      const shortTermCounts: Record<number, number> = {};
      const shortTermTerminals: Record<number, number> = {};
      const shortTermSectors: Record<string, number> = { VOISINS: 0, TIERS: 0, ORPHELINS: 0, JEUZERO: 0 };
      
      last10Convergence.forEach(num => {
        shortTermCounts[num] = (shortTermCounts[num] || 0) + 1;
        const t = num % 10;
        shortTermTerminals[t] = (shortTermTerminals[t] || 0) + 1;
        const s = getSector(num);
        if (shortTermSectors[s] !== undefined) shortTermSectors[s]++;
      });

      // 1. Repetições de curto prazo
      Object.entries(shortTermCounts).forEach(([num, count]) => {
        if (count >= 2) {
          numberScores[Number(num)] += 60 * engineWeights.shortTerm;
          detectedBiases.push({
            type: 'Curto Prazo',
            value: `Repetição do Nº ${num}`,
            confidence: 80
          });
        }
      });

      // 2. Terminais quentes de curto prazo
      Object.entries(shortTermTerminals).forEach(([t, count]) => {
        if (count >= 3) {
          const terminal = Number(t);
          Array.from({length: 37}, (_, i) => i).filter(n => n % 10 === terminal).forEach(n => {
            numberScores[n] += 40 * engineWeights.shortTerm;
          });
          detectedBiases.push({
            type: 'Curto Prazo',
            value: `Terminal ${t} em Alta`,
            confidence: 85
          });
        }
      });

      // 3. Setor dominante de curto prazo
      Object.entries(shortTermSectors).forEach(([sector, count]) => {
        if (count >= 4) {
          const nums = SECTORS[sector.toLowerCase() as keyof typeof SECTORS];
          if (nums) {
            nums.forEach(n => numberScores[n] += 30 * engineWeights.shortTerm);
            detectedBiases.push({
              type: 'Curto Prazo',
              value: `Setor ${sector} Dominante`,
              confidence: 75
            });
          }
        }
      });
    }

    const sortedNumbers = numberScores
      .map((score, num) => ({ num, score }))
      .sort((a, b) => b.score - a.score);

    const top8 = (sortedNumbers || []).slice(0, 8);
    
    // Normalize scores to percentages for UI
    const maxPossibleScore = 750; // Updated max for new layers
    const targetsWithConfidence = top8.map(t => ({
      num: t.num,
      confidence: Math.min(Math.round((t.score / maxPossibleScore) * 100 * (1.2 - chaosIndex)), 99)
    }));

    // --- CAMADA 18: SNIPER CONVERGENCE (MAX PRECISION) ---
    const mainTarget = top8[0]?.num ?? 0;
    const mainScore = top8[0]?.score ?? 0;
    
    // Sniper is true if main target has high score AND matches at least 2 other high-confidence biases
    const sniperBiases = detectedBiases.filter(b => 
      (b.type === 'Padrão de Vácuo' && b.value.includes(`Número ${mainTarget}`)) ||
      (b.type === 'Vácuo Recorrente' && b.value.includes(`Terminal ${mainTarget % 10}`)) ||
      (b.type === 'Assinatura' && WHEEL_ORDER.indexOf(mainTarget) >= WHEEL_ORDER.indexOf(history[0]) - 2 && WHEEL_ORDER.indexOf(mainTarget) <= WHEEL_ORDER.indexOf(history[0]) + 2) ||
      (b.type === 'Desvio Padrão' && b.value.includes(`Terminal ${mainTarget % 10}`)) ||
      (MIRROR_NUMBERS_LIST.includes(mainTarget) && b.type === 'Espelho Direto') ||
      (b.type === 'Terminal Repetido' && b.value.includes(`Terminal ${mainTarget % 10}`)) ||
      (b.type === 'Terminal Triplo' && b.value.includes(`Terminal ${mainTarget % 10}`)) ||
      (b.type === 'Sequência Histórica' && b.value.includes(`T${mainTarget % 10}`))
    );
    
    const isSniper = (mainScore > 450 && sniperBiases.length >= 2) || (mainScore > 600);
    const betPercentage = isSniper ? Math.min(Math.round((mainScore / 800) * 100), 99) : 0;

    // Lógica de "Zona de Impacto": Se o top 5 está concentrado em uma área do cilindro
    const mainIdx = WHEEL_ORDER.indexOf(mainTarget);
    const neighbors = [
      WHEEL_ORDER[(mainIdx - 2 + 37) % 37],
      WHEEL_ORDER[(mainIdx - 1 + 37) % 37],
      mainTarget,
      WHEEL_ORDER[(mainIdx + 1) % 37],
      WHEEL_ORDER[(mainIdx + 2) % 37]
    ];

    // Verifica se os outros 4 do top 5 estão entre os vizinhos do principal
    const isConcentrated = (top8 || []).slice(1, 5).every(t => neighbors.includes(t.num));
    
    const finalTargets = isConcentrated ? neighbors : top8.map(t => t.num);

    // Trend Data for Chart (Last 20)
    const trendData = (history || []).slice(0, 20).reverse().map((num, i) => ({
      index: i,
      value: num,
      color: ROULETTE_NUMBERS[num].color
    }));

    return { 
      total: historyTotal, 
      counts, 
      terminalFrequency,
      terminalVacuum: Array.from({ length: 10 }).map((_, i) => history.findIndex(n => n % 10 === i)),
      terminalGaps: Array.from({ length: 10 }).map((_, t) => {
        const terminalNums = Array.from({length: 37}, (_, i) => i).filter(n => n % 10 === t);
        const pastGaps = calculateGaps(history, terminalNums);
        const lastCompletedGap = pastGaps.length > 0 ? pastGaps[pastGaps.length - 1] : 0;
        const currentOngoingGap = history.findIndex(n => terminalNums.includes(n));
        return { lastCompletedGap, currentOngoingGap };
      }),
      sectorCounts,
      trendData,
      terminalAnalysis: {
        families: Object.entries(FAMILIAS_CFG).map(([key, nums]) => {
          const lastSeen = history.findIndex(n => nums.includes(n % 10));
          return { key, nums, lastSeen };
        }),
        mirrors: ESPELHOS_CFG.pairs.map(pair => {
          const f0 = last50.filter(n => n % 10 === pair[0]).length;
          const f1 = last50.filter(n => n % 10 === pair[1]).length;
          return { pair, f0, f1 };
        })
      },
      biases: detectedBiases,
      barChartData,
      terminalGroupData: [
        { name: 'G1 (1,4,7)', value: counts.termGroup1, color: '#BF953F' },
        { name: 'G2 (2,5,8)', value: counts.termGroup2, color: '#B38728' },
        { name: 'G3 (3,6,9)', value: counts.termGroup3, color: '#AA771C' }
      ],
      sectorTrends,
      sequences,
      tableHeatmap,
      contextTargets,
      dealerSignature: history.length >= 5 ? (() => {
        const distances: number[] = [];
        for (let i = 0; i < 4; i++) {
          const currentIdx = WHEEL_ORDER.indexOf(history[i]);
          const prevIdx = WHEEL_ORDER.indexOf(history[i+1]);
          let dist = currentIdx - prevIdx;
          if (dist < 0) dist += 37;
          distances.push(dist);
        }
        const avgDist = distances.reduce((a, b) => a + b, 0) / distances.length;
        const variance = distances.reduce((a, b) => a + Math.pow(b - avgDist, 2), 0) / distances.length;
        return { avgDist, variance, distances };
      })() : null,
      groupPredictions: (() => {
        const g1 = scores[1] + scores[4] + scores[7];
        const g2 = scores[2] + scores[5] + scores[8];
        const g3 = scores[3] + scores[6] + scores[9];
        const total = g1 + g2 + g3 || 1;
        
        const preds = [
          { name: '1.4.7', score: g1, terminals: [1, 4, 7], color: '#BF953F' },
          { name: '2.5.8', score: g2, terminals: [2, 5, 8], color: '#B38728' },
          { name: '3.6.9', score: g3, terminals: [3, 6, 9], color: '#AA771C' }
        ].map(p => ({
          ...p,
          confidence: Math.min(Math.round((p.score / 200) * 100), 99),
          lastSeen: history.findIndex(n => p.terminals.includes(n % 10))
        })).sort((a, b) => b.score - a.score);

        return preds;
      })(),
      prediction: { 
        terminal: targetTerminal, 
        confidence,
        targets: finalTargets,
        targetsWithConfidence,
        isConcentrated,
        mainTarget,
        isSniper,
        betPercentage
      } 
    };
  }, [history, engineWeights]);

  const { highlightedNumbers, allCylinderTargets, vacuumNumbers, targetZone, isOmega } = useMemo(() => {
    if (!stats) return { highlightedNumbers: [], allCylinderTargets: [], vacuumNumbers: [], targetZone: "", isOmega: false };

    const highlighted = new Set<number>();
    const vacuum = new Set<number>();
    const zones: string[] = [];

    // 1. Prediction Targets (The "Certeiros" - Top 8 from combined engine)
    if (stats.prediction.targets) {
      stats.prediction.targets.slice(0, 8).forEach(n => highlighted.add(n));
      if (stats.prediction.confidence > 50) {
        zones.push(stats.prediction.isConcentrated ? "Zona de Impacto" : "Top 8 Alvos");
      }
    }

    // 2. Recurrent Vacuum (High Priority for visualization, but secondary for highlighting)
    stats.biases.filter(b => b.type === 'Vácuo Recorrente').forEach(b => {
      if (zones.length < 2) zones.push("Vácuo Recorrente");
      if (b.value.includes('Terminal')) {
        const terminalMatch = b.value.match(/Terminal (\d)/);
        if (terminalMatch) {
          const t = parseInt(terminalMatch[1]);
          for (let i = 0; i <= 36; i++) {
            if (i % 10 === t) vacuum.add(i);
          }
        }
      }
    });

    // 3. Sector Bias (For labeling)
    const sectorBias = stats.biases.find(b => b.type === 'Setor' && b.confidence > 60);
    if (sectorBias && zones.length < 2) {
      zones.push(sectorBias.value);
    }

    // OMEGA CONDITION: High confidence OR convergence of multiple analysis
    const omegaCondition = stats.prediction.isSniper ||
                          stats.prediction.confidence >= 90 || 
                          zones.length >= 4 || 
                          (stats.prediction.isConcentrated && stats.prediction.confidence > 80) ||
                          (zones.length >= 3 && stats.prediction.confidence > 75);

    // Final safety check: strictly limit to 8
    const finalHighlighted = Array.from(highlighted).slice(0, 8);

    // Compute all targets including mirrors for the notification
    const allTargetsSet = new Set<number>(finalHighlighted);
    finalHighlighted.forEach(num => {
      [...ESPELHOS_CFG.digitMirrorPairs, ...ESPELHOS_CFG.pairs].forEach(pair => {
        if (pair[0] === num) allTargetsSet.add(pair[1]);
        else if (pair[1] === num) allTargetsSet.add(pair[0]);
      });
    });
    
    // Add vacuum numbers
    vacuum.forEach(num => allTargetsSet.add(num));
    
    // Add context targets
    if (stats.contextTargets) {
      stats.contextTargets.forEach(num => allTargetsSet.add(num));
    }
    
    const allCylinderTargets = Array.from(allTargetsSet).sort((a, b) => a - b);

    const sniperText = stats.prediction.isSniper ? `🎯 SNIPER: ${stats.prediction.betPercentage}% 🎯` : "⚠️ ALERTA OMEGA ⚠️";

    return { 
      highlightedNumbers: finalHighlighted, 
      allCylinderTargets,
      vacuumNumbers: Array.from(vacuum),
      targetZone: omegaCondition ? sniperText : (zones.join(' + ') || "Monitorando"),
      isOmega: omegaCondition
    };
  }, [stats, history]);

  // Alert & Bias Notification System
  useEffect(() => {
    if (history.length < 3 || isMuted) return;
    
    // 1. Analyze confidence scores of all detected biases and prioritize alerts
    // for those with confidence greater than 85%.
    const highConfidenceBiases = stats?.biases?.filter(b => b.confidence > 85) || [];
    
    highConfidenceBiases.forEach(bias => {
      const alertMsg = `${bias.type.toUpperCase()}: ${bias.value} (${bias.confidence}%)`;
      // Check if this specific alert for this history length has already been shown
      const alertId = `bias-${bias.type}-${bias.value}-${history.length}`;
      
      if (!dismissedAlerts.includes(alertId)) {
        toast.info(alertMsg, {
          id: alertId,
          duration: 4000,
          style: {
            background: '#050505',
            border: '1px solid rgba(212, 175, 55, 0.2)',
            color: '#fff',
            fontFamily: 'inherit',
            fontSize: '10px',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            fontWeight: '900'
          }
        });
        setDismissedAlerts(prev => [...prev, alertId]);
        
        // Play a notification sound if not muted
        if (!isMuted) {
          try {
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            
            // Higher pitch for higher confidence
            const frequency = bias.confidence > 90 ? 1100 : 880;
            
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(frequency / 2, audioCtx.currentTime + 0.5);
            
            gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
            
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            
            oscillator.start();
            oscillator.stop(audioCtx.currentTime + 0.5);
          } catch (e) {
            console.error("Audio error:", e);
          }
        }
      }
    });

    // 2. Custom Rules Alerts
    customRules.forEach(rule => {
      if (!rule.enabled || history.length < rule.threshold) return;
      
      const lastN = (history || []).slice(0, rule.threshold).map(n => ROULETTE_NUMBERS[n]);
      let triggered = false;
      let ruleLabel = "";

      switch (rule.type) {
        case 'color': 
          triggered = lastN.every(n => n.color === rule.value);
          ruleLabel = `${rule.threshold}x ${rule.value === 'red' ? 'Vermelho' : 'Preto'}`;
          break;
        case 'parity': 
          triggered = lastN.every(n => rule.value === 'even' ? n.isEven : (!n.isEven && n.num !== 0));
          ruleLabel = `${rule.threshold}x ${rule.value === 'even' ? 'Par' : 'Ímpar'}`;
          break;
        case 'highlow': 
          triggered = lastN.every(n => rule.value === 'high' ? n.isHigh : (!n.isHigh && n.num !== 0));
          ruleLabel = `${rule.threshold}x ${rule.value === 'high' ? 'Alto' : 'Baixo'}`;
          break;
        case 'dozen': 
          triggered = lastN.every(n => n.dozen === Number(rule.value));
          ruleLabel = `${rule.threshold}x ${rule.value}ª Dúzia`;
          break;
        case 'column': 
          triggered = lastN.every(n => n.column === Number(rule.value));
          ruleLabel = `${rule.threshold}x ${rule.value}ª Coluna`;
          break;
        case 'terminalGroup': 
          triggered = lastN.every(n => {
            const terminal = n.num % 10;
            if (rule.value === '1') return [1, 4, 7].includes(terminal);
            if (rule.value === '2') return [2, 5, 8].includes(terminal);
            if (rule.value === '3') return [3, 6, 9].includes(terminal);
            return false;
          });
          ruleLabel = `${rule.threshold}x Grupo Terminal ${rule.value}`;
          break;
        case 'terminal': 
          triggered = lastN.every(n => (n.num % 10) === Number(rule.value));
          ruleLabel = `${rule.threshold}x Terminal ${rule.value}`;
          break;
      }

      if (triggered) {
        const alertMsg = `REGRA CUSTOM: ${ruleLabel}`;
        const alertId = `rule-${rule.id}-${history.length}`;
        
        if (!dismissedAlerts.includes(alertId)) {
          toast.warning(alertMsg, {
            id: alertId,
            duration: 5000,
            style: {
              background: '#050505',
              border: '1px solid #BF953F',
              color: '#BF953F',
              fontFamily: 'inherit',
              fontSize: '10px',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              fontWeight: '900'
            }
          });
          setDismissedAlerts(prev => [...prev, alertId]);
          
          if (!isMuted) {
            try {
              const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
              const oscillator = audioCtx.createOscillator();
              const gainNode = audioCtx.createGain();
              
              oscillator.type = 'square'; // Distinct sound for custom rules
              oscillator.frequency.setValueAtTime(660, audioCtx.currentTime);
              oscillator.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.3);
              
              gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
              gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
              
              oscillator.connect(gainNode);
              gainNode.connect(audioCtx.destination);
              
              oscillator.start();
              oscillator.stop(audioCtx.currentTime + 0.3);
            } catch (e) {
              console.error("Audio error:", e);
            }
          }
        }
      }
    });

    if (isMuted) {
      return;
    }
  }, [history, stats, customRules, dismissedAlerts, isMuted]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gold-primary/20 border-t-gold-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.4em] animate-pulse">Iniciando Terminal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 font-sans selection:bg-gold-primary/30 relative overflow-hidden">
      {/* Toaster for notifications */}
      <Toaster 
        position="top-center" 
        theme="dark" 
        richColors 
        closeButton 
        toastOptions={{
          style: {
            background: 'rgba(5, 5, 5, 0.8)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(191, 149, 63, 0.3)',
            color: '#BF953F',
            fontFamily: 'inherit',
            fontSize: '11px',
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            fontWeight: '900',
            borderRadius: '1rem',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5), inset 0 0 20px rgba(191, 149, 63, 0.05)'
          }
        }}
      />

      {/* Dynamic Background Mesh */}
      <div className="mesh-bg opacity-40" />
      
      {/* The Golden Gauge - Real-Time Confidence Bar */}
      <div className="fixed top-0 left-0 right-0 z-[100] h-1.5 bg-white/5">
        <motion.div 
          className="h-full liquid-progress"
          initial={{ width: 0 }}
          animate={{ 
            width: `${stats?.prediction?.confidence || 0}%`,
            background: (stats?.prediction?.confidence || 0) > 70 ? '#22c55e' : '#222',
            boxShadow: (stats?.prediction?.confidence || 0) > 85 ? '0 0 30px rgba(34, 197, 94, 0.6)' : 'none'
          }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        />
        <AnimatePresence>
          {(stats?.prediction?.confidence || 0) > 85 && (
            <motion.div 
              key="high-confidence-alert"
              initial={{ opacity: 0, y: -10, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 neon-green-gradient rounded-xl text-[10px] font-black text-black tracking-widest uppercase shadow-[0_0_30px_rgba(34,197,94,0.6)] flex items-center gap-2 border border-white/20 max-w-[95vw] w-max"
            >
              <Zap className="w-3.5 h-3.5 animate-bounce fill-black shrink-0" />
              <div className="flex flex-wrap items-center justify-center gap-1">
                <span className="opacity-80 mr-1">ALVOS:</span>
                {allCylinderTargets.map((num, i) => (
                  <span key={num} className="bg-black/20 px-1.5 py-0.5 rounded text-[9px]">
                    {num}
                  </span>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Header */}
      <header className="glass-card sticky top-0 z-50 border-x-0 border-t-0">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 gold-gradient rounded-2xl flex items-center justify-center shadow-2xl shadow-gold-primary/30 border border-white/20">
              <ShieldCheck className="w-7 h-7 text-black" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tighter uppercase italic gold-text">Costa <span className="text-white">analises</span></h1>
              <p className="text-[10px] uppercase tracking-[0.4em] text-zinc-600 font-black">Terminal de Elite</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 sm:gap-6">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="hidden md:block text-right">
                  <p className="text-[10px] font-black text-white uppercase tracking-tighter">{user.displayName || 'Usuário'}</p>
                  <button 
                    onClick={() => logout()} 
                    className="text-[8px] font-black text-zinc-500 hover:text-red-500 uppercase tracking-[0.2em] transition-colors"
                  >
                    Sair da Conta
                  </button>
                </div>
                {user.photoURL ? (
                  <img src={user.photoURL} alt="Avatar" className="w-10 h-10 rounded-xl border border-white/10" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                    <Eye className="w-5 h-5 text-zinc-500" />
                  </div>
                )}
              </div>
            ) : (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => loginWithGoogle()}
                className="px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2"
              >
                <Eye className="w-4 h-4 text-gold-primary" />
                <span className="hidden sm:inline">Entrar</span>
              </motion.button>
            )}

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsMuted(!isMuted)}
              className={`p-3 rounded-2xl border transition-all flex items-center gap-2 group ${
                isMuted 
                  ? 'bg-red-500/10 border-red-500/30 text-red-500' 
                  : 'bg-gold-primary/10 border-gold-primary/30 text-gold-primary'
              }`}
            >
              {isMuted ? (
                <BellOff className="w-5 h-5 group-hover:shake" />
              ) : (
                <Bell className="w-5 h-5 group-hover:animate-bounce" />
              )}
              <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">
                {isMuted ? 'Silenciado' : 'Notificações'}
              </span>
            </motion.button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-5xl mx-auto px-6 pb-4 flex gap-2 overflow-x-auto scrollbar-hide">
          {[
            { id: 'DASHBOARD', label: 'Dashboard', icon: Activity },
            { id: 'TERMINAIS', label: 'Terminais', icon: Zap },
            { id: 'RADAR', label: 'Radar de Viés', icon: Radar, badge: (stats?.biases?.length || 0) + customRules.filter(r => {
              if (!r.enabled || (history || []).length < r.threshold) return false;
              const lastN = (history || []).slice(0, r.threshold).map(n => ROULETTE_NUMBERS[n]);
              switch (r.type) {
                case 'color': return lastN.every(n => n.color === r.value);
                case 'parity': return lastN.every(n => r.value === 'even' ? n.isEven : (!n.isEven && n.num !== 0));
                case 'highlow': return lastN.every(n => r.value === 'high' ? n.isHigh : (!n.isHigh && n.num !== 0));
                case 'dozen': return lastN.every(n => n.dozen === Number(r.value));
                case 'column': return lastN.every(n => n.column === Number(r.value));
                case 'terminalGroup': return lastN.every(n => {
                  const terminal = n.num % 10;
                  if (r.value === '1') return [1, 4, 7].includes(terminal);
                  if (r.value === '2') return [2, 5, 8].includes(terminal);
                  if (r.value === '3') return [3, 6, 9].includes(terminal);
                  return false;
                });
                case 'terminal': return lastN.every(n => (n.num % 10) === Number(r.value));
                default: return false;
              }
            }).length },
            { id: 'ANALISE', label: 'Análise Técnica', icon: Zap },
            { id: 'SETORIAIS', label: 'Setoriais', icon: Target },
            { id: 'ESTATISTICAS', label: 'Estatísticas', icon: BarChart3 },
            { id: 'HISTORICO', label: 'Histórico', icon: History }
          ].map(tab => (
              <motion.button
                key={tab.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 sm:px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap relative overflow-hidden group ${
                  activeTab === tab.id 
                    ? 'bg-gold-primary text-black shadow-lg shadow-gold-primary/40' 
                    : 'bg-white/5 text-zinc-500 hover:text-white hover:bg-white/10'
                }`}
              >
                {activeTab === tab.id && (
                  <motion.div 
                    layoutId="activeTab"
                    className="absolute inset-0 bg-gradient-to-r from-gold-secondary to-gold-primary opacity-50"
                    transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                  />
                )}
                <div className="relative z-10 flex items-center gap-2">
                  <tab.icon className={`w-4 h-4 sm:w-3.5 sm:h-3.5 ${activeTab === tab.id ? '' : 'group-hover:scale-110 transition-transform'}`} />
                  <span className="hidden sm:inline">{tab.label}</span>
                  {tab.badge > 0 && (
                    <span className={`flex items-center justify-center w-4 h-4 rounded-full text-[8px] font-black ${activeTab === tab.id ? 'bg-black text-gold-primary' : 'bg-gold-primary text-black animate-pulse'}`}>
                      {tab.badge}
                    </span>
                  )}
                </div>
              </motion.button>
          ))}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6 relative">
        {/* Keep-Alive Tab Container for Dashboard (to preserve iframe state) */}
        <div className={activeTab === 'DASHBOARD' ? 'block' : 'hidden'}>
          <Suspense fallback={<TabLoading />}>
            <DashboardTab 
              stats={stats} 
              history={history} 
              isOmega={isOmega} 
              addNumber={addNumber} 
              removeLast={removeLast} 
              clearHistory={clearHistory} 
              engineWeights={engineWeights}
              highlightedNumbers={highlightedNumbers}
              vacuumNumbers={vacuumNumbers}
              targetZone={targetZone}
              contextTargets={stats?.contextTargets || []}
              lastNumber={history[0] ?? null}
              searchResults={searchResults}
              isSearchingGoogle={isSearchingGoogle}
              onGoogleSearch={handleGoogleSearch}
              browserUrl={browserUrl}
              onClearBrowser={() => setBrowserUrl(null)}
              ballisticMode={ballisticMode}
              currentDropPoint={currentDropPoint}
              onToggleBallisticMode={() => {
                setBallisticMode(!ballisticMode);
                setCurrentDropPoint(null);
              }}
            />
          </Suspense>
        </div>

        {/* Other tabs are conditionally rendered to save resources */}
        {activeTab === 'TERMINAIS' && (
          <Suspense fallback={<TabLoading />}>
            <TerminaisTab stats={stats} history={history} />
          </Suspense>
        )}

        {activeTab === 'RADAR' && (
          <Suspense fallback={<TabLoading />}>
            <RadarTab stats={stats} customRules={customRules} history={history} setActiveTab={setActiveTab} />
          </Suspense>
        )}

        {activeTab === 'ANALISE' && (
          <Suspense fallback={<TabLoading />}>
            <AnaliseTab stats={stats} />
          </Suspense>
        )}

        {activeTab === 'SETORIAIS' && (
          <Suspense fallback={<TabLoading />}>
            <SetoriaisTab stats={stats} />
          </Suspense>
        )}

        {activeTab === 'ESTATISTICAS' && (
          <Suspense fallback={<TabLoading />}>
            <EstatisticasTab 
              stats={stats} 
              history={history} 
              removeLast={removeLast} 
              clearHistory={clearHistory} 
              isAddingRule={isAddingRule} 
              setIsAddingRule={setIsAddingRule} 
              newRule={newRule} 
              setNewRule={setNewRule} 
              addCustomRule={addCustomRule} 
              customRules={customRules} 
              removeCustomRule={removeCustomRule} 
              engineWeights={engineWeights}
            />
          </Suspense>
        )}

        {activeTab === 'HISTORICO' && (
          <Suspense fallback={<TabLoading />}>
            <HistoricoTab history={history} setHistory={setHistory} />
          </Suspense>
        )}
      </main>

    {/* Footer */}
    <footer className="max-w-5xl mx-auto px-6 py-16 border-t border-white/5 text-center">
        <div className="flex flex-col items-center gap-6">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setLegalModal({ open: true, type: 'terms' })}
              className="text-[9px] font-black text-zinc-500 hover:text-gold-primary uppercase tracking-[0.2em] transition-colors"
            >
              Termos de Uso
            </button>
            <div className="w-1 h-1 rounded-full bg-zinc-800" />
            <button 
              onClick={() => setLegalModal({ open: true, type: 'privacy' })}
              className="text-[9px] font-black text-zinc-500 hover:text-gold-primary uppercase tracking-[0.2em] transition-colors"
            >
              Privacidade
            </button>
          </div>
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-2 opacity-30">
              <ShieldCheck className="w-4 h-4" />
              <span className="text-[10px] uppercase tracking-[0.5em] font-black">Costa Security Protocol</span>
            </div>
            <p className="text-[9px] text-zinc-700 uppercase tracking-[0.2em] font-bold">
              Algoritmo de Alta Frequência • Licença de Uso Profissional
            </p>
          </div>
        </div>
      </footer>

      <Suspense fallback={null}>
        <LegalModal 
          isOpen={legalModal.open} 
          onClose={() => setLegalModal({ ...legalModal, open: false })} 
          type={legalModal.type} 
        />
      </Suspense>
    </div>
  );
}
