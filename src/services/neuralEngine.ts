import * as tf from '@tensorflow/tfjs';
import { ROULETTE_NUMBERS } from '../constants';

// Optimize TF.js for performance
tf.enableProdMode();
tf.setBackend('webgl').then(() => {
  tf.env().set('WEBGL_FORCE_F16_TEXTURES', true);
  tf.env().set('WEBGL_PACK', true);
}).catch(() => tf.setBackend('cpu'));

export class NeuralEngine {
  private model: tf.LayersModel | null = null;
  private isTraining: boolean = false;
  private backendReady: Promise<void>;

  constructor() {
    this.backendReady = tf.ready();
    this.initModel().catch(err => console.error("NeuralEngine init error:", err));
  }

  private async initModel() {
    try {
      await this.backendReady;
      
      const model = tf.sequential();
      
      model.add(tf.layers.conv1d({
        filters: 48, 
        kernelSize: 3,
        padding: 'same',
        activation: 'relu',
        inputShape: [15, 10]
      }));
      
      model.add(tf.layers.lstm({
        units: 96,
        returnSequences: false,
        dropout: 0.1,
      }));
      
      model.add(tf.layers.dense({ units: 64, activation: 'relu' }));
      model.add(tf.layers.batchNormalization());
      
      model.add(tf.layers.dense({ units: 32, activation: 'relu' }));
      
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
      
      // Warmup inference
      await this.warmup().catch(err => console.error("Warmup error:", err));
    } catch (err) {
      console.error("Critical error initializing NeuralEngine:", err);
    }
  }

  private async warmup() {
    if (!this.model) return;
    const dummyInput = tf.zeros([1, 15, 10]);
    this.model.predict(dummyInput);
    dummyInput.dispose();
  }

  // Pre-calculate sector mapping for speed
  private static readonly SECTOR_MAP: Record<number, number> = {
    0: 0, 32: 0, 15: 0, 19: 0, 4: 0, 21: 0, 2: 0, 25: 0, // Voisins
    17: 1, 34: 1, 6: 1, 1: 1, 20: 1, 14: 1, 31: 1, 9: 1, // Orphelins
    27: 2, 13: 2, 36: 2, 11: 2, 30: 2, 8: 2, 23: 2, 10: 2, 5: 2, 24: 2, 16: 2, 33: 2, // Tiers
    12: 3, 35: 3, 3: 3, 26: 3, 7: 3, 28: 3, 29: 3, 22: 3, 18: 3 // Voisins (cont)
  };

  private getFeatures(num: number, idx: number, history: number[]): number[] {
    const n = ROULETTE_NUMBERS[num];
    if (!n) return [0,0,0,0,0,0,0,0,0,0];
    
    const colorVal = n.color === 'red' ? 0.5 : n.color === 'black' ? 1.0 : 0;
    const sectorVal = NeuralEngine.SECTOR_MAP[num] || 0;

    const terminal = num % 10;
    let termGroup = 0;
    if (terminal === 0 || terminal === 1 || terminal === 4 || terminal === 7) termGroup = 1;
    else if (terminal === 2 || terminal === 5 || terminal === 8) termGroup = 2;
    else if (terminal === 3 || terminal === 6 || terminal === 9) termGroup = 3;

    // Fast sum of digits
    const sumDigits = num < 10 ? num : Math.floor(num / 10) + (num % 10);

    // Optimized context sector density
    let sectorMatchCount = 0;
    const subset = history.slice(idx, idx + 5);
    for(const rn of subset) {
      if ((NeuralEngine.SECTOR_MAP[rn] || 0) === sectorVal) sectorMatchCount++;
    }
    const sectorDensity = sectorMatchCount / 5;

    return [
      num * 0.02777, // num / 36
      colorVal,
      n.isEven ? 1 : 0,
      (n.dozen - 1) * 0.5,
      (n.column - 1) * 0.5,
      sectorVal * 0.33333,
      termGroup * 0.33333,
      sumDigits * 0.0909,
      idx * 0.0666,
      sectorDensity
    ];
  }

  private lastTrainSize: number = 0;

  async train(history: number[]) {
    // Only train if we have enough data, aren't already training, 
    // and have at least 5 new numbers since last training
    if (!this.model || history.length < 30 || this.isTraining || (history.length - this.lastTrainSize < 5)) return;

    this.isTraining = true;
    this.lastTrainSize = history.length;
    
    try {
      const windowSize = 15;
      const inputs: number[][][] = [];
      const labels: number[][] = [];

      // Limit training data to the last 200 numbers for better performance/relevance
      const trainingHistory = history.slice(0, 200);

      // Prepare training data from history
      for (let i = 0; i < trainingHistory.length - windowSize; i++) {
        const window = trainingHistory.slice(i, i + windowSize).map((n, j) => this.getFeatures(n, j, trainingHistory));
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
          epochs: 20,
          batchSize: 24,
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

  predict(history: number[]): Promise<number[]> {
    if (!this.model || history.length < 15) return Promise.resolve(new Array(37).fill(0));

    try {
      const scores = tf.tidy(() => {
        const input = history.slice(0, 15).reverse().map((n, i) => this.getFeatures(n, i, history));
        const inputTensor = tf.tensor3d([input]);
        const prediction = this.model!.predict(inputTensor) as tf.Tensor;
        return prediction.dataSync();
      });
      return Promise.resolve(Array.from(scores));
    } catch (error) {
      console.error("Neural prediction error:", error);
      return Promise.resolve(new Array(37).fill(0));
    }
  }

  predictSync(history: number[]): number[] {
    if (!this.model || history.length < 15) return new Array(37).fill(0);

    try {
      return tf.tidy(() => {
        const input = history.slice(0, 15).reverse().map((n, i) => this.getFeatures(n, i, history));
        const inputTensor = tf.tensor3d([input]);
        const prediction = this.model!.predict(inputTensor) as tf.Tensor;
        const scores = prediction.dataSync();
        return Array.from(scores);
      });
    } catch (error) {
      console.error("Neural prediction error:", error);
      return new Array(37).fill(0);
    }
  }
}

export const neuralEngine = new NeuralEngine();
