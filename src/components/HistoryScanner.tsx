import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Image as ImageIcon, Upload, Loader2, CheckCircle2, AlertCircle, X, Hash } from 'lucide-react';
import { toast } from 'sonner';

interface HistoryScannerProps {
  onNumbersDetected: (nums: number[]) => void;
}

const HistoryScanner: React.FC<HistoryScannerProps> = ({ onNumbersDetected }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [detectedNums, setDetectedNums] = useState<number[]>([]);
  const [showModal, setShowModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processImage = async (imageSource: string | File) => {
    setIsScanning(true);
    setDetectedNums([]);
    
    try {
      // Create a canvas to pre-process the image
      const img = new Image();
      const imageUrl = typeof imageSource === 'string' ? imageSource : URL.createObjectURL(imageSource);
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imageUrl;
      });

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error("Could not get canvas context");

      // Set canvas size to image size * 2 for better balance between precision and payload size
      const scale = 2;
      const padding = 50; 
      canvas.width = img.width * scale + padding * 2;
      canvas.height = img.height * scale + padding * 2;

      // Fill with white background
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw upscaled image with padding and WITHOUT smoothing
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, padding, padding, img.width * scale, img.height * scale);

      // MANUAL PIXEL PROCESSING
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // Very sensitive threshold to catch all colors (Red, Green, White)
        const maxColor = Math.max(r, g, b);
        const isNumber = maxColor > 40;
        
        // Convert to Black (0) on White (255)
        const val = isNumber ? 0 : 255;
        
        data[i] = val;
        data[i + 1] = val;
        data[i + 2] = val;
      }
      ctx.putImageData(imageData, 0, 0);

      // Convert canvas to base64 for Proxy
      const base64Data = canvas.toDataURL('image/png').split(',')[1];

      const res = await fetch("/api/analyze-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: base64Data,
          prompt: "Extract all roulette numbers (0-36) from this history screenshot. Return ONLY a JSON array of integers in the order they appear (top-left to bottom-right)."
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to process image");
      }
      
      const { result: nums } = await res.json();
      const validNums = (nums as number[]).filter(n => n >= 0 && n <= 36);
      
      if (validNums.length > 0) {
        setDetectedNums(validNums);
        toast.success(`${validNums.length} números detectados com inteligência artificial.`);
      } else {
        toast.error("Nenhum número de roleta (0-36) detectado.");
      }
    } catch (err) {
      console.error("OCR Error:", err);
      toast.error("Erro ao processar imagem. Tente um print mais nítido.");
    } finally {
      setIsScanning(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      processImage(file).catch(err => {
        console.error("Unhandled processImage error (file):", err);
      });
    }
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          const url = URL.createObjectURL(file);
          setPreviewUrl(url);
          processImage(file).catch(err => {
            console.error("Unhandled processImage error (paste):", err);
          });
          break;
        }
      }
    }
  };

  const confirmAdd = () => {
    if (detectedNums.length > 0) {
      onNumbersDetected(detectedNums);
      setShowModal(false);
      setPreviewUrl(null);
      setDetectedNums([]);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black text-white uppercase tracking-widest transition-all"
      >
        <ImageIcon className="w-3.5 h-3.5 text-gold-primary" />
        Importar Print
      </button>

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[110] flex items-center justify-center p-6"
            onPaste={handlePaste}
          >
            <div className="w-full max-w-xl glass-card rounded-[2.5rem] border border-white/10 overflow-hidden flex flex-col max-h-[85vh]">
              {/* Header */}
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gold-primary/10 rounded-xl flex items-center justify-center">
                    <Upload className="w-5 h-5 text-gold-primary" />
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-white uppercase tracking-widest">Importar Histórico</h2>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Análise de Print de Tela</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-zinc-400" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-8">
                {!previewUrl ? (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-video border-2 border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-gold-primary/30 hover:bg-white/5 transition-all group"
                  >
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Upload className="w-8 h-8 text-zinc-600 group-hover:text-gold-primary" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-black text-white uppercase tracking-tight">Clique ou Cole um Print</p>
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Suporta PNG, JPG e Clipboard</p>
                    </div>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept="image/*" 
                      onChange={handleFileChange}
                    />
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="relative aspect-video rounded-2xl overflow-hidden border border-white/10 bg-black">
                      <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
                      {isScanning && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
                          <Loader2 className="w-10 h-10 text-gold-primary animate-spin" />
                          <span className="text-[10px] font-black text-white uppercase tracking-[0.3em] animate-pulse">Analisando Padrões...</span>
                        </div>
                      )}
                    </div>

                    {detectedNums.length > 0 && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Números Identificados ({detectedNums.length})</h3>
                          <button 
                            onClick={() => { setPreviewUrl(null); setDetectedNums([]); }}
                            className="text-[10px] font-black text-red-500 uppercase tracking-widest"
                          >
                            Limpar
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {detectedNums.map((num, i) => (
                            <div 
                              key={i}
                              className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black border border-white/10 ${
                                num === 0 ? 'bg-green-600' : 
                                [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36].includes(num) ? 'bg-red-600' : 'bg-zinc-900'
                              }`}
                            >
                              {num}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action */}
              <div className="p-6 bg-black/40 border-t border-white/5 flex gap-4">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-4 bg-white/5 border border-white/10 rounded-2xl text-white text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                >
                  Cancelar
                </button>
                <button
                  disabled={isScanning || detectedNums.length === 0}
                  onClick={confirmAdd}
                  className="flex-[2] py-4 gold-gradient rounded-2xl text-black text-[10px] font-black uppercase tracking-widest shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Adicionar ao Histórico
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default HistoryScanner;
