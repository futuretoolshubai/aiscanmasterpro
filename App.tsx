
import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, FileText, Settings, Home, FolderOpen, MoreHorizontal, 
  Plus, ChevronLeft, Check, Download, Languages, Sparkles,
  Trash2, Copy, X, Maximize2, Moon, Sun, Lock, RotateCw, 
  Edit3, Printer, PenTool, Type, Cloud, Crown, Zap, Image as ImageIcon,
  Share2, Shield, CreditCard, User, LogOut, Search, Filter, Play, Info
} from 'lucide-react';
import { ViewState, ScannedPage, DocumentRecord, FilterType, ToastMessage, UserPlan, UserStats, FREE_LIMITS, ADMOB_CONFIG } from './types';
import { performOCR, translateText, generateSmartDetails } from './services/geminiService';
import { applyFilter, generatePDF, rotateImage, addWatermark, overlaySignature, compressImage } from './services/imageUtils';

// --- Utils ---
const vibrate = () => {
  if (navigator.vibrate) {
    navigator.vibrate(10);
  }
};

const languagesList = [
    { code: 'en', name: 'English' },
    { code: 'ur', name: 'Urdu (اردو)' },
    { code: 'ar', name: 'Arabic (العربية)' },
    { code: 'hi', name: 'Hindi (हिंदी)' },
    { code: 'zh', name: 'Chinese (中文)' },
    { code: 'es', name: 'Spanish (Español)' },
    { code: 'fr', name: 'French (Français)' },
    { code: 'de', name: 'German (Deutsch)' },
    { code: 'ru', name: 'Russian (Русский)' },
    { code: 'pt', name: 'Portuguese (Português)' },
    { code: 'ja', name: 'Japanese (日本語)' },
    { code: 'ko', name: 'Korean (한국어)' },
    { code: 'tr', name: 'Turkish (Türkçe)' },
    { code: 'it', name: 'Italian (Italiano)' },
    { code: 'id', name: 'Indonesian (Bahasa)' },
    { code: 'th', name: 'Thai (ไทย)' },
    { code: 'vi', name: 'Vietnamese (Tiếng Việt)' },
    { code: 'ms', name: 'Malay (Melayu)' },
    { code: 'fa', name: 'Persian (فارسی)' },
    { code: 'pa', name: 'Punjabi (پنجابی)' },
];

// --- Ad Components (Mock/Simulated for Web) ---

const AdBanner = () => (
    <div className="w-full h-[50px] bg-[#f7f7f7] border-t border-gray-300 flex items-center justify-center relative overflow-hidden select-none">
        <div className="absolute top-0 right-0 bg-gray-200 text-[8px] text-gray-500 px-1">Ads by Google</div>
        <div className="flex flex-col items-center">
            <span className="font-mono text-[10px] text-gray-400">{ADMOB_CONFIG.BANNER_ID.substring(0, 20)}...</span>
            <span className="font-bold text-gray-600 text-xs">Banner Ad Space</span>
        </div>
    </div>
);

const FullScreenAd = ({ type, onClose, onReward }: { type: 'INTERSTITIAL' | 'REWARDED' | 'APP_OPEN', onClose: () => void, onReward?: () => void }) => {
    const [timeLeft, setTimeLeft] = useState(type === 'APP_OPEN' ? 3 : 5);
    const [canClose, setCanClose] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    setCanClose(true);
                    if (type === 'REWARDED' && onReward) onReward();
                    if (type === 'APP_OPEN') setTimeout(onClose, 500); // Auto close app open
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center text-white animate-fade-in">
            <div className="absolute top-4 right-4">
                {canClose ? (
                    <button onClick={onClose} className="bg-white/20 p-2 rounded-full backdrop-blur-md hover:bg-white/30 transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                ) : (
                    <div className="w-8 h-8 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
                )}
            </div>
            
            <div className="bg-white text-black p-6 rounded-2xl w-80 text-center shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 bg-[#fab005] text-white text-[10px] font-bold px-2 py-0.5">Ad</div>
                <div className="mb-4 flex justify-center">
                   <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                      <Play className="w-8 h-8 fill-current" />
                   </div>
                </div>
                <h3 className="font-bold text-lg mb-1">{type === 'REWARDED' ? 'Reward Granted!' : 'Sponsored Content'}</h3>
                <p className="text-gray-500 text-xs mb-4">
                    {type === 'APP_OPEN' ? 'Opening AI ScanMaster...' : 'This is a test ad for AdMob integration.'}
                </p>
                
                <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-blue-600 h-full transition-all duration-1000 ease-linear" style={{ width: `${(1 - timeLeft/5)*100}%` }}></div>
                </div>
                <div className="mt-2 text-[10px] text-gray-400 font-mono">
                    ID: {type === 'INTERSTITIAL' ? ADMOB_CONFIG.INTERSTITIAL_ID : ADMOB_CONFIG.REWARDED_ID}
                </div>
            </div>
        </div>
    );
};

const Toaster = ({ messages }: { messages: ToastMessage[] }) => (
  <div className="fixed top-12 left-0 right-0 z-[100] flex flex-col items-center gap-2 pointer-events-none px-4">
    {messages.map((msg) => (
      <div 
        key={msg.id}
        className={`px-5 py-3 rounded-2xl shadow-2xl backdrop-blur-xl text-sm font-semibold animate-slide-up flex items-center gap-3 border transition-all transform hover:scale-105
          ${msg.type === 'error' ? 'bg-red-500/90 text-white border-red-400/50' : 'bg-slate-800/90 text-white border-slate-600/50'}
        `}
      >
        {msg.type === 'success' && <div className="bg-green-500 rounded-full p-0.5"><Check className="w-3 h-3 text-white" /></div>}
        {msg.message}
      </div>
    ))}
  </div>
);

const FAB = ({ onClick }: { onClick: () => void }) => (
  <button 
    onClick={() => { vibrate(); onClick(); }}
    className="fixed bottom-24 right-6 w-16 h-16 bg-gradient-to-tr from-blue-600 to-indigo-500 text-white rounded-full shadow-2xl shadow-blue-500/40 flex items-center justify-center transition-all hover:scale-110 active:scale-95 z-40 group border-4 border-white/20 hover:border-white/40"
  >
    <Camera className="w-7 h-7 drop-shadow-md" />
    <div className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-20 transition-opacity"></div>
  </button>
);

const TabBar = ({ currentView, setView, isPro }: { currentView: ViewState, setView: (v: ViewState) => void, isPro: boolean }) => {
  const tabs = [
    { id: ViewState.HOME, icon: Home, label: 'Home' },
    { id: ViewState.FILES, icon: FolderOpen, label: 'Files' },
    { id: ViewState.PREMIUM, icon: Crown, label: 'Pro', highlight: true },
    { id: ViewState.TOOLS, icon: MoreHorizontal, label: 'Tools' },
    { id: ViewState.SETTINGS, icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-dark-card/90 backdrop-blur-xl border-t border-gray-200 dark:border-dark-border pb-safe pt-2 px-2 flex justify-between z-50 shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
      {tabs.map((tab) => {
        const isActive = currentView === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => { vibrate(); setView(tab.id); }}
            className={`flex flex-col items-center gap-1.5 p-2 w-full rounded-2xl transition-all duration-300 relative overflow-hidden group`}
          >
             {tab.highlight && !isPro && <div className="absolute top-2 right-4 w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)]"></div>}
            <tab.icon 
                className={`w-6 h-6 z-10 transition-all duration-300 ${isActive ? 'text-primary dark:text-blue-400 -translate-y-1' : tab.highlight ? 'text-amber-500' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300'}`} 
                fill={isActive ? "currentColor" : "none"}
                strokeWidth={isActive ? 2.5 : 2}
            />
            <span className={`text-[10px] font-bold z-10 transition-all ${isActive ? 'text-primary dark:text-blue-400 opacity-100' : tab.highlight ? 'text-amber-500' : 'text-gray-400 dark:text-gray-500 opacity-80'}`}>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};

// --- Modals ---

const SignatureModal = ({ onSave, onClose }: { onSave: (dataUrl: string) => void, onClose: () => void }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const startDrawing = (e: any) => {
    const canvas = canvasRef.current;
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    if(!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000';
    setIsDrawing(true);
  };

  const draw = (e: any) => {
    if(!isDrawing) return;
    const canvas = canvasRef.current;
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    if(!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => setIsDrawing(false);

  const clear = () => {
    const canvas = canvasRef.current;
    if(canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
      vibrate();
    }
  };

  const save = () => {
    if(canvasRef.current) {
      vibrate();
      onSave(canvasRef.current.toDataURL('image/png'));
    }
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden animate-scale-in shadow-2xl">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-gray-800 flex items-center gap-2"><PenTool className="w-4 h-4" /> Add Signature</h3>
          <button onClick={onClose}><X className="w-6 h-6 text-gray-500" /></button>
        </div>
        <div className="p-4 bg-white relative">
           <canvas 
             ref={canvasRef} 
             width={320} 
             height={200} 
             className="border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 w-full touch-none cursor-crosshair"
             onMouseDown={startDrawing}
             onMouseMove={draw}
             onMouseUp={stopDrawing}
             onMouseLeave={stopDrawing}
             onTouchStart={startDrawing}
             onTouchMove={draw}
             onTouchEnd={stopDrawing}
           />
           <div className="absolute top-6 right-6 text-gray-400 pointer-events-none text-xs font-medium">Sign inside box</div>
        </div>
        <div className="p-4 bg-gray-50 flex gap-3">
          <button onClick={clear} className="flex-1 py-3 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl font-bold text-sm transition-colors">Clear</button>
          <button onClick={save} className="flex-1 py-3 bg-primary text-white hover:bg-primary-dark rounded-xl font-bold text-sm shadow-lg shadow-primary/30 transition-all">Save & Apply</button>
        </div>
      </div>
    </div>
  );
};

const WatermarkModal = ({ onSave, onClose }: { onSave: (text: string) => void, onClose: () => void }) => {
  const [text, setText] = useState('CONFIDENTIAL');
  return (
    <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-dark-card rounded-3xl w-full max-w-sm p-6 animate-scale-in shadow-2xl">
        <h3 className="font-bold text-lg mb-4 dark:text-white flex items-center gap-2"><Type className="w-5 h-5 text-gray-500"/> Add Watermark</h3>
        <input 
          type="text" 
          value={text} 
          onChange={(e) => setText(e.target.value)} 
          className="w-full p-4 border rounded-2xl mb-6 bg-gray-50 dark:bg-slate-800 dark:border-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium"
          placeholder="Enter Text"
        />
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 bg-gray-100 dark:bg-slate-700 dark:text-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors">Cancel</button>
          <button onClick={() => { vibrate(); onSave(text); }} className="flex-1 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark shadow-lg shadow-primary/30 transition-all">Apply</button>
        </div>
      </div>
    </div>
  );
};

// --- Views ---

const PremiumView = ({ onBuy, onClose }: { onBuy: () => void, onClose: () => void }) => (
    <div className="fixed inset-0 bg-black/80 z-[80] backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
        <div className="bg-white dark:bg-dark-card w-full max-w-md h-[92vh] sm:h-auto rounded-t-[2rem] sm:rounded-[2rem] overflow-hidden animate-slide-up flex flex-col relative shadow-2xl">
            <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-black/20 dark:bg-white/10 backdrop-blur-md rounded-full z-10 hover:bg-black/30 transition-colors"><X className="w-5 h-5 text-white"/></button>
            
            {/* Hero */}
            <div className="premium-gradient p-8 pb-12 text-white text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <Crown className="w-20 h-20 mx-auto mb-4 text-amber-300 animate-bounce-slow drop-shadow-[0_0_15px_rgba(251,191,36,0.6)]" />
                <h2 className="text-3xl font-display font-extrabold mb-2 tracking-tight">Upgrade to PRO</h2>
                <p className="text-blue-100 text-sm font-medium opacity-90">Unlock the full power of AI ScanMaster</p>
                
                {/* Decorative circles */}
                <div className="absolute -top-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-amber-400/20 rounded-full blur-3xl"></div>
            </div>

            {/* Features List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 -mt-6 bg-white dark:bg-dark-card rounded-t-[2rem]">
                {[
                    { title: 'Unlimited OCR', desc: 'No daily limits on text extraction', icon: FileText },
                    { title: 'Cloud Backup', desc: 'Sync docs across devices (50GB)', icon: Cloud },
                    { title: 'All 100+ Languages', desc: 'Full translation support', icon: Languages },
                    { title: 'No Ads & Watermark', desc: 'Clean, professional export', icon: Shield },
                    { title: 'Advanced PDF Tools', desc: 'Merge, Split, Compress, & more', icon: Settings }
                ].map((f, i) => (
                    <div key={i} className="flex gap-4 items-center group">
                        <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center flex-shrink-0 text-green-600 dark:text-green-400 group-hover:scale-110 transition-transform">
                            <f.icon className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-800 dark:text-white text-sm">{f.title}</h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{f.desc}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Plans */}
            <div className="p-6 bg-gray-50 dark:bg-slate-900 border-t border-gray-100 dark:border-gray-800 pb-safe">
                <div className="flex gap-4 mb-6">
                    <button className="flex-1 border-2 border-transparent bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm hover:border-primary focus:border-primary transition-all text-center group">
                        <div className="text-[10px] text-gray-400 uppercase font-bold mb-1 tracking-wider">Monthly</div>
                        <div className="text-xl font-black dark:text-white group-hover:text-primary transition-colors">$2.99</div>
                    </button>
                    <button className="flex-1 border-2 border-amber-400 bg-amber-50 dark:bg-amber-900/10 p-4 rounded-2xl shadow-md relative text-center transform scale-105">
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 gold-gradient text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg whitespace-nowrap">BEST VALUE</div>
                        <div className="text-[10px] text-amber-600 dark:text-amber-500 uppercase font-bold mb-1 tracking-wider">Lifetime</div>
                        <div className="text-xl font-black text-amber-600 dark:text-amber-400">$49.99</div>
                    </button>
                </div>
                <button 
                    onClick={() => { vibrate(); onBuy(); }}
                    className="w-full py-4 premium-gradient text-white font-bold rounded-2xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all text-lg tracking-wide"
                >
                    Continue
                </button>
                <p className="text-[10px] text-center text-gray-400 mt-4">Recurring billing, cancel anytime. Restore purchase available.</p>
            </div>
        </div>
    </div>
);

const CameraView = ({ onCapture, onCancel }: { onCapture: (img: string) => void, onCancel: () => void }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isFlashing, setIsFlashing] = useState(false);

  useEffect(() => {
    let stream: MediaStream | null = null;
    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Camera error", err);
      }
    };
    startCamera();
    return () => {
      stream?.getTracks().forEach(t => t.stop());
    };
  }, []);

  const capture = () => {
    vibrate();
    setIsFlashing(true);
    setTimeout(() => {
      if (videoRef.current && canvasRef.current) {
        const vid = videoRef.current;
        const can = canvasRef.current;
        can.width = vid.videoWidth;
        can.height = vid.videoHeight;
        can.getContext('2d')?.drawImage(vid, 0, 0);
        onCapture(can.toDataURL('image/jpeg', 0.9));
      }
      setIsFlashing(false);
    }, 100);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        if (evt.target?.result) onCapture(evt.target.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-[60] flex flex-col">
      <div className="relative flex-1 bg-black overflow-hidden group">
        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
        <canvas ref={canvasRef} className="hidden" />
        {isFlashing && <div className="absolute inset-0 bg-white z-50 animate-fade-out duration-300"></div>}
        <div className="absolute inset-0 pointer-events-none">
           <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/80 to-transparent"></div>
           <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-black/90 to-transparent"></div>
           {/* Guidelines */}
           <div className="w-full h-full border-2 border-white/10 relative opacity-60">
             <div className="absolute top-1/3 w-full h-px bg-white/20"></div>
             <div className="absolute top-2/3 w-full h-px bg-white/20"></div>
             <div className="absolute left-1/3 h-full w-px bg-white/20"></div>
             <div className="absolute left-2/3 h-full w-px bg-white/20"></div>
             {/* Corners */}
             <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white/80 rounded-tl-lg"></div>
             <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white/80 rounded-tr-lg"></div>
             <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white/80 rounded-bl-lg"></div>
             <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white/80 rounded-br-lg"></div>
           </div>
        </div>
        <button onClick={onCancel} className="absolute top-6 left-6 p-3 bg-white/10 rounded-full text-white backdrop-blur-md hover:bg-white/20 active:scale-90 transition-all z-50">
          <X className="w-6 h-6" />
        </button>
      </div>
      <div className="h-44 bg-black flex items-center justify-around pb-10 px-6">
        <label className="flex flex-col items-center text-white/70 gap-3 cursor-pointer hover:text-white transition-colors group">
          <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-all backdrop-blur-sm">
             <ImageIcon className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-bold tracking-widest uppercase">Import</span>
          <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
        </label>
        <button 
          onClick={capture}
          className="w-20 h-20 rounded-full border-4 border-white/30 flex items-center justify-center bg-transparent active:scale-95 transition-all relative"
        >
          <div className="w-16 h-16 bg-white rounded-full shadow-[0_0_20px_rgba(255,255,255,0.6)] group-active:scale-90 transition-transform"></div>
        </button>
        <div className="w-12 flex flex-col items-center gap-2 opacity-50">
           <div className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center">
             <Zap className="w-5 h-5 text-white" />
           </div>
           <span className="text-[10px] font-bold tracking-widest text-white uppercase">Auto</span>
        </div>
      </div>
    </div>
  );
};

const EditorView = ({ 
  pages, 
  onSave, 
  onCancel, 
  onAddPage 
}: { 
  pages: ScannedPage[], 
  onSave: (pages: ScannedPage[]) => void, 
  onCancel: () => void,
  onAddPage: () => void
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activePages, setActivePages] = useState<ScannedPage[]>(JSON.parse(JSON.stringify(pages)));
  const [processing, setProcessing] = useState(false);
  const currentPage = activePages[currentIndex];

  const updateFilter = async (filter: FilterType) => {
    vibrate(); setProcessing(true);
    const newUrl = await applyFilter(currentPage.originalDataUrl, filter);
    const updated = [...activePages];
    updated[currentIndex] = { ...updated[currentIndex], processedDataUrl: newUrl, filter };
    setActivePages(updated);
    setProcessing(false);
  };

  const handleRotate = async () => {
    vibrate(); setProcessing(true);
    const newRotation = (currentPage.rotation + 90) % 360;
    const newUrl = await rotateImage(currentPage.processedDataUrl, 90);
    const updated = [...activePages];
    updated[currentIndex] = { ...updated[currentIndex], processedDataUrl: newUrl, rotation: newRotation, originalDataUrl: newUrl };
    setActivePages(updated);
    setProcessing(false);
  };

  return (
    <div className="fixed inset-0 bg-slate-900 z-[60] flex flex-col">
      <div className="h-16 flex items-center justify-between px-4 bg-slate-900 border-b border-white/10 pt-safe">
        <button onClick={onCancel} className="text-white p-2 hover:bg-white/10 rounded-full transition-colors"><X /></button>
        <div className="text-white text-xs font-bold bg-white/10 px-4 py-1.5 rounded-full backdrop-blur-md">Page {currentIndex + 1} / {activePages.length}</div>
        <button onClick={() => { vibrate(); onSave(activePages); }} className="text-primary font-bold px-5 py-2 bg-white rounded-full text-sm hover:bg-gray-100 shadow-lg shadow-white/10 transition-all">Save</button>
      </div>
      <div className="flex-1 relative flex items-center justify-center bg-slate-800 p-6 overflow-hidden bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
        {processing ? (
          <div className="flex flex-col items-center gap-3">
             <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent shadow-lg"></div>
             <p className="text-white/50 text-xs font-bold uppercase tracking-widest">Processing</p>
          </div>
        ) : (
          <img src={currentPage.processedDataUrl} className="max-w-full max-h-full shadow-2xl rounded-sm object-contain animate-scale-in" />
        )}
        <button onClick={handleRotate} className="absolute bottom-6 right-6 p-4 bg-black/40 backdrop-blur-md rounded-full text-white border border-white/20 hover:bg-white/20 shadow-lg active:rotate-90 transition-all"><RotateCw className="w-6 h-6" /></button>
      </div>
      <div className="h-28 bg-slate-900 flex items-center gap-3 overflow-x-auto px-4 border-t border-white/10">
           {activePages.map((p, i) => (
             <button key={p.id} onClick={() => { vibrate(); setCurrentIndex(i); }} className={`flex-shrink-0 w-16 h-20 border-2 rounded-lg overflow-hidden transition-all relative ${i === currentIndex ? 'border-primary ring-2 ring-primary/50' : 'border-transparent opacity-60 hover:opacity-100'}`}>
                <img src={p.processedDataUrl} className="w-full h-full object-cover" />
                <div className="absolute bottom-0 right-0 bg-black/60 text-white text-[8px] px-1">{i+1}</div>
             </button>
           ))}
           <button onClick={onAddPage} className="w-16 h-20 bg-slate-800 flex flex-col items-center justify-center gap-1 rounded-lg text-white/50 border border-dashed border-white/20 hover:border-white/50 hover:text-white transition-all"><Plus className="w-6 h-6" /></button>
      </div>
      <div className="bg-slate-950 pb-safe pt-2">
        <div className="flex justify-evenly items-center text-white/60 text-xs">
          {Object.values(FilterType).map((f) => (
            <button key={f} onClick={() => updateFilter(f)} className={`flex flex-col items-center gap-2 p-3 w-20 transition-all ${currentPage.filter === f ? 'text-primary scale-110' : 'hover:text-white'}`}>
               <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${currentPage.filter === f ? 'border-primary bg-primary/20 shadow-[0_0_10px_rgba(37,99,235,0.4)]' : 'border-gray-600'}`}>
                 <div className={`w-full h-full rounded-full opacity-50 ${f === FilterType.GRAYSCALE ? 'bg-gray-400' : 'bg-transparent'}`}></div>
               </div>
               <span className="font-bold tracking-wide text-[10px] uppercase">{f}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const ResultView = ({ 
  doc, onBack, onSaveDoc, isPro, userStats, onUpdateStats, onShowPremium, onTriggerAd
}: { 
  doc: DocumentRecord, onBack: () => void, onSaveDoc: (d: DocumentRecord) => void, isPro: boolean, userStats: UserStats, onUpdateStats: (s: UserStats) => void, onShowPremium: () => void, onTriggerAd: (type: 'REWARDED') => Promise<void>
}) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'text' | 'translate'>('preview');
  const [extractedText, setExtractedText] = useState(doc.extractedText || '');
  const [loadingAI, setLoadingAI] = useState(false);
  const [translation, setTranslation] = useState('');
  const [showSignModal, setShowSignModal] = useState(false);
  const [showWatermarkModal, setShowWatermarkModal] = useState(false);
  const [isEditingText, setIsEditingText] = useState(false);

  const runOCR = async () => {
    if(extractedText) return;
    if(!isPro && userStats.ocrCountToday >= FREE_LIMITS.OCR_DAILY) {
        onShowPremium();
        return;
    }

    setLoadingAI(true);
    try {
      const text = await performOCR(doc.pages[0].processedDataUrl);
      setExtractedText(text);
      if(!isPro) onUpdateStats({...userStats, ocrCountToday: userStats.ocrCountToday + 1});
      
      const details = await generateSmartDetails(text);
      onSaveDoc({ ...doc, extractedText: text, title: details.title, tags: details.tags, summary: details.summary });
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAI(false);
    }
  };

  const handleTranslate = async (lang: string) => {
    if (!extractedText) return;
    if(!isPro && userStats.translationCountToday >= FREE_LIMITS.TRANSLATE_DAILY) {
        onShowPremium();
        return;
    }
    setLoadingAI(true);
    try {
      const trans = await translateText(extractedText, lang);
      setTranslation(trans);
      if(!isPro) onUpdateStats({...userStats, translationCountToday: userStats.translationCountToday + 1});
    } catch (e) { console.error("Translation Failed"); } finally { setLoadingAI(false); }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: doc.title,
          text: doc.summary || "Shared from AI ScanMaster",
          url: window.location.href // Ideally this would be the blob url if generated
        });
      } catch (err) { console.log("Share canceled"); }
    } else {
      alert("Sharing not supported on this device.");
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-dark-bg">
      {showSignModal && <SignatureModal onSave={async (s) => { setShowSignModal(false); const url = await overlaySignature(doc.pages[0].processedDataUrl, s); const p = [...doc.pages]; p[0].processedDataUrl = url; onSaveDoc({...doc, pages: p}); }} onClose={() => setShowSignModal(false)} />}
      {showWatermarkModal && <WatermarkModal onSave={async (t) => { setShowWatermarkModal(false); const url = await addWatermark(doc.pages[0].processedDataUrl, t); const p = [...doc.pages]; p[0].processedDataUrl = url; onSaveDoc({...doc, pages: p}); }} onClose={() => setShowWatermarkModal(false)} />}
      
      <div className="bg-white/90 dark:bg-dark-card/90 backdrop-blur-md shadow-sm p-4 pt-safe flex items-center justify-between z-10 sticky top-0 border-b border-gray-100 dark:border-gray-800">
        <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"><ChevronLeft className="dark:text-white" /></button>
        <div className="flex flex-col items-center">
             <h2 className="font-bold font-display text-sm dark:text-white truncate max-w-[200px]">{doc.title}</h2>
             <span className="text-[10px] text-gray-400">{new Date(doc.date).toLocaleDateString()}</span>
        </div>
        <div className="flex gap-2">
            <button onClick={handleShare} className="text-gray-600 dark:text-gray-300 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800"><Share2 className="w-5 h-5" /></button>
            <button onClick={async () => { vibrate(); if(!isPro) await onTriggerAd('REWARDED'); generatePDF(doc.pages.map(p => p.processedDataUrl), isPro); }} className="text-primary bg-blue-50 dark:bg-blue-900/30 p-2 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"><Download className="w-5 h-5" /></button>
        </div>
      </div>

      <div className="flex px-4 py-3 bg-white dark:bg-dark-card border-b border-gray-100 dark:border-dark-border gap-2">
        <button className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-all ${activeTab === 'preview' ? 'bg-secondary text-white shadow-lg shadow-gray-500/30' : 'bg-gray-50 dark:bg-slate-800 dark:text-gray-400 text-gray-500 hover:bg-gray-100'}`} onClick={() => setActiveTab('preview')}>Original</button>
        <button className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1 transition-all ${activeTab === 'text' ? 'bg-primary text-white shadow-lg shadow-blue-500/30' : 'bg-gray-50 dark:bg-slate-800 dark:text-gray-400 text-gray-500 hover:bg-gray-100'}`} onClick={() => { setActiveTab('text'); runOCR(); }}><FileText className="w-3 h-3" /> OCR Text</button>
        <button className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1 transition-all ${activeTab === 'translate' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'bg-gray-50 dark:bg-slate-800 dark:text-gray-400 text-gray-500 hover:bg-gray-100'}`} onClick={() => setActiveTab('translate')}><Languages className="w-3 h-3" /> Translate</button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 scroll-smooth bg-gray-50 dark:bg-dark-bg">
        {activeTab === 'preview' ? (
          <div className="flex flex-col gap-6 animate-fade-in pb-24">
             {doc.pages.map((p, idx) => (
               <div key={p.id} className="relative shadow-xl shadow-gray-200 dark:shadow-black/50 rounded-2xl overflow-hidden group bg-white">
                 <img src={p.processedDataUrl} className="w-full" />
                 <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-full">Page {idx + 1}</div>
               </div>
             ))}
             <div className="grid grid-cols-2 gap-4 mt-2">
                <button onClick={() => { vibrate(); setShowSignModal(true); }} className="flex items-center justify-center gap-2 p-4 bg-white dark:bg-dark-card rounded-2xl shadow-sm border border-gray-200 dark:border-dark-border active:scale-95 transition-transform"><PenTool className="w-5 h-5 text-indigo-500" /><span className="font-bold text-sm dark:text-gray-200">Sign PDF</span></button>
                <button onClick={() => { vibrate(); setShowWatermarkModal(true); }} className="flex items-center justify-center gap-2 p-4 bg-white dark:bg-dark-card rounded-2xl shadow-sm border border-gray-200 dark:border-dark-border active:scale-95 transition-transform"><Type className="w-5 h-5 text-indigo-500" /><span className="font-bold text-sm dark:text-gray-200">Watermark</span></button>
             </div>
          </div>
        ) : activeTab === 'text' ? (
          <div className="animate-fade-in pb-24">
            {loadingAI && <div className="p-12 flex flex-col items-center justify-center text-gray-400 gap-3"><div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div><span className="text-xs font-bold uppercase tracking-wider animate-pulse">Extracting Text...</span></div>}
            {!loadingAI && extractedText && (
              <div className="space-y-4">
                 <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-900 p-5 rounded-2xl border border-blue-100 dark:border-slate-700 shadow-sm">
                     <div className="flex items-center gap-2 mb-3"><Sparkles className="w-4 h-4 text-blue-600" /><h4 className="text-xs font-bold uppercase text-blue-800 dark:text-blue-300 tracking-wider">AI Summary</h4></div>
                     <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed italic">{doc.summary || "Generating summary..."}</p>
                 </div>
                 <div className="bg-white dark:bg-dark-card p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-border">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2"><FileText className="w-4 h-4 text-gray-400"/> Extracted Content</h3>
                      <div className="flex gap-2">
                          <button onClick={() => { navigator.clipboard.writeText(extractedText); alert("Copied!"); }} className="p-2 bg-gray-50 dark:bg-slate-700 rounded-lg hover:bg-gray-100"><Copy className="w-4 h-4 dark:text-white" /></button>
                          <button onClick={() => setIsEditingText(!isEditingText)} className="p-2 bg-gray-50 dark:bg-slate-700 rounded-lg hover:bg-gray-100"><Edit3 className="w-4 h-4 dark:text-white" /></button>
                      </div>
                    </div>
                    {isEditingText ? <textarea className="w-full h-96 p-4 text-sm border rounded-xl dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none" value={extractedText} onChange={(e) => { setExtractedText(e.target.value); onSaveDoc({ ...doc, extractedText: e.target.value }); }} /> : <p className="text-sm leading-relaxed whitespace-pre-wrap dark:text-gray-300 selectable-text">{extractedText}</p>}
                 </div>
              </div>
            )}
          </div>
        ) : (
           <div className="animate-fade-in pb-24">
              <div className="bg-white dark:bg-dark-card p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-border sticky top-0 z-10">
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2 tracking-widest">Target Language</label>
                <div className="relative">
                    <select onChange={(e) => handleTranslate(e.target.value)} className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-3 pl-4 text-sm dark:text-white appearance-none font-medium focus:ring-2 focus:ring-indigo-500 outline-none">
                        <option value="">Select Language ({languagesList.length}+)</option>
                        {languagesList.map(l => <option key={l.code} value={l.name}>{l.name}</option>)}
                    </select>
                    <div className="absolute right-4 top-3.5 pointer-events-none"><Languages className="w-4 h-4 text-gray-400" /></div>
                </div>
              </div>
              {loadingAI && <div className="p-12 flex flex-col items-center justify-center gap-3"><div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent"></div><span className="text-xs font-bold text-indigo-500 uppercase tracking-widest animate-pulse">Translating...</span></div>}
              {translation && (
                  <div className="mt-4 bg-white dark:bg-dark-card p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-border">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold dark:text-white flex items-center gap-2"><Languages className="w-4 h-4 text-indigo-500"/> Translation</h3>
                        <button onClick={() => { navigator.clipboard.writeText(translation); alert("Copied!"); }} className="p-2 bg-gray-50 dark:bg-slate-700 rounded-lg hover:bg-gray-100"><Copy className="w-4 h-4 dark:text-white" /></button>
                      </div>
                      <p className="text-sm dark:text-gray-300 leading-relaxed selectable-text" dir="auto">{translation}</p>
                  </div>
              )}
           </div>
        )}
      </div>
      {/* Banner in Result View */}
      { !isPro && <div className="absolute bottom-0 left-0 right-0 z-20"><AdBanner /></div> }
    </div>
  );
};

// --- Main App ---

function App() {
  const [view, setView] = useState<ViewState>(ViewState.ONBOARDING);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [currentScan, setCurrentScan] = useState<ScannedPage[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [darkMode, setDarkMode] = useState(false);
  const [userPlan, setUserPlan] = useState<UserPlan>('FREE');
  const [showPaywall, setShowPaywall] = useState(false);
  const [userStats, setUserStats] = useState<UserStats>({ ocrCountToday: 0, translationCountToday: 0, lastResetDate: new Date().toDateString() });
  
  // Ad States
  const [activeAd, setActiveAd] = useState<{type: 'INTERSTITIAL' | 'REWARDED' | 'APP_OPEN', resolve?: () => void} | null>(null);

  // Load Data
  useEffect(() => {
    const saved = localStorage.getItem('aiscan_docs');
    const introDone = localStorage.getItem('aiscan_intro');
    const plan = localStorage.getItem('aiscan_plan');
    const stats = localStorage.getItem('aiscan_stats');

    if (saved) setDocuments(JSON.parse(saved));
    if (introDone) setView(ViewState.HOME);
    if (plan === 'PRO') setUserPlan('PRO');
    if (stats) {
        const parsed = JSON.parse(stats);
        if (parsed.lastResetDate !== new Date().toDateString()) {
            setUserStats({ ocrCountToday: 0, translationCountToday: 0, lastResetDate: new Date().toDateString() });
        } else {
            setUserStats(parsed);
        }
    }

    if (window.matchMedia('(prefers-color-scheme: dark)').matches) setDarkMode(true);

    // App Open Ad Trigger
    if(introDone && userPlan !== 'PRO') {
       setTimeout(() => {
           setActiveAd({ type: 'APP_OPEN' });
       }, 500);
    }

  }, []);

  useEffect(() => {
    localStorage.setItem('aiscan_docs', JSON.stringify(documents));
    localStorage.setItem('aiscan_plan', userPlan);
    localStorage.setItem('aiscan_stats', JSON.stringify(userStats));
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [documents, darkMode, userPlan, userStats]);

  const addToast = (msg: string, type: ToastMessage['type'] = 'info') => {
    const id = Math.random().toString();
    setToasts(prev => [...prev, { id, message: msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  };

  const triggerAd = (type: 'INTERSTITIAL' | 'REWARDED'): Promise<void> => {
      if(userPlan === 'PRO') return Promise.resolve();
      return new Promise((resolve) => {
          setActiveAd({ type, resolve });
      });
  };

  const handleAdClose = () => {
      if(activeAd?.resolve) activeAd.resolve();
      setActiveAd(null);
  };

  const upgradeToPro = () => {
      setUserPlan('PRO');
      setShowPaywall(false);
      addToast("Welcome to PRO! Features Unlocked.", 'success');
  };
  
  const resetApp = () => {
      if(confirm("Are you sure you want to delete all data and reset?")) {
          localStorage.clear();
          window.location.reload();
      }
  };

  // --- Views ---

  if (view === ViewState.ONBOARDING) {
    return (
        <div className="h-screen w-full bg-primary dark:bg-dark-bg flex flex-col items-center justify-center p-8 text-white text-center relative overflow-hidden">
            {/* Catchy animated background */}
            <div className="absolute inset-0 opacity-30 pointer-events-none bg-[radial-gradient(circle_at_50%_50%,_var(--tw-gradient-stops))] from-teal-400 via-blue-600 to-transparent animate-pulse-fast"></div>
            <div className="absolute top-0 -left-20 w-72 h-72 bg-purple-500/30 rounded-full blur-3xl animate-bounce-slow"></div>
            <div className="absolute bottom-0 -right-20 w-80 h-80 bg-teal-400/20 rounded-full blur-3xl"></div>
            
            <div className="w-32 h-32 bg-white/10 rounded-[2.5rem] flex items-center justify-center mb-10 backdrop-blur-xl border border-white/20 shadow-2xl animate-scale-in relative z-10">
                <Sparkles className="w-16 h-16 text-teal-300 drop-shadow-[0_0_10px_rgba(20,184,166,0.5)]" />
            </div>
            
            <h1 className="text-5xl font-display font-extrabold mb-4 tracking-tight z-10">AI Scan<span className="text-teal-300">Master</span></h1>
            <div className="bg-white/20 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-8 border border-white/10 z-10 backdrop-blur-md">Pro Edition</div>
            
            <p className="text-blue-100 mb-12 max-w-xs text-lg font-medium z-10 leading-relaxed">Scan, Translate & Manage docs with Enterprise-Grade AI.</p>
            
            <button onClick={() => { vibrate(); localStorage.setItem('aiscan_intro', 'true'); setView(ViewState.HOME); }} className="bg-white text-primary font-bold py-4 px-12 rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all z-10 text-lg">Get Started</button>
        </div>
    );
  }

  if (view === ViewState.CAMERA) return <CameraView onCapture={(img) => { setCurrentScan(prev => [...prev, { id: Math.random().toString(), originalDataUrl: img, processedDataUrl: img, filter: FilterType.ORIGINAL, rotation: 0 }]); setView(ViewState.EDITOR); }} onCancel={() => setView(ViewState.HOME)} />;
  
  if (view === ViewState.EDITOR) return <EditorView pages={currentScan} onSave={async (pages) => { 
      // Interstitial on Save
      await triggerAd('INTERSTITIAL');
      
      const newDoc: DocumentRecord = { 
          id: Math.random().toString(), 
          title: `Scan ${new Date().toLocaleDateString()}`, 
          date: Date.now(), 
          pages, 
          tags: ['New'], 
          isSynced: false, 
          sizeBytes: 1024,
          thumbnailUrl: pages[0].processedDataUrl 
      };
      setDocuments(prev => [newDoc, ...prev]); setSelectedDocId(newDoc.id); setView(ViewState.RESULT); addToast("Document Saved!", 'success');
  }} onCancel={() => setView(ViewState.HOME)} onAddPage={() => setView(ViewState.CAMERA)} />;

  if (view === ViewState.RESULT && selectedDocId) {
      const doc = documents.find(d => d.id === selectedDocId);
      if(!doc) return null;
      return <ResultView doc={doc} onBack={() => setView(ViewState.HOME)} onSaveDoc={(u) => setDocuments(p => p.map(d => d.id === u.id ? u : d))} isPro={userPlan === 'PRO'} userStats={userStats} onUpdateStats={setUserStats} onShowPremium={() => setShowPaywall(true)} onTriggerAd={triggerAd} />;
  }

  return (
    <div className="min-h-screen pb-24 bg-slate-50 dark:bg-dark-bg transition-colors duration-300 font-sans">
      <Toaster messages={toasts} />
      {showPaywall && <PremiumView onBuy={upgradeToPro} onClose={() => setShowPaywall(false)} />}
      
      {/* Full Screen Ads Overlay */}
      {activeAd && (
          <FullScreenAd 
            type={activeAd.type} 
            onClose={handleAdClose} 
            onReward={activeAd.type === 'REWARDED' ? () => addToast("Reward Earned!") : undefined} 
          />
      )}

      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-dark-card/80 backdrop-blur-xl px-6 py-4 flex justify-between items-center border-b border-gray-100 dark:border-gray-800 pt-safe transition-all">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-gradient-to-br from-primary to-blue-700 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20"><Sparkles className="w-5 h-5" /></div>
          <h1 className="text-xl font-display font-bold text-slate-800 dark:text-white tracking-tight">ScanMaster <span className="text-primary text-[10px] bg-primary/10 px-1.5 py-0.5 rounded ml-1 align-top border border-primary/20">PRO</span></h1>
        </div>
        <div className="flex gap-2">
            {!userPlan.includes('PRO') && (
                <button onClick={() => setShowPaywall(true)} className="gold-gradient text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 shadow-md hover:scale-105 transition-transform">
                    <Crown className="w-3 h-3" /> Upgrade
                </button>
            )}
            <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-full bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"><Moon className="w-5 h-5" /></button>
        </div>
      </header>

      <main className="p-6">
        {view === ViewState.HOME && (
          <div className="space-y-8 animate-fade-in">
            {/* 4 Main Cards Dashboard */}
            <div className="grid grid-cols-2 gap-4">
                <button onClick={() => { setCurrentScan([]); setView(ViewState.CAMERA); }} className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-6 rounded-[2rem] flex flex-col justify-between h-44 shadow-2xl shadow-blue-500/30 relative overflow-hidden group hover:scale-[1.02] transition-transform active:scale-95">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-xl group-hover:bg-white/20 transition-all"></div>
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center"><Camera className="w-6 h-6" /></div>
                    <div className="relative z-10 text-left">
                        <h3 className="font-bold text-xl mb-1">Smart Scan</h3>
                        <p className="text-blue-100 text-xs font-medium opacity-80">Auto-detect edges</p>
                    </div>
                </button>
                <div className="flex flex-col gap-4 h-44">
                    <button onClick={() => { if(documents.length>0){setSelectedDocId(documents[0].id); setView(ViewState.RESULT);} else addToast("Scan a document first"); }} className="bg-white dark:bg-dark-card p-4 rounded-[1.5rem] flex-1 shadow-sm border border-gray-100 dark:border-gray-800 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors group">
                        <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"><FileText className="w-5 h-5" /></div>
                        <div className="text-left">
                            <h3 className="font-bold text-gray-800 dark:text-white text-sm">OCR Text</h3>
                            <p className="text-gray-400 text-[10px]">Extract info</p>
                        </div>
                    </button>
                    <button onClick={() => { if(documents.length>0){setSelectedDocId(documents[0].id); setView(ViewState.RESULT);} else addToast("Scan a document first"); }} className="bg-white dark:bg-dark-card p-4 rounded-[1.5rem] flex-1 shadow-sm border border-gray-100 dark:border-gray-800 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors group">
                        <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"><Languages className="w-5 h-5" /></div>
                        <div className="text-left">
                            <h3 className="font-bold text-gray-800 dark:text-white text-sm">Translate</h3>
                            <p className="text-gray-400 text-[10px]">100+ langs</p>
                        </div>
                    </button>
                </div>
                <button onClick={() => setView(ViewState.TOOLS)} className="col-span-2 bg-gradient-to-r from-teal-500 to-emerald-600 text-white p-5 rounded-[2rem] flex items-center justify-between shadow-xl shadow-teal-500/20 relative overflow-hidden group">
                    <div className="absolute -left-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center"><Settings className="w-6 h-6" /></div>
                        <div className="text-left">
                            <h3 className="font-bold text-lg">PDF Tools</h3>
                            <p className="text-teal-100 text-xs">Merge, Split, Sign & Protect</p>
                        </div>
                    </div>
                    <ChevronLeft className="rotate-180 w-6 h-6 opacity-70" />
                </button>
            </div>

            {/* Recent */}
            <div>
               <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-lg dark:text-white">Recent Files</h3>
                  <button onClick={() => setView(ViewState.FILES)} className="text-primary text-xs font-bold bg-primary/10 px-3 py-1 rounded-full hover:bg-primary/20 transition-colors">See All</button>
               </div>
               {documents.slice(0, 3).map(doc => (
                  <div key={doc.id} onClick={() => { setSelectedDocId(doc.id); setView(ViewState.RESULT); }} className="bg-white dark:bg-dark-card p-3 rounded-2xl flex gap-4 mb-3 shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-md transition-shadow cursor-pointer">
                     <div className="w-14 h-16 bg-gray-100 dark:bg-slate-800 rounded-xl overflow-hidden shadow-inner relative">
                         {doc.thumbnailUrl ? <img src={doc.thumbnailUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><FileText className="text-gray-300 w-6 h-6"/></div>}
                     </div>
                     <div className="flex-1 flex flex-col justify-center">
                        <h4 className="font-bold text-sm dark:text-white mb-1">{doc.title}</h4>
                        <div className="flex items-center gap-2">
                             <span className="text-[10px] bg-gray-100 dark:bg-slate-800 text-gray-500 px-2 py-0.5 rounded-full">{doc.tags[0]}</span>
                             <span className="text-[10px] text-gray-400">{doc.pages.length} Pages • {new Date(doc.date).toLocaleDateString()}</span>
                        </div>
                     </div>
                  </div>
               ))}
               {documents.length === 0 && (
                   <div className="text-center py-10 bg-gray-50 dark:bg-dark-card/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                       <div className="w-16 h-16 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400"><Camera className="w-6 h-6"/></div>
                       <p className="text-gray-500 text-sm font-medium">No scans yet. Start now!</p>
                   </div>
               )}
            </div>
          </div>
        )}

        {view === ViewState.TOOLS && (
           <div className="space-y-6 animate-fade-in">
              <h2 className="text-2xl font-display font-bold dark:text-white">PDF Tools</h2>
              <div className="grid grid-cols-2 gap-4">
                 {[
                     { icon: Maximize2, label: 'Merge PDF', pro: true, action: () => addToast("Select files to merge (Simulated)") },
                     { icon: ImageIcon, label: 'Img to PDF', pro: false, action: () => { setCurrentScan([]); setView(ViewState.CAMERA); } },
                     { icon: Download, label: 'Compress PDF', pro: false, action: () => addToast("Opening Compressor...") },
                     { icon: PenTool, label: 'Sign PDF', pro: false, action: () => addToast("Open a doc to sign") },
                     { icon: Lock, label: 'Lock PDF', pro: true, action: () => userPlan==='PRO' ? addToast("Password Prompt...") : setShowPaywall(true) },
                     { icon: Type, label: 'Word to PDF', pro: true, action: () => userPlan==='PRO' ? addToast("Converter...") : setShowPaywall(true) },
                 ].map((t, i) => (
                     <div key={i} onClick={async () => { vibrate(); if(userPlan !== 'PRO' && t.pro) { await triggerAd('REWARDED'); } t.action(); }} className="bg-white dark:bg-dark-card rounded-2xl p-6 flex flex-col items-center justify-center gap-3 shadow-sm border border-gray-100 dark:border-gray-800 relative overflow-hidden group cursor-pointer hover:shadow-md transition-all active:scale-95">
                        {t.pro && <div className="absolute top-3 right-3"><Crown className="w-4 h-4 text-amber-500 drop-shadow-sm" /></div>}
                        <div className="w-14 h-14 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform group-hover:bg-primary/10 mb-1"><t.icon className="w-7 h-7" /></div>
                        <span className="text-sm font-bold text-center dark:text-gray-300">{t.label}</span>
                     </div>
                 ))}
              </div>
           </div>
        )}

        {view === ViewState.PREMIUM && <PremiumView onBuy={upgradeToPro} onClose={() => setView(ViewState.HOME)} />}

        {view === ViewState.FILES && (
            <div className="animate-fade-in space-y-5">
                <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
                    {['All', 'Work', 'Personal', 'Receipts', 'ID Cards'].map(c => <button key={c} className="px-5 py-2.5 bg-white dark:bg-dark-card rounded-full text-xs font-bold shadow-sm border border-gray-100 dark:border-gray-800 dark:text-white whitespace-nowrap hover:bg-gray-50 transition-colors">{c}</button>)}
                </div>
                {documents.length > 0 ? (
                    <div className="grid grid-cols-2 gap-4">
                        {documents.map(doc => (
                            <div key={doc.id} onClick={() => { setSelectedDocId(doc.id); setView(ViewState.RESULT); }} className="bg-white dark:bg-dark-card p-3 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 group hover:shadow-lg transition-all">
                                 <div className="aspect-[3/4] bg-gray-100 dark:bg-slate-800 rounded-xl mb-3 overflow-hidden relative shadow-inner">
                                     {doc.thumbnailUrl ? <img src={doc.thumbnailUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><FileText className="text-gray-300 w-10 h-10"/></div>}
                                     <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors"></div>
                                     {doc.isSynced && <div className="absolute top-2 right-2 bg-blue-500/80 backdrop-blur-md p-1 rounded-full"><Cloud className="w-3 h-3 text-white" /></div>}
                                 </div>
                                 <h4 className="font-bold text-sm truncate dark:text-white pl-1">{doc.title}</h4>
                                 <div className="flex justify-between items-center mt-1 px-1">
                                    <p className="text-[10px] text-gray-400">{doc.pages.length} pages</p>
                                    <MoreHorizontal className="w-4 h-4 text-gray-300" />
                                 </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                        <FolderOpen className="w-16 h-16 mb-4 opacity-20" />
                        <p>No files found</p>
                    </div>
                )}
            </div>
        )}

        {view === ViewState.SETTINGS && (
            <div className="space-y-6 animate-fade-in">
                <h2 className="text-2xl font-bold font-display dark:text-white">Settings</h2>
                
                <div className="bg-white dark:bg-dark-card rounded-3xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800">
                     <div className="p-4 border-b border-gray-50 dark:border-gray-800 flex items-center justify-between">
                         <span className="dark:text-white font-bold flex items-center gap-3"><User className="w-5 h-5 text-gray-400"/> Account</span>
                         <span className="text-xs bg-gray-100 dark:bg-slate-700 px-3 py-1 rounded-full text-gray-500 font-bold">Guest</span>
                     </div>
                     <div onClick={() => setShowPaywall(true)} className="p-4 border-b border-gray-50 dark:border-gray-800 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                         <span className="dark:text-white font-bold flex items-center gap-3"><Crown className="w-5 h-5 text-amber-500"/> Subscription</span>
                         <span className={`text-[10px] font-black px-2 py-1 rounded uppercase tracking-wide ${userPlan==='PRO' ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-500'}`}>{userPlan}</span>
                     </div>
                     <div className="p-4 flex items-center justify-between">
                         <span className="dark:text-white font-bold flex items-center gap-3"><Cloud className="w-5 h-5 text-blue-400"/> Cloud Backup</span>
                         <span className="text-xs text-gray-400 font-medium">{userPlan==='PRO' ? 'Active (50GB)' : 'Disabled'}</span>
                     </div>
                </div>

                <div className="bg-white dark:bg-dark-card rounded-3xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800">
                     {[
                         { icon: Shield, label: 'Privacy Policy' },
                         { icon: Share2, label: 'Share App' },
                         { icon: FileText, label: 'Terms of Service' }
                     ].map((item, i) => (
                         <div key={i} className="p-4 border-b border-gray-50 dark:border-gray-800 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer">
                             <span className="dark:text-white font-medium flex items-center gap-3"><item.icon className="w-5 h-5 text-gray-400"/> {item.label}</span>
                             <ChevronLeft className="w-4 h-4 rotate-180 text-gray-300" />
                         </div>
                     ))}
                     <div onClick={resetApp} className="p-4 flex items-center justify-between cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors group">
                         <span className="text-red-500 font-bold flex items-center gap-3"><LogOut className="w-5 h-5"/> Reset App Data</span>
                     </div>
                </div>

                {userPlan === 'FREE' && (
                    <div onClick={() => setShowPaywall(true)} className="bg-gradient-to-r from-amber-400 to-orange-500 rounded-3xl p-6 text-white text-center shadow-xl shadow-orange-500/20 cursor-pointer hover:scale-[1.02] transition-transform">
                        <Crown className="w-12 h-12 mx-auto mb-3 text-white drop-shadow-md" />
                        <h3 className="font-bold text-xl mb-1">Go Premium</h3>
                        <p className="text-sm opacity-90 mb-5 font-medium">Remove ads, unlimited OCR & more.</p>
                        <button className="bg-white text-orange-600 px-8 py-3 rounded-full font-bold text-sm shadow-lg">Upgrade Now</button>
                    </div>
                )}
                
                <p className="text-center text-xs text-gray-400 pt-4">Version 2.0.1 (Pro Build)</p>
            </div>
        )}
      </main>

      {/* Banner Ad fixed at bottom for Home View */}
      {userPlan === 'FREE' && view === ViewState.HOME && <div className="fixed bottom-[74px] left-0 right-0 z-40"><AdBanner /></div>}

      <FAB onClick={() => { setCurrentScan([]); setView(ViewState.CAMERA); }} />
      <TabBar currentView={view} setView={setView} isPro={userPlan === 'PRO'} />
    </div>
  );
}

export default App;
