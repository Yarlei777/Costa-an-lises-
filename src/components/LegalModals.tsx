import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Shield, Lock, FileText } from 'lucide-react';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'terms' | 'privacy';
}

const LegalModal: React.FC<LegalModalProps> = ({ isOpen, onClose, type }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          key="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-[10000]"
          onClick={onClose}
        />
      )}
      {isOpen && (
        <motion.div 
          key="modal-content"
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[600px] md:max-h-[80vh] glass-card rounded-[2rem] p-8 z-[10001] overflow-y-auto"
        >
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                {type === 'terms' ? <FileText className="w-5 h-5 text-gold-primary" /> : <Lock className="w-5 h-5 text-gold-primary" />}
                <h2 className="text-sm font-black uppercase tracking-[0.3em] text-white">
                  {type === 'terms' ? 'Termos de Uso' : 'Política de Privacidade'}
                </h2>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
                <X className="w-5 h-5 text-zinc-500" />
              </button>
            </div>

            <div className="space-y-6 text-zinc-400 text-xs font-medium leading-relaxed">
              {type === 'terms' ? (
                <>
                  <p>Bem-vindo ao Costa Análises. Ao utilizar nosso terminal, você concorda com os seguintes termos:</p>
                  <div className="space-y-4">
                    <h3 className="text-white font-black uppercase tracking-widest text-[10px]">1. Uso do Software</h3>
                    <p>O Costa Análises é uma ferramenta de análise estatística. Não garantimos lucros e não nos responsabilizamos por perdas financeiras.</p>
                    
                    <h3 className="text-white font-black uppercase tracking-widest text-[10px]">2. Responsabilidade</h3>
                    <p>O usuário é o único responsável por suas decisões de apostas. O jogo deve ser encarado como entretenimento.</p>
                    
                    <h3 className="text-white font-black uppercase tracking-widest text-[10px]">3. Propriedade Intelectual</h3>
                    <p>Todo o código e algoritmos são de propriedade exclusiva do Costa Análises ou licenciados sob MIT conforme o repositório.</p>
                  </div>
                </>
              ) : (
                <>
                  <p>Sua privacidade é nossa prioridade. Veja como lidamos com seus dados:</p>
                  <div className="space-y-4">
                    <h3 className="text-white font-black uppercase tracking-widest text-[10px]">1. Coleta de Dados</h3>
                    <p>Coletamos apenas informações básicas de autenticação via Google para salvar seu histórico e configurações personalizadas.</p>
                    
                    <h3 className="text-white font-black uppercase tracking-widest text-[10px]">2. Segurança</h3>
                    <p>Utilizamos o Firebase Security Protocol para garantir que seus dados estejam protegidos e inacessíveis a terceiros.</p>
                    
                    <h3 className="text-white font-black uppercase tracking-widest text-[10px]">3. Cookies</h3>
                    <p>Utilizamos cookies apenas para manter sua sessão ativa e melhorar a performance do terminal.</p>
                  </div>
                </>
              )}
            </div>

            <div className="mt-12 pt-8 border-t border-white/5 flex items-center gap-3 opacity-30">
              <Shield className="w-4 h-4" />
              <span className="text-[8px] uppercase tracking-[0.4em] font-black">Costa Security Protocol Active</span>
            </div>
          </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LegalModal;
