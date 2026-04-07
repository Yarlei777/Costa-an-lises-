import React, { useRef, useState } from 'react';
import { createWorker } from 'tesseract.js';
import { X, Zap, Loader2, CheckCircle2, Image as ImageIcon, Upload, FileSearch, RotateCcw, BrainCircuit } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { ROULETTE_NUMBERS } from '../constants';
import { extractNumbersFromImage } from '../services/geminiVision';

interface OCRScannerProps {
  onNumberDetected: (num: number | number[]) => void;
  onClose: () => void;
}

const OCRScanner: React.FC<OCRScannerProps> = ({ onNumberDetected, onClose }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [detectedSequence, setDetectedSequence] = useState<number[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [lastImage, setLastImage] = useState<HTMLImageElement | null>(null);

  const processImage = async (imageSource: HTMLImageElement, base64Data: string) => {
    setIsScanning(true);
    setDetectedSequence([]);
    setLastImage(imageSource);
    
    try {
      console.log('Iniciando OCR com Gemini Vision...');
      const numbers = await extractNumbersFromImage(base64Data);
      
      if (numbers && numbers.length > 0) {
        setDetectedSequence(numbers);
        toast.success(`${numbers.length} números detectados pela IA.`);
        setIsScanning(false);
        return;
      }
      
      console.log('Gemini não retornou números, tentando Tesseract...');
      
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) {
        setIsScanning(false);
        return;
      }

      tempCanvas.width = imageSource.width;
      tempCanvas.height = imageSource.height;
      tempCtx.drawImage(imageSource, 0, 0);

      // Simple grayscale preprocessing for better OCR
      const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        data[i] = data[i + 1] = data[i + 2] = avg;
      }
      tempCtx.putImageData(imageData, 0, 0);

      const worker = await createWorker('eng', 1, {
        logger: m => console.log('Tesseract:', m.status, Math.round(m.progress * 100) + '%'),
      });
      
      await worker.setParameters({
        tessedit_char_whitelist: '0123456789',
        tessedit_pageseg_mode: '11' as any,
      });

      const result = await worker.recognize(tempCanvas);
      await worker.terminate();

      const words = (result as any)?.data?.words;
      console.log('Palavras detectadas (Tesseract):', words?.length);

      if (!words || !Array.isArray(words) || words.length === 0) {
        toast.error('Nenhum dado encontrado na imagem. Tente um print mais nítido.');
        setIsScanning(false);
        return;
      }

      processWords(words);
    } catch (err) {
      console.error('OCR Error:', err);
      toast.error('Erro ao processar imagem. Verifique a qualidade do print.');
    } finally {
      setIsScanning(false);
    }
  };

  const processWords = (words: any[]) => {
    // Extract and sort numbers by position (top to bottom)
    const validNumbers = words
      .map((word: any) => ({
        text: word.text.replace(/\D/g, ''),
        y: word.bbox?.y0 || 0,
        x: word.bbox?.x0 || 0
      }))
      .filter((item: any) => item.text !== '' && !isNaN(parseInt(item.text)) && parseInt(item.text) >= 0 && parseInt(item.text) <= 36)
      .sort((a: any, b: any) => a.y - b.y) // Sort by vertical position (top to bottom)
      .map((item: any) => parseInt(item.text));

    if (validNumbers.length > 0) {
      setDetectedSequence(validNumbers);
      toast.success(`${validNumbers.length} números detectados.`);
    } else {
      toast.error('Nenhum número de roleta válido (0-36) encontrado.');
    }
  };

  const handleConfirm = () => {
    if (detectedSequence.length > 0) {
      onNumberDetected(detectedSequence);
      onClose();
    }
  };

  const handleRemoveFromSequence = (index: number) => {
    setDetectedSequence(prev => prev.filter((_, i) => i !== index));
  };

  const handleReverseSequence = () => {
    setDetectedSequence(prev => [...prev].reverse());
    toast.info('Ordem da sequência invertida.');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      const img = new Image();
      img.onload = () => {
        processImage(img, base64);
      };
      img.src = base64;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-[10000] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-4 overflow-y-auto" translate="no">
      <div className="w-full max-w-2xl relative my-auto py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gold-primary/10 flex items-center justify-center border border-gold-primary/20">
              <ImageIcon className="w-5 h-5 text-gold-primary" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white uppercase tracking-tighter italic">Análise de <span className="gold-text">Histórico</span></h2>
              <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">Upload de imagem para detecção automática</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Upload Area / Preview */}
        <div 
          onClick={() => !isScanning && fileInputRef.current?.click()}
          className={`relative aspect-video rounded-[2rem] overflow-hidden border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center p-8 text-center group ${
            previewUrl 
              ? 'border-gold-primary/30 bg-zinc-900' 
              : 'border-white/10 bg-white/5 hover:border-gold-primary/50 hover:bg-white/[0.08]'
          }`}
        >
          {previewUrl ? (
            <>
              <img 
                src={previewUrl} 
                alt="Preview" 
                className={`w-full h-full object-contain transition-all ${isScanning ? 'opacity-40 blur-sm' : 'opacity-100'}`}
              />
              {isScanning && (
                <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4">
                  <div className="relative">
                    <Loader2 className="w-12 h-12 text-gold-primary animate-spin" />
                    <BrainCircuit className="absolute inset-0 m-auto w-6 h-6 text-gold-primary animate-pulse" />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gold-primary animate-pulse">IA Analisando Histórico...</p>
                  
                  <motion.div 
                    initial={{ top: '0%' }}
                    animate={{ top: '100%' }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="absolute left-0 right-0 h-1 bg-gold-primary/50 shadow-[0_0_20px_rgba(212,175,55,0.5)] z-10"
                  />
                </div>
              )}
              <div className="absolute bottom-4 right-4 px-4 py-2 bg-black/60 backdrop-blur-md rounded-xl border border-white/10 text-[8px] font-black uppercase tracking-widest text-white opacity-0 group-hover:opacity-100 transition-opacity">
                Clique para trocar imagem
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="w-20 h-20 rounded-3xl bg-gold-primary/10 flex items-center justify-center border border-gold-primary/20 mx-auto group-hover:scale-110 transition-transform">
                <Upload className="w-8 h-8 text-gold-primary" />
              </div>
              <div>
                <p className="text-sm font-black text-white uppercase tracking-tighter">Selecionar Foto do Histórico</p>
                <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Formatos suportados: JPG, PNG, WEBP</p>
              </div>
            </div>
          )}
          
          <input 
            ref={fileInputRef}
            type="file" 
            accept="image/*" 
            className="hidden" 
            onChange={handleFileSelect}
          />
        </div>

        {/* Detected Sequence List */}
        {detectedSequence.length > 0 && !isScanning && (
          <div className="mt-4 p-4 bg-white/5 border border-white/10 rounded-2xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex flex-col">
                <h3 className="text-[9px] font-black text-white uppercase tracking-widest">Sequência Detectada</h3>
                <p className="text-[7px] text-zinc-500 uppercase tracking-widest mt-0.5">Esquerda = Mais Recente</p>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={handleReverseSequence}
                  className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-[7px] font-black text-zinc-400 uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all flex items-center gap-1.5"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                  Inverter
                </button>
                <span className="text-[7px] font-bold text-zinc-500 uppercase tracking-widest">{detectedSequence.length} números</span>
              </div>
            </div>
            <div className="max-h-[120px] overflow-y-auto pr-2 custom-scrollbar">
              <div className="flex flex-wrap gap-1.5">
                {detectedSequence.map((num, idx) => (
                  <div key={`${num}-${idx}`} className="relative group">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black border border-white/10 ${
                      ROULETTE_NUMBERS[num].color === 'red' ? 'bg-red-600' : 
                      ROULETTE_NUMBERS[num].color === 'black' ? 'bg-zinc-900' : 'bg-emerald-600'
                    } text-white shadow-lg`}>
                      {num}
                    </div>
                    <button 
                      onClick={() => handleRemoveFromSequence(idx)}
                      className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full flex items-center justify-center text-[7px] text-white opacity-0 group-hover:opacity-100 transition-opacity border border-black/20"
                    >
                      <X className="w-2 h-2" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <p className="mt-3 text-[7px] font-bold text-zinc-500 uppercase tracking-widest italic">
              * Verifique a ordem. O primeiro (esquerda) deve ser o mais recente.
            </p>
          </div>
        )}

        {/* Results & Controls */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3">
          <button 
            onClick={handleConfirm}
            disabled={isScanning || detectedSequence.length === 0}
            className={`py-4 rounded-xl font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-2 transition-all ${
              isScanning || detectedSequence.length === 0
                ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed' 
                : 'neon-green-gradient text-black hover:scale-[1.02] active:scale-[0.98]'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            Confirmar e Adicionar
          </button>

          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isScanning}
            className="py-4 rounded-xl bg-white/5 border border-white/10 text-white font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-2 hover:bg-white/10 transition-all"
          >
            <FileSearch className="w-4 h-4" />
            Nova Análise
          </button>
        </div>

        {/* Instructions */}
        <div className="mt-6 p-4 bg-gold-primary/5 border border-gold-primary/20 rounded-xl">
          <p className="text-[8px] font-bold text-gold-primary/80 leading-relaxed uppercase tracking-widest text-center">
            Tire um print do histórico e faça o upload. <br/>
            A IA detectará a sequência (mais recente para o mais antigo).
          </p>
        </div>
      </div>
    </div>
  );
};

export default OCRScanner;
