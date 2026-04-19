import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, Activity, Target, Search, Loader2, RotateCcw, Maximize2, Minimize2, X } from 'lucide-react';
import Markdown from 'react-markdown';
import { Stats } from '../types';
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
    setIsIframeLoading(prev => !prev); // Toggle to trigger effect or just set to true
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

  // Performance optimization for animations
  const containerStyle = React.useMemo(() => ({
    contain: 'layout style paint' as const,
    willChange: 'transform, opacity'
  }), []);

  return (
    <motion.div 
      key="dashboard"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="grid grid-cols-1 lg:grid-cols-12 gap-10"
      style={containerStyle}
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
            <span className="text-[10px] font-black text-gold-primary/60 tracking-widest">{history.length}/200</span>
            <div className="w-24 h-1 bg-white/5 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${(history.length / 200) * 100}%` }}
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
                animate={{ width: `${(history.length / 200) * 100}%` }}
                className="h-full bg-gold-primary shadow-[0_0_10px_rgba(212,175,55,0.5)]" 
              />
            </div>
            <span className="text-[10px] font-black text-gold-primary/60 tracking-widest">{history.length}/200</span>
          </div>
        </div>
      </div>
      {/* Layout de 3 Colunas para Desktop (Análise ao redor do Navegador) */}
      <div className="lg:col-span-3 space-y-6 order-2 lg:order-1">
        {/* Cérebro Central */}
        <section className="glass-card rounded-[2rem] p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-gold-primary" />
              <span className="text-[9px] uppercase tracking-[0.3em] text-zinc-500 font-black">Motores Neurais</span>
            </div>
          </div>
          <div className="space-y-2">
            {[
              { label: 'Neural', weight: engineWeights.neural },
              { label: 'Markov', weight: engineWeights.markov },
              { label: 'Setor', weight: engineWeights.sector },
              { label: 'Viés', weight: engineWeights.bias },
              { label: 'Curto', weight: engineWeights.shortTerm }
            ].map((item, i) => (
              <div key={i} className="p-2 bg-white/5 rounded-xl border border-white/5 flex flex-col gap-0.5">
                <div className="flex justify-between items-center">
                  <span className="text-[7px] uppercase tracking-widest text-zinc-600 font-bold">{item.label}</span>
                  <span className="text-[8px] font-black gold-text">x{item.weight.toFixed(2)}</span>
                </div>
                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-gold-primary" style={{ width: `${(item.weight / 2) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Monitor de Viés */}
        <section className="glass-card rounded-[2rem] p-6">
          <div className="flex items-center gap-3 mb-4">
            <Activity className="w-4 h-4 text-gold-primary" />
            <h2 className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-500">Radar de Viés</h2>
          </div>
          <div className="space-y-3">
            {stats?.biases && stats?.biases?.length > 0 ? (
              [...(stats?.biases || [])]
                .sort((a, b) => b.confidence - a.confidence)
                .slice(0, 3)
                .map((bias, i) => (
                  <div key={i} className={`p-3 rounded-xl border ${bias.confidence > 85 ? 'bg-gold-primary/5 border-gold-primary/20' : 'bg-white/5 border-white/5'}`}>
                    <p className="text-[7px] uppercase tracking-widest text-zinc-600 font-black mb-1">{bias.type}</p>
                    <p className="text-[10px] font-black text-zinc-300 leading-tight">{bias.value}</p>
                    <div className="mt-1 flex justify-between items-center">
                      <div className="h-0.5 flex-1 bg-white/5 rounded-full mr-2">
                        <div className="h-full bg-gold-primary" style={{ width: `${bias.confidence}%` }} />
                      </div>
                      <span className="text-[8px] font-black gold-text">{bias.confidence}%</span>
                    </div>
                  </div>
                ))
            ) : (
              <div className="py-4 text-center border border-dashed border-white/10 rounded-xl">
                <p className="text-[8px] text-zinc-700 font-black uppercase">Aguardando...</p>
              </div>
            )}
          </div>
        </section>

      </div>

      {/* Center Column: Search & Browser (Main Focus) */}
      <div className="lg:col-span-6 space-y-6 order-1 lg:order-2">
        {/* Probabilidade Central (Top of Center) */}
        <section className="relative flex flex-col items-center">
          <div className="w-full bg-black/40 backdrop-blur-xl border border-white/5 rounded-[2rem] p-6 relative overflow-hidden group">
            <div className="flex items-center justify-between relative z-10">
              <div className="flex flex-col">
                <h3 className={`text-lg font-black uppercase tracking-tighter italic ${isOmega ? 'text-red-500' : 'gold-text'}`}>
                  {stats?.prediction?.isSniper ? 'Fogo Livre' : isOmega ? 'Convergência Ômega' : 'Análise Neural'}
                </h3>
                <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500">Sincronia do Motor</span>
              </div>
              <div className="text-right">
                <div className={`text-3xl font-black leading-none ${isOmega ? 'text-red-500' : 'gold-text'}`}>
                  {stats?.prediction?.isSniper ? stats?.prediction?.betPercentage : Math.round(stats?.prediction?.confidence || 0)}%
                </div>
              </div>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden mt-3">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${stats?.prediction?.isSniper ? stats?.prediction?.betPercentage : Math.round(stats?.prediction?.confidence || 0)}%` }}
                className={`h-full transition-all duration-1000 ${isOmega ? 'bg-red-500' : 'bg-gold-primary'}`}
              />
            </div>
          </div>
        </section>

        {/* Google Search Terminal (Significantly Larger) */}
        <section className="glass-card rounded-[2.5rem] p-8 lg:p-10 border-gold-primary/20 shadow-[0_0_50px_rgba(212,175,55,0.1)]">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-xl">
              <svg viewBox="0 0 24 24" className="w-6 h-6">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            </div>
            <h2 className="text-sm font-black uppercase tracking-[0.4em] gold-text">Terminal de Navegação Central</h2>
          </div>

          <div className="relative group">
            <input 
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Digite a URL ou pesquise a casa de apostas..."
              className="w-full bg-white/5 border-2 border-white/10 rounded-[2rem] px-10 py-8 lg:py-10 text-xl lg:text-2xl text-white focus:border-gold-primary outline-none transition-all pr-32 shadow-inner"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearch();
                }
              }}
            />
            <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center space-x-4">
              {isSearchingGoogle ? (
                <Loader2 className="w-8 h-8 text-gold-primary animate-spin" />
              ) : (
                <button onClick={handleSearch} className="p-2 hover:bg-white/10 rounded-full transition-all">
                  <Search className="w-8 h-8 text-gold-primary" />
                </button>
              )}
            </div>
          </div>

          {/* Browser Display Area */}
          <div className={`mt-8 relative w-full bg-black/40 rounded-[2.5rem] border-2 border-white/10 overflow-hidden group transition-all duration-500 shadow-2xl ${
            isMaximized 
              ? 'fixed inset-4 z-[9999] h-[calc(100vh-2rem)]' 
              : 'h-[600px] lg:h-[800px]'
          }`}>
            {browserUrl ? (
              <div className="w-full h-full relative">
                {isIframeLoading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-10">
                    <Loader2 className="w-12 h-12 text-gold-primary animate-spin mb-4" />
                    <p className="text-xs font-black uppercase tracking-widest text-gold-primary animate-pulse">Sincronizando Interface...</p>
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
                <div className="absolute top-6 right-6 flex space-x-3 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => setIsMaximized(!isMaximized)} className="bg-zinc-900/90 text-white p-3 rounded-xl border border-white/10"><Maximize2 className="w-5 h-5" /></button>
                  <button onClick={handleRefreshIframe} className="bg-zinc-900/90 text-white p-3 rounded-xl border border-white/10"><RotateCcw className="w-5 h-5" /></button>
                  <button onClick={handleClearBrowser} className="bg-red-500/20 text-red-500 p-3 rounded-xl border border-red-500/30"><X className="w-5 h-5" /></button>
                </div>
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div id="search-results-container" className="w-full h-full p-10 overflow-y-auto">
                  {isSearchingGoogle ? (
                    <div className="flex flex-col items-center justify-center h-full space-y-4">
                      <Loader2 className="w-12 h-12 text-gold-primary animate-spin" />
                      <p className="text-xs font-black uppercase tracking-widest text-gold-primary">Buscando Dados...</p>
                    </div>
                  ) : searchResults ? (
                    <div className="prose prose-invert max-w-none markdown-body">
                      <Markdown>{searchResults}</Markdown>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full opacity-30">
                      <Search className="w-16 h-16 text-gold-primary mb-4" />
                      <p className="text-xs font-black uppercase tracking-widest">Aguardando Comando de Busca</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Manual Input (Bottom of Center) */}
        <section className="glass-card rounded-[2rem] p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Zap className="w-4 h-4 text-gold-primary" />
              <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">Entrada de Dados Rápida</h2>
            </div>
            <button onClick={onToggleBallisticMode} className={`px-3 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all ${ballisticMode ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' : 'bg-white/5 border-white/10 text-zinc-500'}`}>
              {ballisticMode ? 'Balística ON' : 'Balística OFF'}
            </button>
          </div>

          {/* Recent Numbers Preview */}
          <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
            <span className="text-[8px] font-black uppercase tracking-widest text-zinc-600 mr-2 whitespace-nowrap">Últimos:</span>
            {recentNumbers.length > 0 ? (
              <div className="flex gap-1.5">
                {recentNumbers.map((num, idx) => (
                  <motion.div
                    key={`${num}-${history.length - idx}`}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black border border-white/10 shadow-lg ${COLORS[ROULETTE_NUMBERS[num].color]}`}
                  >
                    {num}
                  </motion.div>
                ))}
              </div>
            ) : (
              <span className="text-[9px] font-bold text-zinc-700 uppercase tracking-widest italic">Aguardando dados...</span>
            )}
          </div>

          <div className="grid grid-cols-6 sm:grid-cols-9 lg:grid-cols-12 gap-2">
            {INPUT_NUMBERS.map((num) => (
              <button key={num} onClick={() => addNumber(num)} className={`aspect-square rounded-lg flex items-center justify-center text-[10px] font-black border border-white/10 transition-all hover:scale-110 ${COLORS[ROULETTE_NUMBERS[num].color]}`}>
                {num}
              </button>
            ))}
          </div>
          <div className="mt-6 flex justify-center gap-4">
            <button onClick={removeLast} className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest text-zinc-400">Desfazer</button>
            <button onClick={clearHistory} className="px-4 py-2 bg-red-500/5 border border-red-500/20 rounded-xl text-[9px] font-black uppercase tracking-widest text-red-500">Limpar</button>
          </div>
        </section>

        {/* Roulette Wheel Visual (Now in Center) */}
        <section className="glass-card rounded-[2rem] p-0 overflow-hidden">
          <RouletteWheelVisual 
            highlightedNumbers={highlightedNumbers} 
            contextNumbers={contextTargets}
            vacuumNumbers={vacuumNumbers}
            mainTarget={stats?.prediction?.mainTarget}
            targetZone={targetZone} 
            isOmega={isOmega}
            lastNumber={lastNumber}
          />
        </section>
      </div>

      {/* Right Column: Targets & Wheel (Desktop Right) */}
      <div className="lg:col-span-3 space-y-6 order-3">
        {/* Números Alvos */}
        <section className="glass-card rounded-[2rem] p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-gold-primary" />
              <span className="text-[9px] uppercase tracking-[0.3em] text-zinc-500 font-black">Alvos Prioritários</span>
            </div>
          </div>
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar" style={{ contain: 'content', willChange: 'scroll-position' }}>
            {allCylinderTargets.slice(0, 12).map((target, idx) => {
              const num = target.num;
              const score = target.confidence;
              const isMirror = target.isMirrorOnly || MIRROR_NUMBERS_LIST.includes(num);
              return (
                <div key={num} className={`p-3 bg-white/5 rounded-xl border flex items-center gap-3 transition-all ${isOmega ? 'border-red-500/30' : isMirror ? 'border-pink-500/30' : 'border-gold-primary/10'}`}>
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg font-black border ${COLORS[ROULETTE_NUMBERS[num].color]} ${isOmega ? 'border-red-500/50' : 'border-gold-primary/30'}`}>
                    {num}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[7px] font-black uppercase text-zinc-500">{isMirror ? 'Espelho' : 'Assertividade'}</span>
                      <span className={`text-[10px] font-black ${isOmega ? 'text-red-500' : 'gold-text'}`}>{score}%</span>
                    </div>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                      <div className={`h-full ${isOmega ? 'bg-red-500' : 'bg-gold-primary'}`} style={{ width: `${score}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Últimos Números */}
        <section className="glass-card rounded-[2rem] p-6">
          <div className="text-[8px] font-black uppercase tracking-widest text-zinc-600 mb-4 flex items-center gap-2">
            <Activity className="w-3 h-3" /> Histórico Recente
          </div>
          <div className="grid grid-cols-5 gap-2">
            {recentNumbers.map((num, i) => (
              <div key={i} className={`aspect-square rounded-lg flex items-center justify-center text-[10px] font-black border border-white/10 ${COLORS[ROULETTE_NUMBERS[num].color]}`}>
                {num}
              </div>
            ))}
          </div>
        </section>
      </div>
    </motion.div>
  );
});

export default DashboardTab;
