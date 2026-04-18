import { SECTORS } from '../constants';

export const calculateSequence = <T extends string>(history: number[], check: (n: number) => boolean, typeA: T, typeB: T) => {
  if (history.length === 0) return { current: 0, max: 0, type: 'none' as const };
  let current = 0;
  let max = 0;
  
  const first = history[0];
  const firstIsA = check(first);
  const currentType = firstIsA ? typeA : typeB;
  
  for (let i = 0; i < history.length; i++) {
    if (check(history[i]) === firstIsA) {
      current++;
    } else {
      break;
    }
  }

  let streak = 0;
  let lastWasA = check(history[0]);
  for (let i = 0; i < history.length; i++) {
    const isA = check(history[i]);
    if (isA === lastWasA) {
      streak++;
    } else {
      max = Math.max(max, streak);
      streak = 1;
      lastWasA = isA;
    }
  }
  max = Math.max(max, streak);

  return { current, max, type: currentType };
};

export const calculateGaps = (history: number[], targetNums: number[]) => {
  const gaps: number[] = [];
  let currentGap = 0;
  let foundFirst = false;
  
  for (let i = history.length - 1; i >= 0; i--) {
    if (targetNums.includes(history[i])) {
      if (foundFirst) {
        gaps.push(currentGap);
      }
      currentGap = 0;
      foundFirst = true;
    } else if (foundFirst) {
      currentGap++;
    }
  }
  return gaps;
};

export const getSector = (n: number) => {
  if (SECTORS.voisins.includes(n)) return 'VOISINS';
  if (SECTORS.tiers.includes(n)) return 'TIERS';
  if (SECTORS.orphelins.includes(n)) return 'ORPHELINS';
  return 'UNKNOWN';
};

export const getSumOfDigits = (n: number): number => {
  if (n < 10) return n;
  let sum = n.toString().split('').reduce((acc, digit) => acc + parseInt(digit), 0);
  while (sum >= 10) {
    sum = sum.toString().split('').reduce((acc, digit) => acc + parseInt(digit), 0);
  }
  return sum;
};
