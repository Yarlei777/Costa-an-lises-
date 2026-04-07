import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, Activity, Target, Search, Loader2, ExternalLink, X, RotateCcw, Maximize2, Minimize2, Camera, Image as ImageIcon } from 'lucide-react';
import Markdown from 'react-markdown';
import { Stats, RouletteNumber } from '../types';
import { COLORS, ROULETTE_NUMBERS, MIRROR_NUMBERS_LIST, ESPELHOS_CFG } from '../constants';
import RouletteWheelVisual from './RouletteWheelVisual';

interface DashboardTabProps {
  stats: Stats | null;
  history: number[];
  isOmega: boolean;
  engineWeights: { neural: number; markov: number; sector: number; bias: number; shortTerm: number };
  highlightedNumbers: number[];
  vacuumNumbers: number[];
  targetZone: string;
  contextTargets: number[];
  lastNumber: number | null;
  addNumber: (num: number | number[]) => void;
  removeLast: () => void;
  clearHistory: () => void;
  searchResults?: string | null;
  isSearchingGoogle?: boolean;
  onGoogleSearch?: (query: string) => void;
  browserUrl?: string | null;
  onClearBrowser?: () => void;
  ballisticMode?: boolean;
  currentDropPoint?: number | null;
  onToggleBallisticMode?: () => void;
}

const INPUT_NUMBERS = Array.from({ length: 37 }, (_, i) => i);

const DashboardTab: React.FC<DashboardTabProps> = React.memo(({
  stats,
  history,
  isOmega,
  engineWeights,
  highlightedNumbers,
  vacuumNumbers,
  targetZone,
  contextTargets,
  lastNumber,
  addNumber,
  removeLast,
  clearHistory,
  searchResults,
  isSearchingGoogle,
  onGoogleSearch,
  browserUrl,
  onClearBrowser,
  ballisticMode,
  currentDropPoint,
  onToggleBallisticMode
}) => {
  const [searchValue, setSearchValue] = React.useState('');
  const [isIframeLoading, setIsIframeLoading] = React.useState(false);
  const [iframeKey, setIframeKey] = React.useState(0);
  const [isMaximized, setIsMaximized] = React.useState(false);

  // Get last 10 numbers for preview
  const recentNumbers = history.slice(0, 10);

  React.useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMaximized(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  // Sync loading state when browserUrl changes (from Gemini or direct input)
  React.useEffect(() => {
    if (browserUrl) {
      setIsIframeLoading(true);
      setIframeKey(prev => prev + 1);
    }
  }, [browserUrl]);

  const handleSearch = () => {
    if (onGoogleSearch && searchValue) {
      onGoogleSearch(searchValue);
    }
  };

  const handleRefreshIframe = () => {
    setIframeKey(prev => prev + 1);
    setIsIframeLoading(true);
  };

  const handleClearBrowser = () => {
    if (onClearBrowser) {
      onClearBrowser();
      setSearchValue('');
      setIsIframeLoading(false);
      setIsMaximized(false);
    }
  };

  const allCylinderTargets = React.useMemo(() => {
    const targetsMap = new Map<number, { num: number; confidence: number; isMirrorOnly: boolean }>();
    
    // First, add all highlighted numbers with their original confidence
    highlightedNumbers.forEach(num => {
      const confObj = stats?.prediction?.targetsWithConfidence?.find(t => t.num === num);
      targetsMap.set(num, {
        num,
        confidence: confObj ? confObj.confidence : 85, // Default high confidence if not found
        isMirrorOnly: false
      });
    });
    
    // Then, add mirrors for the highlighted numbers
    highlightedNumbers.forEach(num => {
      [...ESPELHOS_CFG.digitMirrorPairs, ...ESPELHOS_CFG.pairs].forEach(pair => {
        let mirrorNum: number | null = null;
        if (pair[0] === num) mirrorNum = pair[1];
        else if (pair[1] === num) mirrorNum = pair[0];
        
        if (mirrorNum !== null && !targetsMap.has(mirrorNum)) {
          const originalConf = targetsMap.get(num)?.confidence || 85;
          targetsMap.set(mirrorNum, {
            num: mirrorNum,
            confidence: Math.max(originalConf - 5, 50), // Slightly lower confidence for mirrors
            isMirrorOnly: true
          });
        }
      });
    });
    
    // Add vacuum numbers
    vacuumNumbers.forEach(num => {
      if (!targetsMap.has(num)) {
        targetsMap.set(num, {
          num,
          confidence: 70, // Default confidence for vacuum numbers
          isMirrorOnly: false
        });
      }
    });

    // Add context targets
    contextTargets.forEach(num => {
      if (!targetsMap.has(num)) {
        targetsMap.set(num, {
          num,
          confidence: 65, // Default confidence for context targets
          isMirrorOnly: false
        });
      }
    });
    
    return Array.from(targetsMap.values()).sort((a, b) => b.confidence - a.confidence);
  }, [highlightedNumbers, stats?.prediction?.targetsWithConfidence, vacuumNumbers, contextTargets]);

  return (
    <motion.div 
      key="dashboard"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="grid grid-cols-1 lg:grid-cols-12 gap-10"
      translate="no"
    >
      {isMaximized && (
        <div 
          className="fixed inset-0 bg-black/90 backdrop-blur-md z-[9998] transition-opacity duration-500"
          onClick={() => setIsMaximized(false)}
        />
      )}
      {/* Header Estilo Exu do Ouro */}
      <div className="lg:col-span-12 mb-6">
        <div className="flex items-center justify-between px-4 py-2 bg-black/40 backdrop-blur-md border-b border-gold-primary/20 rounded-t-3xl">
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-black text-gold-primary/60 tracking-widest">{history.length}/500</span>
            <div className="w-24 h-1 bg-white/5 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${(history.length / 500) * 100}%` }}
                className="h-full bg-gold-primary shadow-[0_0_10px_rgba(212,175,55,0.5)]" 
              />
            </div>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-black uppercase tracking-[0.8em] gold-text">Exu do Ouro</h1>
              {history.length < 25 && (
                <div className="group relative flex items-center gap-1 px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded-full animate-pulse cursor-help">
                  <div className="w-1 h-1 rounded-full bg-blue-500" />
                  <span className="text-[7px] font-black text-blue-400 uppercase tracking-widest">Germinação</span>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 p-2 bg-black/90 border border-blue-500/30 rounded-lg text-[8px] text-blue-200 font-bold leading-tight opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-2xl">
                    O sistema está em fase de coleta de dados. A precisão máxima será atingida após 25 números inseridos.
                  </div>
                </div>
              )}
            </div>
            <div className="h-[1px] w-32 bg-gradient-to-r from-transparent via-gold-primary/50 to-transparent mt-1" />
          </div>

          <div className="flex items-center gap-4">
            <div className="w-24 h-1 bg-white/5 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${(history.length / 500) * 100}%` }}
                className="h-full bg-gold-primary shadow-[0_0_10px_rgba(212,175,55,0.5)]" 
              />
            </div>
            <span className="text-[10px] font-black text-gold-primary/60 tracking-widest">{history.length}/500</span>
          </div>
        </div>
      </div>

      {/* Left: Main Prediction & Manual Input */}
      <div className="lg:col-span-6 space-y-6" style={{ contentVisibility: 'auto', containIntrinsicSize: '1px 1200px' }}>
        <section className="relative flex flex-col items-center py-4">
          <div className="absolute -inset-20 bg-gold-primary/5 blur-[100px] rounded-full animate-pulse" />
          <div className="relative w-full flex flex-col items-center">
            <div className="text-[10px] uppercase font-black tracking-[0.5em] text-zinc-600 mb-4 text-center">Probabilidade Central</div>
            
            <div className="w-full max-w-md bg-black/40 backdrop-blur-xl border border-white/5 rounded-[2rem] p-6 relative overflow-hidden group">
              <div className={`absolute inset-0 opacity-5 transition-opacity duration-1000 ${isOmega ? 'bg-red-500' : 'bg-gold-primary'}`} />
              
              <div className="flex items-center justify-between mb-4 relative z-10">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-1.5 h-1.5 rounded-full ${ isOmega ? 'bg-red-500 animate-ping' : (stats?.prediction?.confidence || 0) > 80 ? 'bg-gold-primary shadow-[0_0_10px_rgba(212,175,55,1)]' : 'bg-zinc-800'}`} />
                    <span className={`text-[8px] font-black uppercase tracking-[0.3em] ${isOmega ? 'text-red-400' : 'text-zinc-500'}`}>
                      {stats?.prediction?.isSniper ? 'Sniper Ativo' : isOmega ? 'Sincronia Crítica' : 'Sincronia do Motor'}
                    </span>
                  </div>
                  <h3 className={`text-xl font-black uppercase tracking-tighter italic ${isOmega ? 'text-red-500' : 'gold-text'}`}>
                    {stats?.prediction?.isSniper ? 'Fogo Livre' : isOmega ? 'Convergência Ômega' : 'Análise Neural'}
                  </h3>
                </div>
                <div className="text-right">
                  <div className={`text-4xl font-black leading-none ${isOmega ? 'text-red-500' : 'gold-text'}`}>
                    {stats?.prediction?.isSniper ? stats?.prediction?.betPercentage : Math.round(stats?.prediction?.confidence || 0)}%
                  </div>
                  <p className="text-[7px] font-black uppercase tracking-widest text-zinc-600 mt-1">Confiança</p>
                </div>
              </div>

              <div className="h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/5 p-[1px] relative z-10">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${stats?.prediction?.isSniper ? stats?.prediction?.betPercentage : Math.round(stats?.prediction?.confidence || 0)}%` }}
                  className={`h-full rounded-full shadow-[0_0_20px_rgba(212,175,55,0.3)] transition-all duration-1000 ${isOmega ? 'bg-red-500' : 'bg-gold-primary'}`}
                />
              </div>
              
              <div className="mt-4 flex items-center justify-between relative z-10">
                <div className="flex items-center gap-4">
                  <div className="flex flex-col">
                    <span className="text-[6px] font-black text-zinc-600 uppercase tracking-widest">Estabilidade</span>
                    <span className="text-[8px] font-black text-zinc-400 uppercase tracking-tighter">98.4%</span>
                  </div>
                  <div className="w-[1px] h-4 bg-white/10" />
                  <div className="flex flex-col">
                    <span className="text-[6px] font-black text-zinc-600 uppercase tracking-widest">Latência</span>
                    <span className="text-[8px] font-black text-emerald-500 uppercase tracking-tighter">12ms</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Zap className={`w-3 h-3 ${isOmega ? 'text-red-500' : 'text-gold-primary'}`} />
                  <span className={`text-[8px] font-black uppercase tracking-widest ${isOmega ? 'text-red-500' : 'text-gold-primary'}`}>
                    {isOmega ? 'Prioridade Máxima' : 'Processamento Otimizado'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 w-full max-w-sm space-y-4">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-gold-primary" />
                <span className="text-[10px] uppercase tracking-[0.4em] text-zinc-600 font-black">Cérebro Central</span>
              </div>
              <div className="flex items-center gap-3">
                {history.length >= 10 && (
                  <div className="group relative flex items-center gap-1 px-1.5 py-0.5 bg-gold-primary/10 border border-gold-primary/20 rounded-md animate-pulse cursor-help">
                    <div className="w-1 h-1 rounded-full bg-gold-primary" />
                    <span className="text-[6px] font-black text-gold-primary uppercase tracking-widest">Auto-Balance</span>
                    <div className="absolute top-full right-0 mt-2 w-48 p-2 bg-black/90 border border-gold-primary/30 rounded-lg text-[8px] text-gold-primary/80 font-bold leading-tight opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-2xl">
                      O cérebro está ajustando os pesos das análises em tempo real com base na volatilidade da mesa.
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                  <span className="text-[8px] uppercase tracking-widest text-emerald-500 font-bold">Sincronizado</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Rede Neural', status: history.length >= 25 ? 'Ativo' : 'Treinando...', weight: engineWeights.neural },
                { label: 'Markov Chain', status: history.length > 10 ? 'Ativo' : 'Aguardando...', weight: engineWeights.markov },
                { label: 'Setoriais', status: 'Ativo', weight: engineWeights.sector },
                { label: 'Terminais', status: 'Ativo', weight: engineWeights.bias },
                { label: 'Curto Prazo', status: history.length >= 5 ? 'Ativo' : 'Coletando...', weight: engineWeights.shortTerm }
              ].map((item, i) => (
                <div key={i} className="p-3 bg-white/5 rounded-xl border border-white/5 flex flex-col gap-1 relative overflow-hidden group">
                  <div className="absolute bottom-0 left-0 h-0.5 bg-gold-primary transition-all duration-500" style={{ width: `${(item.weight / 2) * 100}%` }} />
                  <div className="flex justify-between items-center">
                    <span className="text-[7px] uppercase tracking-widest text-zinc-600 font-bold">{item.label}</span>
                    <span className="text-[8px] font-black gold-text opacity-0 group-hover:opacity-100 transition-opacity">x{item.weight.toFixed(2)}</span>
                  </div>
                  <span className={`text-[9px] font-black ${item.status === 'Ativo' ? 'text-gold-primary' : 'text-zinc-500'}`}>{item.status}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between px-2 pt-4">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-gold-primary" />
                <span className="text-[10px] uppercase tracking-[0.4em] text-zinc-600 font-black">Números Alvos</span>
              </div>
              <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{targetZone}</div>
            </div>
            
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {allCylinderTargets.map((target, idx) => {
                const num = target.num;
                const score = target.confidence;
                const isMirror = target.isMirrorOnly || MIRROR_NUMBERS_LIST.includes(num);
                return (
                  <motion.div 
                    key={num} 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className={`p-4 bg-gradient-to-br from-white/10 to-transparent backdrop-blur-xl rounded-2xl border flex items-center gap-5 relative group overflow-hidden transition-all hover:translate-x-2 ${isOmega ? 'border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.2)] animate-pulse' : isMirror ? 'border-pink-500/40 shadow-[0_0_15px_rgba(236,72,153,0.1)] animate-pulse' : 'border-gold-primary/20'}`}
                  >
                    <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${isOmega ? 'bg-red-500/10' : isMirror ? 'bg-pink-500/10' : 'bg-gold-primary/10'}`} />
                    
                    {/* Number Badge */}
                    <div className="relative">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black border-2 shadow-2xl transition-transform group-hover:scale-110 ${COLORS[ROULETTE_NUMBERS[num].color]} ${isOmega ? 'border-red-500/50' : isMirror ? 'border-pink-400/60' : 'border-gold-primary/30'}`}>
                        {num}
                      </div>
                      {isMirror && (
                        <div className="absolute -top-2 -right-2 w-5 h-5 bg-pink-500 rounded-full flex items-center justify-center shadow-lg">
                          <Target className="w-3 h-3 text-white" />
                        </div>
                      )}
                      {!isMirror && score > 90 && (
                        <div className="absolute -top-2 -right-2 w-5 h-5 bg-gold-primary rounded-full flex items-center justify-center shadow-lg">
                          <Zap className="w-3 h-3 text-black fill-black" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 space-y-3">
                      <div className="flex justify-between items-end">
                        <div className="space-y-0.5">
                          <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${isOmega ? 'text-red-400' : isMirror ? 'text-pink-400' : 'text-zinc-500'}`}>
                            {isMirror ? 'Fator Espelho' : 'Fator de Assertividade'}
                          </span>
                          <div className={`text-lg font-black leading-none ${isOmega ? 'text-red-500' : isMirror ? 'text-pink-500' : 'gold-text'}`}>{score}%</div>
                        </div>
                        <div className="text-right">
                          <span className="text-[8px] font-black uppercase tracking-widest text-zinc-600">Status</span>
                          <div className={`text-[9px] font-black uppercase ${isMirror ? 'text-pink-400' : score > 80 ? 'text-emerald-500' : 'text-zinc-400'}`}>
                            {isMirror ? 'Espelho Ativo' : score > 90 ? 'Crítico' : score > 70 ? 'Forte' : 'Monitorando'}
                          </div>
                        </div>
                      </div>
                      
                      {/* Premium Progress Bar */}
                      <div className="h-2 bg-black/40 rounded-full overflow-hidden border border-white/5 p-[1px]">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${score}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className={`h-full rounded-full relative ${isOmega ? 'bg-gradient-to-r from-red-600 to-red-400' : isMirror ? 'bg-gradient-to-r from-pink-600 to-pink-400' : 'bg-gradient-to-r from-emerald-600 to-emerald-400'}`}
                        >
                          <div className="absolute inset-0 bg-white/20 animate-pulse" />
                        </motion.div>
                      </div>
                    </div>

                    {/* Decorative Corner */}
                    <div className={`absolute top-0 right-0 w-8 h-8 opacity-20 ${isOmega ? 'text-red-500' : isMirror ? 'text-pink-500' : 'text-gold-primary'}`}>
                       <svg viewBox="0 0 100 100" className="w-full h-full">
                         <path d="M 0 0 L 100 0 L 100 100 Z" fill="currentColor" />
                       </svg>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Manual Input Terminal */}
        <section className="glass-card rounded-[2rem] p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Zap className="w-4 h-4 text-gold-primary" />
              <div>
                <h2 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-400">Entrada de Dados</h2>
                {ballisticMode && (
                  <p className="text-[9px] text-emerald-500 uppercase tracking-widest font-bold mt-1">
                    {currentDropPoint === null ? 'Aguardando Ponto de Soltura...' : `Soltura: ${currentDropPoint} | Aguardando Queda...`}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onToggleBallisticMode}
                className={`px-3 py-1.5 rounded-xl border transition-all flex items-center gap-2 ${
                  ballisticMode 
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]' 
                    : 'bg-white/5 border-white/10 text-zinc-500 hover:bg-white/10'
                }`}
              >
                <Target className={`w-3.5 h-3.5 ${ballisticMode ? 'animate-pulse' : ''}`} />
                <span className="text-[9px] font-black uppercase tracking-widest">
                  {ballisticMode ? 'Balística ON' : 'Balística OFF'}
                </span>
              </button>
            </div>
          </div>

          {/* Recent Numbers Preview */}
          <div className="mb-8 p-4 bg-black/40 rounded-2xl border border-white/5">
            <div className="text-[8px] font-black uppercase tracking-widest text-zinc-600 mb-3 flex items-center gap-2">
              <Activity className="w-3 h-3" /> Últimos Números Adicionados
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide min-h-[40px]">
              {recentNumbers.length > 0 ? (
                recentNumbers.map((num, i) => (
                  <div
                    key={`${num}-${history.length - i}`}
                    className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black border border-white/10 shadow-lg animate-in zoom-in duration-300 ${COLORS[ROULETTE_NUMBERS[num].color]}`}
                  >
                    {num}
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-center w-full py-2">
                  <span className="text-[8px] text-zinc-700 font-black uppercase tracking-widest italic">Nenhum número inserido</span>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-6 sm:grid-cols-9 gap-2">
            {INPUT_NUMBERS.map((num) => (
              <button
                key={num}
                onClick={() => addNumber(num)}
                className={`aspect-square rounded-lg flex items-center justify-center text-xs font-black border border-white/10 shadow-lg transition-all hover:scale-110 active:scale-95 hover:ring-2 hover:ring-gold-primary/50 ${COLORS[ROULETTE_NUMBERS[num].color]}`}
              >
                {num}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2 sm:gap-4 mt-8">
            <button 
              onClick={removeLast}
              className="py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 transition-all flex items-center justify-center gap-2"
            >
              <Activity className="w-3 h-3" />
              <span className="hidden sm:inline">Remover Último</span>
              <span className="sm:hidden">Desfazer</span>
            </button>
            <button 
              onClick={clearHistory}
              className="py-4 bg-red-500/5 hover:bg-red-500/10 border border-red-500/20 rounded-2xl text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-red-500 transition-all flex items-center justify-center gap-2"
            >
              <Zap className="w-3 h-3" />
              <span className="hidden sm:inline">Limpar Tudo</span>
              <span className="sm:hidden">Limpar</span>
            </button>
          </div>
        </section>

        {/* Roulette Wheel Visual */}
        <section className="glass-card rounded-[2rem] p-0 overflow-hidden">
          <div className="flex items-center justify-between p-8 pb-0">
            <div className="flex items-center gap-3">
              <Zap className="w-4 h-4 text-gold-primary" />
              <h2 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-400">Visualização do Cilindro</h2>
            </div>
          </div>
          <div className="p-0">
            <RouletteWheelVisual 
              highlightedNumbers={highlightedNumbers} 
              contextNumbers={contextTargets}
              vacuumNumbers={vacuumNumbers}
              mainTarget={stats?.prediction?.mainTarget}
              targetZone={targetZone} 
              isOmega={isOmega}
              lastNumber={lastNumber}
            />
          </div>

          {/* Legenda do Cilindro */}
          <div className="px-8 pb-8 pt-4 border-t border-white/5 bg-black/20">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.8)] animate-pulse" />
                <div className="flex flex-col">
                  <span className="text-[9px] font-black uppercase tracking-widest text-red-500">Bolha Vermelha</span>
                  <span className="text-[8px] text-zinc-400 font-black leading-tight">ALVO PRINCIPAL (CONVERGÊNCIA MÁXIMA)</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                <div className="flex flex-col">
                  <span className="text-[9px] font-black uppercase tracking-widest text-zinc-300">Verde</span>
                  <span className="text-[8px] text-zinc-500 font-bold leading-tight">Alvos da análise do cérebro neural</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-pink-500 shadow-[0_0_8px_rgba(236,72,153,0.6)]" />
                <div className="flex flex-col">
                  <span className="text-[9px] font-black uppercase tracking-widest text-zinc-300">Rosa</span>
                  <span className="text-[8px] text-zinc-500 font-bold leading-tight">Alvos da análise de espelhos</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-gold-primary shadow-[0_0_8px_rgba(212,175,55,0.6)]" />
                <div className="flex flex-col">
                  <span className="text-[9px] font-black uppercase tracking-widest text-zinc-300">Dourado</span>
                  <span className="text-[8px] text-zinc-500 font-bold leading-tight">Números de contexto e apoio</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
                <div className="flex flex-col">
                  <span className="text-[9px] font-black uppercase tracking-widest text-zinc-300">Azul</span>
                  <span className="text-[8px] text-zinc-500 font-bold leading-tight">Números de vácuo e recorrência</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Bias Monitor */}
        <section className="glass-card rounded-[2rem] p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Activity className="w-4 h-4 text-gold-primary" />
              <h2 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-400">Monitor de Viés</h2>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-gold-primary animate-pulse" />
              <span className="text-[8px] font-black uppercase tracking-widest text-gold-primary">Prioridade {'>'} 85%</span>
            </div>
          </div>
          <div className="space-y-4">
            {stats?.biases && stats?.biases?.length > 0 ? (
              [...(stats?.biases || [])]
                .sort((a, b) => b.confidence - a.confidence)
                .slice(0, 4)
                .map((bias, i) => (
                  <div 
                    key={i} 
                    className={`p-4 rounded-2xl border transition-all relative overflow-hidden group ${bias.confidence > 85 ? 'bg-gold-primary/10 border-gold-primary/40 shadow-[0_0_20px_rgba(212,175,55,0.1)]' : 'bg-white/5 border-white/5'}`}
                  >
                    {bias.confidence > 85 && (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gold-primary/10 to-transparent skew-x-12 animate-shimmer" />
                    )}
                    <div className="flex items-start justify-between relative z-10 gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div className={`w-1.5 h-1.5 rounded-full ${bias.confidence > 85 ? 'bg-gold-primary animate-pulse' : 'bg-zinc-600'}`} />
                          <p className="text-[8px] uppercase tracking-widest text-zinc-500 font-black">{bias.type}</p>
                          {bias.confidence > 85 && (
                            <span className="px-1.5 py-0.5 rounded-full bg-gold-primary text-[6px] font-black text-black uppercase tracking-tighter shadow-[0_0_10px_rgba(212,175,55,0.3)]">Prioritário</span>
                          )}
                        </div>
                        <p className={`text-sm font-black mb-0.5 ${bias.confidence > 85 ? 'text-white' : 'text-zinc-300'}`}>{bias.value}</p>
                        <p className="text-[9px] text-zinc-500 font-bold leading-tight opacity-80 group-hover:opacity-100 transition-opacity">
                          {bias.type === 'Padrão de Vácuo' && "O número está repetindo um intervalo de ausência histórico exato."}
                          {bias.type === 'Vácuo Recorrente' && "O terminal ou família atingiu um limite de atraso recorrente."}
                          {bias.type === 'Espelho Direto' && "Convergência baseada em números que costumam sair juntos (espelhos)."}
                          {bias.type === 'Setor' && "Forte tendência de queda em uma região específica do cilindro."}
                          {bias.type === 'Terminal' && "Alta frequência detectada para este final de número."}
                          {bias.type === 'Sequência' && "Padrão de repetição detectado em cores, paridade ou altura."}
                          {bias.type === 'Hiper-Quente' && "Número com frequência estatística fora da curva normal."}
                          {bias.type === 'Assinatura' && "Padrão de força e velocidade constante detectado no crupiê."}
                          {bias.type === 'Padrão Visual' && "Sequência visual detectada na mesa ou no cilindro."}
                          {bias.type === 'Desvio Padrão' && "Anomalia estatística: o número/terminal está muito abaixo da média esperada."}
                        </p>
                      </div>
                      <div className="text-right flex flex-col items-end justify-center h-full">
                        <p className={`text-[8px] uppercase tracking-widest font-black mb-1 ${bias.confidence > 85 ? 'text-gold-primary' : 'text-zinc-600'}`}>Poder</p>
                        <div className="flex items-baseline gap-0.5">
                          <span className={`text-lg font-black ${bias.confidence > 85 ? 'gold-text' : 'text-zinc-400'}`}>{bias.confidence}</span>
                          <span className={`text-[8px] font-black ${bias.confidence > 85 ? 'text-gold-primary' : 'text-zinc-600'}`}>%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
            ) : (
                <div className="py-10 text-center border border-dashed border-white/10 rounded-2xl">
                  <p className="text-xs text-zinc-600 font-bold uppercase tracking-widest">Aguardando Dados...</p>
                </div>
              )}
            </div>
          </section>
      </div>

      {/* Right Column: Google Search & Browser */}
      <div className="lg:col-span-6 lg:sticky lg:top-8 self-start space-y-6" style={{ contentVisibility: 'auto', containIntrinsicSize: '1px 800px' }}>
        <section className="glass-card rounded-[2rem] p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-lg">
              <svg viewBox="0 0 24 24" className="w-5 h-5">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            </div>
            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-400">Google Search Terminal</h2>
          </div>

          <div className="space-y-6">
            <div className="relative group">
              <input 
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="Digite a URL da casa (ex: bet365.com) ou pesquise..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-8 py-5 text-base text-white focus:border-gold-primary outline-none transition-all pr-28"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch();
                  }
                }}
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center space-x-2">
                {searchValue && (
                  <button 
                    onClick={() => setSearchValue('')}
                    className="p-1 hover:bg-white/10 rounded-full transition-colors"
                  >
                    <X className="w-4 h-4 text-zinc-500" />
                  </button>
                )}
                {isSearchingGoogle ? (
                  <Loader2 className="w-5 h-5 text-gold-primary animate-spin" />
                ) : (
                  <button onClick={handleSearch}>
                    <Search className="w-5 h-5 text-zinc-500 group-focus-within:text-gold-primary transition-colors" />
                  </button>
                )}
              </div>
            </div>

            {/* Browser Display Area - Increased height for better visibility */}
            <div className={`relative w-full bg-black/40 rounded-[2rem] border border-white/5 overflow-hidden group transition-all duration-500 shadow-[0_0_50px_rgba(212,175,55,0.05)] ${
              isMaximized 
                ? 'fixed inset-4 z-[9999] h-[calc(100vh-2rem)] shadow-[0_0_100px_rgba(0,0,0,0.8)]' 
                : 'h-[600px] lg:h-[750px]'
            }`}>
              {browserUrl ? (
                <div className="w-full h-full relative group">
                  {isIframeLoading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-10 space-y-4">
                      <Loader2 className="w-12 h-12 text-gold-primary animate-spin" />
                      <div className="text-center">
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gold-primary animate-pulse">Carregando Interface da Casa...</p>
                        <p className="text-[8px] text-zinc-500 uppercase tracking-widest mt-2">Se demorar muito, o site pode estar bloqueando o acesso via terminal.</p>
                      </div>
                    </div>
                  )}
                  <iframe 
                    key={iframeKey}
                    src={browserUrl} 
                    className="w-full h-full border-none bg-white"
                    title="Betting Site"
                    onLoad={() => setIsIframeLoading(false)}
                    allow="autoplay; clipboard-write; encrypted-media; picture-in-picture"
                    sandbox="allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-scripts allow-same-origin allow-storage-access-by-user-activation"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-4 left-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1 rounded-full flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-[8px] text-zinc-300 font-mono truncate max-w-[200px]">{browserUrl}</span>
                    </div>
                  </div>
                  <div className="absolute top-4 right-4 flex space-x-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    {isMaximized && (
                      <p className="text-[8px] text-zinc-500 uppercase tracking-widest self-center mr-2 hidden md:block">Pressione ESC para sair</p>
                    )}
                    <button 
                      onClick={() => setIsMaximized(!isMaximized)}
                      className="bg-zinc-800/80 hover:bg-zinc-700/80 text-white p-2 rounded-lg backdrop-blur-md border border-white/10 transition-all"
                      title={isMaximized ? "Minimizar" : "Maximizar"}
                    >
                      {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    </button>
                    <button 
                      onClick={handleRefreshIframe}
                      className="bg-zinc-800/80 hover:bg-zinc-700/80 text-white p-2 rounded-lg backdrop-blur-md border border-white/10 transition-all"
                      title="Recarregar"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={handleClearBrowser}
                      className="bg-zinc-800/80 hover:bg-zinc-700/80 text-white p-2 rounded-lg backdrop-blur-md border border-white/10 transition-all"
                      title="Fechar Navegador"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => window.open(browserUrl, '_blank')}
                      className="bg-gold-primary/20 hover:bg-gold-primary/40 text-gold-primary p-2 rounded-lg backdrop-blur-md border border-gold-primary/30 transition-all"
                      title="Abrir em Nova Aba"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/80 px-4 py-2 rounded-full border border-white/10 backdrop-blur-md pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-[9px] text-zinc-400 uppercase tracking-widest text-center">
                      Algumas casas de apostas bloqueiam o acesso via terminal. Se não carregar, use o botão acima.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div id="search-results-container" className="w-full h-full p-6 md:p-10 overflow-y-auto scrollbar-thin scrollbar-thumb-gold-primary/20 scrollbar-track-transparent">
                    {isSearchingGoogle ? (
                      <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                        <Loader2 className="w-12 h-12 text-gold-primary animate-spin" />
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gold-primary animate-pulse">Sincronizando com a Rede Mundial...</p>
                      </div>
                    ) : searchResults ? (
                      <div className="prose prose-invert prose-sm md:prose-base max-w-none markdown-body">
                        <Markdown>{searchResults}</Markdown>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-40 group-hover:opacity-60 transition-opacity">
                        <Search className="w-12 h-12 text-gold-primary mb-2" />
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500">Aguardando Consulta...</p>
                        <p className="text-[8px] text-zinc-600 max-w-xs">Acesse casas de apostas ou pesquise estratégias aqui</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Decorative scanline effect */}
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-white/[0.02] to-transparent h-20 w-full animate-scanline" />
            </div>
          </div>
        </section>
      </div>
    </motion.div>
  );
});

export default DashboardTab;
