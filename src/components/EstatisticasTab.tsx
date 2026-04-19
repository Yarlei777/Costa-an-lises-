import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BarChart3, LineChart as LineChartIcon, History, RotateCcw, Trash2, Settings, Plus } from 'lucide-react';
import { Stats, CustomAlertRule } from '../types';
import { COLORS, ROULETTE_NUMBERS } from '../constants';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar, Cell, LineChart, Line, ReferenceLine } from 'recharts';

interface EstatisticasTabProps {
  stats: Stats | null;
  history: number[];
  removeLast: () => void;
  clearHistory: () => void;
  isAddingRule: boolean;
  setIsAddingRule: (val: boolean) => void;
  newRule: Partial<CustomAlertRule>;
  setNewRule: (val: Partial<CustomAlertRule>) => void;
  addCustomRule: () => void;
  customRules: CustomAlertRule[];
  removeCustomRule: (id: string) => void;
  engineWeights: { neural: number; markov: number; sector: number; bias: number; shortTerm: number };
}

const EstatisticasTab: React.FC<EstatisticasTabProps> = React.memo(({
  stats,
  history,
  removeLast,
  clearHistory,
  isAddingRule,
  setIsAddingRule,
  newRule,
  setNewRule,
  addCustomRule,
  customRules,
  removeCustomRule,
  engineWeights
}) => {
  const displayHistory = React.useMemo(() => history.slice(0, 200), [history]);

  return (
    <motion.div 
      key="estatisticas"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
      className="space-y-10"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Engine Weights Analysis */}
        <section className="glass-card rounded-[2rem] p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Settings className="w-4 h-4 text-gold-primary" />
              <h2 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-400">Pesos do Motor (Auto-Balance)</h2>
            </div>
            {history.length >= 10 && (
              <span className="px-2 py-1 bg-gold-primary/10 border border-gold-primary/20 rounded text-[8px] font-black text-gold-primary uppercase tracking-widest animate-pulse">Ativo</span>
            )}
          </div>
          <div className="space-y-6">
            {[
              { label: 'Rede Neural', weight: engineWeights.neural, color: 'bg-blue-500' },
              { label: 'Markov Chain', weight: engineWeights.markov, color: 'bg-purple-500' },
              { label: 'Setoriais', weight: engineWeights.sector, color: 'bg-emerald-500' },
              { label: 'Terminais/Viés', weight: engineWeights.bias, color: 'bg-gold-primary' },
              { label: 'Curto Prazo (10)', weight: engineWeights.shortTerm, color: 'bg-red-500' }
            ].map((engine, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between items-end">
                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{engine.label}</span>
                  <span className="text-sm font-black gold-text">x{engine.weight.toFixed(2)}</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(engine.weight / 2) * 100}%` }}
                    className={`h-full ${engine.color} shadow-[0_0_10px_rgba(212,175,55,0.2)]`}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Number Frequency */}
        <section className="glass-card rounded-[2rem] p-8">
          <div className="flex items-center gap-3 mb-8">
            <BarChart3 className="w-4 h-4 text-gold-primary" />
            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-400">Frequência Global (Últimos 50)</h2>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.barChartData || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis 
                  dataKey="number" 
                  fontSize={10} 
                  tick={{ fill: '#71717a' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis hide />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(212, 175, 55, 0.3)', borderRadius: '12px' }}
                />
                <Bar dataKey="frequency" radius={[4, 4, 0, 0]}>
                  {(stats?.barChartData || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Oscillation Analysis */}
        <section className="glass-card rounded-[2rem] p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <LineChartIcon className="w-4 h-4 text-gold-primary" />
              <h2 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-400">Oscilação de Resultados (20)</h2>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats?.trendData || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis hide dataKey="index" />
                <YAxis domain={[0, 36]} hide />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(212, 175, 55, 0.3)', borderRadius: '12px' }}
                  itemStyle={{ color: '#D4AF37', fontWeight: 'bold' }}
                />
                <ReferenceLine y={18} stroke="rgba(212, 175, 55, 0.2)" strokeDasharray="3 3" />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#D4AF37" 
                  strokeWidth={3} 
                  dot={{ fill: '#D4AF37', r: 4, strokeWidth: 0 }}
                  activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {/* Full History */}
      <section className="glass-card rounded-[2rem] p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <History className="w-4 h-4 text-gold-primary" />
            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-400">Histórico Expandido (200)</h2>
          </div>
          <div className="flex gap-2">
            <button onClick={removeLast} className="p-2 hover:bg-white/5 rounded-lg transition-colors text-zinc-500">
              <RotateCcw className="w-4 h-4" />
            </button>
            <button onClick={clearHistory} className="p-2 hover:bg-red-500/10 rounded-lg transition-colors text-zinc-500 hover:text-red-500">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-6 sm:grid-cols-10 md:grid-cols-15 lg:grid-cols-20 gap-2 max-h-96 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gold-primary/20 scrollbar-track-transparent">
          {displayHistory.map((num, i) => (
            <div
              key={`${num}-${history.length - i}`}
              className={`aspect-square rounded-lg flex items-center justify-center text-xs font-black shadow-lg ${COLORS[ROULETTE_NUMBERS[num].color]}`}
            >
              {num}
            </div>
          ))}
        </div>
      </section>

      {/* Custom Alert Configuration */}
      <section className="glass-card rounded-[2rem] p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Settings className="w-4 h-4 text-gold-primary" />
            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-400">Configuração de Alertas</h2>
          </div>
          <button 
            onClick={() => setIsAddingRule(!isAddingRule)}
            className="p-2 bg-gold-primary rounded-lg text-black hover:scale-105 transition-all"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          <AnimatePresence>
            {isAddingRule && (
              <motion.div 
                key="add-rule-form"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden bg-white/5 rounded-2xl border border-gold-primary/20 p-4 space-y-4"
              >
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[8px] uppercase font-bold text-zinc-500 tracking-widest">Tipo</label>
                    <select 
                      value={newRule.type}
                      onChange={(e) => {
                        const type = e.target.value as any;
                        let defaultValue = 'red';
                        if (type === 'parity') defaultValue = 'even';
                        if (type === 'highlow') defaultValue = 'low';
                        if (type === 'dozen' || type === 'column' || type === 'terminalGroup') defaultValue = '1';
                        if (type === 'terminal') defaultValue = '0';
                        setNewRule({...newRule, type, value: defaultValue});
                      }}
                      className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-gold-primary outline-none"
                    >
                      <option value="color">Cor (Vermelho/Preto)</option>
                      <option value="parity">Paridade (Par/Ímpar)</option>
                      <option value="highlow">Alto/Baixo</option>
                      <option value="dozen">Dúzia</option>
                      <option value="column">Coluna</option>
                      <option value="terminal">Terminal</option>
                      <option value="terminalGroup">Grupo Terminal</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] uppercase font-bold text-zinc-500 tracking-widest">Alvo</label>
                    <select 
                      value={newRule.value}
                      onChange={(e) => setNewRule({...newRule, value: e.target.value})}
                      className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-gold-primary outline-none"
                    >
                      {newRule.type === 'color' && (
                        <>
                          <option value="red">Vermelho</option>
                          <option value="black">Preto</option>
                        </>
                      )}
                      {newRule.type === 'parity' && (
                        <>
                          <option value="even">Par</option>
                          <option value="odd">Ímpar</option>
                        </>
                      )}
                      {newRule.type === 'highlow' && (
                        <>
                          <option value="low">Baixo (1-18)</option>
                          <option value="high">Alto (19-36)</option>
                        </>
                      )}
                      {newRule.type === 'dozen' && (
                        <>
                          <option value="1">1ª Dúzia</option>
                          <option value="2">2ª Dúzia</option>
                          <option value="3">3ª Dúzia</option>
                        </>
                      )}
                      {newRule.type === 'column' && (
                        <>
                          <option value="1">1ª Coluna</option>
                          <option value="2">2ª Coluna</option>
                          <option value="3">3ª Coluna</option>
                        </>
                      )}
                      {newRule.type === 'terminalGroup' && (
                        <>
                          <option value="1">Grupo 1 (1,4,7)</option>
                          <option value="2">Grupo 2 (2,5,8)</option>
                          <option value="3">Grupo 3 (3,6,9)</option>
                        </>
                      )}
                      {newRule.type === 'terminal' && (
                        Array.from({length: 10}).map((_, i) => (
                          <option key={i} value={i.toString()}>Terminal {i}</option>
                        ))
                      )}
                    </select>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] uppercase font-bold text-zinc-500 tracking-widest">Limite (Threshold)</label>
                  <input 
                    type="number"
                    value={newRule.threshold}
                    onChange={(e) => setNewRule({...newRule, threshold: parseInt(e.target.value)})}
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-gold-primary outline-none"
                  />
                </div>
                <button 
                  onClick={addCustomRule}
                  className="w-full py-3 bg-gold-primary rounded-xl text-black font-black text-[10px] uppercase tracking-widest hover:brightness-110 transition-all"
                >
                  Salvar Regra
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {customRules.map(rule => (
              <div key={rule.id} className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between">
                <div>
                  <p className="text-[8px] uppercase tracking-widest text-zinc-500 font-bold mb-1">{rule.type}</p>
                  <p className="text-xs font-black text-white">{(rule.value || '').toUpperCase()} &gt; {rule.threshold}</p>
                </div>
                <button 
                  onClick={() => removeCustomRule(rule.id)}
                  className="p-2 hover:bg-red-500/10 rounded-lg text-zinc-600 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>
    </motion.div>
  );
});

export default EstatisticasTab;
