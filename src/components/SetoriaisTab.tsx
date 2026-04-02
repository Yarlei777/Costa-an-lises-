import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TrendingUp, Activity } from 'lucide-react';
import { Stats } from '../types';
import { ResponsiveContainer, AreaChart, Area, Tooltip } from 'recharts';

interface SetoriaisTabProps {
  stats: Stats | null;
}

const SetoriaisTab: React.FC<SetoriaisTabProps> = React.memo(({ stats }) => {
  return (
    <motion.div 
      key="setoriais"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
      className="grid grid-cols-1 lg:grid-cols-12 gap-10"
    >
      {/* Left: Sector Trends */}
      <div className="lg:col-span-7 space-y-10">
        <section className="glass-card rounded-[2rem] p-8">
          <div className="flex items-center gap-3 mb-8">
            <TrendingUp className="w-4 h-4 text-gold-primary" />
            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-400">Tendência de Setores (Blocos de 10)</h2>
          </div>
          <div className="grid grid-cols-1 gap-8">
            {['voisins', 'tiers', 'orphelins'].map(sector => (
              <div key={sector} className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] uppercase font-black tracking-widest text-zinc-500">{sector}</span>
                  <span className="text-xs font-black gold-text">
                    {stats ? Math.round((stats.sectorCounts[sector as keyof typeof stats.sectorCounts] / stats.total) * 100) : 0}%
                  </span>
                </div>
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats?.sectorTrends || []}>
                      <defs>
                        <linearGradient id={`color-${sector}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <Area 
                        type="monotone" 
                        dataKey={sector} 
                        stroke="#D4AF37" 
                        fillOpacity={1} 
                        fill={`url(#color-${sector})`} 
                        strokeWidth={2}
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(212, 175, 55, 0.3)', borderRadius: '12px' }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Right: Circular Heatmap */}
      <div className="lg:col-span-5 space-y-10">
        <section className="glass-card rounded-[2rem] p-8 aspect-square flex flex-col items-center justify-center relative">
          <div className="absolute top-8 left-8 flex items-center gap-2">
            <Activity className="w-4 h-4 text-gold-primary" />
            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-400">Heatmap Circular</h2>
          </div>
          
          <div className="relative w-full max-w-[320px] aspect-square rounded-full border border-white/5 flex items-center justify-center">
            <AnimatePresence>
              {stats && (
                <>
                  {Object.entries(stats.sectorCounts).map(([sector, count]) => {
                    const c = count as number;
                    const p = (c / stats.total) * 100;
                    const isHot = p > 30;
                    const intensity = Math.min(p / 45, 1); 
                    const opacity = isHot ? 0.3 + (intensity * 0.5) : 0.05;
                    const blur = isHot ? `${2 + intensity * 10}px` : '1px';
                    const spread = isHot ? 15 + (intensity * 35) : 0;

                    return (
                      <motion.div 
                        key={sector}
                        initial={{ opacity: 0, scale: 0.9 }} 
                        animate={{ 
                          opacity: opacity, 
                          scale: 1,
                          boxShadow: isHot ? `0 0 ${spread}px rgba(212, 175, 55, ${0.1 + intensity * 0.4})` : 'none'
                        }}
                        transition={{ duration: 1 }}
                        className={`absolute inset-0 rounded-full border-gold-primary/30 transition-all ${isHot ? 'border-gold-primary/60' : ''}`}
                        style={{ 
                          borderWidth: isHot ? `${2 + intensity * 4}px` : '1px',
                          filter: `blur(${blur})`
                        }}
                      />
                    );
                  })}
                  
                  <div className="absolute inset-6 rounded-full border border-white/5 flex items-center justify-center bg-[#0a0a0a] shadow-inner shadow-white/5">
                    <div className="text-center space-y-4">
                      <div className="text-[10px] uppercase tracking-[0.3em] text-zinc-600 font-black">Setores</div>
                      <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                        {Object.entries(stats.sectorCounts).map(([sector, count]) => {
                          const c = count as number;
                          const percentage = (c / stats.total);
                          const isHot = percentage > 0.30;
                          return (
                            <div key={sector} className={`flex flex-col items-center transition-all duration-500 ${isHot ? 'scale-110' : 'opacity-40'}`}>
                              <span className="text-[8px] uppercase text-zinc-500 font-bold">{sector}</span>
                              <span className={`text-lg font-black ${ isHot ? 'gold-text' : 'text-white'}`}>
                                {Math.round(percentage * 100)}%
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </AnimatePresence>
            <div className="absolute inset-0 border-8 border-zinc-900 rounded-full" />
            <div className="absolute inset-0 border border-white/10 rounded-full" />
          </div>
        </section>
      </div>
    </motion.div>
  );
});

export default SetoriaisTab;
