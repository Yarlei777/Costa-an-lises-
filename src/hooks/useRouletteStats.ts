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

    last200.forEach((num, idx) => {
      const data = ROULETTE_NUMBERS[num];
      if (!data) return;

      if (data.color === 'red') counts.red++;
      else if (data.color === 'black') counts.black++;
      else counts.green++;

      if (num !== 0) {
        if (data.isEven) counts.even++; else counts.odd++;
        if (data.isHigh) counts.high++; else counts.low++;
        
        if (data.color === 'red') {
          if (data.isEven) correlations.redEven++; else correlations.redOdd++;
          if (data.isHigh) correlations.redHigh++; else correlations.redLow++;
        } else if (data.color === 'black') {
          if (data.isEven) correlations.blackEven++; else correlations.blackOdd++;
          if (data.isHigh) correlations.blackHigh++; else correlations.blackLow++;
        }
        
        if (data.isEven) {
          if (data.isHigh) correlations.evenHigh++; else correlations.evenLow++;
        } else {
          if (data.isHigh) correlations.oddHigh++; else correlations.oddLow++;
        }

        if (data.dozen === 1) counts.dozen1++;
        else if (data.dozen === 2) counts.dozen2++;
        else counts.dozen3++;
        
        if (data.column === 1) counts.col1++;
        else if (data.column === 2) counts.col2++;
        else counts.col3++;

        const terminal = num % 10;
        if ([1, 4, 7, 0].includes(terminal)) counts.termGroup1++;
        else if ([2, 5, 8].includes(terminal)) counts.termGroup2++;
        else if ([3, 6, 9].includes(terminal)) counts.termGroup3++;
      }

      numberFrequency[num] = (numberFrequency[num] || 0) + 1;
      const terminal = num % 10;
      terminalFrequency[terminal] = (terminalFrequency[terminal] || 0) + 1;

      if (voisinsSet.has(num)) sectorCounts.voisins++;
      else if (tiersSet.has(num)) sectorCounts.tiers++;
      else if (orphelinsSet.has(num)) sectorCounts.orphelins++;
      if (jeuZeroSet.has(num)) sectorCounts.jeuZero++;

      if (idx < 50) freq50[num] = (freq50[num] || 0) + 1;
    });

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
    if (history.length >= 5) {
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
      if (variance < 15) {
        detectedBiases.push({ type: 'Assinatura', value: `Salto ~${Math.round(avgDist)}`, confidence: Math.min(Math.round((15 - variance) * 6.66), 100) });
      }
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

    // --- ENSEMBLE PREDICTION ENGINE ---
    const numberScores = new Array(37).fill(0);
    const scores = new Array(10).fill(0);
    const contextTargets: number[] = [];

    // Layer 1: Families
    Object.keys(FAMILIAS_CFG).forEach(key => {
      const familia = FAMILIAS_CFG[key as keyof typeof FAMILIAS_CFG];
      const ultimoVisto = history.findIndex(n => familia.includes(n % 10));
      if (ultimoVisto > 7 || ultimoVisto === -1) familia.forEach(t => scores[t] += 40); 
      if (ultimoVisto < 2 && ultimoVisto !== -1) familia.forEach(t => scores[t] += 25);
    });

    // Layer 2: Mirrors & Sector Zero
    ESPELHOS_CFG.pairs.forEach(pair => {
      const f0 = last50.filter(n => n % 10 === pair[0]).length;
      const f1 = last50.filter(n => n % 10 === pair[1]).length;
      const diff = Math.abs(f0 - f1);
      if (diff >= 5) {
        const terminalAtrasado = f0 < f1 ? pair[0] : pair[1];
        scores[terminalAtrasado] += 50 * engineWeights.bias;
      }
    });

    if (history.length > 0) {
      const lastNum = history[0];
      ESPELHOS_CFG.digitMirrorPairs.forEach(pair => {
        if (pair.includes(lastNum)) {
          const counterpart = pair[0] === lastNum ? pair[1] : pair[0];
          numberScores[counterpart] += 150 * engineWeights.bias;
        }
      });
    }

    // Camuflados
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

    // Sector Zero Density
    const last20 = history.slice(0, 20);
    const contagemSetorZero = last20.filter(n => ESPELHOS_CFG.setorZero.includes(n % 10)).length;
    if (contagemSetorZero >= 7) ESPELHOS_CFG.setorZero.forEach(t => scores[t] += 40);

    // Layer 3: Momentum
    const last15 = history.slice(0, 15);
    for (let i = 0; i < 10; i++) {
      if (last15.filter(n => n % 10 === i).length >= 3) scores[i] += 20;
    }

    if (history.length >= 2) {
      const t1 = history[0] % 10;
      const t2 = history[1] % 10;
      const t3 = history.length >= 3 ? history[2] % 10 : -1;
      if (t1 === t2 && t2 === t3) scores[t1] += 500 * engineWeights.bias;
      else if (t1 === t2) scores[t1] += 300 * engineWeights.bias;
    }

    // Layer 5: Neural Engine (Weighted heavily)
    neuralProbs.forEach((prob, num) => {
      numberScores[num] += prob * 250 * engineWeights.neural;
      
      // Probability Smoothing (Bell curve distribution to neighbors)
      const wheelIdx = WHEEL_ORDER.indexOf(num);
      const neighborWeights = [0.4, 0.2]; // Weights for 1st and 2nd neighbors
      
      neighborWeights.forEach((w, offset) => {
        const n1 = WHEEL_ORDER[(wheelIdx - (offset + 1) + 37) % 37];
        const n2 = WHEEL_ORDER[(wheelIdx + (offset + 1)) % 37];
        numberScores[n1] += prob * 250 * engineWeights.neural * w;
        numberScores[n2] += prob * 250 * engineWeights.neural * w;
      });
    });

    // Layer 6: Markov Chain & Transition Frequency
    if (history.length > 10) {
      const lastNum = history[0];
      const transitions: Record<number, number> = {};
      const terminalTransitions: Record<number, number> = {};
      
      for (let i = 0; i < Math.min(history.length - 1, 150); i++) {
        if (history[i+1] === lastNum) {
          const next = history[i];
          transitions[next] = (transitions[next] || 0) + 1;
        }
        
        // Terminal transitions (e.g., if last was Terminal 1, what terminal follows?)
        const lastTerm = history[i+1] % 10;
        const nextTerm = history[i] % 10;
        if (lastTerm === (lastNum % 10)) {
          terminalTransitions[nextTerm] = (terminalTransitions[nextTerm] || 0) + 1;
        }
      }
      
      Object.entries(transitions).forEach(([num, count]) => {
        numberScores[Number(num)] += (count / Math.min(history.length, 100)) * 250 * engineWeights.markov;
      });
      
      Object.entries(terminalTransitions).forEach(([term, count]) => {
        scores[Number(term)] += (count / Math.min(history.length, 100)) * 60 * engineWeights.markov;
      });
    }

    // Layer 7: Sector Velocity
    const recentSectorCounts: Record<string, number> = {};
    for (let i = 0; i < Math.min(history.length, 5); i++) {
      const s = getSector(history[i]);
      recentSectorCounts[s] = (recentSectorCounts[s] || 0) + 1;
    }
    const dominantSector = Object.entries(recentSectorCounts).sort((a, b) => b[1] - a[1])[0];
    if (dominantSector && dominantSector[1] >= 3) {
      const nums = SECTORS[dominantSector[0].toLowerCase() as keyof typeof SECTORS];
      if (nums) nums.forEach(n => numberScores[n] += 40 * engineWeights.sector);
    }

    // Layer 9: Recurrent Vacuum
    for (let t = 0; t < 10; t++) {
      const terminalNums = Array.from({length: 37}, (_, i) => i).filter(n => n % 10 === t);
      const pastGaps = calculateGaps(history, terminalNums);
      if (pastGaps.length > 0) {
        const lastCompletedGap = pastGaps[pastGaps.length - 1];
        const currentOngoingGap = history.findIndex(n => terminalNums.includes(n));
        if (currentOngoingGap !== -1 && Math.abs(currentOngoingGap - lastCompletedGap) <= 1 && lastCompletedGap > 0) {
          scores[t] += 45 * engineWeights.bias;
        }
      }
    }

    // Layer 13: Ballistic Mode
    if (ballisticMode && currentDropPoint !== null) {
      const distances: number[] = [];
      for (let i = 0; i < Math.min(10, history.length - 1); i++) {
        const currentIdx = WHEEL_ORDER.indexOf(history[i]);
        const prevIdx = WHEEL_ORDER.indexOf(history[i+1]);
        let dist = currentIdx - prevIdx;
        if (dist < 0) dist += 37;
        distances.push(dist);
      }
      if (distances.length > 0) {
        const distFreq: Record<number, number> = {};
        distances.forEach(d => distFreq[d] = (distFreq[d] || 0) + 1);
        const mostFrequentDist = parseInt(Object.keys(distFreq).reduce((a, b) => distFreq[parseInt(a)] > distFreq[parseInt(b)] ? a : b));
        const dropIdx = WHEEL_ORDER.indexOf(currentDropPoint);
        const predictedIdx = (dropIdx + mostFrequentDist) % 37;
        const predictedNum = WHEEL_ORDER[predictedIdx];
        numberScores[predictedNum] += 500; 
        for (let offset = -2; offset <= 2; offset++) {
          if (offset === 0) continue;
          const idx = (predictedIdx + offset + 37) % 37;
          numberScores[WHEEL_ORDER[idx]] += 200;
        }
      }
    }

    // Final scores normalization
    for (let i = 0; i <= 36; i++) {
      numberScores[i] += scores[i % 10];
    }

    const chaosIndex = (() => {
      if (history.length < 10) return 0.5;
      const uniqueNums = new Set(history.slice(0, 15)).size;
      return uniqueNums / 15;
    })();

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
