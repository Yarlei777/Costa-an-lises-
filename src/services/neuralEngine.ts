import * as tf from '@tensorflow/tfjs';
import { ROULETTE_NUMBERS } from '../constants';

// Ensure TF backend is ready and catch any initialization errors
tf.ready().catch(err => console.error("TensorFlow initialization error:", err));

export class NeuralEngine {
  private model: tf.LayersModel | null = null;
  private isTraining: boolean = false;

  constructor() {
    this.initModel();
  }

  private initModel() {
    const model = tf.sequential();
    
    // Input: sequence of 10 numbers, each with 7 features:
    // [normalized_val, color_id, parity_id, dozen_id, column_id, sector_id, term_group_id]
    // Total input shape: [10, 7]
    model.add(tf.layers.flatten({ inputShape: [10, 7] }));
    
    model.add(tf.layers.dense({ units: 128, activation: 'relu' }));
    model.add(tf.layers.dropout({ rate: 0.2 }));
    model.add(tf.layers.dense({ units: 64, activation: 'relu' }));
    model.add(tf.layers.dense({ units: 32, activation: 'relu' }));
    
    // Output: probability distribution over 37 numbers (0-36)
    model.add(tf.layers.dense({
      units: 37,
      activation: 'softmax'
    }));

    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy']
    });

    this.model = model;
  }

  private getFeatures(num: number): number[] {
    const n = ROULETTE_NUMBERS[num];
    if (!n) return new Array(7).fill(0);
    
    const colorMap = { green: 0, red: 1, black: 2 };
    const sectorMap: Record<number, number> = {
      0: 0, 32: 0, 15: 0, 19: 0, 4: 0, 21: 0, 2: 0, 25: 0, // Voisins
      17: 1, 34: 1, 6: 1, 1: 1, 20: 1, 14: 1, 31: 1, 9: 1, // Orphelins
      27: 2, 13: 2, 36: 2, 11: 2, 30: 2, 8: 2, 23: 2, 10: 2, 5: 2, 24: 2, 16: 2, 33: 2, // Tiers
      12: 3, 35: 3, 3: 3, 26: 3, 7: 3, 28: 3, 29: 3, 22: 3, 18: 3 // Voisins (cont)
    };

    const terminal = num % 10;
    let termGroup = 0;
    if ([0, 1, 4, 7].includes(terminal)) termGroup = 1;
    else if ([2, 5, 8].includes(terminal)) termGroup = 2;
    else if ([3, 6, 9].includes(terminal)) termGroup = 3;

    return [
      num / 36,
      colorMap[n.color] / 2,
      n.isEven ? 1 : 0,
      (n.dozen - 1) / 2,
      (n.column - 1) / 2,
      (sectorMap[num] || 0) / 3,
      termGroup / 3
    ];
  }

  private lastTrainSize: number = 0;

  async train(history: number[]) {
    // Only train if we have enough data, aren't already training, 
    // and have at least 5 new numbers since last training
    if (!this.model || history.length < 25 || this.isTraining || (history.length - this.lastTrainSize < 5)) return;

    this.isTraining = true;
    this.lastTrainSize = history.length;
    
    try {
      const windowSize = 10;
      const inputs: number[][][] = [];
      const labels: number[][] = [];

      // Limit training data to the last 100 numbers to prevent performance issues
      const trainingHistory = history.slice(0, 100);

      // Prepare training data from history
      for (let i = 0; i < trainingHistory.length - windowSize; i++) {
        const window = trainingHistory.slice(i, i + windowSize).map(n => this.getFeatures(n));
        const nextNum = trainingHistory[i + windowSize];
        
        const label = new Array(37).fill(0);
        label[nextNum] = 1;

        inputs.push(window);
        labels.push(label);
      }

      const xs = tf.tensor3d(inputs);
      const ys = tf.tensor2d(labels);

      try {
        await this.model.fit(xs, ys, {
          epochs: 15,
          batchSize: 16,
          verbose: 0,
          shuffle: true
        });
      } finally {
        xs.dispose();
        ys.dispose();
      }
    } catch (error) {
      console.error("Neural training error:", error);
    } finally {
      this.isTraining = false;
    }
  }

  predict(history: number[]): number[] {
    if (!this.model || history.length < 10) return new Array(37).fill(0);

    try {
      return tf.tidy(() => {
        const input = history.slice(0, 10).reverse().map(n => this.getFeatures(n));
        const inputTensor = tf.tensor3d([input]);
        const prediction = this.model!.predict(inputTensor) as tf.Tensor;
        const scores = prediction.dataSync() as Float32Array;
        return Array.from(scores);
      });
    } catch (error) {
      console.error("Neural prediction error:", error);
      return new Array(37).fill(0);
    }
  }
}

export const neuralEngine = new NeuralEngine();
