import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Lock, Zap, ChevronRight, AlertCircle } from 'lucide-react';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

interface LoginScreenProps {
  onLogin: () => void;
}

const RouletteIcon = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className}>
    <circle cx="50" cy="50" r="48" fill="#0c0a09" stroke="#D4AF37" strokeWidth="2" />
    {[...Array(37)].map((_, i) => {
      const angle = (i * 360) / 37;
      const nextAngle = ((i + 1) * 360) / 37;
      const x1 = 50 + 42 * Math.cos((angle * Math.PI) / 180);
      const y1 = 50 + 42 * Math.sin((angle * Math.PI) / 180);
      const x2 = 50 + 42 * Math.cos((nextAngle * Math.PI) / 180);
      const y2 = 50 + 42 * Math.sin((nextAngle * Math.PI) / 180);
      
      let color = "#000000";
      if (i === 0) color = "#16a34a"; // Green 0
      else if ([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36].includes(i)) color = "#ef4444"; // Red
      
      return (
        <path
          key={i}
          d={`M 50 50 L ${x1} ${y1} A 42 42 0 0 1 ${x2} ${y2} Z`}
          fill={color}
          stroke="#D4AF37"
          strokeWidth="0.2"
        />
      );
    })}
    <circle cx="50" cy="50" r="12" fill="#D4AF37" />
    <circle cx="50" cy="50" r="4" fill="#fff" />
  </svg>
);

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Check if already logged in via localStorage
  useEffect(() => {
    const isAuth = localStorage.getItem('costa_auth_v2');
    if (isAuth === 'true') {
      onLogin();
    }
  }, [onLogin]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Artificial delay for "security check" feel
    setTimeout(() => {
      if (password === 'Costaroullete') {
        localStorage.setItem('costa_auth_v2', 'true');
        onLogin();
      } else {
        setError('CHAVE DE ACESSO INVÁLIDA');
        setIsLoading(false);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen text-white flex items-center justify-center p-6 font-sans selection:bg-gold-primary selection:text-black relative overflow-hidden bg-black">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.ais.studio/user-uploads/1712795379000-roulette-bg.jpg" 
          alt="Realistic Roulette" 
          className="w-full h-full object-cover opacity-60"
          referrerPolicy="no-referrer"
          onError={(e) => {
            // Fallback in case the specific URL fails
            (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1518893063132-36e46dbe2428?q=80&w=2070&auto=format&fit=crop";
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/30 to-black/80" />
      </div>

      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-[1]">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-gold-primary/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-gold-primary/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo Area */}
        <div className="flex flex-col items-center mb-10">
          <motion.div 
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="w-20 h-20 gold-gradient rounded-3xl flex items-center justify-center shadow-[0_0_50px_rgba(212,175,55,0.3)] border border-white/20 mb-6"
          >
            <RouletteIcon className="w-12 h-12" />
          </motion.div>
          <div className="px-4">
            <h1 className="text-4xl font-black tracking-tight uppercase italic gold-text text-center leading-none">
              Exu <span className="text-white">do Ouro</span>
            </h1>
          </div>
          <p className="text-[10px] uppercase tracking-[0.6em] text-zinc-500 font-black mt-2 opacity-30">Protocolo de Elite</p>
        </div>

        {/* Login Card */}
        <div className="glass-card rounded-[2.5rem] p-8 border border-white/5 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold-primary/50 to-transparent" />
          
          <div className="flex items-center gap-3 mb-8">
            <Lock className="w-4 h-4 text-gold-primary" />
            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-400">Autenticação de Terminal</h2>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase tracking-widest text-zinc-600 ml-2">Identificação</label>
              <div className="relative group">
                <input 
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Seu usuário..."
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white focus:border-gold-primary outline-none transition-all placeholder:text-zinc-700"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase tracking-widest text-zinc-600 ml-2">Chave de Acesso</label>
              <div className="relative group">
                <input 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white focus:border-gold-primary outline-none transition-all placeholder:text-zinc-700"
                  required
                />
              </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl"
              >
                <AlertCircle className="w-4 h-4 text-red-500" />
                <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">{error}</span>
              </motion.div>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={isLoading}
              className="w-full py-5 gold-gradient rounded-2xl text-black text-xs font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 shadow-[0_10px_30px_rgba(212,175,55,0.2)] hover:shadow-[0_15px_40px_rgba(212,175,55,0.3)] transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
              ) : (
                <>
                  <span>Acessar Terminal</span>
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </motion.button>
          </form>
        </div>

        {/* Footer Info */}
        <div className="mt-8 flex flex-col items-center gap-4 opacity-30">
          <div className="flex items-center gap-2">
            <Zap className="w-3 h-3 text-gold-primary" />
            <span className="text-[8px] uppercase tracking-[0.4em] font-black">Neural Engine v4.0</span>
          </div>
          <p className="text-[7px] text-zinc-600 uppercase tracking-widest font-bold text-center leading-relaxed">
            Acesso restrito a operadores autorizados.<br />
            Monitoramento de IP ativo em tempo real.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginScreen;
