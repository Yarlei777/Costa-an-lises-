import React, { useEffect, useState, useRef } from 'react';
import { RotateCcw, Trash2 } from 'lucide-react';
import { motion, useAnimation } from 'motion/react';
import { MIRROR_NUMBERS_LIST } from '../constants';

interface RouletteWheelVisualProps {
  highlightedNumbers?: number[];
  contextNumbers?: number[];
  vacuumNumbers?: number[];
  mainTarget?: number | null;
  targetZone?: string;
  isOmega?: boolean;
  onClearHistory?: () => void;
  onRemoveLast?: () => void;
  lastNumber?: number | null;
}

// Ordem oficial do cilindro europeu (Vizinhança real)
const WHEEL_ORDER = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];

const getColor = (num: number) => {
  if (num === 0) return '#065f46'; // Verde Escuro Profundo
  const reds = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
  return reds.includes(num) ? '#991b1b' : '#0a0a0a'; // Vermelho Vinho ou Preto Absoluto
};

const WheelSegment: React.FC<{
  num: number;
  index: number;
  isHighlighted: boolean;
  isContext: boolean;
  isVacuum: boolean;
  isMirror: boolean;
  isMainTarget: boolean;
  isOmega: boolean;
  color: string;
}> = React.memo(({ num, index, isHighlighted, isContext, isVacuum, isMirror, isMainTarget, isOmega, color }) => {
  const angle = (index * 360) / 37;
  
  return (
    <g transform={`rotate(${angle} 50 50)`} style={{ willChange: 'transform, opacity' }}>
      {/* Divisórias Metálicas (Pins) - Mais realistas */}
      <rect x="49.85" y="2" width="0.3" height="14" fill="url(#pinGradient)" />

      {/* Fatia do Número */}
      <use
        href="#wheel-wedge"
        fill={color}
        className={`transition-all duration-700 ${isHighlighted || isVacuum || isContext ? 'brightness-125' : ''}`}
      />
      
      {/* Sombra Interna da Casa */}
      <path d="M 50 2 A 48 48 0 0 1 58.1 2.7 L 57.5 3.5 A 46.5 46.5 0 0 0 50 2.8 Z" fill="rgba(0,0,0,0.4)" />

      {/* Efeito de Destaque Premium */}
      {isHighlighted && (
        <g>
          <use
            href="#wheel-wedge"
            fill={isMainTarget ? "url(#mainTargetGlow)" : isMirror ? "url(#mirrorGlow)" : "url(#targetGlow)"}
          />
          <circle 
            cx="54" cy="8.2" r={isMainTarget ? "4.2" : "3.5"} 
            fill={isMainTarget ? "#ef4444" : "none"} 
            stroke={isMainTarget ? "#ffffff" : isMirror ? "#f472b6" : "#4ade80"} 
            strokeWidth={isMainTarget ? "0.8" : "0.6"} 
            className={isMainTarget ? "animate-pulse" : ""}
            style={{ filter: `drop-shadow(0 0 ${isMainTarget ? "5px" : "2px"} ${isMainTarget ? "#ef4444" : isMirror ? "#f472b6" : "#4ade80"})` }}
          />
          {isMainTarget && (
            <circle 
              cx="54" cy="8.2" r="5.5" 
              fill="none" 
              stroke="#ef4444" 
              strokeWidth="0.3" 
              className="animate-ping"
              style={{ opacity: 0.6 }}
            />
          )}
        </g>
      )}

      {/* Efeito de Contexto (Gold Glow) */}
      {isContext && !isHighlighted && (
        <g>
          <use
            href="#wheel-wedge"
            fill="url(#contextGlow)"
          />
          <circle 
            cx="54" cy="8.2" r="3.2" 
            fill="none" stroke="#fbbf24" strokeWidth="0.4" 
            style={{ filter: 'drop-shadow(0 0 1.5px #fbbf24)' }}
          />
        </g>
      )}

      {/* Efeito de Vácuo Recorrente */}
      {isVacuum && (
        <g className="animate-pulse">
          <use
            href="#wheel-wedge"
            fill="url(#vacuumGlow)"
          />
          <circle 
            cx="54" cy="8.2" r="3.2" 
            fill="none" stroke="#60a5fa" strokeWidth="0.5" 
            style={{ filter: 'drop-shadow(0 0 1.5px #60a5fa)' }}
          />
        </g>
      )}

      {/* Texto do Número */}
      <text
        x="54"
        y="9.2"
        fontSize="3.2"
        fill="white"
        fontWeight="900"
        textAnchor="middle"
        transform={`rotate(5 54 9.2)`}
        className="pointer-events-none font-serif italic"
        style={{ textShadow: '0 1px 2px rgba(0,0,0,1)' }}
      >
        {num}
      </text>
    </g>
  );
});

const RouletteWheelVisual: React.FC<RouletteWheelVisualProps> = React.memo(({ 
  highlightedNumbers = [], 
  contextNumbers = [],
  vacuumNumbers = [],
  mainTarget = null,
  targetZone = "",
  isOmega = false,
  onClearHistory,
  onRemoveLast,
  lastNumber = null
}) => {
  const segments = React.useMemo(() => {
    return WHEEL_ORDER.map((num, i) => (
      <WheelSegment 
        key={num} 
        num={num} 
        index={i} 
        isHighlighted={highlightedNumbers.includes(num)} 
        isContext={contextNumbers.includes(num)}
        isVacuum={vacuumNumbers.includes(num)}
        isMirror={MIRROR_NUMBERS_LIST.includes(num) && highlightedNumbers.includes(num)}
        isMainTarget={num === mainTarget}
        isOmega={isOmega}
        color={getColor(num)}
      />
    ));
  }, [highlightedNumbers, contextNumbers, vacuumNumbers, mainTarget, isOmega]);

  return (
    <div className="relative w-full mx-auto aspect-square overflow-hidden" style={{ contain: 'layout paint' }}>
      <svg 
        viewBox="-3 -3 106 106" 
        className="w-full h-full overflow-visible"
        style={{ pointerEvents: 'none' }}
      >
        <defs>
          {/* Definições de Formas */}
          <path id="wheel-wedge" d="M 50 2 A 48 48 0 0 1 58.1 2.7 L 50 50 Z" />
          
          {/* Gradiente de Madeira Realista (Mogno) */}
          <radialGradient id="woodGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#451a03" />
            <stop offset="60%" stopColor="#451a03" />
            <stop offset="100%" stopColor="#0c0a09" />
          </radialGradient>

          {/* Gradiente Dourado Polido (Exu do Ouro) */}
          <linearGradient id="goldRimGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#78350f" />
            <stop offset="50%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#451a03" />
          </linearGradient>

          {/* Gradiente para os Pinos Metálicos */}
          <linearGradient id="pinGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#451a03" />
            <stop offset="50%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#451a03" />
          </linearGradient>

          {/* Brilho de Alvos */}
          <radialGradient id="targetGlow" cx="50%" cy="0%" r="100%">
            <stop offset="0%" stopColor="#22c55e" stopOpacity="0.3" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>

          {/* Brilho de Espelhos (Rosa/Roxo para diferenciar) */}
          <radialGradient id="mirrorGlow" cx="50%" cy="0%" r="100%">
            <stop offset="0%" stopColor="#ec4899" stopOpacity="0.4" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>

          {/* Brilho de Alvo Principal (Bolha Vermelha) */}
          <radialGradient id="mainTargetGlow" cx="50%" cy="0%" r="100%">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.8" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>

          {/* Brilho de Contexto */}
          <radialGradient id="contextGlow" cx="50%" cy="0%" r="100%">
            <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.3" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>

          {/* Brilho de Vácuo */}
          <radialGradient id="vacuumGlow" cx="50%" cy="0%" r="100%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>

        {/* Base de Madeira do Cilindro */}
        <circle cx="50" cy="50" r="50" fill="url(#woodGradient)" />
        
        {/* Aro Externo Dourado Polido */}
        <circle cx="50" cy="50" r="49.5" fill="none" stroke="url(#goldRimGradient)" strokeWidth="1" />
        <circle cx="50" cy="50" r="48.5" fill="none" stroke="rgba(0,0,0,0.6)" strokeWidth="0.2" />

        {/* Área dos Números (Track) */}
        <circle cx="50" cy="50" r="48" fill="#0c0a09" />
        
        {segments}

        {/* Divisória Interna Dourada */}
        <circle cx="50" cy="50" r="34" fill="none" stroke="url(#goldRimGradient)" strokeWidth="0.8" style={{ filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.5))' }} />

        {/* Cone Central de Madeira */}
        <circle cx="50" cy="50" r="33.2" fill="url(#woodGradient)" />

        {/* Spindle Central 3D (O "Eixo" do Exu do Ouro) */}
        <g style={{ filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.6))' }}>
          {/* Base do Spindle */}
          <circle cx="50" cy="50" r="14" fill="url(#goldRimGradient)" />
          <circle cx="50" cy="50" r="13.5" fill="none" stroke="rgba(0,0,0,0.3)" strokeWidth="0.1" />
          
          {/* Corpo do Spindle */}
          <circle cx="50" cy="50" r="8" fill="url(#goldRimGradient)" />
          <circle cx="50" cy="50" r="7.5" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="0.1" />
          
          {/* Topo do Spindle */}
          <circle cx="50" cy="50" r="4" fill="url(#goldRimGradient)" />
          <circle cx="50" cy="50" r="3.5" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.1" />
          
          {/* Texto Exu do Ouro no Hub */}
          <text
            x="50"
            y="56"
            fontSize="1.5"
            fill="#fbbf24"
            fontWeight="900"
            textAnchor="middle"
            className="pointer-events-none uppercase tracking-[0.2em]"
            style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}
          >
            Exu do Ouro
          </text>

          {/* Brilho Final */}
          <circle cx="48.5" cy="48.5" r="1" fill="white" opacity="0.6" filter="blur(0.5px)" />
        </g>

        {/* Bola Dourada Estática (Realismo) */}
        <g style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))' }}>
          <circle cx="67" cy="60" r="1.8" fill="url(#goldRimGradient)" />
          <circle cx="66.5" cy="59.5" r="0.4" fill="white" opacity="0.8" />
        </g>
      </svg>

      {/* Overlay de Texto da Zona */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center">
            <span className={`block text-[8px] uppercase tracking-[4px] mb-1 font-black ${isOmega ? 'text-red-500 animate-pulse' : 'text-zinc-500'}`}>Target Zone</span>
            <span className={`text-xs font-black uppercase transition-all duration-500 ${
              isOmega 
                ? 'text-red-500 drop-shadow-[0_0_12px_rgba(239,68,68,0.8)] scale-125 animate-bounce' 
                : highlightedNumbers.length > 0 
                  ? 'text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.6)] scale-110' 
                  : 'text-zinc-700'
            }`}>
                {targetZone || "Monitorando"}
            </span>
        </div>
      </div>
    </div>
  );
});

export default RouletteWheelVisual;
