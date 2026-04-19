import * as tf from '@tensorflow/tfjs';
import { ROULETTE_NUMBERS } from '../constants';

// Ensure TF backend is ready and catch any initialization errors
const safelyInitTF = async () => {
  try {
    await tf.ready();
    // Prefer WebGL, but if it fails later, we can fallback to CPU
    console.log("TensorFlow ready. Backend:", tf.getBackend());
  } catch (err) {
    console.error("TensorFlow initial readiness error, falling back to CPU:", err);
    await tf.setBackend('cpu');
  }
};

safelyInitTF();

export class NeuralEngine {
  private model: tf.LayersModel | null = null;
  private isTraining: boolean = false;
  private initPromise: Promise<void>;

  constructor() {
    this.initPromise = this.initModel();
  }

  private async initModel() {
    try {
      await tf.ready();
      
      const model = tf.sequential();
      
      // Input: sequence of 15 numbers (deepened history), each with 10 features:
      // [normalized_val, color_id, parity_id, dozen_id, column_id, sector_id, term_group_id, sum_digits, normalized_index, sector_density]
      // Total input shape: [15, 10]
      
      // Layer 1: Conv1D for local pattern recognition (short-term dependencies)
      model.add(tf.layers.conv1d({
        filters: 64,
        kernelSize: 3,
        padding: 'same',
        activation: 'relu',
        inputShape: [15, 10]
      }));
      
      // Layer 2: Bi-directional LSTM for complex sequence pattern recognition
      // Removing recurrentDropout as it often causes WebGL shader linkage issues in some environments
      model.add(tf.layers.bidirectional({
        layer: tf.layers.lstm({
          units: 128,
          returnSequences: false,
          dropout: 0.2
        })
      }));
      
      // Deep dense layers for non-linear feature combination
      model.add(tf.layers.dense({ units: 128, activation: 'relu' }));
      model.add(tf.layers.batchNormalization());
      model.add(tf.layers.dropout({ rate: 0.3 }));
      
      model.add(tf.layers.dense({ units: 64, activation: 'relu' }));
      model.add(tf.layers.dropout({ rate: 0.2 }));
      
      model.add(tf.layers.dense({ units: 32, activation: 'relu' }));
      
      // Output: probability distribution over 37 numbers (0-36)
      model.add(tf.layers.dense({
        units: 37,
        activation: 'softmax'
      }));

      model.compile({
        optimizer: tf.train.adam(0.0005), // slightly slower learning rate for deeper net
        loss: 'categoricalCrossentropy',
        metrics: ['accuracy']
      });

      this.model = model;
    } catch (err) {
      console.error("Neural model initialization error:", err);
      // Fallback to CPU if initialization fails
      await tf.setBackend('cpu');
    }
  }

  private async ensureInitialized() {
    await this.initPromise;
  }

  private getFeatures(num: number, idx: number, history: number[]): number[] {
    const n = ROULETTE_NUMBERS[num];
    if (!n) return new Array(10).fill(0);
    
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

    // Sum of digits feature
    const sumDigits = num.toString().split('').reduce((acc, digit) => acc + parseInt(digit), 0);

    // Contextual sector density (last 5 numbers)
    const recentSectors = history.slice(Math.max(0, idx), Math.min(history.length, idx + 5)).map(rn => sectorMap[rn] || 0);
    const sectorDensity = recentSectors.filter(s => s === (sectorMap[num] || 0)).length / 5;

    return [
      num / 36,
      colorMap[n.color] / 2,
      n.isEven ? 1 : 0,
      (n.dozen - 1) / 2,
      (n.column - 1) / 2,
      (sectorMap[num] || 0) / 3,
      termGroup / 3,
      sumDigits / 11,
      idx / 15,
      sectorDensity
    ];
  }

  private lastTrainSize: number = 0;

  async train(history: number[]) {
    await this.ensureInitialized();
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
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("Neural training error:", errorMessage);
      
      // If error is related to shaders, switch to CPU for future operations
      if (errorMessage.includes('shader') || errorMessage.includes('vertex') || errorMessage.includes('fragment')) {
        console.warn("Detected shader error, switching TensorFlow to CPU backend...");
        await tf.setBackend('cpu');
      }
    } finally {
      this.isTraining = false;
    }
  }

  async predict(history: number[]): Promise<number[]> {
    await this.ensureInitialized();
    if (!this.model || history.length < 15) return new Array(37).fill(0);

    try {
      const scores = tf.tidy(() => {
        const input = history.slice(0, 15).reverse().map((n, i) => this.getFeatures(n, i, history));
        const inputTensor = tf.tensor3d([input]);
        const prediction = this.model!.predict(inputTensor) as tf.Tensor;
        return prediction.dataSync();
      });
      return Array.from(scores);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("Neural prediction error:", errorMessage);
      
      if (errorMessage.includes('shader') || errorMessage.includes('vertex') || errorMessage.includes('fragment')) {
        console.warn("Detected shader error during prediction, switching to CPU...");
        await tf.setBackend('cpu');
      }
      return new Array(37).fill(0);
    }
  }

  predictSync(history: number[]): number[] {
    // Note: ensureInitialized is not awaited here because this is sync, 
    // but the model will be null if not ready.
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
      console.error("Neural prediction error (sync):", error);
      return new Array(37).fill(0);
    }
  }
}

export const neuralEngine = new NeuralEngine();
