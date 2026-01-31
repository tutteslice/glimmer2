
import React, { useState, useEffect } from 'react';
import { Plus, ArrowRight, Settings as SettingsIcon, AlertCircle } from 'lucide-react';
import { Language, View, FeelingEntry } from './types';
import { TRANSLATIONS } from './constants';
import { EntryForm } from './components/EntryForm';
import { Diary } from './components/Diary';
import { Settings } from './components/Settings';

function App() {
  const [currentView, setCurrentView] = useState<View>('HOME');
  const [language, setLanguage] = useState<Language>(Language.EN);
  const [editingEntry, setEditingEntry] = useState<FeelingEntry | null>(null);
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);

  // Check for API key on mount and whenever view changes
  useEffect(() => {
     // API Key must come exclusively from env
     setHasApiKey(!!process.env.API_KEY);
  }, [currentView]);

  const t = TRANSLATIONS[language];

  // Helper to change view
  const goHome = () => {
      setCurrentView('HOME');
      setEditingEntry(null);
  }

  const handleEditEntry = (entry: FeelingEntry) => {
      setEditingEntry(entry);
      setCurrentView('NEW_ENTRY');
  };

  const handleEntrySaved = () => {
      setEditingEntry(null);
      setCurrentView('DIARY');
  };

  // Render content based on view
  const renderContent = () => {
    switch (currentView) {
      case 'NEW_ENTRY':
        return (
          <EntryForm 
            language={language}
            t={t}
            onBack={goHome}
            onSave={handleEntrySaved}
            initialEntry={editingEntry}
          />
        );
      case 'DIARY':
        return (
          <Diary 
            language={language}
            t={t}
            onBack={goHome}
            onEdit={handleEditEntry}
          />
        );
      case 'SETTINGS':
        return (
          <Settings
            language={language}
            t={t}
            onBack={goHome}
          />
        );
      default:
        return renderHome();
    }
  };

  const renderHome = () => (
    <div className="flex flex-col h-full bg-navy-900 text-white relative overflow-hidden">
      
      {/* Navbar / Header */}
      <nav className="flex-none p-6 md:px-12 flex items-center justify-between border-b border-white/10 bg-navy-900/80 backdrop-blur-md z-20">
        <h1 className="text-2xl font-serif font-bold text-coral-500 tracking-wide">
          {t.title}
        </h1>
        
        <div className="flex items-center gap-6">
          {/* Language Switcher */}
          <div className="flex gap-4 text-sm font-medium">
            {Object.values(Language).map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className={`transition-colors ${
                  language === lang 
                    ? 'text-white border-b-2 border-coral-500 pb-0.5' 
                    : 'text-gray-400 hover:text-coral-500'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>

          {/* Settings Button */}
          <button
            onClick={() => setCurrentView('SETTINGS')}
            className={`transition-all duration-300 ${!hasApiKey ? 'text-coral-500 animate-pulse' : 'text-gray-400 hover:text-coral-500 hover:rotate-90'}`}
            title={t.settings}
          >
            <SettingsIcon size={24} />
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col justify-center items-center p-6 md:p-12 z-10 relative">
        <div className="text-center max-w-2xl mb-12">
          {/* Headline Structure */}
          <h2 className="text-5xl md:text-7xl font-serif font-bold mb-6 text-coral-500 leading-tight">
            {t.title}
          </h2>
          <p className="text-xl md:text-2xl font-serif italic text-white mb-6 leading-relaxed">
            "{t.definition}"
          </p>
          <p className="text-gray-400 text-base md:text-lg font-light leading-relaxed max-w-lg mx-auto">
            {t.landingDescription}
          </p>
        </div>

        {/* API Key Missing Warning */}
        {!hasApiKey && (
            <div className="w-full max-w-lg mb-8 bg-coral-500/10 border border-coral-500/50 p-4 rounded-xl flex items-center gap-4 animate-fade-in-up">
                <div className="text-coral-500"><AlertCircle size={24} /></div>
                <div className="flex-1">
                    <p className="text-sm text-gray-200">
                        {language === Language.SV ? 'API-nyckel saknas. AI-funktioner kommer inte att fungera.' : 'API Key missing. AI features will not work.'}
                    </p>
                    <button 
                        onClick={() => setCurrentView('SETTINGS')}
                        className="text-xs font-bold text-coral-500 hover:text-white underline mt-1"
                    >
                        {language === Language.SV ? 'Gå till Inställningar' : 'Go to Settings'}
                    </button>
                </div>
            </div>
        )}

        {/* Single "Big Box" Dashboard */}
        <div className="w-full max-w-2xl bg-navy-800 border border-white/10 rounded-2xl p-8 md:p-12 shadow-2xl flex flex-col items-center text-center animate-fade-in-up group">
           <h3 className="text-3xl md:text-4xl font-serif font-bold text-coral-500 mb-8 tracking-wide">
             {t.glimmersDiary}
           </h3>
           
           <div className="flex flex-col md:flex-row gap-6 w-full justify-center">
             <button 
               onClick={() => {
                   setEditingEntry(null);
                   setCurrentView('NEW_ENTRY');
               }}
               className="flex-1 bg-coral-500 text-white py-4 px-8 rounded-xl font-bold text-lg shadow-lg hover:bg-coral-600 transition-all hover:scale-105 flex items-center justify-center gap-3"
             >
               <Plus size={24} /> {t.newEntry}
             </button>

             <button 
               onClick={() => setCurrentView('DIARY')}
               className="flex-1 bg-navy-700 text-white border border-white/20 py-4 px-8 rounded-xl font-bold text-lg shadow-lg hover:bg-navy-600 hover:border-white/40 transition-all hover:scale-105 flex items-center justify-center gap-3"
             >
               <ArrowRight size={24} /> {t.previousEntries}
             </button>
           </div>
        </div>

      </main>
      
      <footer className="p-8 bg-navy-950 text-center text-gray-500 text-sm">
        &copy; 2025 Glimmer. Private & Secure.
      </footer>
    </div>
  );

  return renderContent();
}

export default App;
