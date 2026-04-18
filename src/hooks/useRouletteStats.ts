import { useMemo, useState, useEffect } from 'react';
import { 
  ROULETTE_NUMBERS, 
  WHEEL_ORDER, 
  SECTORS, 
  SECTOR_PROBABILITIES, 
  FAMILIAS_CFG, 
  ESPELHOS_CFG, 
  CAMUFLADOS_NUMBERS, 
  MIRROR_NUMBERS_LIST 
} from '../constants';
import { Stats } from '../types';
import { neuralEngine } from '../services/neuralEngine';
import { calculateSequence, calculateGaps, getSector, getSumOfDigits } from '../utils/rouletteUtils';

export function useRouletteStats(history: number[], engineWeights: any, ballisticMode: boolean, currentDropPoint: number | null) {
  const [neuralProbs, setNeuralProbs] = useState<number[]>(new Array(37).fill(0));

  // Update neural predictions asynchronously
  useEffect(() => {
    if (history.length >= 15) {
      neuralEngine.predict(history).then(probs => {
        setNeuralProbs(probs);
      }).catch(err => {
        console.error("Neural prediction hook error:", err);
      });
    } else {
      setNeuralProbs(new Array(37).fill(0));
    }
  }, [history.length]);

  return useMemo(() => {
    if (history.length === 0) return null;

    const historyTotal = history.length;
    const last50 = history.slice(0, 50);
    const last100 = history.slice(0, 100);
    const last200 = history.slice(0, 200);
    const total200 = last200.length || 1;

    const counts = {
      red: 0, black: 0, green: 0,
      even: 0, odd: 0,
      high: 0, low: 0,
      dozen1: 0, dozen2: 0, dozen3: 0,
      col1: 0, col2: 0, col3: 0,
      termGroup1: 0, termGroup2: 0, termGroup3: 0,
    };

    const correlations = {
      redEven: 0, redOdd: 0, blackEven: 0, blackOdd: 0,
      redHigh: 0, redLow: 0, blackHigh: 0, blackLow: 0,
      evenHigh: 0, evenLow: 0, oddHigh: 0, oddLow: 0
    };

    const numberFrequency: Record<number, number> = {};
    const terminalFrequency: Record<number, number> = {};
    const sectorCounts = { voisins: 0, tiers: 0, orphelins: 0, jeuZero: 0 };
    const freq50: Record<number, number> = {};
    
    const voisinsSet = new Set(SECTORS.voisins);
    const tiersSet = new Set(SECTORS.tiers);
    const orphelinsSet = new Set(SECTORS.orphelins);
    const jeuZeroSet = new Set(SECTORS.jeuZero);

    // Optimized calculation pass
    for (let i = 0; i < total200; i++) {
      const num = last200[i];
      const data = ROULETTE_NUMBERS[num];
      if (!data) continue;

      if (data.color === 'red') {
        counts.red++;
        if (num !== 0) {
          if (data.isEven) correlations.redEven++; else correlations.redOdd++;
          if (data.isHigh) correlations.redHigh++; else correlations.redLow++;
        }
      } else if (data.color === 'black') {
        counts.black++;
        if (num !== 0) {
          if (data.isEven) correlations.blackEven++; else correlations.blackOdd++;
          if (data.isHigh) correlations.blackHigh++; else correlations.blackLow++;
        }
      } else {
        counts.green++;
      }

      if (num !== 0) {
        if (data.isEven) {
          counts.even++;
          if (data.isHigh) correlations.evenHigh++; else correlations.evenLow++;
        } else {
          counts.odd++;
          if (data.isHigh) correlations.oddHigh++; else correlations.oddLow++;
        }
        
        if (data.isHigh) counts.high++; else counts.low++;
        
        const dozen = data.dozen;
        if (dozen === 1) counts.dozen1++;
        else if (dozen === 2) counts.dozen2++;
        else counts.dozen3++;
        
        const column = data.column;
        if (column === 1) counts.col1++;
        else if (column === 2) counts.col2++;
        else counts.col3++;

        const terminal = num % 10;
        if (terminal === 1 || terminal === 4 || terminal === 7 || terminal === 0) counts.termGroup1++;
        else if (terminal === 2 || terminal === 5 || terminal === 8) counts.termGroup2++;
        else counts.termGroup3++;
      }

      numberFrequency[num] = (numberFrequency[num] || 0) + 1;
      const terminal = num % 10;
      terminalFrequency[terminal] = (terminalFrequency[terminal] || 0) + 1;

      if (voisinsSet.has(num)) sectorCounts.voisins++;
      else if (tiersSet.has(num)) sectorCounts.tiers++;
      else if (orphelinsSet.has(num)) sectorCounts.orphelins++;
      if (jeuZeroSet.has(num)) sectorCounts.jeuZero++;

      if (i < 50) freq50[num] = (freq50[num] || 0) + 1;
    }

    const chaosIndex = history.length < 10 ? 0.5 : new Set(history.slice(0, 15)).size / 15;

    const dealerSignature = history.length >= 5 ? (() => {
      const distances: number[] = [];
      for (let i = 0; i < 4; i++) {
        const currentIdx = WHEEL_ORDER.indexOf(history[i]);
        const prevIdx = WHEEL_ORDER.indexOf(history[i+1]);
        let dist = currentIdx - prevIdx;
        if (dist < 0) dist += 37;
        distances.push(dist);
      }
      const avgDist = distances.reduce((a, b) => a + b, 0) / distances.length;
      const variance = distances.reduce((a, b) => a + Math.pow(b - avgDist, 2), 0) / distances.length;
      return { avgDist, variance, distances };
    })() : null;

    const barChartData = Array.from({ length: 37 }, (_, i) => ({
      number: i,
      frequency: freq50[i] || 0,
      color: ROULETTE_NUMBERS[i].color === 'red' ? '#ef4444' : ROULETTE_NUMBERS[i].color === 'black' ? '#18181b' : '#22c55e'
    }));

    const sectorTrends: { index: number; voisins: number; tiers: number; orphelins: number }[] = [];
    for (let i = 0; i < 10; i++) {
      const block = last100.slice(i * 10, (i + 1) * 10);
      if (block.length === 0) break;
      const bCounts = { voisins: 0, tiers: 0, orphelins: 0 };
      for (const n of block) {
        if (voisinsSet.has(n)) bCounts.voisins++;
        else if (tiersSet.has(n)) bCounts.tiers++;
        else if (orphelinsSet.has(n)) bCounts.orphelins++;
      }
      sectorTrends.unshift({ index: 10 - i, ...bCounts });
    }

    const detectedBiases: { type: string; value: string; confidence: number }[] = [];
    
    // 1. Sector Bias
    Object.entries(sectorCounts).forEach(([sector, count]) => {
      const actualProb = count / total200;
      const expectedProb = SECTOR_PROBABILITIES[sector as keyof typeof SECTOR_PROBABILITIES];
      const deviation = (actualProb - expectedProb) / expectedProb;
      if (deviation > 0.25 && total200 > 10) {
        detectedBiases.push({ type: 'Setor', value: sector.toUpperCase(), confidence: Math.min(Math.round(deviation * 100), 100) });
      }
    });

    // 2. Simple Tendencies
    const simpleBets = [
      { name: 'Vermelho', count: counts.red, expected: 18/37 },
      { name: 'Preto', count: counts.black, expected: 18/37 },
      { name: 'Par', count: counts.even, expected: 18/37 },
      { name: 'Ímpar', count: counts.odd, expected: 18/37 },
      { name: 'Alto', count: counts.high, expected: 18/37 },
      { name: 'Baixo', count: counts.low, expected: 18/37 },
    ];

    simpleBets.forEach(bet => {
      const actualProb = bet.count / total200;
      const deviation = (actualProb - bet.expected) / bet.expected;
      if (deviation > 0.3 && total200 > 15) {
        detectedBiases.push({ type: 'Tendência', value: bet.name, confidence: Math.min(Math.round(deviation * 100), 100) });
      }
    });

    // 2.1 Correlation Bias
    const correlationBets = [
      { name: 'Vermelho/Par', count: correlations.redEven, expected: 9/37 },
      { name: 'Vermelho/Ímpar', count: correlations.redOdd, expected: 9/37 },
      { name: 'Preto/Par', count: correlations.blackEven, expected: 9/37 },
      { name: 'Preto/Ímpar', count: correlations.blackOdd, expected: 9/37 },
      { name: 'Vermelho/Alto', count: correlations.redHigh, expected: 9/37 },
      { name: 'Vermelho/Baixo', count: correlations.redLow, expected: 9/37 },
      { name: 'Preto/Alto', count: correlations.blackHigh, expected: 9/37 },
      { name: 'Preto/Baixo', count: correlations.blackLow, expected: 9/37 },
      { name: 'Par/Alto', count: correlations.evenHigh, expected: 9/37 },
      { name: 'Par/Baixo', count: correlations.evenLow, expected: 9/37 },
      { name: 'Ímpar/Alto', count: correlations.oddHigh, expected: 9/37 },
      { name: 'Ímpar/Baixo', count: correlations.oddLow, expected: 9/37 },
    ];

    correlationBets.forEach(bet => {
      const actualProb = bet.count / total200;
      const deviation = (actualProb - bet.expected) / bet.expected;
      if (deviation > 0.4 && total200 > 25) {
        detectedBiases.push({ type: 'Correlação', value: bet.name, confidence: Math.min(Math.round(deviation * 100), 100) });
      }
    });

    // 3. Terminal Groups
    const terminalGroups = [
      { name: 'G1 (0,1,4,7)', count: counts.termGroup1, expected: 15/37 },
      { name: 'G2 (2,5,8)', count: counts.termGroup2, expected: 11/37 },
      { name: 'G3 (3,6,9)', count: counts.termGroup3, expected: 11/37 },
    ];

    terminalGroups.forEach(group => {
      const actualProb = group.count / total200;
      const deviation = (actualProb - group.expected) / group.expected;
      if (deviation > 0.35 && total200 > 20) {
        detectedBiases.push({ type: 'Terminal G', value: group.name, confidence: Math.min(Math.round(deviation * 100), 100) });
      }
    });

    Object.entries(terminalFrequency).forEach(([terminal, count]) => {
      const actualProb = count / total200;
      const deviation = (actualProb - 0.1) / 0.1;
      if (deviation > 0.5 && total200 > 20) {
        detectedBiases.push({ type: 'Terminal', value: `T-${terminal}`, confidence: Math.min(Math.round(deviation * 100), 100) });
      }
    });

    // 4. Dealer Signature (Distance Analysis)
    if (dealerSignature && dealerSignature.variance < 15) {
      detectedBiases.push({ 
        type: 'Assinatura', 
        value: `Salto ~${Math.round(dealerSignature.avgDist)}`, 
        confidence: Math.min(Math.round((15 - dealerSignature.variance) * 6.66), 100) 
      });
    }

    // 5. Hot/Cold Analysis
    if (total200 >= 30) {
      const expected = total200 / 37;
      const stdDev = Math.sqrt(total200 * (1/37) * (36/37));
      Object.entries(numberFrequency).forEach(([num, count]) => {
        const zScore = (count - expected) / stdDev;
        if (zScore > 2.0) {
          detectedBiases.push({ type: 'Hiper-Quente', value: `#${num}`, confidence: Math.min(Math.round(zScore * 30), 100) });
        }
      });
    }

    // 6. Visual Patterns
    if (history.length >= 4) {
      const last4 = history.slice(0, 4);
      const colors = last4.map(n => ROULETTE_NUMBERS[n]?.color).filter(Boolean);
      if (colors.length === 4 && (colors.every(c => c === 'red') || colors.every(c => c === 'black'))) {
        detectedBiases.push({ type: 'Padrão Visual', value: `Sequência ${colors[0] === 'red' ? 'Vermelha' : 'Preta'}`, confidence: 85 });
      }
    }

    // --- ENSEMBLE PREDICTION ENGINE: 30 LAYERS OF ANALYSIS ---
    const numberScores = new Array(37).fill(0);
    const scores = new Array(10).fill(0);
    const contextTargets: number[] = [];

    // CAMADA 1: Análise de Famílias (1, 4, 7)
    Object.keys(FAMILIAS_CFG).forEach(key => {
      const familia = FAMILIAS_CFG[key as keyof typeof FAMILIAS_CFG];
      const ultimoVisto = history.findIndex(n => familia.includes(n % 10));
      if (ultimoVisto > 7 || ultimoVisto === -1) familia.forEach(t => scores[t] += 40); 
      if (ultimoVisto < 2 && ultimoVisto !== -1) familia.forEach(t => scores[t] += 25);
    });

    // CAMADA 2: Análise de Espelhos e Setor Zero
    ESPELHOS_CFG.pairs.forEach(pair => {
      const f0 = last50.filter(n => n % 10 === pair[0]).length;
      const f1 = last50.filter(n => n % 10 === pair[1]).length;
      const diff = Math.abs(f0 - f1);
      if (diff >= 5) {
        const terminalAtrasado = f0 < f1 ? pair[0] : pair[1];
        scores[terminalAtrasado] += 50 * engineWeights.bias;
      }
    });

    // CAMADA EXTRA: Análise de Camuflados (Soma de Dígitos)
    if (history.length >= 2) {
      const lastNums = history.slice(0, 3);
      const camufladosInHistory = lastNums.filter(n => CAMUFLADOS_NUMBERS.includes(n));
      if (camufladosInHistory.length >= 2) {
        const sums = camufladosInHistory.map(n => getSumOfDigits(n));
        const commonSum = sums.find((s, i) => sums.indexOf(s) !== i);
        if (commonSum !== undefined) {
          CAMUFLADOS_NUMBERS.filter(n => getSumOfDigits(n) === commonSum).forEach(n => numberScores[n] += 120 * engineWeights.bias);
        }
      }
    }

    // CAMADA 3: Análise de Calor e Momentum (Heatmap Ativo)
    Object.entries(numberFrequency).forEach(([num, count]) => {
      const n = parseInt(num);
      numberScores[n] += (count / total200) * 100 * engineWeights.bias;
    });

    // CAMADA 4: Momentum de Vizinhança
    if (history.length > 0) {
      const last = history[0];
      const idx = WHEEL_ORDER.indexOf(last);
      [-1, 1].forEach(offset => {
        const neighbor = WHEEL_ORDER[(idx + offset + 37) % 37];
        numberScores[neighbor] += 60 * engineWeights.sector;
      });
    }

    // CAMADA 5: Neural Engine (Deep Learning via TensorFlow LSTM)
    neuralProbs.forEach((prob, num) => {
      numberScores[num] += prob * 350 * engineWeights.neural;
      
      const wheelIdx = WHEEL_ORDER.indexOf(num);
      const neighborWeights = [0.4, 0.2];
      neighborWeights.forEach((w, offset) => {
        const n1 = WHEEL_ORDER[(wheelIdx - (offset + 1) + 37) % 37];
        const n2 = WHEEL_ORDER[(wheelIdx + (offset + 1)) % 37];
        numberScores[n1] += prob * 350 * engineWeights.neural * w;
        numberScores[n2] += prob * 350 * engineWeights.neural * w;
      });
    });

    // CAMADA 6: Markov Chain (Cadeia de Transições Probabilísticas)
    if (history.length > 10) {
      const lastNum = history[0];
      const transitions: Record<number, number> = {};
      for (let i = 0; i < Math.min(history.length - 1, 150); i++) {
        if (history[i+1] === lastNum) {
          const next = history[i];
          transitions[next] = (transitions[next] || 0) + 1;
        }
      }
      Object.entries(transitions).forEach(([num, count]) => {
        numberScores[Number(num)] += (count / 20) * 300 * engineWeights.markov;
      });
    }

    // CAMADA 7: Sector Velocity & Momentum (Inércia do Cilindro)
    const recentSectorCounts: Record<string, number> = {};
    for (let i = 0; i < Math.min(history.length, 5); i++) {
      const s = getSector(history[i]);
      recentSectorCounts[s] = (recentSectorCounts[s] || 0) + 1;
    }
    const dominantSector = Object.entries(recentSectorCounts).sort((a, b) => b[1] - a[1])[0];
    if (dominantSector && dominantSector[1] >= 3) {
      const nums = SECTORS[dominantSector[0].toLowerCase() as keyof typeof SECTORS];
      if (nums) nums.forEach(n => numberScores[n] += 50 * engineWeights.sector);
    }

    // CAMADA 8: Vizinhos Históricos (Padrões Temporais)
    if (history.length >= 2) {
      const lastIdx = WHEEL_ORDER.indexOf(history[0]);
      const prevIdx = WHEEL_ORDER.indexOf(history[1]);
      const jump = (lastIdx - prevIdx + 37) % 37;
      const targetIdx = (lastIdx + jump) % 37;
      numberScores[WHEEL_ORDER[targetIdx]] += 80 * engineWeights.bias;
    }

    // CAMADA 9: Vácuo Recorrente (Gap Analysis Avançada)
    for (let t = 0; t < 10; t++) {
      const terminalNums = Array.from({length: 37}, (_, i) => i).filter(n => n % 10 === t);
      const currentOngoingGap = history.findIndex(n => terminalNums.includes(n));
      if (currentOngoingGap > 12) scores[t] += currentOngoingGap * 5;
    }

    // CAMADA 10: Sequence Analysis (Cores, Paridade e Alto/Baixo)
    const colorStreak = calculateSequence(history, n => ROULETTE_NUMBERS[n].color === 'red', 'red', 'black');
    if (colorStreak.current >= 4) {
      const oppositeColor = colorStreak.type === 'red' ? 'black' : 'red';
      Array.from({length: 37}, (_, i) => i).filter(n => ROULETTE_NUMBERS[n].color === oppositeColor)
        .forEach(n => numberScores[n] += colorStreak.current * 15);
    }

    // CAMADA 11: Table Heatmap (Frequência Bruta na Mesa)
    barChartData.forEach(item => {
      numberScores[item.number] += item.frequency * 10;
    });

    // CAMADA 12: Historical Gap Pattern (Vácuo Individual por Número)
    for (let i = 0; i <= 36; i++) {
      const gap = history.indexOf(i);
      if (gap > 37) numberScores[i] += (gap - 37) * 4;
    }

    // CAMADA 13: Dealer Signature (Assinatura Mecânica do Crupiê)
    if (dealerSignature && dealerSignature.variance < 10) {
      const predictedIdx = (WHEEL_ORDER.indexOf(history[0]) + Math.round(dealerSignature.avgDist)) % 37;
      numberScores[WHEEL_ORDER[predictedIdx]] += 150;
    }

    // CAMADA 13.5: Ballistic Mode (Cálculo Físico de Ponto de Soltura)
    if (ballisticMode && currentDropPoint !== null) {
      const dropIdx = WHEEL_ORDER.indexOf(currentDropPoint);
      const dists = history.slice(0, 5).map((n, i) => (WHEEL_ORDER.indexOf(n) - WHEEL_ORDER.indexOf(history[i+1]) + 37) % 37);
      const avgDist = dists.reduce((a, b) => a + b, 0) / dists.length;
      const targetIdx = (dropIdx + Math.round(avgDist)) % 37;
      numberScores[WHEEL_ORDER[targetIdx]] += 400;
    }

    // CAMADA 14: Z-Score (Desvio Padrão e Anomalias Estatísticas)
    const expected = total200 / 37;
    const stdDev = Math.sqrt(total200 * (1/37) * (36/37));
    Object.entries(numberFrequency).forEach(([num, count]) => {
      const z = (count - expected) / stdDev;
      if (z > 2) numberScores[parseInt(num)] += z * 40;
    });

    // CAMADA 15: Cluster Analysis (Agrupamentos de Queda Recente)
    const recent10 = history.slice(0, 10);
    const recentIndices = recent10.map(n => WHEEL_ORDER.indexOf(n));
    recentIndices.forEach(idx => {
      [-2, -1, 1, 2].forEach(offset => {
        const neighbor = WHEEL_ORDER[(idx + offset + 37) % 37];
        numberScores[neighbor] += 30;
      });
    });

    // CAMADA 15.5: Sector Velocity (Análise de Momentum Inverso)
    const lastSector = getSector(history[0]);
    const prevSector = getSector(history[1]);
    if (lastSector === prevSector) {
      const oppositeSectorMap: Record<string, string> = { 'VOISINS': 'TIERS', 'TIERS': 'VOISINS', 'ORPHELINS': 'VOISINS' };
      const opp = oppositeSectorMap[lastSector] || 'VOISINS';
      SECTORS[opp.toLowerCase() as keyof typeof SECTORS]?.forEach(n => numberScores[n] += 40);
    }

    // CAMADA 15.7: Sequential Pattern Recognition (Recorrência de Ordem)
    if (history.length >= 4) {
      const pattern = history.slice(0, 2);
      for (let i = 2; i < Math.min(history.length - 2, 100); i++) {
        if (history[i] === pattern[1] && history[i+1] === pattern[0]) {
          numberScores[history[i-1]] += 100;
        }
      }
    }

    // CAMADA 15.9: Mirror Convergence (Simetria de Dígitos e Espelhamento)
    ESPELHOS_CFG.digitMirrorPairs.forEach(pair => {
      if (history.slice(0, 5).includes(pair[0]) && !history.slice(0, 5).includes(pair[1])) {
        numberScores[pair[1]] += 80;
      }
    });

    // CAMADA 16: Chaos Index (Fator de Volatilidade da Mesa)
    const chaos = new Set(history.slice(0, 15)).size / 15;
    if (chaos < 0.4) numberScores.forEach((_, i) => numberScores[i] *= 1.2); // Low chaos = higher predictability

    // CAMADA 17: Dynamic Cross-Terminal Convergence
    if (history.length > 0) {
      const lastTerm = history[0] % 10;
      const convergenceMap: Record<number, number[]> = { 1: [4, 7], 2: [5, 8], 3: [6, 9], 0: [0] };
      (convergenceMap[lastTerm] || []).forEach(t => scores[t] += 40);
    }

    // CAMADA 18: Approximation Engine (Busca por Vizinhança de Alvos)
    const tempScores = [...numberScores];
    tempScores.forEach((score, num) => {
      if (score > 200) {
        const idx = WHEEL_ORDER.indexOf(num);
        [-1, 1].forEach(off => numberScores[WHEEL_ORDER[(idx + off + 37) % 37]] += score * 0.3);
      }
    });

    // CAMADA 19: Short-Term Convergence (Micro-janela de 10 rodadas)
    history.slice(0, 10).forEach(n => numberScores[n] += 25);

    // CAMADA 20: Lei do Terceiro (Law of the Thirds)
    const seen37 = new Set(history.slice(0, 37));
    Array.from({length: 37}, (_, i) => i).filter(n => !seen37.has(n)).forEach(n => numberScores[n] += 45);

    // CAMADA 21: Padrão de Pêndulo (Pendulum Strike)
    if (history.length >= 2) {
      const s1 = getSector(history[0]);
      const s2 = getSector(history[1]);
      if (s1 !== s2) {
        SECTORS[s1.toLowerCase() as keyof typeof SECTORS]?.forEach(n => numberScores[n] += 30);
      }
    }

    // CAMADA 22: Geometria de Mesa (Análise de Dúzias e Colunas)
    if (counts.dozen1 < counts.dozen2 && counts.dozen1 < counts.dozen3) {
      Array.from({length: 37}, (_, i) => i).filter(n => ROULETTE_NUMBERS[n]?.dozen === 1).forEach(n => numberScores[n] += 40);
    }

    // CAMADA 23: Ressonância de Fibonacci (Proporções Áureas de Queda)
    const fib = [1, 2, 3, 5, 8, 13, 21];
    fib.forEach(f => {
      if (history.length > f) {
        const n = history[f];
        numberScores[n] += 20;
      }
    });

    // CAMADA 24: Detector de Alternância (Choppy vs Streaky)
    const isChoppy = history.slice(0, 10).every((n, i) => i === 0 || ROULETTE_NUMBERS[n].color !== ROULETTE_NUMBERS[history[i-1]].color);
    if (isChoppy) {
      const lastColor = ROULETTE_NUMBERS[history[0]].color;
      Array.from({length: 37}, (_, i) => i).filter(n => ROULETTE_NUMBERS[n].color !== lastColor).forEach(n => numberScores[n] += 60);
    }

    // CAMADA 25: Wheel Slice Analysis (Fatiamento Granular da Roda)
    const slices = 6;
    const sliceSize = Math.floor(37 / slices);
    const sliceCounts = new Array(slices).fill(0);
    history.slice(0, 20).forEach(n => {
      const idx = WHEEL_ORDER.indexOf(n);
      sliceCounts[Math.floor(idx / sliceSize)]++;
    });
    const lowSlice = sliceCounts.indexOf(Math.min(...sliceCounts));
    for (let i = lowSlice * sliceSize; i < (lowSlice + 1) * sliceSize; i++) {
      if (WHEEL_ORDER[i] !== undefined) numberScores[WHEEL_ORDER[i]] += 40;
    }

    // CAMADA 26: Análise de Longo Prazo (Espelhamento de Sequência)
    if (history.length > 100) {
      const recent3 = history.slice(0, 3);
      for (let i = 50; i < history.length - 3; i++) {
        if (history[i] === recent3[0] && history[i+1] === recent3[1]) {
          numberScores[history[i-1]] += 70;
        }
      }
    }

    // CAMADA 27: Sector Transition Matrix (Matriz de Transição entre Setores)
    if (history.length > 5) {
      const lastS = getSector(history[0]);
      const sectorTransitions: Record<string, number> = {};
      for (let i = 0; i < history.length - 1; i++) {
        if (getSector(history[i+1]) === lastS) {
          const nextS = getSector(history[i]);
          sectorTransitions[nextS] = (sectorTransitions[nextS] || 0) + 1;
        }
      }
      const sortedS = Object.entries(sectorTransitions).sort((a,b) => b[1]-a[1]);
      const nextS = sortedS[0]?.[0];
      if (nextS) SECTORS[nextS.toLowerCase() as keyof typeof SECTORS]?.forEach(n => numberScores[n] += 50);
    }

    // CAMADA 28: Cross-Sector Terminal Break (Quebra de Padrão de Terminal)
    const lastT = history[0] % 10;
    const lastS2 = getSector(history[0]);
    if (history.slice(1, 5).some(n => n % 10 === lastT && getSector(n) !== lastS2)) {
      Array.from({length: 37}, (_, i) => i).filter(n => n % 10 === lastT && getSector(n) === lastS2).forEach(n => numberScores[n] += 90);
    }

    // CAMADA 29: Neural-Markov Convergence Boost (Sincronia de Motores)
    const topNeural = neuralProbs.indexOf(Math.max(...neuralProbs));
    if (numberScores[topNeural] > 300) numberScores[topNeural] += 200;

    // CAMADA 30: Super Convergence (Intersecção Final de Todas as Camadas)
    for (let i = 0; i <= 36; i++) {
      numberScores[i] += scores[i % 10];
      if (numberScores[i] > 600) numberScores[i] *= 1.3;
    }

    const sortedNumbers = numberScores
      .map((score, num) => ({ num, score }))
      .sort((a, b) => b.score - a.score);

    const top8 = sortedNumbers.slice(0, 8);
    const maxPossibleScore = 1400;
    const targetsWithConfidence = top8.map(t => ({
      num: t.num,
      confidence: Math.min(Math.round((t.score / maxPossibleScore) * 100 * (1.2 - chaosIndex)), 99)
    }));

    const mainTarget = top8[0]?.num ?? 0;
    const mainScore = top8[0]?.score ?? 0;
    const isSniper = mainScore > 550;
    const betPercentage = isSniper ? Math.min(Math.round((mainScore / 800) * 100), 99) : 0;

    const mainIdx = WHEEL_ORDER.indexOf(mainTarget);
    const neighbors = [
      WHEEL_ORDER[(mainIdx - 2 + 37) % 37],
      WHEEL_ORDER[(mainIdx - 1 + 37) % 37],
      mainTarget,
      WHEEL_ORDER[(mainIdx + 1) % 37],
      WHEEL_ORDER[(mainIdx + 2) % 37]
    ];
    const isConcentrated = top8.slice(1, 5).every(t => neighbors.includes(t.num));
    const finalTargets = isConcentrated ? neighbors : top8.map(t => t.num);

    const trendData = history.slice(0, 20).reverse().map((num, i) => ({
      index: i,
      value: num,
      color: ROULETTE_NUMBERS[num].color
    }));

    const systemStatus = {
      neural: history.length >= 25 ? 'ONLINE' : 'TRAINING',
      markov: history.length >= 10 ? 'ONLINE' : 'COLLECTING',
      bias: history.length >= 5 ? 'ONLINE' : 'COLLECTING',
      sector: history.length >= 3 ? 'ONLINE' : 'COLLECTING',
      ballistic: ballisticMode ? 'ACTIVE' : 'STANDBY'
    };

    const terminalVacuum = Array.from({ length: 10 }).map((_, i) => history.findIndex(n => n % 10 === i));
    const terminalGaps = Array.from({ length: 10 }).map((_, t) => {
      const terminalNums = Array.from({length: 37}, (_, i) => i).filter(n => n % 10 === t);
      const pastGaps = calculateGaps(history, terminalNums);
      const lastCompletedGap = pastGaps.length > 0 ? pastGaps[pastGaps.length - 1] : 0;
      const currentOngoingGap = history.findIndex(n => terminalNums.includes(n));
      return { lastCompletedGap, currentOngoingGap };
    });

    const terminalAnalysis = {
      families: Object.entries(FAMILIAS_CFG).map(([key, nums]) => {
        const lastSeen = history.findIndex(n => nums.includes(n % 10));
        return { key, nums, lastSeen };
      }),
      mirrors: ESPELHOS_CFG.pairs.map(pair => {
        const f0 = last50.filter(n => n % 10 === pair[0]).length;
        const f1 = last50.filter(n => n % 10 === pair[1]).length;
        return { pair, f0, f1 };
      })
    };

    const terminalGroupData = [
      { name: 'G1 (1,4,7)', value: counts.termGroup1, color: '#BF953F' },
      { name: 'G2 (2,5,8)', value: counts.termGroup2, color: '#B38728' },
      { name: 'G3 (3,6,9)', value: counts.termGroup3, color: '#AA771C' }
    ];

    const groupPredictions = (() => {
      const g1 = scores[1] + scores[4] + scores[7] + scores[0];
      const g2 = scores[2] + scores[5] + scores[8];
      const g3 = scores[3] + scores[6] + scores[9];
      const preds = [
        { name: '0.1.4.7', score: g1, terminals: [0, 1, 4, 7], color: '#BF953F' },
        { name: '2.5.8', score: g2, terminals: [2, 5, 8], color: '#B38728' },
        { name: '3.6.9', score: g3, terminals: [3, 6, 9], color: '#AA771C' }
      ].map(p => ({
        ...p,
        confidence: Math.min(Math.round((p.score / 200) * 100), 99),
        lastSeen: history.findIndex(n => p.terminals.includes(n % 10))
      })).sort((a, b) => b.score - a.score);
      return preds;
    })();

    const sequences = {
      color: calculateSequence(history, n => ROULETTE_NUMBERS[n].color === 'red', 'red', 'black'),
      parity: calculateSequence(history, n => ROULETTE_NUMBERS[n].isEven, 'even', 'odd'),
      highLow: calculateSequence(history, n => ROULETTE_NUMBERS[n].isHigh, 'high', 'low')
    };

    const tableHeatmap = Array.from({ length: 37 }, (_, i) => ({
      num: i,
      frequency: numberFrequency[i] || 0,
      color: ROULETTE_NUMBERS[i].color
    }));

    return {
      total: historyTotal,
      counts,
      terminalFrequency,
      terminalVacuum,
      terminalGaps,
      sectorCounts,
      trendData,
      terminalAnalysis,
      terminalGroupData,
      dealerSignature,
      groupPredictions,
      biases: detectedBiases,
      barChartData,
      sectorTrends: sectorTrends,
      sequences,
      tableHeatmap,
      contextTargets,
      prediction: {
        terminal: scores.indexOf(Math.max(...scores)),
        confidence: Math.min(Math.max(...scores), 99),
        targets: finalTargets,
        targetsWithConfidence,
        isConcentrated,
        mainTarget,
        isSniper,
        betPercentage,
        neuralTop: neuralProbs.map((p, i) => ({ num: i, prob: p })).sort((a, b) => b.prob - a.prob).slice(0, 5)
      },
      systemStatus
    } as Stats;
  }, [history, engineWeights, ballisticMode, currentDropPoint, neuralProbs]);
}
