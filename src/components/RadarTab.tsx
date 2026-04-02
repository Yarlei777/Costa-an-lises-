import React from 'react';
import { motion } from 'motion/react';
import { Radar, Target, Zap } from 'lucide-react';
import { Stats, CustomAlertRule, RouletteNumber } from '../types';
import { COLORS, ROULETTE_NUMBERS, WHEEL_ORDER, MIRROR_NUMBERS_LIST } from '../constants';

interface RadarTabProps {
  stats: Stats | null;
  history: number[];
  customRules: CustomAlertRule[];
  setActiveTab: (tab: any) => void;
}

const RadarTab: React.FC<RadarTabProps> = React.memo(({ stats, history, customRules, setActiveTab }) => {
  return (
    <motion.div 
      key="radar"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-12 space-y-6">
          {/* Radar de Viés Estatístico */}
          <section className="glass-card rounded-xl p-4 relative overflow-hidden" style={{ contentVisibility: 'auto', containIntrinsicSize: '1px 600px' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gold-primary/10 flex items-center justify-center">
                  <Radar className="w-4 h-4 text-gold-primary animate-pulse" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white uppercase tracking-tighter italic">Radar de Viés <span className="gold-text">Ativo</span></h2>
                  <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">Anomalias estatísticas e tendências de motor</p>
                </div>
              </div>
              <div className="px-2.5 py-1 bg-white/5 rounded-md border border-white/10 flex items-center gap-1.5">
                <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Live Scan</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {stats?.biases && stats.biases.length > 0 ? (
                [...stats.biases]
                  .sort((a, b) => b.confidence - a.confidence)
                  .map((bias, i) => {
                  // Determine target numbers based on bias type/value
                  let targetNumbers: number[] = [];
                  if (bias.type === 'Vácuo Recorrente') {
                    if (bias.value.includes('Terminal')) {
                      const t = parseInt(bias.value.match(/\d+/)?.[0] || "");
                      targetNumbers = Array.from({length: 37}, (_, i) => i).filter(n => n % 10 === t);
                    } else if (bias.value.includes('Família')) {
                      const f = bias.value.match(/\d+/)?.[0] || "";
                      const terminals = f.split('').map(Number);
                      targetNumbers = Array.from({length: 37}, (_, i) => i).filter(n => terminals.includes(n % 10));
                    }
                  } else if (bias.type === 'Assinatura') {
                    const lastNum = history[0];
                    const lastIdx = WHEEL_ORDER.indexOf(lastNum);
                    const jump = parseInt(bias.value.replace('Salto ~', ''));
                    if (!isNaN(jump)) {
                      const targetIdx = (lastIdx + jump) % 37;
                      for (let offset = -2; offset <= 2; offset++) {
                        targetNumbers.push(WHEEL_ORDER[(targetIdx + offset + 37) % 37]);
                      }
                    }
                  } else if (bias.type === 'Espelho' || bias.type === 'Desequilíbrio Espelho' || bias.type === 'Espelho Direto') {
                    if (bias.type === 'Desequilíbrio Espelho') {
                      const t = parseInt(bias.value.match(/Terminal (\d+)/)?.[1] || "");
                      targetNumbers = Array.from({length: 37}, (_, i) => i).filter(n => n % 10 === t);
                    } else if (bias.type === 'Espelho Direto') {
                      const num = parseInt(bias.value.split(' ➔ ')[1]);
                      if (!isNaN(num)) targetNumbers = [num];
                    } else {
                      const pair = bias.value.split(' & ').map(Number);
                      targetNumbers = Array.from({length: 37}, (_, i) => i).filter(n => pair.includes(n % 10));
                    }
                  } else if (bias.type === 'Tendência de Cores') {
                    const color = bias.value.toLowerCase().includes('vermelho') ? 'red' : 'black';
                    targetNumbers = Array.from({length: 37}, (_, i) => i).filter(n => ROULETTE_NUMBERS[n].color === color);
                  }

                    const isMirrorBias = bias.type.includes('Espelho');

                    return (
                      <motion.div 
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className={`p-3 rounded-xl bg-white/5 border relative overflow-hidden group transition-all ${isMirrorBias ? 'border-pink-500/20 hover:border-pink-500/40' : 'border-white/10 hover:border-gold-primary/30'}`}
                      >
                        <div className="absolute top-0 right-0 p-2 opacity-5 group-hover:opacity-10 transition-opacity">
                          <Target className={`w-8 h-8 ${isMirrorBias ? 'text-pink-500' : 'text-gold-primary'}`} />
                        </div>

                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className={`text-[7px] font-black uppercase tracking-widest mb-0.5 block ${isMirrorBias ? 'text-pink-500' : 'text-gold-primary'}`}>{bias.type}</span>
                            <h3 className="text-sm font-black text-white tracking-tight leading-tight">{bias.value}</h3>
                          </div>
                          <div className="flex flex-col items-end">
                            <span className="text-[7px] font-black uppercase tracking-widest text-zinc-500 mb-0.5">Confiança</span>
                            <div className="flex items-center gap-1">
                              {bias.type === 'Vácuo Recorrente' && bias.confidence >= 95 && (
                                <span className="px-1.5 py-0.5 bg-gold-primary rounded text-[6px] font-black text-black uppercase tracking-widest animate-pulse">Match</span>
                              )}
                              {isMirrorBias && (
                                <span className="px-1.5 py-0.5 bg-pink-500 rounded text-[6px] font-black text-white uppercase tracking-widest animate-pulse">Mirror</span>
                              )}
                              <span className={`text-xs font-black ${isMirrorBias ? 'text-pink-500' : 'gold-text'}`}>{bias.confidence}%</span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div>
                            <div className="h-1 bg-white/5 rounded-full overflow-hidden mb-2">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${bias.confidence}%` }}
                                className={`h-full ${isMirrorBias ? 'bg-pink-500' : 'bg-gold-primary'}`}
                              />
                            </div>
                            
                            <div className="flex flex-wrap gap-1">
                              {targetNumbers.slice(0, 12).map(num => (
                                <div key={num} className={`w-6 h-6 rounded-md flex items-center justify-center text-[8px] font-black border border-white/10 shadow-lg ${COLORS[ROULETTE_NUMBERS[num].color]}`}>
                                  {num}
                                </div>
                              ))}
                              {targetNumbers.length > 12 && (
                                <div className="w-6 h-6 rounded-md flex items-center justify-center text-[6px] font-black border border-white/10 bg-white/5 text-zinc-500 uppercase">
                                  +{targetNumbers.length - 12}
                                </div>
                              )}
                            </div>
                            <div className="mt-1.5 flex items-center gap-1">
                              <span className={`text-[6px] font-black uppercase tracking-widest ${isMirrorBias ? 'text-pink-500' : 'text-gold-primary'}`}>info:</span>
                              <span className="text-[7px] font-bold text-zinc-400 uppercase tracking-tight">
                                {bias.type === 'Vácuo Recorrente' ? 'Atraso Terminal Detectado' : 
                                 bias.type === 'Padrão de Vácuo' ? 'Intervalo Histórico Repetido' :
                                 bias.type === 'Assinatura' ? 'Padrão de Salto do Crupiê' : 
                                 bias.type.includes('Espelho') ? 'Convergência de Par Espelho' : 
                                 bias.type === 'Setor' ? 'Tendência de Queda em Setor' :
                                 bias.type === 'Terminal' ? 'Frequência de Final de Número' :
                                 bias.type === 'Sequência' ? 'Padrão de Repetição Visual' :
                                 'Análise de Tendência Ativa'}
                              </span>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                            <span className="text-[7px] font-black uppercase tracking-widest text-zinc-600">Zona de Impacto</span>
                            <button 
                              onClick={() => setActiveTab('SETORIAIS')}
                              className={`px-2 py-1 border rounded-md text-[6px] font-black uppercase tracking-widest transition-all ${isMirrorBias ? 'bg-pink-500/10 border-pink-500/20 text-pink-500 hover:bg-pink-500 hover:text-white' : 'bg-gold-primary/10 border-gold-primary/20 text-gold-primary hover:bg-gold-primary hover:text-black'}`}
                            >
                              Ver no Cilindro
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                })
              ) : (
                <div className="col-span-full py-20 text-center border-2 border-dashed border-white/5 rounded-[3rem]">
                  <Radar className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
                  <p className="text-sm text-zinc-600 font-bold uppercase tracking-widest">Nenhum viés crítico detectado no momento</p>
                </div>
              )}
            </div>
          </section>

          {/* Alertas de Padrão e Sequência */}
          <section className="glass-card rounded-xl p-3 relative overflow-hidden">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Zap className="w-3.5 h-3.5 text-emerald-500" />
              </div>
              <div>
                <h2 className="text-base font-black text-white uppercase tracking-tighter italic">Alertas de <span className="text-emerald-500">Sequência</span></h2>
                <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">Padrões de repetição e concentração setorial</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {/* Custom Rules Matches */}
              {customRules.filter(r => r.enabled).map((rule, i) => {
                if (!history || history.length < rule.threshold) return null;
                const lastN = history.slice(0, rule.threshold).map(n => ROULETTE_NUMBERS[n]);
                let isMatch = false;
                let ruleLabel = "";

                switch (rule.type) {
                  case 'color': 
                    isMatch = lastN.every(n => n.color === rule.value);
                    ruleLabel = `${rule.threshold}x ${rule.value === 'red' ? 'Vermelho' : 'Preto'}`;
                    break;
                  case 'parity': 
                    isMatch = lastN.every(n => rule.value === 'even' ? n.isEven : (!n.isEven && n.num !== 0));
                    ruleLabel = `${rule.threshold}x ${rule.value === 'even' ? 'Par' : 'Ímpar'}`;
                    break;
                  case 'highlow': 
                    isMatch = lastN.every(n => rule.value === 'high' ? n.isHigh : (!n.isHigh && n.num !== 0));
                    ruleLabel = `${rule.threshold}x ${rule.value === 'high' ? 'Alto' : 'Baixo'}`;
                    break;
                  case 'dozen': 
                    isMatch = lastN.every(n => n.dozen === Number(rule.value));
                    ruleLabel = `${rule.threshold}x ${rule.value}ª Dúzia`;
                    break;
                  case 'column': 
                    isMatch = lastN.every(n => n.column === Number(rule.value));
                    ruleLabel = `${rule.threshold}x ${rule.value}ª Coluna`;
                    break;
                  case 'terminalGroup': 
                    isMatch = lastN.every(n => {
                      const terminal = n.num % 10;
                      if (rule.value === '1') return [1, 4, 7].includes(terminal);
                      if (rule.value === '2') return [2, 5, 8].includes(terminal);
                      if (rule.value === '3') return [3, 6, 9].includes(terminal);
                      return false;
                    });
                    ruleLabel = `${rule.threshold}x Grupo Terminal ${rule.value}`;
                    break;
                  case 'terminal': 
                    isMatch = lastN.every(n => (n.num % 10) === Number(rule.value));
                    ruleLabel = `${rule.threshold}x Terminal ${rule.value}`;
                    break;
                }

                if (!isMatch) return null;

                return (
                  <motion.div 
                    key={rule.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] font-black text-white uppercase tracking-tight">{ruleLabel}</span>
                    </div>
                    <span className="text-[8px] font-bold text-emerald-500 uppercase tracking-widest">Ativo</span>
                  </motion.div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </motion.div>
  );
});

export default RadarTab;
