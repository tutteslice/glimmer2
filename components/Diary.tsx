
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  ArrowLeft, Search, Calendar, User, Tag, Trash2, Edit2,
  Smile, Frown, Sparkles, Copy, Check, Download, Share2, X, Users, Plus, Flame, MessageCircle, Send,
  Grid, List, ChevronRight, Clock, ChevronLeft, ZoomOut, ZoomIn, Save, TrendingUp, Lightbulb, Brain
} from 'lucide-react';
import { Language, Translation, FeelingEntry, FeelingType, Person, Emotion, DiaryInsight } from '../types';
import { getEntries, deleteEntry, getPeople, savePerson, deletePerson } from '../services/storageService';
import { generateInsight, generateShareableSummary, createDiaryChat } from '../services/geminiService';
import { EMOTION_CONFIG } from '../config';
import html2canvas from 'html2canvas';

interface DiaryProps {
  language: Language;
  t: Translation;
  onBack: () => void;
  onEdit: (entry: FeelingEntry) => void;
}

// Color Helpers
const COLORS = {
  POSITIVE: 'emerald',
  NEGATIVE: 'rose',
  MIXED: 'amber',
  SEXUAL: 'violet',
  NEUTRAL: 'navy'
};

const getColorClass = (type: string, part: 'bg' | 'text' | 'border' | 'ring') => {
  const colorName = type === 'POSITIVE' ? COLORS.POSITIVE :
                    type === 'NEGATIVE' ? COLORS.NEGATIVE :
                    type === 'MIXED' ? COLORS.MIXED :
                    type === 'SEXUAL' ? COLORS.SEXUAL : COLORS.NEUTRAL;
  
  if (part === 'bg') return `bg-${colorName}-500`;
  if (part === 'text') return `text-${colorName}-500`;
  if (part === 'border') return `border-${colorName}-500`;
  if (part === 'ring') return `ring-${colorName}-500`;
  return '';
};

const getAggregateMood = (entries: FeelingEntry[]): 'POSITIVE' | 'NEGATIVE' | 'MIXED' | 'SEXUAL' | 'NEUTRAL' => {
  if (entries.length === 0) return 'NEUTRAL';

  const hasPositive = entries.some(e => e.type === FeelingType.POSITIVE);
  const hasNegative = entries.some(e => e.type === FeelingType.NEGATIVE);
  const hasSexual = entries.some(e => e.type === FeelingType.SEXUAL);

  if (hasPositive && hasNegative) return 'MIXED'; // Yellow
  
  // Count frequency for dominance if not mixed
  const posCount = entries.filter(e => e.type === FeelingType.POSITIVE).length;
  const negCount = entries.filter(e => e.type === FeelingType.NEGATIVE).length;
  const sexCount = entries.filter(e => e.type === FeelingType.SEXUAL).length;

  if (posCount >= negCount && posCount >= sexCount && posCount > 0) return 'POSITIVE';
  if (negCount > posCount && negCount >= sexCount) return 'NEGATIVE';
  if (sexCount > 0) return 'SEXUAL'; // Purple if mostly sexual or only sexual
  
  return 'NEUTRAL';
};

export const Diary: React.FC<DiaryProps> = ({ language, t, onBack, onEdit }) => {
  const [entries, setEntries] = useState<FeelingEntry[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [filterType, setFilterType] = useState<'ALL' | 'POSITIVE' | 'NEGATIVE' | 'SEXUAL'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPersonId, setFilterPersonId] = useState<string>('ALL_PEOPLE');
  const [filterDate, setFilterDate] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'LIST' | 'CALENDAR'>('LIST');
  
  // Calendar State
  const [calendarViewLevel, setCalendarViewLevel] = useState<'MONTH' | 'YEAR'>('MONTH');
  const [calendarDate, setCalendarDate] = useState(new Date()); // Tracks current view (Month or Year)
  const [selectedDayModal, setSelectedDayModal] = useState<{date: Date, entries: FeelingEntry[]} | null>(null);

  // Insight State
  const [insight, setInsight] = useState<DiaryInsight | null>(null);
  const [isGeneratingInsight, setIsGeneratingInsight] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Share State
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareText, setShareText] = useState('');
  const [isGeneratingShare, setIsGeneratingShare] = useState(false);
  const shareCardRef = useRef<HTMLDivElement>(null);

  // People Management State
  const [showPeopleModal, setShowPeopleModal] = useState(false);
  const [editingPersonId, setEditingPersonId] = useState<string | null>(null);
  const [personForm, setPersonForm] = useState<Person>({ id: '', name: '' });


  // Chat State
  const [showChatModal, setShowChatModal] = useState(false);
  const [chatMessages, setChatMessages] = useState<{role: 'user' | 'model', text: string}[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatSessionRef = useRef<any>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setEntries(getEntries());
    setPeople(getPeople());
  }, []);

  const handleDelete = (id: string) => {
    if (confirm('Delete this entry permanently?')) {
      deleteEntry(id);
      setEntries(prev => prev.filter(e => e.id !== id));
      if (selectedDayModal) setSelectedDayModal(null);
    }
  };

  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      // Type Filter
      if (filterType === 'POSITIVE' && entry.type !== FeelingType.POSITIVE) return false;
      if (filterType === 'NEGATIVE' && entry.type !== FeelingType.NEGATIVE) return false;
      if (filterType === 'SEXUAL' && entry.type !== FeelingType.SEXUAL) return false;

      // Person Filter
      if (filterPersonId !== 'ALL_PEOPLE') {
         const person = people.find(p => p.id === filterPersonId);
         if (person && (!entry.people || !entry.people.includes(person.name))) {
             return false;
         }
      }

      // Date Filter
      if (filterDate) {
         const entryDay = new Date(entry.timestamp).setHours(0,0,0,0);
         const filterDay = new Date(filterDate).setHours(0,0,0,0);
         if (entryDay !== filterDay) return false;
      }

      // Search Filter
      if (searchTerm) {
        const lowerSearch = searchTerm.toLowerCase();
        const inPeople = entry.people?.some(p => p.toLowerCase().includes(lowerSearch));
        const inTags = entry.tags?.some(tag => tag.toLowerCase().includes(lowerSearch));
        const inText = entry.text.toLowerCase().includes(lowerSearch);
        const inSummary = entry.summary?.toLowerCase().includes(lowerSearch);
        const inReason = entry.reason?.toLowerCase().includes(lowerSearch);
        const inReaction = entry.reaction?.toLowerCase().includes(lowerSearch);
        const inEmotion = entry.emotion ? t.emotions[entry.emotion].toLowerCase().includes(lowerSearch) : false;
        
        return inPeople || inTags || inText || inSummary || inReason || inReaction || inEmotion;
      }

      return true;
    });
  }, [entries, filterType, searchTerm, filterPersonId, people, t.emotions, filterDate]);

  // Derived Stats for Share Card
  const selectedPerson = useMemo(() => people.find(p => p.id === filterPersonId), [people, filterPersonId]);
  const shareHeader = selectedPerson ? selectedPerson.name : t.title;

  const personStats = useMemo(() => {
    if (!selectedPerson) return null;
    
    // Global stats for this person, ignoring current filters
    const personEntries = entries.filter(e => e.people?.includes(selectedPerson.name));
    
    if (personEntries.length === 0) return null;

    const sorted = [...personEntries].sort((a, b) => a.timestamp - b.timestamp);
    const firstDate = sorted[0].timestamp;
    
    // Count positive
    const smileCount = personEntries.filter(e => e.type === FeelingType.POSITIVE).length;
    
    return { firstDate, smileCount };
  }, [entries, selectedPerson]);


  // --- Insight Logic ---
  const handleGenerateInsight = async () => {
    setIsGeneratingInsight(true);
    setInsight(null);
    try {
      const result = await generateInsight(filteredEntries, language);
      setInsight(result);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingInsight(false);
    }
  };

  const copyInsight = () => {
    if (insight) {
      const text = `${insight.title}\n\nTone: ${insight.emotionalTone}\n\n${insight.reflection}\n\nPatterns:\n${insight.patterns.map(p => `- ${p}`).join('\n')}\n\nAdvice: ${insight.advice}`;
      navigator.clipboard.writeText(text);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filteredEntries, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `glimmer_export_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleOpenShare = async () => {
    if (filterPersonId === 'ALL_PEOPLE' || !selectedPerson) return;
    
    setShowShareModal(true);
    setIsGeneratingShare(true);
    setShareText('');
    
    try {
      const text = await generateShareableSummary(filteredEntries, language, selectedPerson);
      setShareText(text);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingShare(false);
    }
  };

  const handleDownloadImage = async () => {
    if (shareCardRef.current) {
      try {
        const canvas = await html2canvas(shareCardRef.current, {
          backgroundColor: '#1F2642', // Match card bg
          scale: 2 // Higher resolution
        });
        const image = canvas.toDataURL("image/png");
        const link = document.createElement('a');
        link.download = `glimmer_share_${new Date().getTime()}.png`;
        link.href = image;
        link.click();
      } catch (e) {
        console.error("Image generation failed", e);
      }
    }
  };

  // --- People Management ---
  const handleAddNewPerson = () => {
     // Generate new ID
     let id;
     try {
         if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) id = (crypto as any).randomUUID();
         else id = Math.random().toString(36).substring(2, 15);
     } catch(e) { id = Math.random().toString(36).substring(2, 15); }

     setPersonForm({ id, name: '', age: '', relation: '', interests: [], notes: '' });
     setEditingPersonId('NEW');
  };

  const handleEditPerson = (person: Person) => {
      setPersonForm({ ...person });
      setEditingPersonId(person.id);
  };

  const handleSavePersonForm = () => {
      if (!personForm.name.trim()) return;
      
      savePerson(personForm);
      setPeople(getPeople());
      setEditingPersonId(null);
  };

  const handleDeletePerson = (id: string) => {
      if(confirm('Delete this person?')) {
        deletePerson(id);
        setPeople(getPeople());
        if (filterPersonId === id) setFilterPersonId('ALL_PEOPLE');
      }
  };

  // --- Chat Logic ---
  const handleOpenChat = async () => {
    setChatMessages([]);
    setShowChatModal(true);
    setIsChatLoading(true);
    try {
        const session = await createDiaryChat(filteredEntries, language);
        if (session) {
            chatSessionRef.current = session;
        } else {
            setChatMessages([{ role: 'model', text: 'Unable to connect to AI service. Please check your API key.' }]);
        }
    } catch (e) {
        console.error(e);
    } finally {
        setIsChatLoading(false);
    }
  };

  const handleSendChat = async (msg: string) => {
    if (!msg.trim()) return;
    if (!chatSessionRef.current) {
        // Try to re-init if session missing
        const session = await createDiaryChat(filteredEntries, language);
        if (session) {
            chatSessionRef.current = session;
        } else {
             setChatMessages(prev => [...prev, { role: 'user', text: msg }, { role: 'model', text: 'AI service unavailable.' }]);
             return;
        }
    }
    
    const userMsg = msg.trim();
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setChatInput('');
    setIsChatLoading(true);

    setTimeout(() => {
        chatScrollRef.current?.scrollTo({ top: chatScrollRef.current.scrollHeight, behavior: 'smooth' });
    }, 100);

    try {
        const response = await chatSessionRef.current.sendMessage({ message: userMsg });
        const text = response.text || "I couldn't generate a response.";
        setChatMessages(prev => [...prev, { role: 'model', text }]);
    } catch (e) {
        console.error("Chat error", e);
        setChatMessages(prev => [...prev, { role: 'model', text: "Sorry, I encountered an error answering that." }]);
    } finally {
        setIsChatLoading(false);
        setTimeout(() => {
            chatScrollRef.current?.scrollTo({ top: chatScrollRef.current.scrollHeight, behavior: 'smooth' });
        }, 100);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Intl.DateTimeFormat(
      language === Language.HR ? 'hr-HR' : language === Language.SV ? 'sv-SE' : 'en-US', 
      { weekday: 'long', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
    ).format(new Date(timestamp));
  };

  const getPreviewText = (fullText: string) => {
    const userLine = fullText.split('\n').find(line => line.startsWith('user:'));
    if (userLine) {
        return userLine.replace('user: ', '');
    }
    return fullText.split('\n')[0] || '';
  };

  // --- Calendar Logic ---
  const getDaysInMonth = (date: Date) => {
      return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };
  const getFirstDayOfMonth = (date: Date) => {
      const day = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
      return day;
  };

  const handleDayClick = (date: Date, dayEntries: FeelingEntry[]) => {
      if (dayEntries.length > 0) {
          setSelectedDayModal({ date, entries: dayEntries });
      }
  };

  const handleViewListFromModal = () => {
      if (selectedDayModal) {
          setFilterDate(selectedDayModal.date.getTime());
          setViewMode('LIST');
          setSelectedDayModal(null);
      }
  };

  const renderMonthView = () => {
      const daysInMonth = getDaysInMonth(calendarDate);
      const firstDay = getFirstDayOfMonth(calendarDate);
      const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
      const blanks = Array.from({ length: firstDay }, (_, i) => i);

      return (
          <div className="bg-navy-800 rounded-xl border border-white/10 p-4 animate-fade-in">
              <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-2">
                     <button onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1))} className="p-2 text-gray-400 hover:text-white bg-navy-900 rounded-lg hover:bg-white/5 transition-colors"><ChevronLeft size={20}/></button>
                     <button 
                        onClick={() => setCalendarViewLevel('YEAR')} 
                        className="flex items-center gap-2 px-4 py-2 bg-navy-900 rounded-lg hover:bg-white/5 transition-colors text-white font-bold"
                     >
                        {calendarDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                        <ZoomOut size={16} className="text-gray-400" />
                     </button>
                     <button onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1))} className="p-2 text-gray-400 hover:text-white bg-navy-900 rounded-lg hover:bg-white/5 transition-colors"><ChevronRight size={20}/></button>
                  </div>
              </div>
              
              <div className="grid grid-cols-7 gap-1 text-center mb-4">
                  {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
                      <div key={d} className="text-xs font-bold text-gray-500 uppercase tracking-wider">{d}</div>
                  ))}
              </div>
              
              <div className="grid grid-cols-7 gap-2">
                  {blanks.map(b => <div key={`blank-${b}`} />)}
                  {daysArray.map(day => {
                      const dateTimestamp = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), day).setHours(0,0,0,0);
                      const dayEntries = filteredEntries.filter(e => {
                          const eDate = new Date(e.timestamp).setHours(0,0,0,0);
                          return eDate === dateTimestamp;
                      });

                      const mood = getAggregateMood(dayEntries);
                      const hasEntry = dayEntries.length > 0;
                      
                      let bgClass = 'bg-navy-900/50';
                      let borderClass = 'border-white/5';
                      let textClass = 'text-gray-400';
                      let dotColorClass = '';

                      if (hasEntry) {
                          textClass = 'text-white font-bold';
                          bgClass = 'bg-navy-800 hover:bg-navy-700';
                          
                          switch(mood) {
                              case 'POSITIVE': 
                                borderClass = 'border-emerald-500/30'; 
                                dotColorClass = 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]';
                                break;
                              case 'NEGATIVE': 
                                borderClass = 'border-rose-500/30'; 
                                dotColorClass = 'bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.8)]';
                                break;
                              case 'MIXED': 
                                borderClass = 'border-amber-500/30'; 
                                dotColorClass = 'bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.8)]';
                                break;
                              case 'SEXUAL': 
                                borderClass = 'border-violet-500/30'; 
                                dotColorClass = 'bg-violet-400 shadow-[0_0_6px_rgba(167,139,250,0.8)]';
                                break;
                              default: 
                                borderClass = 'border-white/20';
                                dotColorClass = 'bg-gray-400';
                          }
                      }

                      return (
                          <div 
                              key={day} 
                              onClick={() => handleDayClick(new Date(dateTimestamp), dayEntries)}
                              className={`aspect-square flex flex-col items-center justify-center relative rounded-xl transition-all border ${bgClass} ${borderClass} ${hasEntry ? 'cursor-pointer hover:scale-105 shadow-sm' : ''}`}
                          >
                              <span className={`text-sm ${textClass}`}>{day}</span>
                              {hasEntry && (
                                  <div className={`w-2 h-2 rounded-full mt-1.5 ${dotColorClass}`} />
                              )}
                          </div>
                      );
                  })}
              </div>
          </div>
      );
  };

  const renderYearView = () => {
      const year = calendarDate.getFullYear();
      const months = Array.from({length: 12}, (_, i) => i);

      return (
        <div className="bg-navy-800 rounded-xl border border-white/10 p-4 animate-fade-in">
             <div className="flex justify-between items-center mb-6">
                 <div className="flex items-center gap-2">
                     <button onClick={() => setCalendarDate(new Date(year - 1, 0, 1))} className="p-2 text-gray-400 hover:text-white bg-navy-900 rounded-lg hover:bg-white/5 transition-colors"><ChevronLeft size={20}/></button>
                     <h3 className="text-xl font-serif font-bold text-white px-2">{year} Overview</h3>
                     <button onClick={() => setCalendarDate(new Date(year + 1, 0, 1))} className="p-2 text-gray-400 hover:text-white bg-navy-900 rounded-lg hover:bg-white/5 transition-colors"><ChevronRight size={20}/></button>
                 </div>
             </div>

             <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                 {months.map(monthIndex => {
                     const monthDate = new Date(year, monthIndex, 1);
                     // Calculate stats for this month
                     const monthEntries = filteredEntries.filter(e => {
                         const d = new Date(e.timestamp);
                         return d.getFullYear() === year && d.getMonth() === monthIndex;
                     });
                     
                     const total = monthEntries.length;
                     const pos = monthEntries.filter(e => e.type === FeelingType.POSITIVE).length;
                     const neg = monthEntries.filter(e => e.type === FeelingType.NEGATIVE).length;
                     const sex = monthEntries.filter(e => e.type === FeelingType.SEXUAL).length;
                     
                     // Simple bar calculation
                     const posPct = total ? (pos / total) * 100 : 0;
                     const negPct = total ? (neg / total) * 100 : 0;
                     const sexPct = total ? (sex / total) * 100 : 0;

                     return (
                         <div 
                            key={monthIndex}
                            onClick={() => {
                                setCalendarDate(monthDate);
                                setCalendarViewLevel('MONTH');
                            }}
                            className="bg-navy-900/50 border border-white/5 hover:border-coral-500/30 rounded-xl p-3 cursor-pointer transition-all hover:-translate-y-1 hover:shadow-lg"
                         >
                             <div className="flex justify-between items-center mb-2">
                                <span className="font-bold text-gray-300 text-sm">
                                    {monthDate.toLocaleString('default', { month: 'short' })}
                                </span>
                                {total > 0 && <span className="text-[10px] bg-navy-800 px-1.5 rounded text-gray-400">{total}</span>}
                             </div>
                             
                             {/* Mini Visualization Bar */}
                             <div className="h-2 w-full bg-navy-950 rounded-full overflow-hidden flex">
                                 {posPct > 0 && <div style={{width: `${posPct}%`}} className="bg-emerald-500" />}
                                 {negPct > 0 && <div style={{width: `${negPct}%`}} className="bg-rose-500" />}
                                 {sexPct > 0 && <div style={{width: `${sexPct}%`}} className="bg-violet-500" />}
                             </div>
                             
                             {/* Legend / Dots */}
                             <div className="flex gap-1 mt-2 justify-end">
                                 {pos > 0 && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                                 {neg > 0 && <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />}
                                 {sex > 0 && <div className="w-1.5 h-1.5 rounded-full bg-violet-500" />}
                             </div>
                         </div>
                     );
                 })}
             </div>
        </div>
      );
  };

  return (
    <div className="flex flex-col h-full bg-navy-900 text-white overflow-hidden relative">
      {/* Header */}
      <header className="bg-navy-900 border-b border-white/10 p-4 z-10 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-gray-400 hover:text-coral-500 transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="font-semibold">{t.back}</span>
          </button>
          <h2 className="text-xl font-serif font-bold text-coral-500">{t.diaryTitle}</h2>
          
          <div className="flex gap-2">
            <button 
               onClick={() => {
                   setEditingPersonId(null);
                   setShowPeopleModal(true);
               }}
               className="p-2 text-gray-400 hover:text-coral-500 transition-colors"
               title={t.managePeople}
            >
               <Users size={20} />
            </button>
            <button 
              onClick={handleExport}
              disabled={filteredEntries.length === 0}
              className="p-2 text-gray-400 hover:text-coral-500 transition-colors disabled:opacity-30"
              title={t.exportData}
            >
              <Download size={20} />
            </button>
          </div>
        </div>

        {/* Filters & Toggles */}
        <div className="flex flex-col gap-3 w-full max-w-4xl mx-auto">
          {/* Top Row: Type Filters + Search + View Toggle */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex bg-navy-800 rounded-lg p-1 border border-white/5 overflow-x-auto">
                {(['ALL', 'POSITIVE', 'NEGATIVE', 'SEXUAL'] as const).map((ft) => (
                <button
                    key={ft}
                    onClick={() => setFilterType(ft)}
                    className={`flex-1 min-w-[60px] px-3 py-2 text-xs md:text-sm font-medium rounded-md transition-all whitespace-nowrap ${
                    filterType === ft 
                        ? 'bg-coral-500 text-white shadow-md' 
                        : 'text-gray-400 hover:text-white'
                    }`}
                >
                    {ft === 'ALL' ? t.filterAll : 
                     ft === 'POSITIVE' ? t.filterPositive : 
                     ft === 'NEGATIVE' ? t.filterNegative : t.filterSexual.split(' ')[0]}
                </button>
                ))}
            </div>

            <div className="flex-1 flex gap-2">
                <div className="relative flex-1 flex items-center bg-navy-800 rounded-lg border border-white/5 px-4">
                    <Search className="text-gray-400" size={18} />
                    <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={t.searchPlaceholder}
                    className="w-full px-3 py-2 bg-transparent text-white placeholder-gray-500 focus:outline-none"
                    />
                </div>
                
                {/* View Toggle */}
                <div className="flex bg-navy-800 rounded-lg p-1 border border-white/5">
                    <button 
                        onClick={() => { setViewMode('LIST'); setFilterDate(null); }} 
                        className={`p-2 rounded-md ${viewMode === 'LIST' ? 'bg-coral-500 text-white' : 'text-gray-400'}`}
                        title={t.listView}
                    >
                        <List size={20} />
                    </button>
                    <button 
                        onClick={() => { setViewMode('CALENDAR'); setFilterDate(null); }} 
                        className={`p-2 rounded-md ${viewMode === 'CALENDAR' ? 'bg-coral-500 text-white' : 'text-gray-400'}`}
                        title={t.calendarView}
                    >
                        <Calendar size={20} />
                    </button>
                </div>
            </div>
          </div>

          {/* Bottom Row: Person Filter */}
          <div className="w-full md:w-auto">
             <select 
                value={filterPersonId} 
                onChange={(e) => setFilterPersonId(e.target.value)}
                className="w-full md:w-auto bg-navy-800 text-gray-300 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-coral-500"
             >
                 <option value="ALL_PEOPLE">{t.allPeople}</option>
                 {people.map(p => (
                     <option key={p.id} value={p.id}>{p.name}</option>
                 ))}
             </select>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-navy-900">
        <div className="max-w-3xl mx-auto space-y-8">
          
          {/* Action Buttons Area */}
          {entries.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <button
                onClick={handleGenerateInsight}
                className="bg-navy-800 border border-white/10 hover:border-coral-500/50 text-white p-4 rounded-xl font-bold shadow-lg transition-all flex flex-col md:flex-row items-center justify-center gap-2 group h-full"
              >
                <Sparkles size={24} className="text-coral-500 group-hover:animate-spin-slow" /> 
                <span className="text-center md:text-left text-sm md:text-base">{t.insightButton}</span>
              </button>

               <button
                onClick={handleOpenChat}
                className="bg-coral-500/10 border border-coral-500/30 hover:bg-coral-500/20 text-white p-4 rounded-xl font-bold shadow-lg transition-all flex flex-col md:flex-row items-center justify-center gap-2 h-full"
              >
                <MessageCircle size={24} className="text-coral-500" /> 
                <span className="text-center md:text-left text-sm md:text-base">{t.chatWithDiary}</span>
              </button>

              <button
                onClick={handleOpenShare}
                disabled={filterPersonId === 'ALL_PEOPLE'}
                className={`bg-navy-800 border border-white/10 text-white p-4 rounded-xl font-bold shadow-lg transition-all flex flex-col md:flex-row items-center justify-center gap-2 h-full ${
                    filterPersonId === 'ALL_PEOPLE' 
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'hover:border-coral-500/50'
                }`}
              >
                <Share2 size={24} className={filterPersonId === 'ALL_PEOPLE' ? "text-gray-500" : "text-coral-500"} /> 
                <span className="text-center md:text-left text-sm md:text-base">
                    {filterPersonId === 'ALL_PEOPLE' ? t.selectPersonToShare : t.shareSummary}
                </span>
              </button>
            </div>
          )}

          {/* Insight Result */}
          {isGeneratingInsight && (
            <div className="bg-navy-800 p-6 border border-white/5 rounded-xl shadow-lg animate-pulse flex items-center justify-center gap-3">
              <Sparkles className="animate-spin text-coral-500" size={20} />
              <span className="text-gray-300">{t.analyzing}</span>
            </div>
          )}

          {insight && !isGeneratingInsight && (
            <div className="bg-navy-800 border border-coral-500/30 rounded-xl shadow-xl overflow-hidden animate-fade-in-up relative">
                {/* Header */}
                <div className="bg-navy-900/50 p-6 border-b border-white/5 flex justify-between items-start">
                    <div>
                        <h3 className="font-serif font-bold text-2xl text-white mb-2">{insight.title}</h3>
                        <div className="flex items-center gap-2 text-coral-400 text-sm font-medium">
                            <Sparkles size={16} />
                            <span>{insight.emotionalTone}</span>
                        </div>
                    </div>
                    <button 
                        onClick={copyInsight}
                        className="p-2 text-gray-400 hover:text-coral-500 transition-colors"
                        title={t.copyToClipboard}
                    >
                        {isCopied ? <Check size={18} /> : <Copy size={18} />}
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Reflection */}
                    <div className="flex gap-4">
                        <div className="p-2 bg-navy-900 rounded-lg h-fit text-blue-400"><Brain size={24} /></div>
                        <div>
                            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-1">Reflection</h4>
                            <p className="text-gray-200 leading-relaxed text-lg italic">"{insight.reflection}"</p>
                        </div>
                    </div>

                    {/* Grid for Patterns & Advice */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         {/* Patterns */}
                         <div className="bg-navy-900/40 rounded-xl p-4 border border-white/5">
                            <div className="flex items-center gap-2 mb-3 text-purple-400">
                                <TrendingUp size={20} />
                                <h4 className="font-bold">Key Patterns</h4>
                            </div>
                            <ul className="space-y-2">
                                {insight.patterns.map((pattern, idx) => (
                                    <li key={idx} className="flex gap-2 text-sm text-gray-300">
                                        <span className="text-purple-500/50">•</span> {pattern}
                                    </li>
                                ))}
                            </ul>
                         </div>

                         {/* Advice */}
                         <div className="bg-navy-900/40 rounded-xl p-4 border border-white/5">
                             <div className="flex items-center gap-2 mb-3 text-yellow-400">
                                <Lightbulb size={20} />
                                <h4 className="font-bold">Suggestion</h4>
                            </div>
                            <p className="text-sm text-gray-300 leading-relaxed">
                                {insight.advice}
                            </p>
                         </div>
                    </div>
                </div>
            </div>
          )}

          {/* View Content: Calendar or List */}
          {viewMode === 'CALENDAR' && (
             calendarViewLevel === 'MONTH' ? renderMonthView() : renderYearView()
          )}

          {viewMode === 'LIST' && (
              <>
              {filterDate && (
                  <div className="flex items-center gap-2 mb-4 bg-coral-500/10 border border-coral-500/30 p-3 rounded-lg animate-fade-in">
                      <Calendar size={18} className="text-coral-500" />
                      <span className="text-gray-200 text-sm">
                          Showing entries for <span className="font-bold">{new Date(filterDate).toLocaleDateString()}</span>
                      </span>
                      <button onClick={() => setFilterDate(null)} className="ml-auto text-xs font-bold text-coral-500 hover:text-white flex items-center gap-1">
                          <X size={14} /> {t.clear}
                      </button>
                  </div>
              )}

              {filteredEntries.length === 0 ? (
                <div className="text-center py-20 text-gray-500 border-2 border-dashed border-gray-700 rounded-xl">
                  <Calendar className="mx-auto mb-4 opacity-50" size={48} />
                  <p>{t.noEntries}</p>
                </div>
              ) : (
                filteredEntries.map((entry) => {
                  const isPos = entry.type === FeelingType.POSITIVE;
                  const isSexual = entry.type === FeelingType.SEXUAL;
                  const isNeg = entry.type === FeelingType.NEGATIVE;
                  
                  // Color Coding for Row
                  let rowMood: 'POSITIVE' | 'NEGATIVE' | 'SEXUAL' = 'POSITIVE';
                  if (isSexual) rowMood = 'SEXUAL';
                  else if (isNeg) rowMood = 'NEGATIVE';
                  else if (isPos) rowMood = 'POSITIVE';

                  const config = entry.emotion ? EMOTION_CONFIG[entry.emotion] : null;
                  const EmotionIcon = config ? config.icon : (isSexual ? Flame : (isPos ? Smile : Frown));
                  
                  let emoLabel = t.filterPositive;
                  if (entry.emotion) emoLabel = t.emotions[entry.emotion];
                  else if (!isPos) emoLabel = t.filterNegative;
                  if (isSexual) emoLabel = t.filterSexual.replace(' (18+)', '');

                  return (
                    <div 
                      key={entry.id} 
                      className={`
                        bg-navy-800 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group mb-4 border
                        ${getColorClass(rowMood, 'border')}
                      `}
                    >
                      {/* Card Header */}
                      <div className={`
                        p-4 flex justify-between items-center border-b border-white/5
                        ${isSexual ? 'bg-violet-900/20' : 
                          isNeg ? 'bg-rose-900/20' : 'bg-emerald-900/20'}
                      `}>
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full bg-navy-900/40 ${getColorClass(rowMood, 'text')}`}>
                            <EmotionIcon size={20} />
                          </div>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                                <span className={`font-bold ${getColorClass(rowMood, 'text')}`}>{emoLabel}</span>
                                {entry.intensity && (
                                  <span className="text-xs bg-navy-900 text-gray-400 px-1.5 py-0.5 rounded border border-white/10">
                                    {entry.intensity}/10
                                  </span>
                                )}
                            </div>
                            <span className="text-xs text-gray-500">{formatDate(entry.timestamp)}</span>
                          </div>
                        </div>
                        <div className="flex gap-1">
                            <button 
                                onClick={() => onEdit(entry)}
                                className="text-gray-600 hover:text-white transition-colors p-2"
                                title={t.edit}
                            >
                                <Edit2 size={18} />
                            </button>
                            <button 
                                onClick={() => handleDelete(entry.id)}
                                className="text-gray-600 hover:text-red-500 transition-colors p-2"
                                title={t.delete}
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                      </div>

                      <div className="p-6">
                        {entry.summary && (
                            <h3 className="text-xl font-serif font-bold text-white mb-4 leading-tight">
                            {entry.summary}
                            </h3>
                        )}

                        {/* Mandatory fields display */}
                        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            {entry.reason && (
                              <div className="bg-navy-900/50 p-3 rounded-lg border border-white/5">
                                <span className="block text-gray-500 text-xs uppercase font-bold mb-1">Reason</span>
                                <span className="text-gray-200">{entry.reason}</span>
                              </div>
                            )}
                            {entry.reaction && (
                              <div className="bg-navy-900/50 p-3 rounded-lg border border-white/5">
                                <span className="block text-gray-500 text-xs uppercase font-bold mb-1">Reaction</span>
                                <span className="text-gray-200">{entry.reaction}</span>
                              </div>
                            )}
                        </div>
                        
                        {/* Images Display */}
                        {entry.images && entry.images.length > 0 && (
                            <div className="flex gap-4 mb-6 overflow-x-auto pb-2 scrollbar-hide">
                            {entry.images.map((img, i) => (
                                <img 
                                key={i} 
                                src={img} 
                                alt="Entry attachment" 
                                className="h-24 w-24 object-cover rounded-lg border border-white/10 shadow-sm"
                                />
                            ))}
                            </div>
                        )}

                        <div className="text-sm text-gray-400 italic border-t border-white/5 pt-4 mb-4 line-clamp-2">
                            "{getPreviewText(entry.text).substring(0, 150)}..."
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {entry.people && entry.people.length > 0 && entry.people.map((person, i) => (
                            <span key={`p-${i}`} className="inline-flex items-center gap-1 px-2 py-1 bg-navy-900 text-gray-300 text-xs rounded border border-white/5">
                                <User size={10} /> {person}
                            </span>
                            ))}
                            {entry.tags && entry.tags.length > 0 && entry.tags.map((tag, i) => (
                            <span key={`t-${i}`} className="inline-flex items-center gap-1 px-2 py-1 bg-navy-900 text-gray-300 text-xs rounded border border-white/5">
                                <Tag size={10} /> {tag}
                            </span>
                            ))}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              </>
          )}
        </div>
      </main>

      {/* Share Modal */}
      {showShareModal && (
        <div className="absolute inset-0 z-50 bg-navy-900/90 backdrop-blur-sm flex items-center justify-center p-4">
           <div className="bg-navy-900 border border-white/10 rounded-2xl max-w-md w-full shadow-2xl animate-fade-in-up overflow-hidden">
             
             <div className="p-4 border-b border-white/10 flex justify-between items-center">
               <h3 className="font-serif font-bold text-lg text-white">{t.shareTitle}</h3>
               <button onClick={() => setShowShareModal(false)} className="text-gray-400 hover:text-white">
                 <X size={24} />
               </button>
             </div>

             <div className="p-6 flex flex-col items-center">
                {isGeneratingShare ? (
                  <div className="py-12 flex flex-col items-center gap-4 text-gray-400">
                     <Sparkles className="animate-spin text-coral-500" size={32} />
                     <p>{t.shareHint}</p>
                  </div>
                ) : (
                  <>
                    <div 
                      ref={shareCardRef}
                      className="w-full bg-navy-800 p-8 rounded-xl border border-white/5 shadow-inner flex flex-col items-center text-center relative overflow-hidden"
                    >
                      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-coral-500 to-purple-600" />
                      
                      {/* Share Card Header - Name of Subject */}
                      <h4 className="font-serif text-2xl font-bold text-coral-500 mb-2">{shareHeader}</h4>
                      
                      {/* Smile Statistic */}
                      {selectedPerson && personStats && personStats.smileCount > 0 && (
                          <div className="mb-6 flex items-center gap-2 text-sm text-coral-300 bg-coral-500/10 px-4 py-1.5 rounded-full border border-coral-500/20">
                             <Sparkles size={14} />
                             <span>
                               {t.statSmile
                                 .replace('{count}', personStats.smileCount.toString())
                                 .replace('{date}', new Date(personStats.firstDate).toLocaleDateString())
                               }
                             </span>
                          </div>
                      )}

                      {/* Changed to allow line breaks (whitespace-pre-wrap) and removed quotes */}
                      <div className="text-lg font-light italic leading-relaxed text-gray-100 mb-8 whitespace-pre-wrap text-left w-full px-2 md:px-4">
                        {shareText}
                      </div>

                      <div className="mt-auto flex items-center gap-2 text-gray-500 text-xs uppercase tracking-widest">
                        <span className="w-8 h-[1px] bg-gray-600" />
                        {new Date().toLocaleDateString()}
                        <span className="w-8 h-[1px] bg-gray-600" />
                      </div>
                    </div>

                    <button
                      onClick={handleDownloadImage}
                      className="mt-6 w-full bg-coral-500 text-white py-3 rounded-lg font-bold shadow-lg hover:bg-coral-600 transition-colors flex items-center justify-center gap-2"
                    >
                      <Download size={20} />
                      {t.downloadImage}
                    </button>
                  </>
                )}
             </div>
           </div>
        </div>
      )}

      {/* Chat Modal */}
      {showChatModal && (
        <div className="absolute inset-0 z-50 bg-navy-900/95 backdrop-blur-md flex flex-col animate-fade-in-up">
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-navy-800 shadow-lg shrink-0">
                <div className="flex items-center gap-2 text-coral-500">
                    <MessageCircle size={24} />
                    <h3 className="font-serif font-bold text-lg">{t.chatTitle}</h3>
                </div>
                <button onClick={() => setShowChatModal(false)} className="text-gray-400 hover:text-white p-2">
                    <X size={24} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={chatScrollRef}>
                {chatMessages.length === 0 && (
                    <div className="flex flex-col gap-4 mt-8">
                        <p className="text-center text-gray-400 text-sm mb-4">Select a topic or ask anything about your entries.</p>
                        <div className="grid grid-cols-2 gap-3 max-w-md mx-auto w-full px-4">
                            <button onClick={() => handleSendChat(t.chatTemplates.happiness)} className="p-3 bg-navy-800 border border-white/10 hover:border-coral-500/50 rounded-lg text-sm text-left transition-colors">
                                {t.chatTemplates.happiness}
                            </button>
                            <button onClick={() => handleSendChat(t.chatTemplates.patterns)} className="p-3 bg-navy-800 border border-white/10 hover:border-coral-500/50 rounded-lg text-sm text-left transition-colors">
                                {t.chatTemplates.patterns}
                            </button>
                            <button onClick={() => handleSendChat(t.chatTemplates.summary)} className="p-3 bg-navy-800 border border-white/10 hover:border-coral-500/50 rounded-lg text-sm text-left transition-colors">
                                {t.chatTemplates.summary}
                            </button>
                            <button onClick={() => handleSendChat(t.chatTemplates.people)} className="p-3 bg-navy-800 border border-white/10 hover:border-coral-500/50 rounded-lg text-sm text-left transition-colors">
                                {t.chatTemplates.people}
                            </button>
                        </div>
                    </div>
                )}

                {chatMessages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`
                            max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed whitespace-pre-wrap
                            ${msg.role === 'user' 
                                ? 'bg-coral-500 text-white rounded-tr-sm shadow-md' 
                                : 'bg-navy-800 border border-white/10 text-gray-200 rounded-tl-sm shadow-sm'}
                        `}>
                            {msg.text}
                        </div>
                    </div>
                ))}
                
                {isChatLoading && (
                    <div className="flex justify-start">
                        <div className="bg-navy-800 border border-white/10 rounded-2xl p-4 rounded-tl-sm flex gap-1 items-center">
                            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                    </div>
                )}
            </div>

            <div className="p-4 bg-navy-800 border-t border-white/10 shrink-0">
                <div className="relative max-w-4xl mx-auto">
                    <input 
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendChat(chatInput)}
                        placeholder={t.chatInputPlaceholder}
                        disabled={isChatLoading}
                        className="w-full bg-navy-900 border border-white/10 rounded-xl pl-4 pr-12 py-3 text-white focus:outline-none focus:border-coral-500 disabled:opacity-50"
                    />
                    <button 
                        onClick={() => handleSendChat(chatInput)}
                        disabled={!chatInput.trim() || isChatLoading}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-coral-500 hover:bg-coral-500/10 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Send size={20} />
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* People Management Modal - Enhanced */}
      {showPeopleModal && (
          <div className="absolute inset-0 z-50 bg-navy-900/90 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-navy-900 border border-white/10 rounded-2xl max-w-md w-full shadow-2xl animate-fade-in-up flex flex-col h-[70vh]">
                <div className="p-4 border-b border-white/10 flex justify-between items-center bg-navy-800 rounded-t-2xl">
                    <h3 className="font-serif font-bold text-lg text-white">
                        {editingPersonId ? (editingPersonId === 'NEW' ? t.addPerson : t.edit) : t.managePeople}
                    </h3>
                    <button onClick={() => {
                        setEditingPersonId(null);
                        setShowPeopleModal(false);
                    }} className="text-gray-400 hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto bg-navy-800">
                    {/* List View */}
                    {!editingPersonId && (
                        <div className="p-4 space-y-2">
                             <button 
                                onClick={handleAddNewPerson}
                                className="w-full p-3 border-2 border-dashed border-white/20 rounded-lg text-gray-400 hover:text-white hover:border-coral-500/50 hover:bg-white/5 transition-all flex items-center justify-center gap-2 mb-4"
                            >
                                <Plus size={20} /> {t.addPerson}
                            </button>

                            {people.length === 0 ? (
                                <p className="text-center text-gray-500 mt-4">{t.noPeople}</p>
                            ) : (
                                people.map(person => (
                                    <div key={person.id} className="flex justify-between items-center bg-navy-900/50 p-4 rounded-lg border border-white/5 group hover:border-coral-500/30 transition-colors">
                                        <div onClick={() => handleEditPerson(person)} className="flex-1 cursor-pointer">
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-white font-bold text-lg">{person.name}</span>
                                                {person.age && <span className="text-xs text-gray-500">{person.age}</span>}
                                            </div>
                                            {person.relation && <div className="text-xs text-coral-500 uppercase font-bold tracking-wide">{person.relation}</div>}
                                            {person.interests && person.interests.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mt-2">
                                                    {person.interests.slice(0,3).map((int, i) => (
                                                        <span key={i} className="text-[10px] px-1.5 py-0.5 bg-navy-800 rounded text-gray-400">{int}</span>
                                                    ))}
                                                    {person.interests.length > 3 && <span className="text-[10px] text-gray-500">+{person.interests.length - 3}</span>}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => handleEditPerson(person)}
                                                className="p-2 text-gray-500 hover:text-white bg-navy-800 rounded-lg"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button 
                                                onClick={() => handleDeletePerson(person.id)}
                                                className="p-2 text-gray-500 hover:text-red-500 bg-navy-800 rounded-lg"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {/* Edit Form View */}
                    {editingPersonId && (
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">{t.personName}</label>
                                <input 
                                    type="text" 
                                    value={personForm.name}
                                    onChange={(e) => setPersonForm({...personForm, name: e.target.value})}
                                    className="w-full bg-navy-900 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-coral-500"
                                    placeholder="Name"
                                />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">{t.personRelation}</label>
                                    <input 
                                        type="text" 
                                        value={personForm.relation || ''}
                                        onChange={(e) => setPersonForm({...personForm, relation: e.target.value})}
                                        className="w-full bg-navy-900 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-coral-500"
                                        placeholder="e.g. Sister, Friend"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">{t.personAge}</label>
                                    <input 
                                        type="text" 
                                        value={personForm.age || ''}
                                        onChange={(e) => setPersonForm({...personForm, age: e.target.value})}
                                        className="w-full bg-navy-900 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-coral-500"
                                        placeholder="e.g. 25"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">{t.personInterests}</label>
                                <input 
                                    type="text" 
                                    value={(personForm.interests || []).join(', ')}
                                    onChange={(e) => setPersonForm({...personForm, interests: e.target.value.split(',').map(s => s.trim()).filter(Boolean)})}
                                    className="w-full bg-navy-900 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-coral-500"
                                    placeholder="e.g. Coffee, Hiking, Music"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">{t.personNotes}</label>
                                <textarea 
                                    value={personForm.notes || ''}
                                    onChange={(e) => setPersonForm({...personForm, notes: e.target.value})}
                                    className="w-full h-32 bg-navy-900 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-coral-500 resize-none text-sm leading-relaxed"
                                    placeholder="Random facts, memories, or notes..."
                                />
                                <p className="text-[10px] text-gray-500 mt-1 italic">
                                    * Notes will be auto-updated by AI when you save new entries involving this person.
                                </p>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button 
                                    onClick={() => setEditingPersonId(null)}
                                    className="flex-1 py-3 text-gray-400 font-bold hover:text-white transition-colors"
                                >
                                    {t.cancel}
                                </button>
                                <button 
                                    onClick={handleSavePersonForm}
                                    className="flex-1 bg-coral-500 text-white py-3 rounded-lg font-bold shadow-lg hover:bg-coral-600 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Save size={18} /> {t.savePersonProfile}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
          </div>
      )}

      {/* Day Summary Modal */}
      {selectedDayModal && (
          <div className="absolute inset-0 z-50 bg-navy-900/60 backdrop-blur-sm flex items-center justify-center p-4">
             <div className="bg-navy-800 border border-white/10 rounded-2xl w-full max-w-xs shadow-2xl animate-fade-in-up p-5">
                 <div className="flex justify-between items-start mb-4">
                    <div>
                        <h4 className="font-serif font-bold text-xl text-white">
                            {selectedDayModal.date.toLocaleDateString(undefined, { month: 'long', day: 'numeric'})}
                        </h4>
                        <p className="text-xs text-gray-400 font-medium uppercase mt-1">
                            {selectedDayModal.date.toLocaleDateString(undefined, { weekday: 'long' })}
                        </p>
                    </div>
                    <button 
                        onClick={() => setSelectedDayModal(null)}
                        className="p-1 -mr-2 -mt-2 text-gray-400 hover:text-white"
                    >
                        <X size={20} />
                    </button>
                 </div>

                 {/* Aggregate Color Indicator */}
                 <div className={`w-full h-1.5 rounded-full mb-4 ${getColorClass(getAggregateMood(selectedDayModal.entries), 'bg')}`} />

                 <div className="flex items-center gap-4 mb-6">
                     <div className="bg-navy-900 rounded-xl p-3 border border-white/5 flex flex-col items-center min-w-[80px]">
                         <span className="text-2xl font-bold text-coral-500">{selectedDayModal.entries.length}</span>
                         <span className="text-[10px] text-gray-500 uppercase font-bold">Entries</span>
                     </div>
                     <div className="flex flex-wrap gap-2">
                        {/* Unique Emotions for the day */}
                        {Array.from(new Set(selectedDayModal.entries.map(e => e.emotion))).slice(0, 3).map(emo => {
                            if (!emo) return null;
                            const Icon = EMOTION_CONFIG[emo as Emotion].icon;
                            return (
                                <div key={emo} className="p-2 bg-navy-900 rounded-full text-gray-300 border border-white/5" title={emo}>
                                    <Icon size={16} />
                                </div>
                            );
                        })}
                     </div>
                 </div>

                 <button 
                    onClick={handleViewListFromModal}
                    className="w-full bg-coral-500 hover:bg-coral-600 text-white font-bold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
                 >
                     View Entries <ChevronRight size={18} />
                 </button>
             </div>
          </div>
      )}
    </div>
  );
};
