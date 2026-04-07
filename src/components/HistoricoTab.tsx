import React from 'react';
import { motion } from 'motion/react';
import { History, Trash2 } from 'lucide-react';

interface HistoricoTabProps {
  history: number[];
  setHistory: (val: number[]) => void;
}

const HistoricoTab: React.FC<HistoricoTabProps> = React.memo(({ history, setHistory }) => {
  const displayHistory = React.useMemo(() => history.slice(0, 200), [history]);

  return (
    <motion.div 
      key="historico"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
      className="space-y-6"
    >
      <section className="glass-card rounded-[2rem] p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <History className="w-4 h-4 text-gold-primary" />
            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-400">Histórico Completo</h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="px-4 py-1.5 bg-white/5 rounded-full border border-white/10">
              <span className="text-[10px] font-black text-gold-primary uppercase tracking-widest">{history.length} Números</span>
            </div>
            <button 
              onClick={() => setHistory([])}
              className="p-2 hover:bg-red-500/10 rounded-xl text-zinc-600 hover:text-red-500 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3" style={{ contentVisibility: 'auto', containIntrinsicSize: '1px 500px' }}>
          {displayHistory.map((num, i) => {
            const color = num === 0 ? 'bg-green-600 text-white' : 
              [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36].includes(num) ? 'bg-red-600 text-white' : 'bg-zinc-900 text-white';
            
            return (
              <div
                key={`${num}-${history.length - i}`}
                className={`aspect-square rounded-xl flex items-center justify-center text-sm font-black border border-white/10 shadow-lg animate-in zoom-in duration-300 ${color}`}
              >
                {num}
              </div>
            );
          })}
          {history.length === 0 && (
            <div className="col-span-full py-20 text-center">
              <p className="text-sm text-zinc-600 font-bold uppercase tracking-widest">Nenhum número registrado</p>
            </div>
          )}
        </div>
        {history.length > 200 && (
          <div className="mt-6 text-center">
            <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Mostrando apenas os últimos 200 giros para performance</p>
          </div>
        )}
      </section>
    </motion.div>
  );
});

export default HistoricoTab;
