import React, { useEffect, useState, useRef } from 'react';
import { RotateCcw, Trash2, Zap } from 'lucide-react';
import { motion, useAnimation, AnimatePresence } from 'motion/react';
import { MIRROR_NUMBERS_LIST, ESPELHOS_CFG } from '../constants';

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
  showLightning?: boolean;
}

const LEFT_STRAIGHT = [35, 12, 28, 7, 29, 18, 22, 9, 31, 14, 20, 1, 33, 16, 24];
const RIGHT_STRAIGHT = [32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30];
const TOP_CURVE = [3, 26, 0];
const BOTTOM_CURVE = [8, 23, 10, 5]; // 0 to 180 degrees

const TRACK_WIDTH = 60;
const INNER_RADIUS = 60;
const OUTER_RADIUS = 120;
const CENTER_X = 200;
const TOP_Y = 200;
const BOTTOM_Y = 700;
const STRAIGHT_HEIGHT = 500;
const ROW_HEIGHT = STRAIGHT_HEIGHT / 15;

function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
  const angleInRadians = (angleInDegrees) * Math.PI / 180.0;
  return {
    x: centerX + (radius * Math.cos(angleInRadians)),
    y: centerY + (radius * Math.sin(angleInRadians))
  };
}

function describeAnnulusSector(x: number, y: number, innerRadius: number, outerRadius: number, startAngle: number, endAngle: number) {
  const startOuter = polarToCartesian(x, y, outerRadius, startAngle);
  const endOuter = polarToCartesian(x, y, outerRadius, endAngle);
  const startInner = polarToCartesian(x, y, innerRadius, startAngle);
  const endInner = polarToCartesian(x, y, innerRadius, endAngle);

  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

  return [
    "M", startOuter.x, startOuter.y,
    "A", outerRadius, outerRadius, 0, largeArcFlag, 1, endOuter.x, endOuter.y,
    "L", endInner.x, endInner.y,
    "A", innerRadius, innerRadius, 0, largeArcFlag, 0, startInner.x, startInner.y,
    "Z"
  ].join(" ");
}

const getColor = (num: number) => {
  if (num === 0) return '#065f46'; // Verde Escuro Profundo
  const reds = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
  return reds.includes(num) ? '#991b1b' : '#0a0a0a'; // Vermelho Vinho ou Preto Absoluto
};

const RacetrackSegment: React.FC<{
  num: number;
  path: string;
  textX: number;
  textY: number;
  textRotation?: number;
  isHighlighted: boolean;
  isContext: boolean;
  isVacuum: boolean;
  isMirror: boolean;
  isMainTarget: boolean;
  isOmega: boolean;
  color: string;
}> = React.memo(({ num, path, textX, textY, textRotation = 0, isHighlighted, isContext, isVacuum, isMirror, isMainTarget, isOmega, color }) => {
  return (
    <g>
      {/* Fatia do Número */}
      <path
        d={path}
        fill={color}
        stroke="rgba(255,255,255,0.05)"
        strokeWidth="1"
        className={isHighlighted || isVacuum || isContext ? 'brightness-125' : ''}
      />
      
      {/* Efeito de Destaque Premium (Verde Neon para todos) */}
      {(isHighlighted || isContext || isVacuum) && (
        <g>
          <path
            d={path}
            fill="url(#targetGlow)"
            style={{ filter: `drop-shadow(0 0 4px #4ade80)` }}
          />
          <circle 
            cx={textX} cy={textY} r="14" 
            fill="none" 
            stroke="#4ade80" 
            strokeWidth="2.5" 
            style={{ filter: `drop-shadow(0 0 6px #4ade80)` }}
          />
        </g>
      )}

      {/* Texto do Número */}
      <text
        x={textX}
        y={textY}
        fontSize="22"
        fill={color === '#0a0a0a' ? "white" : color === '#991b1b' ? "#ef4444" : "#4ade80"}
        fontWeight="bold"
        textAnchor="middle"
        dominantBaseline="central"
        transform={`rotate(${textRotation}, ${textX}, ${textY})`}
        className="pointer-events-none font-sans"
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
  lastNumber = null,
  showLightning = false
}) => {
  const segments = React.useMemo(() => {
    // Add mirror counterparts to highlighted numbers
    const effectiveHighlighted = new Set(highlightedNumbers);
    const mirrorHighlights = new Set<number>();
    
    highlightedNumbers.forEach(num => {
      // Check both digitMirrorPairs and regular pairs
      [...ESPELHOS_CFG.digitMirrorPairs, ...ESPELHOS_CFG.pairs].forEach(pair => {
        if (pair[0] === num) {
          effectiveHighlighted.add(pair[1]);
          mirrorHighlights.add(pair[1]);
        } else if (pair[1] === num) {
          effectiveHighlighted.add(pair[0]);
          mirrorHighlights.add(pair[0]);
        }
      });
    });

    const allSegments: React.ReactNode[] = [];

    // Left Straight
    LEFT_STRAIGHT.forEach((num, i) => {
      const yStart = TOP_Y + i * ROW_HEIGHT;
      const yEnd = TOP_Y + (i + 1) * ROW_HEIGHT;
      const path = `M ${CENTER_X - OUTER_RADIUS} ${yStart} L ${CENTER_X - INNER_RADIUS} ${yStart} L ${CENTER_X - INNER_RADIUS} ${yEnd} L ${CENTER_X - OUTER_RADIUS} ${yEnd} Z`;
      const textX = CENTER_X - INNER_RADIUS - TRACK_WIDTH / 2;
      const textY = yStart + ROW_HEIGHT / 2;
      
      allSegments.push(
        <RacetrackSegment 
          key={num} num={num} path={path} textX={textX} textY={textY} textRotation={90}
          isHighlighted={effectiveHighlighted.has(num)} isContext={contextNumbers.includes(num)}
          isVacuum={vacuumNumbers.includes(num)} isMirror={mirrorHighlights.has(num) || (MIRROR_NUMBERS_LIST.includes(num) && highlightedNumbers.includes(num))}
          isMainTarget={num === mainTarget} isOmega={isOmega} color={getColor(num)}
        />
      );
    });

    // Right Straight
    RIGHT_STRAIGHT.forEach((num, i) => {
      const yStart = TOP_Y + i * ROW_HEIGHT;
      const yEnd = TOP_Y + (i + 1) * ROW_HEIGHT;
      const path = `M ${CENTER_X + INNER_RADIUS} ${yStart} L ${CENTER_X + OUTER_RADIUS} ${yStart} L ${CENTER_X + OUTER_RADIUS} ${yEnd} L ${CENTER_X + INNER_RADIUS} ${yEnd} Z`;
      const textX = CENTER_X + INNER_RADIUS + TRACK_WIDTH / 2;
      const textY = yStart + ROW_HEIGHT / 2;
      
      allSegments.push(
        <RacetrackSegment 
          key={num} num={num} path={path} textX={textX} textY={textY} textRotation={90}
          isHighlighted={effectiveHighlighted.has(num)} isContext={contextNumbers.includes(num)}
          isVacuum={vacuumNumbers.includes(num)} isMirror={mirrorHighlights.has(num) || (MIRROR_NUMBERS_LIST.includes(num) && highlightedNumbers.includes(num))}
          isMainTarget={num === mainTarget} isOmega={isOmega} color={getColor(num)}
        />
      );
    });

    // Top Curve (180 to 360)
    const topAngles = [180, 240, 300, 360];
    TOP_CURVE.forEach((num, i) => {
      const startAngle = topAngles[i];
      const endAngle = topAngles[i+1];
      const midAngle = (startAngle + endAngle) / 2;
      const textPos = polarToCartesian(CENTER_X, TOP_Y, INNER_RADIUS + TRACK_WIDTH / 2, midAngle);
      const path = describeAnnulusSector(CENTER_X, TOP_Y, INNER_RADIUS, OUTER_RADIUS, startAngle, endAngle);
      
      allSegments.push(
        <RacetrackSegment 
          key={num} num={num} path={path} textX={textPos.x} textY={textPos.y} textRotation={midAngle + 90}
          isHighlighted={effectiveHighlighted.has(num)} isContext={contextNumbers.includes(num)}
          isVacuum={vacuumNumbers.includes(num)} isMirror={mirrorHighlights.has(num) || (MIRROR_NUMBERS_LIST.includes(num) && highlightedNumbers.includes(num))}
          isMainTarget={num === mainTarget} isOmega={isOmega} color={getColor(num)}
        />
      );
    });

    // Bottom Curve (0 to 180)
    const bottomAngles = [0, 45, 90, 135, 180];
    BOTTOM_CURVE.forEach((num, i) => {
      const startAngle = bottomAngles[i];
      const endAngle = bottomAngles[i+1];
      const midAngle = (startAngle + endAngle) / 2;
      const textPos = polarToCartesian(CENTER_X, BOTTOM_Y, INNER_RADIUS + TRACK_WIDTH / 2, midAngle);
      const path = describeAnnulusSector(CENTER_X, BOTTOM_Y, INNER_RADIUS, OUTER_RADIUS, startAngle, endAngle);
      
      allSegments.push(
        <RacetrackSegment 
          key={num} num={num} path={path} textX={textPos.x} textY={textPos.y} textRotation={midAngle - 90}
          isHighlighted={effectiveHighlighted.has(num)} isContext={contextNumbers.includes(num)}
          isVacuum={vacuumNumbers.includes(num)} isMirror={mirrorHighlights.has(num) || (MIRROR_NUMBERS_LIST.includes(num) && highlightedNumbers.includes(num))}
          isMainTarget={num === mainTarget} isOmega={isOmega} color={getColor(num)}
        />
      );
    });

    return allSegments;
  }, [highlightedNumbers, contextNumbers, vacuumNumbers, mainTarget, isOmega]);

  return (
    <div className="relative w-full mx-auto overflow-hidden flex justify-center items-center p-4" style={{ contain: 'layout paint', maxHeight: '600px' }}>
      <svg 
        viewBox="0 0 400 900" 
        className="h-full w-auto max-h-[600px] overflow-visible"
        style={{ pointerEvents: 'none' }}
      >
        <defs>
          {/* Gradiente de Madeira Simplificado */}
          <radialGradient id="woodGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#1c1917" />
            <stop offset="100%" stopColor="#0a0a0a" />
          </radialGradient>

          {/* Brilho de Alvos */}
          <radialGradient id="targetGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#4ade80" stopOpacity="0.8" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>

          {/* Brilho de Espelhos (Rosa/Roxo para diferenciar) */}
          <radialGradient id="mirrorGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#f472b6" stopOpacity="0.8" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>

          {/* Brilho de Alvo Principal (Bolha Vermelha) */}
          <radialGradient id="mainTargetGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="1" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>

          {/* Brilho de Contexto */}
          <radialGradient id="contextGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.6" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>

          {/* Brilho de Vácuo */}
          <radialGradient id="vacuumGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.6" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>

        {/* Fundo do Racetrack (Madeira) */}
        <rect x="0" y="0" width="400" height="900" fill="url(#woodGradient)" rx="40" />
        
        {/* Aro Externo */}
        <path d={`M ${CENTER_X - OUTER_RADIUS} ${TOP_Y} A ${OUTER_RADIUS} ${OUTER_RADIUS} 0 0 1 ${CENTER_X + OUTER_RADIUS} ${TOP_Y} L ${CENTER_X + OUTER_RADIUS} ${BOTTOM_Y} A ${OUTER_RADIUS} ${OUTER_RADIUS} 0 0 1 ${CENTER_X - OUTER_RADIUS} ${BOTTOM_Y} Z`} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
        
        {/* Aro Interno */}
        <path d={`M ${CENTER_X - INNER_RADIUS} ${TOP_Y} A ${INNER_RADIUS} ${INNER_RADIUS} 0 0 1 ${CENTER_X + INNER_RADIUS} ${TOP_Y} L ${CENTER_X + INNER_RADIUS} ${BOTTOM_Y} A ${INNER_RADIUS} ${INNER_RADIUS} 0 0 1 ${CENTER_X - INNER_RADIUS} ${BOTTOM_Y} Z`} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />

        {/* Segmentos */}
        {segments}

        {/* Pista Interna de Setores */}
        <g>
          {/* Zero (Jeu 0) */}
          <path d={`
            M ${CENTER_X + 60} ${TOP_Y + 2 * ROW_HEIGHT}
            L ${CENTER_X + 60} ${TOP_Y}
            A 60 60 0 0 0 ${CENTER_X - 60} ${TOP_Y}
            L ${CENTER_X - 60} ${TOP_Y + 2 * ROW_HEIGHT}
            L ${CENTER_X - 45} ${TOP_Y + 2 * ROW_HEIGHT}
            L ${CENTER_X - 45} ${TOP_Y}
            A 45 45 0 0 1 ${CENTER_X + 45} ${TOP_Y}
            L ${CENTER_X + 45} ${TOP_Y + 2 * ROW_HEIGHT}
            Z
          `} fill="rgba(34, 197, 94, 0.15)" />

          {/* Voisins Left */}
          <path d={`
            M ${CENTER_X - 60} ${TOP_Y + 2 * ROW_HEIGHT}
            L ${CENTER_X - 60} ${TOP_Y + 7 * ROW_HEIGHT}
            L ${CENTER_X - 45} ${TOP_Y + 7 * ROW_HEIGHT}
            L ${CENTER_X - 45} ${TOP_Y + 2 * ROW_HEIGHT}
            Z
          `} fill="rgba(59, 130, 246, 0.15)" />
          
          {/* Voisins Right */}
          <path d={`
            M ${CENTER_X + 60} ${TOP_Y + 2 * ROW_HEIGHT}
            L ${CENTER_X + 60} ${TOP_Y + 7 * ROW_HEIGHT}
            L ${CENTER_X + 45} ${TOP_Y + 7 * ROW_HEIGHT}
            L ${CENTER_X + 45} ${TOP_Y + 2 * ROW_HEIGHT}
            Z
          `} fill="rgba(59, 130, 246, 0.15)" />

          {/* Orphelins Left */}
          <path d={`
            M ${CENTER_X - 60} ${TOP_Y + 7 * ROW_HEIGHT}
            L ${CENTER_X - 60} ${TOP_Y + 12 * ROW_HEIGHT}
            L ${CENTER_X - 45} ${TOP_Y + 12 * ROW_HEIGHT}
            L ${CENTER_X - 45} ${TOP_Y + 7 * ROW_HEIGHT}
            Z
          `} fill="rgba(168, 85, 247, 0.15)" />
          
          {/* Orphelins Right */}
          <path d={`
            M ${CENTER_X + 60} ${TOP_Y + 7 * ROW_HEIGHT}
            L ${CENTER_X + 60} ${TOP_Y + 10 * ROW_HEIGHT}
            L ${CENTER_X + 45} ${TOP_Y + 10 * ROW_HEIGHT}
            L ${CENTER_X + 45} ${TOP_Y + 7 * ROW_HEIGHT}
            Z
          `} fill="rgba(168, 85, 247, 0.15)" />

          {/* Tier */}
          <path d={`
            M ${CENTER_X - 60} ${TOP_Y + 12 * ROW_HEIGHT}
            L ${CENTER_X - 60} ${BOTTOM_Y}
            A 60 60 0 0 0 ${CENTER_X + 60} ${BOTTOM_Y}
            L ${CENTER_X + 60} ${TOP_Y + 10 * ROW_HEIGHT}
            L ${CENTER_X + 45} ${TOP_Y + 10 * ROW_HEIGHT}
            L ${CENTER_X + 45} ${BOTTOM_Y}
            A 45 45 0 0 1 ${CENTER_X - 45} ${BOTTOM_Y}
            L ${CENTER_X - 45} ${TOP_Y + 12 * ROW_HEIGHT}
            Z
          `} fill="rgba(234, 179, 8, 0.15)" />

          {/* Aro Interno dos Setores */}
          <path d={`M ${CENTER_X - 45} ${TOP_Y} A 45 45 0 0 1 ${CENTER_X + 45} ${TOP_Y} L ${CENTER_X + 45} ${BOTTOM_Y} A 45 45 0 0 1 ${CENTER_X - 45} ${BOTTOM_Y} Z`} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />

          {/* Linhas Divisórias dos Setores */}
          <g>
            {/* Left Side Notches */}
            {[2, 7, 12].map(row => (
              <g key={`left-notch-${row}`}>
                <line x1={CENTER_X - 60} y1={TOP_Y + row * ROW_HEIGHT} x2={CENTER_X - 45} y2={TOP_Y + row * ROW_HEIGHT} stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
              </g>
            ))}
            
            {/* Right Side Notches */}
            {[2, 7, 10].map(row => (
              <g key={`right-notch-${row}`}>
                <line x1={CENTER_X + 45} y1={TOP_Y + row * ROW_HEIGHT} x2={CENTER_X + 60} y2={TOP_Y + row * ROW_HEIGHT} stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
              </g>
            ))}

            {/* Linhas Guias Internas (Linhas Pretas Conectando os Entalhes) */}
            <g>
              {/* Linha 1 (Zero / Voisins) */}
              <line x1={CENTER_X - 45} y1={TOP_Y + 2 * ROW_HEIGHT + 1} x2={CENTER_X + 45} y2={TOP_Y + 2 * ROW_HEIGHT + 1} stroke="#ffffff" strokeWidth="1" opacity="0.2" />
              <line x1={CENTER_X - 45} y1={TOP_Y + 2 * ROW_HEIGHT} x2={CENTER_X + 45} y2={TOP_Y + 2 * ROW_HEIGHT} stroke="#000000" strokeWidth="2" opacity="0.85" />
              
              {/* Linha 2 (Voisins / Orphelins) */}
              <line x1={CENTER_X - 45} y1={TOP_Y + 7 * ROW_HEIGHT + 1} x2={CENTER_X + 45} y2={TOP_Y + 7 * ROW_HEIGHT + 1} stroke="#ffffff" strokeWidth="1" opacity="0.2" />
              <line x1={CENTER_X - 45} y1={TOP_Y + 7 * ROW_HEIGHT} x2={CENTER_X + 45} y2={TOP_Y + 7 * ROW_HEIGHT} stroke="#000000" strokeWidth="2" opacity="0.85" />
              
              {/* Linha 3 (Orphelins / Tier) */}
              <line x1={CENTER_X - 45} y1={TOP_Y + 12 * ROW_HEIGHT + 1} x2={CENTER_X + 45} y2={TOP_Y + 10 * ROW_HEIGHT + 1} stroke="#ffffff" strokeWidth="1" opacity="0.2" />
              <line x1={CENTER_X - 45} y1={TOP_Y + 12 * ROW_HEIGHT} x2={CENTER_X + 45} y2={TOP_Y + 10 * ROW_HEIGHT} stroke="#000000" strokeWidth="2" opacity="0.85" />
            </g>
          </g>
        </g>

        {/* Textos Internos (Zero, Voisins, Orphelins, Tier) */}
        <g fill="rgba(255,255,255,0.9)" fontSize="14" textAnchor="middle" dominantBaseline="central" className="font-sans font-medium pointer-events-none tracking-widest uppercase">
          <text x={CENTER_X} y={TOP_Y - 10} fill="#4ade80">Zero</text>
          <text x={CENTER_X} y={TOP_Y + 4.5 * ROW_HEIGHT} fill="#60a5fa">Voisins</text>
          <text x={CENTER_X} y={TOP_Y + 9 * ROW_HEIGHT} fill="#c084fc">Orphelins</text>
          <text x={CENTER_X} y={BOTTOM_Y + 10} fill="#facc15">Tier</text>
        </g>

        {/* Green Lightning Bolt Effect */}
        <AnimatePresence>
          {showLightning && (
            <motion.g
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              style={{ originX: `${CENTER_X}px`, originY: `${TOP_Y - 50}px` }}
            >
              <foreignObject 
                x={CENTER_X - 60} 
                y={TOP_Y - 140} 
                width="120" 
                height="120"
              >
                <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                  <motion.div
                    animate={{ 
                      scale: [1, 1.1, 1],
                      filter: [
                        'drop-shadow(0 0 10px #22c55e)',
                        'drop-shadow(0 0 30px #22c55e)',
                        'drop-shadow(0 0 10px #22c55e)'
                      ]
                    }}
                    transition={{ repeat: Infinity, duration: 0.8 }}
                    className="p-3 bg-green-500 rounded-2xl shadow-[0_0_30px_#22c55e] border-2 border-green-300/30"
                  >
                    <Zap className="w-12 h-12 text-black fill-black" strokeWidth={3} />
                  </motion.div>
                  
                  <motion.div
                    initial={{ y: 5, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="px-2 py-0.5 bg-green-500 rounded text-[9px] font-black text-black uppercase tracking-tighter"
                  >
                    Momento Ótimo
                  </motion.div>
                </div>
              </foreignObject>
              
              {/* Electric arcs around the wheel */}
              {[45, 135, 225, 315].map((angle, i) => {
                const start = polarToCartesian(CENTER_X, (angle > 180 ? BOTTOM_Y : TOP_Y), OUTER_RADIUS + 5, angle);
                const end = polarToCartesian(CENTER_X, (angle > 180 ? BOTTOM_Y : TOP_Y), OUTER_RADIUS + 15, angle + 10);
                return (
                  <motion.path
                    key={i}
                    d={`M ${start.x} ${start.y} Q ${CENTER_X} ${angle > 180 ? BOTTOM_Y : TOP_Y} ${end.x} ${end.y}`}
                    stroke="#22c55e"
                    strokeWidth="2"
                    fill="none"
                    animate={{
                      opacity: [0, 1, 0],
                      pathLength: [0, 1, 0],
                      x: [0, Math.random() * 10 - 5, 0],
                      y: [0, Math.random() * 10 - 5, 0]
                    }}
                    transition={{ repeat: Infinity, duration: 0.3, delay: i * 0.1 }}
                  />
                );
              })}
            </motion.g>
          )}
        </AnimatePresence>
      </svg>
    </div>
  );
});

export default RouletteWheelVisual;
