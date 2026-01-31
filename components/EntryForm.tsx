
import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, MicOff, Save, ArrowLeft, Sparkles, Image as ImageIcon, PenTool, X, ChevronDown, Edit3, Wand2
} from 'lucide-react';
import { FeelingType, Language, Translation, Emotion, Person, FeelingEntry } from '../types';
import { analyzeStructuredEntry, updatePersonFromEntry } from '../services/geminiService';
import { saveEntry, getSettings, getPeople, savePerson } from '../services/storageService';
import { EMOTION_CONFIG } from '../config';

interface EntryFormProps {
  language: Language;
  t: Translation;
  onBack: () => void;
  onSave: () => void;
  initialEntry?: FeelingEntry | null; // For Editing
}

interface IWindow extends Window {
  webkitSpeechRecognition: any;
  SpeechRecognition: any;
}

export const EntryForm: React.FC<EntryFormProps> = ({ language, t, onBack, onSave, initialEntry }) => {
  // Sentiment State
  const [availableEmotions, setAvailableEmotions] = useState<Emotion[]>([]);
  const [selectedEmotion, setSelectedEmotion] = useState<Emotion>('HAPPY');
  
  // Form State
  // Action is now implicitly "Thought"
  const [subject, setSubject] = useState<string>(''); // Acts as "The Thought"
  const [reaction, setReaction] = useState<string>('Smiled');
  const [notes, setNotes] = useState<string>(''); // Acts as "Context/Details"

  // UI State
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [knownPeople, setKnownPeople] = useState<Person[]>([]);
  const [showSubjectSuggestions, setShowSubjectSuggestions] = useState(false);
  const [hasSpeechSupport, setHasSpeechSupport] = useState(false);

  // Drawing & Image State
  const [showDrawing, setShowDrawing] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentImage, setCurrentImage] = useState<string | null>(null); 

  const recognitionRef = useRef<any>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const settings = getSettings();
    const people = getPeople();
    setKnownPeople(people);

    const allEmotions = Object.keys(EMOTION_CONFIG) as Emotion[];
    
    // Filter based on Positive/Negative/Sexual Global Toggles
    const filtered = allEmotions.filter(emo => {
      const type = EMOTION_CONFIG[emo].type;
      if (type === FeelingType.POSITIVE) return settings.enablePositive;
      if (type === FeelingType.NEGATIVE) return settings.enableNegative;
      if (type === FeelingType.SEXUAL) return settings.enableSexual;
      return true;
    });

    setAvailableEmotions(filtered);

    // Initialize from initialEntry if present
    if (initialEntry) {
        if (initialEntry.emotion) setSelectedEmotion(initialEntry.emotion);
        if (initialEntry.text) setNotes(initialEntry.text);
        if (initialEntry.images && initialEntry.images.length > 0) setCurrentImage(initialEntry.images[0]);
        if (initialEntry.reaction) setReaction(initialEntry.reaction);
        
        // When editing, we try to strip "Thought about" if it exists, otherwise just show the reason
        const actionPrefix = "Thought about";
        if (initialEntry.reason?.startsWith(actionPrefix)) {
             setSubject(initialEntry.reason?.replace(actionPrefix, '').trim() || '');
        } else {
             setSubject(initialEntry.reason || '');
        }
    } else {
        if (filtered.length > 0 && !filtered.includes(selectedEmotion)) {
            setSelectedEmotion(filtered[0]);
        }
    }
  }, [initialEntry]);

  const currentConfig = EMOTION_CONFIG[selectedEmotion] || EMOTION_CONFIG['HAPPY'];

  // --- Image Compression ---
  const compressImage = (base64Str: string, maxWidth = 800, quality = 0.7): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxWidth) {
          const ratio = width / height;
          if (width > height) {
              width = maxWidth;
              height = maxWidth / ratio;
          } else {
              height = maxWidth;
              width = maxWidth * ratio;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', quality));
        } else {
            resolve(base64Str);
        }
      };
      img.onerror = () => resolve(base64Str);
    });
  };

  // --- Speech Recognition ---
  useEffect(() => {
    const win = window as unknown as IWindow;
    const SpeechRecognition = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (SpeechRecognition) {
      setHasSpeechSupport(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = false; 
      recognition.interimResults = true;
      recognition.lang = language === Language.HR ? 'hr-HR' : language === Language.SV ? 'sv-SE' : 'en-US';

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
           setNotes(prev => prev + (prev ? ' ' : '') + finalTranscript);
        }
      };
      
      recognition.onend = () => setIsListening(false);
      recognitionRef.current = recognition;
    } else {
        setHasSpeechSupport(false);
    }
  }, [language]);

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) { console.error(e); }
    }
  };

  // --- Auto-Fill / Enhance Logic ---
  const handleEnhance = async () => {
      setIsProcessing(true);
      setStatusMessage(t.analyzing);
      try {
          const result = await analyzeStructuredEntry({
              action: "Thought about", // Hardcoded context
              subject, 
              reaction, 
              notes, 
              emotion: selectedEmotion
          }, language, knownPeople);
          
          // We ignore result.action updates to enforce "Thought" mode
          if (result.subject) setSubject(result.subject);
          if (result.reaction) setReaction(result.reaction);
      } catch(e) {
          console.error(e);
      } finally {
          setIsProcessing(false);
          setStatusMessage('');
      }
  };

  const handleAutoFill = async () => {
      if (!notes.trim()) return;
      handleEnhance();
  };

  const generateId = () => {
     try {
         if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
             return (crypto as any).randomUUID();
         }
     } catch(e) { /* ignore */ }
     return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  // --- Save Logic ---
  const handleSave = async () => {
    if (!subject.trim() && !notes.trim()) return;
    
    setIsProcessing(true);
    setStatusMessage(t.analyzing);

    try {
        let processedImage = null;
        if (currentImage) {
            setStatusMessage(t.compressing);
            processedImage = await compressImage(currentImage);
            setStatusMessage(t.analyzing);
        }

        const analysis = await analyzeStructuredEntry({
            action: "Thought about", // Context
            subject, 
            reaction, 
            notes, 
            emotion: selectedEmotion
        }, language, knownPeople);

        // Fetch latest people from storage to ensure we have the most up-to-date list
        const currentStoredPeople = getPeople();
        const peopleInEntryNames: string[] = [];
        const peopleObjectsToUpdate: Person[] = [];

        // 1. Identify all unique names mentioned (from AI analysis)
        const namesDetected = analysis.people || [];

        // 2. Also check if the Subject is a known person who wasn't caught by AI (rare but possible)
        const subjectLower = subject.toLowerCase();
        const subjectIsKnown = currentStoredPeople.find(p => p.name.toLowerCase() === subjectLower);
        if (subjectIsKnown && !namesDetected.includes(subjectIsKnown.name)) {
            namesDetected.push(subjectIsKnown.name);
        }

        // 3. Process each name: find existing or create NEW
        for (const name of namesDetected) {
            const cleanName = name.trim();
            if (!cleanName) continue;

            peopleInEntryNames.push(cleanName);

            const existingPerson = currentStoredPeople.find(p => p.name.toLowerCase() === cleanName.toLowerCase());
            
            if (existingPerson) {
                peopleObjectsToUpdate.push(existingPerson);
            } else {
                // AUTO-CREATE NEW PERSON
                const newPerson: Person = {
                    id: generateId(),
                    name: cleanName,
                    relation: '', 
                    interests: [],
                    notes: 'Automatically added from diary entry.'
                };
                savePerson(newPerson); // Save to local storage
                peopleObjectsToUpdate.push(newPerson);
            }
        }

        const entry: FeelingEntry = {
            id: initialEntry ? initialEntry.id : generateId(),
            timestamp: initialEntry ? initialEntry.timestamp : Date.now(),
            type: currentConfig.type,
            emotion: selectedEmotion,
            text: notes || `Thought about ${subject}`,
            images: processedImage ? [processedImage] : [],
            summary: analysis.summary || `Thought: ${subject}`,
            reason: `Thought about ${subject}`,
            reaction: reaction || analysis.reaction || "Unspecified",
            people: peopleInEntryNames,
            tags: analysis.tags,
            moodScore: analysis.moodScore
        };

        saveEntry(entry);

        // --- Auto Update Person Profiles (for both old and new people) ---
        if (peopleObjectsToUpdate.length > 0) {
            setStatusMessage(t.updatingProfile);
            for (const person of peopleObjectsToUpdate) {
                const updatedPerson = await updatePersonFromEntry(person, entry, language);
                savePerson(updatedPerson);
            }
        }

        onSave();

    } catch (e) {
        console.error("Save failed", e);
    } finally {
        setIsProcessing(false);
        setStatusMessage('');
    }
  };

  // --- Quick Chips for Reaction ---
  const getReactionChips = () => {
      if (currentConfig.type === FeelingType.SEXUAL) {
          return ["Made me horny", "Gave me an erection", "Turned me on", "Felt intense", "Got wet"];
      }
      if (currentConfig.type === FeelingType.NEGATIVE) {
          return ["Cried", "Felt heavy", "Screamed", "Withdrew", "Got headache"];
      }
      return ["Smiled", "Laughed", "Felt warm", "Relaxed", "Danced"];
  };

  const handleReactionChipClick = (chip: string) => {
      if (!reaction) {
          setReaction(chip);
      } else {
          const parts = reaction.split(',').map(s => s.trim());
          if (!parts.includes(chip)) {
              setReaction(`${reaction}, ${chip}`);
          }
      }
  };

  // --- Drawing Logic ---
  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : (e as React.MouseEvent).clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : (e as React.MouseEvent).clientY - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = '#ffffff'; 
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : (e as React.MouseEvent).clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : (e as React.MouseEvent).clientY - rect.top;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => { setIsDrawing(false); };

  const saveDrawing = () => {
    if (canvasRef.current) {
      setCurrentImage(canvasRef.current.toDataURL('image/png'));
      setShowDrawing(false);
    }
  };

  const clearCanvas = () => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      ctx && (ctx.fillStyle = "#1F2642"); 
      ctx?.fillRect(0,0, canvasRef.current.width, canvasRef.current.height);
    }
  };
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setCurrentImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col h-full bg-navy-900 relative text-white">
      {/* Header */}
      <header className="flex-none flex flex-col border-b border-white/10 bg-navy-900 z-10">
        <div className="flex items-center justify-between p-4 bg-navy-900 relative z-20">
          <button onClick={onBack} className="p-2 text-gray-400 hover:text-white transition-colors">
            <ArrowLeft size={24} />
          </button>
          <div className="flex items-center gap-2">
              {initialEntry && <Edit3 size={16} className="text-coral-500" />}
              <h2 className="font-serif font-bold text-xl text-coral-500">
                  {initialEntry ? t.edit : t.newFeeling}
              </h2>
          </div>
          <button 
             onClick={handleSave} 
             disabled={isProcessing}
             className="p-2 text-coral-500 hover:bg-coral-500/10 rounded-lg font-bold disabled:opacity-50 transition-colors"
          >
             {isProcessing ? statusMessage || t.analyzing : (initialEntry ? t.update : t.save)}
          </button>
        </div>

        {/* Emotion Grid */}
        <div className="p-4 bg-navy-800 overflow-x-auto scrollbar-hide">
          <div className="flex gap-4 min-w-max">
             {availableEmotions.map((key) => {
               const emo = key as Emotion;
               const config = EMOTION_CONFIG[emo];
               const isSelected = selectedEmotion === emo;
               const Icon = config.icon;
               const isSexual = config.type === FeelingType.SEXUAL;
               return (
                 <button
                   key={emo}
                   onClick={() => setSelectedEmotion(emo)}
                   className={`
                     flex flex-col items-center gap-2 p-3 rounded-lg transition-all border min-w-[80px]
                     ${isSelected 
                       ? (isSexual ? 'bg-purple-500/20 border-purple-500 text-purple-500' : 'bg-coral-500/20 border-coral-500 text-coral-500')
                       : 'bg-navy-700 border-white/5 text-gray-400 hover:bg-navy-600'}
                   `}
                 >
                   <Icon size={24} />
                   <span className="text-xs font-semibold tracking-wide">{t.emotions[emo]}</span>
                 </button>
               )
             })}
          </div>
        </div>
      </header>

      {/* Form Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 bg-navy-900">
        
        {/* Context Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative">
             {/* Smart Enhance Button */}
             <div className="md:col-span-2 flex justify-end">
                <button 
                    onClick={handleEnhance}
                    disabled={isProcessing}
                    className="flex items-center gap-2 text-xs font-bold text-coral-500 hover:text-white bg-coral-500/10 border border-coral-500/20 hover:bg-coral-500 px-3 py-1.5 rounded-lg transition-all disabled:opacity-50"
                >
                    <Wand2 size={14} /> {t.enhance}
                </button>
             </div>

            {/* Subject (The Thought) */}
            <div className="md:col-span-2 space-y-2 relative">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">{t.thoughtLabel}</label>
                <input 
                    type="text"
                    value={subject}
                    onChange={(e) => {
                        setSubject(e.target.value);
                        setShowSubjectSuggestions(true);
                    }}
                    onFocus={() => setShowSubjectSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSubjectSuggestions(false), 200)}
                    placeholder="e.g. I wonder if I should get a dog..."
                    className="w-full bg-navy-800 text-white border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-coral-500 placeholder-gray-600"
                />
                {/* Suggestions Dropdown */}
                {showSubjectSuggestions && knownPeople.length > 0 && (
                    <div className="absolute top-full left-0 w-full bg-navy-800 border border-white/10 rounded-xl shadow-xl z-30 mt-1 max-h-40 overflow-y-auto">
                        {knownPeople
                            .filter(p => p.name.toLowerCase().includes(subject.toLowerCase()))
                            .map(p => (
                            <button
                                key={p.id}
                                onClick={() => setSubject(p.name)}
                                className="w-full text-left px-4 py-2 hover:bg-white/5 text-gray-300 border-b border-white/5 last:border-0"
                            >
                                {p.name}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>

        {/* Reaction Section */}
        <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">{t.reactionLabel}</label>
            <input 
                type="text"
                value={reaction}
                onChange={(e) => setReaction(e.target.value)}
                placeholder="e.g. Heart raced, Smiled, Cried..."
                className="w-full bg-navy-800 text-white border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-coral-500 placeholder-gray-600"
            />
            {/* Quick Chips */}
            <div className="flex flex-wrap gap-2 mt-2">
                {getReactionChips().map(chip => (
                    <button 
                        key={chip}
                        onClick={() => handleReactionChipClick(chip)}
                        className="px-3 py-1 bg-navy-800 border border-white/5 rounded-full text-xs text-gray-400 hover:text-white hover:border-coral-500/50 transition-colors"
                    >
                        {chip}
                    </button>
                ))}
            </div>
        </div>

        {/* Notes Section with Magic Fill */}
        <div className="space-y-2">
             <div className="flex justify-between items-center">
                 <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">{t.notesLabel}</label>
                 <button 
                    onClick={handleAutoFill}
                    disabled={!notes.trim() || isProcessing}
                    className="flex items-center gap-1 text-xs text-coral-500 hover:text-coral-400 disabled:opacity-50"
                 >
                     <Sparkles size={12} /> {t.autoFill}
                 </button>
             </div>
             <div className="relative">
                <textarea 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Elaborate on why you thought this..."
                    className="w-full h-32 bg-navy-800 text-white border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-coral-500 placeholder-gray-600 resize-none"
                />
                {hasSpeechSupport && (
                    <button
                        onClick={toggleListening}
                        className={`absolute bottom-3 right-3 p-2 rounded-full transition-colors ${
                        isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-navy-900 text-gray-400 hover:text-coral-500'
                        }`}
                    >
                        {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                    </button>
                )}
             </div>
        </div>

        {/* Media */}
        <div className="flex gap-4">
             {/* Image Preview */}
             {currentImage && (
                <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-white/20 group">
                    <img src={currentImage} alt="Preview" className="w-full h-full object-cover" />
                    <button 
                        onClick={() => setCurrentImage(null)}
                        className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <X size={20} />
                    </button>
                </div>
            )}
            
            <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleFileSelect} />
            
            <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-24 h-24 bg-navy-800 rounded-xl border border-white/10 flex flex-col items-center justify-center text-gray-500 hover:text-coral-500 hover:border-coral-500/50 transition-all"
            >
                <ImageIcon size={24} className="mb-2" />
                <span className="text-[10px] uppercase font-bold">{t.uploadImage}</span>
            </button>

            <button 
                onClick={() => setShowDrawing(true)}
                className="w-24 h-24 bg-navy-800 rounded-xl border border-white/10 flex flex-col items-center justify-center text-gray-500 hover:text-coral-500 hover:border-coral-500/50 transition-all"
            >
                <PenTool size={24} className="mb-2" />
                <span className="text-[10px] uppercase font-bold">{t.drawSomething}</span>
            </button>
        </div>

      </main>

       {/* Drawing Overlay */}
       {showDrawing && (
        <div className="absolute inset-0 z-50 bg-navy-900 flex flex-col animate-fade-in-up">
           <div className="p-4 border-b border-white/10 flex justify-between items-center bg-navy-800">
             <h3 className="font-serif font-bold text-xl text-white">{t.drawing}</h3>
             <button onClick={() => setShowDrawing(false)} className="p-2 text-gray-400 hover:text-white">
               <X size={24} />
             </button>
           </div>
           
           <div className="flex-1 bg-navy-900 relative touch-none cursor-crosshair">
             <canvas 
               ref={canvasRef}
               width={window.innerWidth}
               height={window.innerHeight * 0.7}
               className="w-full h-full"
               onMouseDown={startDrawing}
               onMouseMove={draw}
               onMouseUp={stopDrawing}
               onMouseLeave={stopDrawing}
               onTouchStart={startDrawing}
               onTouchMove={draw}
               onTouchEnd={stopDrawing}
             />
           </div>
           
           <div className="p-4 border-t border-white/10 flex gap-4 bg-navy-800">
             <button onClick={clearCanvas} className="flex-1 py-3 font-semibold text-coral-500 border border-coral-500/50 rounded-lg hover:bg-coral-500/10 transition-colors">
               {t.clear}
             </button>
             <button onClick={saveDrawing} className="flex-1 py-3 font-bold bg-coral-500 text-white rounded-lg hover:bg-coral-600 transition-colors">
               {t.done}
             </button>
           </div>
        </div>
      )}

    </div>
  );
};