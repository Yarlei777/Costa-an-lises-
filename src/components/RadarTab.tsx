import React from 'react';
import { motion } from 'motion/react';
import { Radar, Target, Zap } from 'lucide-react';
import { Stats, CustomAlertRule, RouletteNumber, Bias } from '../types';
import { COLORS, ROULETTE_NUMBERS, WHEEL_ORDER, MIRROR_NUMBERS_LIST, CAMUFLADOS_NUMBERS } from '../constants';

interface RadarTabProps {
  stats: Stats | null;
  history: number[];
  customRules: CustomAlertRule[];
  setActiveTab: (tab: any) => void;
  notificationLog?: { id: string; bias: Bias; spinIndex: number; timestamp: number; isImportant: boolean; formattedMessage?: string }[];
}

const RadarTab: React.FC<RadarTabProps> = React.memo(({ stats, history, customRules, setActiveTab, notificationLog = [] }) => {
  return (
    <motion.div 
      key="notificacoes"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-12 space-y-6">
          {/* Feed de Notificações */}
          <section className="glass-card rounded-xl p-4 relative overflow-hidden min-h-[600px]">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gold-primary/10 flex items-center justify-center">
                  <Radar className="w-5 h-5 text-gold-primary animate-pulse" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white uppercase tracking-tighter italic">Central de <span className="gold-text">Notificações</span></h2>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.3em] mt-0.5">Histórico de anomalias e alertas de elite</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="px-3 py-1.5 bg-white/5 rounded-lg border border-white/10 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Feed em Tempo Real</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {notificationLog.length > 0 ? (
                notificationLog.map((log, i) => {
                  const bias = log.bias;
                  const isImportant = log.isImportant;

                  return (
                    <motion.div 
                      key={log.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className={`p-4 rounded-2xl border transition-all flex items-center gap-6 ${
                        isImportant 
                          ? 'bg-gold-primary/5 border-gold-primary/20 shadow-lg shadow-gold-primary/5' 
                          : 'bg-white/5 border-white/5 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <div className="flex flex-col items-center justify-center min-w-[60px] border-r border-white/10 pr-4">
                        <span className="text-[10px] font-black text-zinc-500">GIRO</span>
                        <span className="text-xl font-black text-white">#{log.spinIndex}</span>
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[8px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded ${
                            isImportant ? 'bg-gold-primary text-black' : 'bg-white/5 text-zinc-500'
                          }`}>
                            {bias.type}
                          </span>
                          {isImportant && <Zap className="w-3 h-3 text-gold-primary animate-pulse" />}
                        </div>
                        <h3 className="text-base font-black text-white tracking-tight leading-tight">{log.formattedMessage || bias.value}</h3>
                        <div className="flex items-center gap-3 mt-2">
                          <div className="w-24 h-1 bg-white/5 rounded-full overflow-hidden">
                            <div className={`h-full ${isImportant ? 'bg-gold-primary' : 'bg-zinc-500'}`} style={{ width: `${bias.confidence}%` }} />
                          </div>
                          <span className={`text-[9px] font-black ${isImportant ? 'gold-text' : 'text-zinc-500'}`}>{bias.confidence}% Confiança</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 pr-2">
                        <button 
                          onClick={() => setActiveTab('SETORIAIS')}
                          className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all shadow-sm ${
                            isImportant 
                              ? 'bg-gold-primary/10 border-gold-primary/20 text-gold-primary hover:bg-gold-primary hover:text-black' 
                              : 'bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          Analisar
                        </button>
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <div className="py-40 text-center border-2 border-dashed border-white/5 rounded-[3rem]">
                  <Radar className="w-16 h-16 text-zinc-800 mx-auto mb-4" />
                  <p className="text-sm text-zinc-600 font-bold uppercase tracking-widest">Aguardando capturar anomalias nos giros</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </motion.div>
  );
});

export default RadarTab;
