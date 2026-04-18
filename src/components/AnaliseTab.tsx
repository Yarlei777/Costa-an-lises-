import React from 'react';
import { motion } from 'motion/react';
import { Zap, TrendingUp, BarChart3, RotateCcw, Activity, ShieldCheck } from 'lucide-react';
import { Stats } from '../types';
import { ROULETTE_NUMBERS } from '../constants';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar, Cell } from 'recharts';

interface AnaliseTabProps {
  stats: Stats | null;
}

const TABLE_ROWS = [
  [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36],
  [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35],
  [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34]
];

const AnaliseTab: React.FC<AnaliseTabProps> = React.memo(({ stats }) => {
  const maxFreq = React.useMemo(() => Math.max(...(stats?.tableHeatmap?.map(h => h.frequency) || [1])), [stats?.tableHeatmap]);

  return (
    <motion.div 
      key="analise"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
      className="grid grid-cols-1 lg:grid-cols-12 gap-10"
    >
      {/* Left: Terminal Analysis */}
      <div className="lg:col-span-7 space-y-10">
        <section className="glass-card rounded-[2rem] p-8">
          <div className="flex items-center gap-3 mb-8">
            <Zap className="w-4 h-4 text-gold-primary" />
            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-400">Análise de Terminais</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Families */}
            <div>
              <p className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold mb-4">Famílias (Atraso)</p>
              <div className="grid grid-cols-3 gap-3">
                {stats?.terminalAnalysis?.families?.map((f, i) => (
                  <div key={i} className={`p-4 rounded-2xl border transition-all ${f.lastSeen > 7 || f.lastSeen === -1 ? 'bg-gold-primary/10 border-gold-primary/30 shadow-lg shadow-gold-primary/5' : 'bg-black/5 border-black/5'}`}>
                    <div className="text-[10px] font-black text-zinc-500 mb-2">{f.key.toUpperCase()}</div>
                    <div className={`text-lg font-black ${f.lastSeen > 7 || f.lastSeen === -1 ? 'text-gold-primary' : 'text-white'}`}>
                      {f.lastSeen === -1 ? '∞' : f.lastSeen}
                    </div>
                    <div className="text-[8px] uppercase tracking-tighter text-zinc-600 font-bold mt-1">Rds</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mirrors */}
            <div>
              <p className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold mb-4">Espelhos (Equilíbrio)</p>
              <div className="space-y-3">
                {stats?.terminalAnalysis?.mirrors?.map((m, i) => {
                  const diff = Math.abs(m.f0 - m.f1);
                  return (
                    <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-2xl border border-white/5">
                      <div className="flex items-center gap-3">
                        <div className="flex -space-x-2">
                           <div className="w-6 h-6 rounded-lg bg-zinc-800 border border-white/10 flex items-center justify-center text-[10px] font-black text-zinc-400">{m.pair[0]}</div>
                           <div className="w-6 h-6 rounded-lg bg-zinc-800 border border-white/10 flex items-center justify-center text-[10px] font-black text-zinc-400">{m.pair[1]}</div>
                        </div>
                        <span className="text-[10px] font-bold text-zinc-500">Paridade</span>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-[10px] font-black ${diff > 3 ? 'bg-gold-primary/20 text-gold-primary border border-gold-primary/30' : 'bg-white/5 text-zinc-500'}`}>
                        Δ {diff}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section className="glass-card rounded-[2rem] p-8">
          <div className="flex items-center gap-3 mb-8">
            <TrendingUp className="w-4 h-4 text-gold-primary" />
            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-400">Distribuição de Grupos (0.1.4.7, 2.5.8, 3.6.9)</h2>
          </div>
          
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.terminalGroupData || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#71717a', fontSize: 10, fontWeight: 'bold' }} 
                />
                <YAxis hide />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ 
                    backgroundColor: '#0a0a0a', 
                    border: '1px solid rgba(212, 175, 55, 0.2)',
                    borderRadius: '12px',
                    fontSize: '10px',
                    fontWeight: 'bold'
                  }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {stats?.terminalGroupData?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="glass-card rounded-[2rem] p-8">
          <div className="flex items-center gap-3 mb-8">
            <Activity className="w-4 h-4 text-gold-primary" />
            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-400">Mapa de Calor da Mesa</h2>
          </div>
          
          <div className="overflow-x-auto pb-4">
            <div className="min-w-[600px] space-y-1">
              {TABLE_ROWS.map((row, rowIndex) => (
                <div key={rowIndex} className="flex gap-1">
                  {row.map((num) => {
                    const freq = stats?.tableHeatmap?.find(h => h.num === num)?.frequency || 0;
                    const intensity = maxFreq > 0 ? (freq / maxFreq) : 0;
                    const isTarget = stats?.prediction?.targets?.includes(num);
                    
                    return (
                      <div 
                        key={num}
                        className={`flex-1 aspect-square rounded-lg flex flex-col items-center justify-center relative transition-all border ${
                          ROULETTE_NUMBERS[num].color === 'red' ? 'bg-red-500/10 border-red-500/20' : ROULETTE_NUMBERS[num].color === 'black' ? 'bg-zinc-900 border-white/5' : 'bg-emerald-500/10 border-emerald-500/20'
                        } ${isTarget ? 'ring-2 ring-gold-primary ring-offset-2 ring-offset-black z-10' : ''}`}
                      >
                        <div 
                          className="absolute inset-0 rounded-lg opacity-40"
                          style={{ backgroundColor: intensity > 0 ? `rgba(212, 175, 55, ${intensity * 0.8})` : 'transparent' }}
                        />
                        <span className={`text-[10px] font-black z-10 ${isTarget ? 'text-gold-primary' : 'text-zinc-400'}`}>{num}</span>
                        {freq > 0 && (
                          <span className="text-[8px] font-bold text-zinc-600 z-10">{freq}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="glass-card rounded-[2rem] p-8">
          <div className="flex items-center gap-3 mb-8">
            <BarChart3 className="w-4 h-4 text-gold-primary" />
            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-400">Matriz de Terminais</h2>
          </div>
          
          <div className="grid grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 10 }).map((_, i) => {
              const freq = (stats?.terminalFrequency?.[i] as number) || 0;
              const total = stats?.total || 1;
              const p = Math.round((freq / total) * 100);
              const isTarget = stats?.prediction?.terminal === i;
              
              return (
                <motion.div 
                  key={i} 
                  animate={isTarget ? { 
                    scale: [1, 1.05, 1],
                    boxShadow: [
                      '0 0 0px rgba(212, 175, 55, 0)',
                      '0 0 20px rgba(212, 175, 55, 0.4)',
                      '0 0 0px rgba(212, 175, 55, 0)'
                    ]
                  } : {}}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className={`flex flex-col items-center p-5 rounded-3xl transition-all border ${isTarget ? 'bg-gold-primary border-gold-primary shadow-xl shadow-gold-primary/20' : 'bg-white/5 border-white/5'}`}
                >
                  <span className={`text-xl font-black ${isTarget ? 'text-black' : 'text-white'}`}>{i}</span>
                  <span className={`text-[10px] font-bold mt-2 ${isTarget ? 'text-black/60' : 'text-zinc-500'}`}>{p}%</span>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* Dealer Signature Analysis */}
        <section className="glass-card rounded-[2rem] p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <RotateCcw className="w-4 h-4 text-gold-primary" />
              <h2 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-400">Assinatura do Dealer (Salto Médio)</h2>
            </div>
            {stats?.dealerSignature && stats.dealerSignature.variance < 15 && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[8px] uppercase tracking-widest text-emerald-500 font-bold">Padrão Detectado</span>
              </div>
            )}
          </div>

          {stats?.dealerSignature ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                  <p className="text-[8px] uppercase tracking-widest text-zinc-500 font-bold mb-1">Salto Médio</p>
                  <p className="text-2xl font-black gold-text">{stats?.dealerSignature?.avgDist?.toFixed(1)} <span className="text-[10px] text-zinc-600">pos.</span></p>
                </div>
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                  <p className="text-[8px] uppercase tracking-widest text-zinc-500 font-bold mb-1">Variância</p>
                  <p className={`text-2xl font-black ${(stats?.dealerSignature?.variance || 0) < 15 ? 'text-emerald-500' : 'text-white'}`}>
                    {stats?.dealerSignature?.variance?.toFixed(1)}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-[8px] uppercase tracking-widest text-zinc-500 font-bold">Últimos 4 Saltos (Wheel Dist)</p>
                <div className="flex gap-2">
                  {stats?.dealerSignature?.distances?.map((d, i) => (
                    <div key={i} className="flex-1 h-10 bg-white/5 rounded-xl border border-white/5 flex items-center justify-center text-xs font-black text-zinc-400">
                      {d}
                    </div>
                  ))}
                </div>
              </div>

              {(stats?.dealerSignature?.variance || 0) < 15 && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                  <p className="text-[10px] font-bold text-emerald-400 leading-relaxed">
                    O dealer está mantendo um ritmo constante de lançamento. A predição baseada em assinatura está com alta prioridade.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="py-10 text-center border border-dashed border-white/10 rounded-3xl">
              <p className="text-xs text-zinc-600 font-bold uppercase tracking-widest">Aguardando mais giros...</p>
            </div>
          )}
        </section>
      </div>

      {/* Right: Full Bias Monitor */}
      <div className="lg:col-span-5 space-y-10">
        {/* System Status Layer */}
        <section className="glass-card rounded-[2rem] p-8 border-gold-primary/10">
          <div className="flex items-center gap-3 mb-6">
            <Activity className="w-4 h-4 text-gold-primary" />
            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-400">Status dos Motores</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {stats?.systemStatus && Object.entries(stats.systemStatus).map(([engine, status]) => (
              <div key={engine} className="p-3 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between">
                <span className="text-[8px] font-black uppercase tracking-widest text-zinc-600">{engine}</span>
                <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${status === 'ONLINE' || status === 'ACTIVE' ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-gold-primary animate-pulse'}`} />
                  <span className={`text-[8px] font-black ${status === 'ONLINE' || status === 'ACTIVE' ? 'text-emerald-500' : 'text-gold-primary'}`}>{status}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Neural Engine Insights */}
        <section className="glass-card rounded-[2rem] p-8 border-gold-primary/10">
          <div className="flex items-center gap-3 mb-6">
            <Zap className="w-4 h-4 text-gold-primary" />
            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-400">Insights Neurais (Deep Learning)</h2>
          </div>
          <div className="space-y-3">
            {stats?.prediction?.neuralTop?.map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black border ${ROULETTE_NUMBERS[item.num].color === 'red' ? 'bg-red-500/20 border-red-500/30 text-red-500' : ROULETTE_NUMBERS[item.num].color === 'black' ? 'bg-zinc-800 border-white/10 text-white' : 'bg-emerald-500/20 border-emerald-500/30 text-emerald-500'}`}>
                    {item.num}
                  </div>
                  <span className="text-[10px] font-bold text-zinc-400">Probabilidade Neural</span>
                </div>
                <span className="text-xs font-black gold-text">{(item.prob * 100).toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </section>

        {/* Active Analysis Layers Section */}
        <section className="glass-card rounded-[2rem] p-8 border-gold-primary/20">
          <div className="flex items-center gap-3 mb-8">
            <ShieldCheck className="w-4 h-4 text-gold-primary" />
            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-400">Camadas de Análise Ativas</h2>
          </div>
          
          <div className="space-y-4">
            {[
              { id: 1, name: "Motor de Balística Real", desc: "Cálculo de trajetória física e ponto de impacto", status: "ACTIVE" },
              { id: 2, name: "Camada LSTM Primária (256)", desc: "Reconhecimento de padrões sequenciais profundos", status: "ONLINE" },
              { id: 3, name: "Fusão de Atributos (128)", desc: "Associação entre setor, terminais e dezenas", status: "ONLINE" },
              { id: 4, name: "Abstração Comportamental (64)", desc: "Filtragem de ruído e padrões de erro", status: "ONLINE" },
              { id: 5, name: "Output Probabilístico Neural", desc: "Distribuição Softmax sobre 37 alvos", status: "ACTIVE" },
              { id: 6, name: "Análise de Espelhos Digitais", desc: "Correlação determinística entre terminais espelhados", status: "ONLINE" },
              { id: 7, name: "Convergência de Grupos Terminais", desc: "Análise de fluxo entre os grupos 0.1.4.7, 2.5.8, 3.6.9", status: "ONLINE" },
              { id: 8, name: "Monitor de Vácuo Recorrente", desc: "Identificação de zonas sem repetição em ciclos curtos", status: "ACTIVE" },
              { id: 9, name: "Assinatura do Dealer (Salto)", desc: "Detecção de repetição mecânica do lançamento", status: "ONLINE" },
              { id: 10, name: "Super Convergência (Layer 30)", desc: stats?.prediction?.entrySignal === 'PLAY' ? "ENTRADA CONFIRMADA PELO SISTEMA" : "Nível de reconciliação de múltiplos motores", status: stats?.prediction?.entrySignal === 'PLAY' ? "JOGAR AGORA" : stats?.prediction?.entrySignal === 'WAIT_CONFIRM' ? "CONFIRMANDO" : "ONLINE" }
            ].map((layer) => (
              <div key={layer.id} className={`flex items-center gap-4 p-4 rounded-2xl border transition-all group ${layer.status === 'JOGAR AGORA' ? 'bg-emerald-500/10 border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.2)]' : 'bg-white/5 border-white/5 hover:border-gold-primary/30'}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black transition-all ${layer.status === 'JOGAR AGORA' ? 'bg-emerald-500 text-black' : 'bg-gold-primary/10 border border-gold-primary/20 text-gold-primary group-hover:bg-gold-primary group-hover:text-black'}`}>
                  {layer.id}
                </div>
                <div className="flex-1">
                  <h3 className={`text-[10px] font-black uppercase tracking-widest ${layer.status === 'JOGAR AGORA' ? 'text-emerald-500' : 'text-white'}`}>{layer.name}</h3>
                  <p className="text-[8px] text-zinc-500 font-bold uppercase tracking-tighter mt-0.5">{layer.desc}</p>
                </div>
                <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full border ${layer.status === 'JOGAR AGORA' ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'}`}>
                  <div className={`w-1 h-1 rounded-full ${layer.status === 'JOGAR AGORA' ? 'bg-white animate-ping' : 'bg-emerald-500 animate-pulse'}`} />
                  <span className="text-[7px] font-black uppercase">{layer.status}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="glass-card rounded-[2rem] p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Activity className="w-4 h-4 text-gold-primary" />
              <h2 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-400">Monitor de Viés Completo</h2>
            </div>
          </div>

          <div className="space-y-4">
            {/* Sequence Monitor */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              {stats?.sequences && Object.entries(stats?.sequences || {}).map(([key, seq]) => (
                <div key={key} className="p-4 bg-white/5 rounded-2xl border border-white/5">
                  <p className="text-[8px] uppercase tracking-widest text-zinc-500 font-bold mb-2">{key === 'color' ? 'Cores' : key === 'parity' ? 'Paridade' : 'Alto/Baixo'}</p>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-xl font-black text-white">{seq.current}</p>
                      <p className="text-[8px] uppercase text-zinc-600 font-bold">Atual</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-gold-primary">{seq.max}</p>
                      <p className="text-[8px] uppercase text-zinc-600 font-bold">Max</p>
                    </div>
                  </div>
                  <div className="mt-2 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${seq.type === 'red' ? 'bg-red-500' : seq.type === 'black' ? 'bg-zinc-400' : 'bg-gold-primary'}`}
                      style={{ width: `${(seq.current / seq.max) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {stats?.biases && stats?.biases?.length > 0 ? (
              stats?.biases?.map((bias, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-5 bg-black/5 rounded-2xl border border-gold-primary/20 flex items-center justify-between"
                >
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-1">{bias.type}</p>
                    <p className="text-lg font-black text-white">{bias.value}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-widest text-gold-primary font-bold mb-1">Confiança</p>
                    <p className="text-lg font-black gold-text">{bias.confidence}%</p>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="py-20 text-center border border-dashed border-white/10 rounded-3xl">
                <p className="text-xs text-zinc-600 font-bold uppercase tracking-widest">Aguardando Análise...</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </motion.div>
  );
});

export default AnaliseTab;
