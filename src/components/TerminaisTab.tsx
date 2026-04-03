import React from 'react';
import { motion } from 'motion/react';
import { Zap, History, Eye, ShieldCheck } from 'lucide-react';
import { Stats } from '../types';
import { COLORS, ROULETTE_NUMBERS } from '../constants';

interface TerminaisTabProps {
  stats: Stats | null;
  history: number[];
}

const TerminaisTab: React.FC<TerminaisTabProps> = React.memo(({ stats, history }) => {
  return (
    <motion.div 
      key="terminais"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
      className="space-y-10"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Main Prediction Card */}
        <div className="lg:col-span-12 space-y-10">
          <section className="glass-card rounded-[3rem] p-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8">
              <div className="w-20 h-20 rounded-3xl bg-gold-primary/10 border border-gold-primary/20 flex items-center justify-center">
                <Zap className="w-10 h-10 text-gold-primary animate-pulse" />
              </div>
            </div>

            <div className="relative z-10">
              <span className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-500 mb-4 block">Próximo Alvo Sugerido</span>
              <h2 className="text-7xl font-black gold-text tracking-tighter italic mb-2">
                {stats?.groupPredictions?.[0]?.name || '---'}
              </h2>
              <p className="text-zinc-400 text-sm font-bold uppercase tracking-widest">
                Grupo de Terminais com maior probabilidade
              </p>

              <div className="mt-12 flex items-center gap-10">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600 block mb-1">Confiança</span>
                  <span className="text-4xl font-black text-white">{stats?.groupPredictions?.[0]?.confidence || 0}%</span>
                </div>
                <div className="w-px h-12 bg-white/10" />
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600 block mb-1">Status</span>
                  <span className={`text-sm font-black uppercase tracking-widest ${(stats?.groupPredictions?.[0]?.confidence || 0) > 75 ? 'text-emerald-500' : 'text-gold-primary'}`}>
                    {(stats?.groupPredictions?.[0]?.confidence || 0) > 75 ? 'Entrada Forte' : 'Aguardar Confirmação'}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-12 grid grid-cols-3 gap-4">
              {stats?.groupPredictions?.[0]?.terminals?.map(t => (
                <div key={t} className="p-6 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center gap-2">
                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Terminal</span>
                  <span className="text-3xl font-black text-white">{t}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Comparison Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {stats?.groupPredictions?.map((pred, i) => (
              <div key={i} className={`p-8 rounded-[2rem] border transition-all ${i === 0 ? 'bg-gold-primary/5 border-gold-primary/30 shadow-xl shadow-gold-primary/5' : 'bg-white/5 border-white/5'}`}>
                <div className="flex justify-between items-start mb-6">
                  <h3 className="text-2xl font-black text-white">{pred.name}</h3>
                  <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${i === 0 ? 'bg-gold-primary text-black' : 'bg-white/10 text-zinc-500'}`}>
                    {i === 0 ? 'Top 1' : `Top ${i + 1}`}
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-2">
                      <span className="text-zinc-500">Confiança</span>
                      <span className="gold-text">{pred.confidence}%</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-gold-primary" style={{ width: `${pred.confidence}%` }} />
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <span className="text-[9px] font-black uppercase tracking-widest text-zinc-600">Atraso</span>
                    <span className="text-sm font-black text-white">{pred.lastSeen === -1 ? '∞' : pred.lastSeen} Rds</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Terminal Vacuum (Atraso Individual) */}
          <section className="glass-card rounded-[2rem] p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <History className="w-24 h-24 text-gold-primary" />
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-gold-primary/10 flex items-center justify-center">
                  <History className="w-4 h-4 text-gold-primary" />
                </div>
                <div>
                  <h2 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-400">Vácuo de Terminais</h2>
                  <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest mt-0.5">Monitoramento de Atraso por Terminal</p>
                </div>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-white/10" />
                  <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Normal</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-gold-primary/40" />
                  <span className="text-[8px] font-black text-gold-primary/60 uppercase tracking-widest">Atrasado</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-gold-primary shadow-[0_0_8px_rgba(212,175,55,0.6)]" />
                  <span className="text-[8px] font-black text-gold-primary uppercase tracking-widest">Recorrente</span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-5 md:grid-cols-10 gap-4 relative z-10">
              {stats?.terminalVacuum?.map((v, i) => {
                const gapInfo = stats?.terminalGaps?.[i];
                const isRecurrent = v !== -1 && gapInfo && v >= gapInfo.lastCompletedGap - 1 && v <= gapInfo.lastCompletedGap + 1 && gapInfo.lastCompletedGap > 0;
                const isHighVacuum = v > 12 || v === -1;
                
                const maxRef = Math.max(gapInfo?.lastCompletedGap || 0, 15);
                const progress = v === -1 ? 100 : Math.min((v / maxRef) * 100, 100);
                
                return (
                  <motion.div 
                    key={i} 
                    whileHover={{ y: -5 }}
                    className={`relative p-5 rounded-3xl border transition-all duration-500 flex flex-col items-center gap-3 group ${
                      isRecurrent 
                        ? 'bg-gold-primary/20 border-gold-primary shadow-[0_10px_30px_rgba(212,175,55,0.15)]' 
                        : isHighVacuum 
                          ? 'bg-gold-primary/5 border-gold-primary/20' 
                          : 'bg-white/5 border-white/5 hover:border-white/10'
                    }`}
                  >
                    <div className="flex flex-col items-center">
                      <span className={`text-[10px] font-black uppercase tracking-widest ${isRecurrent ? 'text-gold-primary' : 'text-zinc-500'}`}>T{i}</span>
                      <div className={`w-1 h-1 rounded-full mt-1 ${isRecurrent ? 'bg-gold-primary animate-ping' : 'bg-transparent'}`} />
                    </div>

                    <div className="relative w-full aspect-square flex items-center justify-center">
                      <svg className="w-full h-full -rotate-90 transform">
                        <circle
                          cx="50%"
                          cy="50%"
                          r="40%"
                          className="stroke-white/5 fill-none"
                          strokeWidth="4"
                        />
                        <motion.circle
                          cx="50%"
                          cy="50%"
                          r="40%"
                          className={`fill-none transition-all duration-1000 ${
                            isRecurrent ? 'stroke-gold-primary' : isHighVacuum ? 'stroke-gold-primary/40' : 'stroke-white/20'
                          }`}
                          strokeWidth="4"
                          strokeDasharray="100"
                          initial={{ strokeDashoffset: 100 }}
                          animate={{ strokeDashoffset: 100 - progress }}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className={`text-2xl font-black tracking-tighter ${isRecurrent ? 'gold-text' : isHighVacuum ? 'text-gold-primary' : 'text-white'}`}>
                          {v === -1 ? '∞' : v}
                        </span>
                        <span className="text-[7px] font-black text-zinc-600 uppercase tracking-widest -mt-1">Giros</span>
                      </div>
                    </div>

                    <div className="w-full pt-3 border-t border-white/5 flex flex-col items-center gap-1">
                      <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Anterior</span>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-xs font-black ${isRecurrent ? 'text-gold-primary' : 'text-zinc-400'}`}>
                          {gapInfo.lastCompletedGap || '-'}
                        </span>
                        {isRecurrent && <Zap className="w-2.5 h-2.5 text-gold-primary fill-gold-primary" />}
                      </div>
                    </div>

                    {isRecurrent && (
                      <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-gold-primary rounded-full shadow-lg">
                        <span className="text-[7px] font-black text-black uppercase tracking-widest">Match</span>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>

            <div className="mt-8 p-6 rounded-2xl bg-white/5 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                  <Eye className="w-5 h-5 text-zinc-500" />
                </div>
                <div>
                  <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Como ler este monitor?</h4>
                  <p className="text-[9px] font-bold text-zinc-500 leading-relaxed mt-1">
                    O círculo indica o progresso do vácuo atual em relação ao vácuo anterior. <br/>
                    Quando o vácuo atual atinge o valor do anterior (<span className="text-gold-primary">Match</span>), a probabilidade de saída aumenta drasticamente.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-gold-primary/10 border border-gold-primary/20 rounded-xl">
                <ShieldCheck className="w-3.5 h-3.5 text-gold-primary" />
                <span className="text-[9px] font-black text-gold-primary uppercase tracking-widest">Análise de Ciclos Ativa</span>
              </div>
            </div>
          </section>
        </div>

        {/* Side Info */}
        <div className="lg:col-span-4 space-y-10">
          <section className="glass-card rounded-[2rem] p-8">
            <div className="flex items-center gap-3 mb-8">
              <Zap className="w-4 h-4 text-gold-primary" />
              <h2 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-400">Dica de Operação</h2>
            </div>
            <div className="space-y-6">
              <p className="text-sm font-bold text-zinc-400 leading-relaxed">
                A análise de terminais foca na repetição de padrões de final de número. 
                Quando um grupo como <span className="text-gold-primary">1.4.7</span> atinge alta confiança, 
                recomenda-se cobrir todos os números que terminam com esses dígitos.
              </p>
              <div className="p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
                <div className="flex items-center gap-3 mb-3">
                  <ShieldCheck className="w-5 h-5 text-emerald-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Gestão de Banca</span>
                </div>
                <p className="text-[11px] font-bold text-emerald-400/80">
                  Utilize no máximo 2% da banca por entrada em grupos de terminais para manter a sustentabilidade a longo prazo.
                </p>
              </div>
            </div>
          </section>

          <section className="glass-card rounded-[2rem] p-8">
            <div className="flex items-center gap-3 mb-8">
              <History className="w-4 h-4 text-gold-primary" />
              <h2 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-400">Últimos Grupos</h2>
            </div>
            <div className="space-y-3">
              {(history || []).slice(0, 8).map((num, i) => {
                const terminal = num % 10;
                let group = "Outro";
                if ([1, 4, 7].includes(terminal)) group = "1.4.7";
                else if ([2, 5, 8].includes(terminal)) group = "2.5.8";
                else if ([3, 6, 9].includes(terminal)) group = "3.6.9";
                
                return (
                  <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black ${COLORS[ROULETTE_NUMBERS[num].color]}`}>
                        {num}
                      </div>
                      <span className="text-[10px] font-bold text-zinc-500">Terminal {terminal}</span>
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${group !== 'Outro' ? 'gold-text' : 'text-zinc-700'}`}>
                      {group}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </motion.div>
  );
});

export default TerminaisTab;
