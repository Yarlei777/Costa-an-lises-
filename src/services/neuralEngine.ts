import * as tf from '@tensorflow/tfjs';
import { ROULETTE_NUMBERS, WHEEL_ORDER } from '../constants';

// Robust TensorFlow initialization with CPU fallback
let tfInitializationPromise: Promise<void> | null = null;

const initializeTF = async () => {
  if (tfInitializationPromise) return tfInitializationPromise;

  tfInitializationPromise = (async () => {
    try {
      // Attempt to use WebGL first
      console.log("Initializing TensorFlow...");
      await tf.setBackend('webgl');
      await tf.ready();
      console.log("TensorFlow ready on WebGL");
    } catch (error) {
      console.warn("WebGL initialization failed, falling back to CPU backend:", error);
      try {
        await tf.setBackend('cpu');
        await tf.ready();
        console.log("TensorFlow ready on CPU (fallback)");
      } catch (cpuError) {
        console.error("TensorFlow failed to initialize any backend:", cpuError);
        throw cpuError;
      }
    }
  })();

  return tfInitializationPromise;
};

// Start initialization immediately
initializeTF().catch(err => console.error("Initial TF startup failed:", err));

export class NeuralEngine {
  private model: tf.LayersModel | null = null;
  private isTraining: boolean = false;
  private initPromise: Promise<void>;

  constructor() {
    this.initPromise = this.setup();
  }

  private async setup() {
    try {
      await initializeTF();
      this.initModel();
    } catch (err) {
      console.error("Neural Engine setup failed:", err);
    }
  }

  private initModel() {
    if (this.model) return;
    try {
      const model = tf.sequential();
      
      // Camada 1: LSTM Primária (Captura dependências de curto/médio prazo)
      model.add(tf.layers.lstm({
        units: 256,
        inputShape: [15, 11],
        returnSequences: true,
        dropout: 0.1,
        recurrentDropout: 0.1,
        kernelInitializer: 'glorotNormal'
      }));
      model.add(tf.layers.batchNormalization());
      
      // Camada 2: LSTM Secundária (Refinamento de Sequência)
      model.add(tf.layers.lstm({
        units: 128,
        returnSequences: false,
        dropout: 0.1,
        kernelInitializer: 'glorotNormal'
      }));
      model.add(tf.layers.batchNormalization());
      
      // Camada 3: Densa de Fusão (Análise de Atributos Combinados)
      model.add(tf.layers.dense({ 
        units: 128, 
        activation: 'relu',
        kernelInitializer: 'heNormal'
      }));
      model.add(tf.layers.dropout({ rate: 0.2 }));

      // Camada 4: Densa de Abstração (Análise de Resíduos)
      model.add(tf.layers.dense({ 
        units: 64, 
        activation: 'relu',
        kernelInitializer: 'heNormal'
      }));
      model.add(tf.layers.dropout({ rate: 0.1 }));
      
      // Camada 5: Saída Softmax (Predição de 0 a 36)
      model.add(tf.layers.dense({
        units: 37,
        activation: 'softmax'
      }));

      model.compile({
        optimizer: tf.train.adam(0.0003),
        loss: 'categoricalCrossentropy',
        metrics: ['accuracy']
      });

      this.model = model;
      console.log("Neural Engine v5: Arquitetura de 5 camadas inicializada com sucesso.");
    } catch (err) {
      console.error("Erro fatal ao construir arquitetura neural:", err);
    }
  }

  private getFeatures(num: number): number[] {
    try {
      const n = ROULETTE_NUMBERS[num];
      if (n === undefined) return new Array(11).fill(0);
      
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

      const sumDigits = num.toString().split('').reduce((acc, digit) => acc + parseInt(digit), 0);
      const wheelIdx = WHEEL_ORDER.indexOf(num);
      const angle = (wheelIdx / 37) * 2 * Math.PI;

      return [
        num / 36,
        colorMap[n.color] / 2,
        n.isEven ? 1 : 0,
        (n.dozen - 1) / 2,
        (n.column - 1) / 2,
        (sectorMap[num] || 0) / 3,
        termGroup / 3,
        terminal / 9,
        sumDigits / 11,
        Math.sin(angle),
        Math.cos(angle)
      ];
    } catch (e) {
      return new Array(11).fill(0);
    }
  }

  private lastTrainSize: number = 0;

  async train(history: number[]) {
    await this.initPromise;
    if (!this.model || history.length < 25 || this.isTraining || (history.length - this.lastTrainSize < 5)) return;

    this.isTraining = true;
    this.lastTrainSize = history.length;
    
    try {
      const windowSize = 15;
      const inputs: number[][][] = [];
      const labels: number[][] = [];

      // Aumentado para 200 amostras para maior profundidade histórica
      const trainingHistory = history.slice(0, 200);

      for (let i = 0; i < trainingHistory.length - windowSize; i++) {
        const target = trainingHistory[i];
        const window = trainingHistory.slice(i + 1, i + 1 + windowSize).reverse().map(n => this.getFeatures(n));
        
        const label = new Array(37).fill(0);
        label[target] = 1;

        inputs.push(window);
        labels.push(label);
      }

      if (inputs.length === 0) {
        this.isTraining = false;
        return;
      }

      const xs = tf.tensor3d(inputs);
      const ys = tf.tensor2d(labels);

      // Treino progressivo com 'Super Convergence'
      await this.model.fit(xs, ys, {
        epochs: 30, // Aumentado para melhor convergência
        batchSize: 8, // Reduzido para maior sensibilidade a padrões sutis
        verbose: 0,
        shuffle: true
      });

      xs.dispose();
      ys.dispose();
    } catch (error) {
      console.error("Falha na convergência neural:", error);
    } finally {
      this.isTraining = false;
    }
  }

  predict(history: number[]): number[] {
    if (!this.model || history.length < 15) return new Array(37).fill(0);

    try {
      return tf.tidy(() => {
        const input = history.slice(0, 15).reverse().map(n => this.getFeatures(n));
        const inputTensor = tf.tensor3d([input]);
        const prediction = this.model!.predict(inputTensor) as tf.Tensor;
        const scores = prediction.dataSync() as Float32Array;
        return Array.from(scores);
      });
    } catch (error) {
      console.error("Erro na inferência neural:", error);
      return new Array(37).fill(0);
    }
  }
}

export const neuralEngine = new NeuralEngine();
