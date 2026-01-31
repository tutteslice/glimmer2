import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Smile, CloudRain, Flame, Check, Upload, Database, RefreshCw, Download } from 'lucide-react';
import { Language, Translation, AppSettings, Person, FeelingEntry, FeelingType, Emotion } from '../types';
import { getSettings, saveSettings, importData, savePerson, saveBulkEntries, getPeople } from '../services/storageService';

interface SettingsProps {
  language: Language;
  t: Translation;
  onBack: () => void;
}

// Static Sample Data for Manual Download
const SAMPLE_DATA: FeelingEntry[] = [
  // --- SIMON (Best Friend) ---
  {
    "id": "simon-1",
    "timestamp": Date.now() - 86400000 * 1,
    "type": FeelingType.POSITIVE,
    "emotion": "HAPPY" as Emotion,
    "intensity": 8,
    "text": "Had coffee with Simon. We talked about his new job and he seems really settled. Good vibes.",
    "summary": "Coffee with Simon",
    "reason": "Met Simon",
    "reaction": "Laughed",
    "people": ["Simon"],
    "moodScore": 85,
    "tags": ["social", "friendship"]
  },
  {
    "id": "simon-2",
    "timestamp": Date.now() - 86400000 * 3,
    "type": FeelingType.POSITIVE,
    "emotion": "GRATEFUL" as Emotion,
    "intensity": 9,
    "text": "Simon helped me move the heavy couch today. I couldn't have done it without him.",
    "summary": "Moving help",
    "reason": "Received help",
    "reaction": "High-fived",
    "people": ["Simon"],
    "moodScore": 90,
    "tags": ["help", "home"]
  },
  {
    "id": "simon-3",
    "timestamp": Date.now() - 86400000 * 5,
    "type": FeelingType.POSITIVE,
    "emotion": "EXCITED" as Emotion,
    "intensity": 8,
    "text": "Planning a road trip with Simon for next month. Looking at maps and Airbnb options.",
    "summary": "Trip planning",
    "reason": "Planned trip",
    "reaction": "Smiled",
    "people": ["Simon"],
    "moodScore": 88,
    "tags": ["travel", "future"]
  },
  {
    "id": "simon-4",
    "timestamp": Date.now() - 86400000 * 8,
    "type": FeelingType.POSITIVE,
    "emotion": "CALM" as Emotion,
    "intensity": 6,
    "text": "Just sat on the porch with Simon, not saying much. It's nice to have friends you can be quiet with.",
    "summary": "Quiet evening",
    "reason": "Relaxed with Simon",
    "reaction": "Relaxed",
    "people": ["Simon"],
    "moodScore": 80,
    "tags": ["peace", "friendship"]
  },
  {
    "id": "simon-5",
    "timestamp": Date.now() - 86400000 * 12,
    "type": FeelingType.POSITIVE,
    "emotion": "HAPPY" as Emotion,
    "intensity": 7,
    "text": "Beat Simon at FIFA finally. He took it well, surprisingly.",
    "summary": "Gaming win",
    "reason": "Played games",
    "reaction": "Cheered",
    "people": ["Simon"],
    "moodScore": 85,
    "tags": ["gaming", "fun"]
  },
  {
    "id": "simon-6",
    "timestamp": Date.now() - 86400000 * 15,
    "type": FeelingType.POSITIVE,
    "emotion": "GRATEFUL" as Emotion,
    "intensity": 8,
    "text": "Simon brought me soup when I wasn't feeling great. He's a true friend.",
    "summary": "Care package",
    "reason": "Received care",
    "reaction": "Felt warm",
    "people": ["Simon"],
    "moodScore": 90,
    "tags": ["kindness"]
  },
  {
    "id": "simon-7",
    "timestamp": Date.now() - 86400000 * 18,
    "type": FeelingType.POSITIVE,
    "emotion": "EXCITED" as Emotion,
    "intensity": 9,
    "text": "We got tickets to the concert! Simon managed to snag front row seats.",
    "summary": "Concert tickets",
    "reason": "Bought tickets",
    "reaction": "Jumped",
    "people": ["Simon"],
    "moodScore": 95,
    "tags": ["music", "events"]
  },
  {
    "id": "simon-8",
    "timestamp": Date.now() - 86400000 * 22,
    "type": FeelingType.POSITIVE,
    "emotion": "HAPPY" as Emotion,
    "intensity": 7,
    "text": "Tried that new burger place with Simon. The food was amazing.",
    "summary": "Burger lunch",
    "reason": "Ate lunch",
    "reaction": "Satisfied",
    "people": ["Simon"],
    "moodScore": 85,
    "tags": ["food", "outing"]
  },
  {
    "id": "simon-9",
    "timestamp": Date.now() - 86400000 * 25,
    "type": FeelingType.POSITIVE,
    "emotion": "CALM" as Emotion,
    "intensity": 5,
    "text": "Morning jog with Simon. Good pace, fresh air.",
    "summary": "Morning run",
    "reason": "Exercised",
    "reaction": "Breathed",
    "people": ["Simon"],
    "moodScore": 75,
    "tags": ["health", "morning"]
  },
  {
    "id": "simon-10",
    "timestamp": Date.now() - 86400000 * 28,
    "type": FeelingType.POSITIVE,
    "emotion": "GRATEFUL" as Emotion,
    "intensity": 8,
    "text": "Simon gave me great advice about the work situation. Helped me see it clearly.",
    "summary": "Good advice",
    "reason": "Talked to Simon",
    "reaction": "Relieved",
    "people": ["Simon"],
    "moodScore": 88,
    "tags": ["advice", "work"]
  },

  // --- LELO (Subtle Crush / Intellectual Connection) ---
  {
    "id": "lelo-1",
    "timestamp": Date.now() - 86400000 * 2,
    "type": FeelingType.POSITIVE,
    "emotion": "HAPPY" as Emotion,
    "intensity": 7,
    "text": "Ran into Lelo at the library. We realized we're reading the same sci-fi series.",
    "summary": "Library coincindence",
    "reason": "Met Lelo",
    "reaction": "Smiled",
    "people": ["Lelo"],
    "moodScore": 85,
    "tags": ["books", "coincidence"]
  },
  {
    "id": "lelo-2",
    "timestamp": Date.now() - 86400000 * 4,
    "type": FeelingType.POSITIVE,
    "emotion": "GRATEFUL" as Emotion,
    "intensity": 6,
    "text": "It started raining and I didn't have an umbrella. Lelo shared hers to the bus stop. Very kind of her.",
    "summary": "Shared umbrella",
    "reason": "Walked with Lelo",
    "reaction": "Thanked her",
    "people": ["Lelo"],
    "moodScore": 80,
    "tags": ["kindness", "rain"]
  },
  {
    "id": "lelo-3",
    "timestamp": Date.now() - 86400000 * 6,
    "type": FeelingType.POSITIVE,
    "emotion": "CALM" as Emotion,
    "intensity": 7,
    "text": "Working alongside Lelo on the community project. She has a very organized way of thinking that I admire.",
    "summary": "Project collaboration",
    "reason": "Worked with Lelo",
    "reaction": "Observed",
    "people": ["Lelo"],
    "moodScore": 82,
    "tags": ["work", "admiration"]
  },
  {
    "id": "lelo-4",
    "timestamp": Date.now() - 86400000 * 9,
    "type": FeelingType.POSITIVE,
    "emotion": "EXCITED" as Emotion,
    "intensity": 7,
    "text": "Lelo recommended a podcast about architecture. It's actually fascinating.",
    "summary": "Podcast recommendation",
    "reason": "Listened to recommendation",
    "reaction": "Engaged",
    "people": ["Lelo"],
    "moodScore": 85,
    "tags": ["learning", "interests"]
  },
  {
    "id": "lelo-5",
    "timestamp": Date.now() - 86400000 * 11,
    "type": FeelingType.POSITIVE,
    "emotion": "HAPPY" as Emotion,
    "intensity": 6,
    "text": "Noticed Lelo changed her hair. It suits her.",
    "summary": "New hairstyle",
    "reason": "Saw Lelo",
    "reaction": "Noticed",
    "people": ["Lelo"],
    "moodScore": 75,
    "tags": ["observation"]
  },
  {
    "id": "lelo-6",
    "timestamp": Date.now() - 86400000 * 14,
    "type": FeelingType.POSITIVE,
    "emotion": "GRATEFUL" as Emotion,
    "intensity": 7,
    "text": "I forgot my notes for the meeting. Lelo had an extra copy she let me use.",
    "summary": "Saved by Lelo",
    "reason": "Received help",
    "reaction": "Relieved",
    "people": ["Lelo"],
    "moodScore": 85,
    "tags": ["work", "help"]
  },
  {
    "id": "lelo-7",
    "timestamp": Date.now() - 86400000 * 17,
    "type": FeelingType.POSITIVE,
    "emotion": "HAPPY" as Emotion,
    "intensity": 8,
    "text": "Lelo has a really distinct laugh. Made the whole group lighten up today.",
    "summary": "Lelo's laugh",
    "reason": "Heard laughter",
    "reaction": "Smiled",
    "people": ["Lelo"],
    "moodScore": 88,
    "tags": ["social", "joy"]
  },
  {
    "id": "lelo-8",
    "timestamp": Date.now() - 86400000 * 20,
    "type": FeelingType.POSITIVE,
    "emotion": "CALM" as Emotion,
    "intensity": 6,
    "text": "Sat near Lelo during the break. We didn't talk much, just enjoyed the quiet.",
    "summary": "Quiet break",
    "reason": "Sat with Lelo",
    "reaction": "Relaxed",
    "people": ["Lelo"],
    "moodScore": 78,
    "tags": ["break", "presence"]
  },
  {
    "id": "lelo-9",
    "timestamp": Date.now() - 86400000 * 24,
    "type": FeelingType.POSITIVE,
    "emotion": "EXCITED" as Emotion,
    "intensity": 7,
    "text": "Found out Lelo also speaks a bit of French. We tried to have a basic conversation.",
    "summary": "Language practice",
    "reason": "Talked to Lelo",
    "reaction": "Laughed",
    "people": ["Lelo"],
    "moodScore": 85,
    "tags": ["language", "fun"]
  },
  {
    "id": "lelo-10",
    "timestamp": Date.now() - 86400000 * 27,
    "type": FeelingType.POSITIVE,
    "emotion": "HAPPY" as Emotion,
    "intensity": 7,
    "text": "Shared a coffee with Lelo. She has interesting perspectives on the city.",
    "summary": "Coffee chat",
    "reason": "Drank coffee",
    "reaction": "Listened",
    "people": ["Lelo"],
    "moodScore": 82,
    "tags": ["conversation", "coffee"]
  },

  // --- ZOEY (Wholesome Child) ---
  {
    "id": "zoey-1",
    "timestamp": Date.now() - 86400000 * 1,
    "type": FeelingType.POSITIVE,
    "emotion": "HAPPY" as Emotion,
    "intensity": 9,
    "text": "Zoey showed me her drawing of a dragon. It was purple and had five legs. Adorable.",
    "summary": "Dragon drawing",
    "reason": "Saw drawing",
    "reaction": "Praised her",
    "people": ["Zoey"],
    "moodScore": 92,
    "tags": ["art", "kids"]
  },
  {
    "id": "zoey-2",
    "timestamp": Date.now() - 86400000 * 4,
    "type": FeelingType.POSITIVE,
    "emotion": "EXCITED" as Emotion,
    "intensity": 8,
    "text": "Played tag with Zoey in the park. She's getting fast!",
    "summary": "Playing tag",
    "reason": "Played outside",
    "reaction": "Ran",
    "people": ["Zoey"],
    "moodScore": 90,
    "tags": ["play", "park"]
  },
  {
    "id": "zoey-3",
    "timestamp": Date.now() - 86400000 * 7,
    "type": FeelingType.POSITIVE,
    "emotion": "GRATEFUL" as Emotion,
    "intensity": 7,
    "text": "Zoey shared her cookie with me. 'Half for you' she said.",
    "summary": "Shared cookie",
    "reason": "Received snack",
    "reaction": "Ate it",
    "people": ["Zoey"],
    "moodScore": 88,
    "tags": ["sharing", "sweet"]
  },
  {
    "id": "zoey-4",
    "timestamp": Date.now() - 86400000 * 10,
    "type": FeelingType.POSITIVE,
    "emotion": "CALM" as Emotion,
    "intensity": 6,
    "text": "Read a story to Zoey. She fell asleep halfway through.",
    "summary": "Storytime",
    "reason": "Read book",
    "reaction": "Whispered",
    "people": ["Zoey"],
    "moodScore": 85,
    "tags": ["reading", "calm"]
  },
  {
    "id": "zoey-5",
    "timestamp": Date.now() - 86400000 * 13,
    "type": FeelingType.POSITIVE,
    "emotion": "HAPPY" as Emotion,
    "intensity": 8,
    "text": "Zoey learned to tie her shoes today! She was so proud.",
    "summary": "Shoe tying",
    "reason": "Watched Zoey",
    "reaction": "Clapped",
    "people": ["Zoey"],
    "moodScore": 90,
    "tags": ["milestone"]
  },
  {
    "id": "zoey-6",
    "timestamp": Date.now() - 86400000 * 16,
    "type": FeelingType.POSITIVE,
    "emotion": "EXCITED" as Emotion,
    "intensity": 9,
    "text": "Zoey found a 'magic rock' in the garden. She was so excited to show me.",
    "summary": "Magic rock",
    "reason": "Found object",
    "reaction": "Examined it",
    "people": ["Zoey"],
    "moodScore": 92,
    "tags": ["discovery"]
  },
  {
    "id": "zoey-7",
    "timestamp": Date.now() - 86400000 * 19,
    "type": FeelingType.POSITIVE,
    "emotion": "HAPPY" as Emotion,
    "intensity": 7,
    "text": "Zoey told me a knock-knock joke. It didn't make sense but her delivery was perfect.",
    "summary": "Zoey's joke",
    "reason": "Heard joke",
    "reaction": "Laughed",
    "people": ["Zoey"],
    "moodScore": 88,
    "tags": ["humor"]
  },
  {
    "id": "zoey-8",
    "timestamp": Date.now() - 86400000 * 23,
    "type": FeelingType.POSITIVE,
    "emotion": "CALM" as Emotion,
    "intensity": 5,
    "text": "Coloring book time with Zoey. Very therapeutic.",
    "summary": "Coloring",
    "reason": "Colored",
    "reaction": "Focused",
    "people": ["Zoey"],
    "moodScore": 80,
    "tags": ["art", "relax"]
  },
  {
    "id": "zoey-9",
    "timestamp": Date.now() - 86400000 * 26,
    "type": FeelingType.POSITIVE,
    "emotion": "HAPPY" as Emotion,
    "intensity": 8,
    "text": "Zoey gave me a high-five for fixing her toy.",
    "summary": "Toy fix",
    "reason": "Fixed toy",
    "reaction": "High-fived",
    "people": ["Zoey"],
    "moodScore": 85,
    "tags": ["helping"]
  },
  {
    "id": "zoey-10",
    "timestamp": Date.now() - 86400000 * 29,
    "type": FeelingType.POSITIVE,
    "emotion": "GRATEFUL" as Emotion,
    "intensity": 7,
    "text": "Zoey picked a dandelion for me.",
    "summary": "Flower gift",
    "reason": "Received flower",
    "reaction": "Smiled",
    "people": ["Zoey"],
    "moodScore": 88,
    "tags": ["nature", "gift"]
  },

  // --- LIDIJA (Friendly/Sister) ---
  {
    "id": "lidija-1",
    "timestamp": Date.now() - 86400000 * 2,
    "type": FeelingType.POSITIVE,
    "emotion": "GRATEFUL" as Emotion,
    "intensity": 8,
    "text": "Lidija invited me over for dinner. Her cooking is always comforting.",
    "summary": "Dinner invitation",
    "reason": "Ate dinner",
    "reaction": "Satisfied",
    "people": ["Lidija"],
    "moodScore": 88,
    "tags": ["food", "hospitality"]
  },
  {
    "id": "lidija-2",
    "timestamp": Date.now() - 86400000 * 5,
    "type": FeelingType.POSITIVE,
    "emotion": "HAPPY" as Emotion,
    "intensity": 7,
    "text": "Ran into Lidija at the market. Had a quick nice chat about vegetables.",
    "summary": "Market chat",
    "reason": "Met Lidija",
    "reaction": "Chatted",
    "people": ["Lidija"],
    "moodScore": 82,
    "tags": ["market", "social"]
  },
  {
    "id": "lidija-3",
    "timestamp": Date.now() - 86400000 * 8,
    "type": FeelingType.POSITIVE,
    "emotion": "CALM" as Emotion,
    "intensity": 6,
    "text": "Gardening tips from Lidija. She knows so much about plants.",
    "summary": "Gardening talk",
    "reason": "Discussed plants",
    "reaction": "Listened",
    "people": ["Lidija"],
    "moodScore": 80,
    "tags": ["garden", "learning"]
  },
  {
    "id": "lidija-4",
    "timestamp": Date.now() - 86400000 * 11,
    "type": FeelingType.POSITIVE,
    "emotion": "EXCITED" as Emotion,
    "intensity": 7,
    "text": "Lidija is planning a surprise party for Lelo. Fun to be in on the secret.",
    "summary": "Secret planning",
    "reason": "Planned party",
    "reaction": "Whispered",
    "people": ["Lidija", "Lelo"],
    "moodScore": 85,
    "tags": ["party", "secret"]
  },
  {
    "id": "lidija-5",
    "timestamp": Date.now() - 86400000 * 14,
    "type": FeelingType.POSITIVE,
    "emotion": "GRATEFUL" as Emotion,
    "intensity": 8,
    "text": "Lidija gave me a cutting of her pothos plant. Hope I can keep it alive.",
    "summary": "Plant gift",
    "reason": "Received plant",
    "reaction": "Thanked her",
    "people": ["Lidija"],
    "moodScore": 85,
    "tags": ["plants", "gift"]
  },
  {
    "id": "lidija-6",
    "timestamp": Date.now() - 86400000 * 18,
    "type": FeelingType.POSITIVE,
    "emotion": "HAPPY" as Emotion,
    "intensity": 7,
    "text": "Lidija complimented my new shirt. She has good taste.",
    "summary": "Compliment",
    "reason": "Received compliment",
    "reaction": "Smiled",
    "people": ["Lidija"],
    "moodScore": 82,
    "tags": ["compliment", "style"]
  },
  {
    "id": "lidija-7",
    "timestamp": Date.now() - 86400000 * 21,
    "type": FeelingType.POSITIVE,
    "emotion": "CALM" as Emotion,
    "intensity": 6,
    "text": "Walked the dog with Lidija. Nice evening stroll.",
    "summary": "Dog walk",
    "reason": "Walked",
    "reaction": "Walked",
    "people": ["Lidija"],
    "moodScore": 78,
    "tags": ["walk", "pets"]
  },
  {
    "id": "lidija-8",
    "timestamp": Date.now() - 86400000 * 25,
    "type": FeelingType.POSITIVE,
    "emotion": "HAPPY" as Emotion,
    "intensity": 7,
    "text": "Lidija told a funny story about her childhood with Lelo.",
    "summary": "Childhood story",
    "reason": "Heard story",
    "reaction": "Laughed",
    "people": ["Lidija", "Lelo"],
    "moodScore": 85,
    "tags": ["story", "history"]
  },
  {
    "id": "lidija-9",
    "timestamp": Date.now() - 86400000 * 28,
    "type": FeelingType.POSITIVE,
    "emotion": "GRATEFUL" as Emotion,
    "intensity": 7,
    "text": "Lidija helped me pick out a gift for my mom.",
    "summary": "Gift help",
    "reason": "Shopped",
    "reaction": "Relieved",
    "people": ["Lidija"],
    "moodScore": 84,
    "tags": ["shopping", "help"]
  },
  {
    "id": "lidija-10",
    "timestamp": Date.now() - 86400000 * 30,
    "type": FeelingType.POSITIVE,
    "emotion": "EXCITED" as Emotion,
    "intensity": 8,
    "text": "Lidija showed me photos from her recent trip. Looks amazing.",
    "summary": "Travel photos",
    "reason": "Saw photos",
    "reaction": "Admired",
    "people": ["Lidija"],
    "moodScore": 85,
    "tags": ["travel", "photos"]
  }
];

export const Settings: React.FC<SettingsProps> = ({ language, t, onBack }) => {
  const [settings, setSettings] = useState<AppSettings>({
    enablePositive: true,
    enableNegative: false,
    enableSexual: false
  });

  const [importStatus, setImportStatus] = useState<'IDLE' | 'SUCCESS' | 'ERROR'>('IDLE');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSettings(getSettings());
  }, []);

  const toggleSetting = (key: keyof AppSettings) => {
    // Prevent disabling the last remaining category
    const activeCount = 
      (settings.enablePositive ? 1 : 0) + 
      (settings.enableNegative ? 1 : 0) + 
      (settings.enableSexual ? 1 : 0);

    if (settings[key] && activeCount === 1) {
        return;
    }

    const newSettings = { ...settings, [key]: !settings[key] };
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
          if (event.target?.result) {
              const success = importData(event.target.result as string);
              setImportStatus(success ? 'SUCCESS' : 'ERROR');
              
              // Enable all settings so they see the imported data
              if (success) {
                  const newSettings = { enablePositive: true, enableNegative: true, enableSexual: true };
                  setSettings(newSettings);
                  saveSettings(newSettings);
                  alert("Data imported! I've enabled all categories so you can see the new entries.");
              }
              
              setTimeout(() => setImportStatus('IDLE'), 3000);
          }
      };
      reader.readAsText(file);
      // Reset input so we can select same file again if needed
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDownloadSample = () => {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(SAMPLE_DATA, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", "glimmer_manual_demo.json");
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
  };

  const handleLoadDemoData = () => {
    if (!window.confirm("This will add 20 test entries and 4 people to your database. Continue?")) return;

    // Helper for ID generation 
    const generateId = () => {
        try {
            if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
                return (crypto as any).randomUUID();
            }
        } catch (e) { /* ignore */ }
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    };

    try {
        console.log("Starting demo data load...");
        const today = new Date();
        const currentYear = today.getFullYear();
        const prevYear = currentYear - 1;

        // 1. Create People
        const peopleData = [
            { name: 'Lelo', relation: 'Crush' },
            { name: 'Zoey', relation: 'Daughter of Lelo' },
            { name: 'Lidija', relation: 'Sister of Lelo' },
            { name: 'Simon', relation: 'Best Friend' }
        ];

        // Ensure we don't duplicate names if they already exist
        const existingPeople = getPeople() || [];
        const existingNames = new Set(existingPeople.map(p => p.name.toLowerCase()));

        peopleData.forEach(p => {
            if (!existingNames.has(p.name.toLowerCase())) {
                savePerson({ id: generateId(), name: p.name, relation: p.relation });
            }
        });

        // 2. Create Entries
        // Helpers
        const mkDate = (y: number, m: number, d: number) => new Date(y, m, d, 14, 0, 0).getTime();
        
        type DemoEntry = {
            date: number;
            type: FeelingType;
            emotion: Emotion;
            action: string;
            subject: string;
            reaction: string;
            summary: string;
            people: string[];
            intensity: number;
            text: string;
        };

        const demoEntries: DemoEntry[] = [
            // DECEMBER (Previous Year)
            { 
                date: mkDate(prevYear, 11, 2), type: FeelingType.POSITIVE, emotion: 'HAPPY', 
                action: 'Drank coffee', subject: 'Simon', reaction: 'Laughed a lot',
                summary: 'Coffee with Simon', people: ['Simon'], intensity: 8,
                text: "Met Simon at the cafe. We talked about his new job. Good vibes."
            },
            { 
                date: mkDate(prevYear, 11, 5), type: FeelingType.POSITIVE, emotion: 'EXCITED', 
                action: 'Saw', subject: 'Lelo', reaction: 'Heart raced',
                summary: 'Saw Lelo at the store', people: ['Lelo'], intensity: 9,
                text: "Bumped into Lelo while grocery shopping. She looked amazing in that blue coat."
            },
            { 
                date: mkDate(prevYear, 11, 7), type: FeelingType.NEGATIVE, emotion: 'SAD', 
                action: 'Sat alone', subject: 'Rain', reaction: 'Cried',
                summary: 'Rainy day blues', people: [], intensity: 6,
                text: "Gloomy weather today. Felt a bit lonely."
            },
            { 
                date: mkDate(prevYear, 11, 10), type: FeelingType.SEXUAL, emotion: 'AROUSED', 
                action: 'Dreamt about', subject: 'Lelo', reaction: 'Woke up hot',
                summary: 'Intense dream about Lelo', people: ['Lelo'], intensity: 10,
                text: "Had a very vivid dream about Lelo. We were alone in a cabin."
            },
            { 
                date: mkDate(prevYear, 11, 12), type: FeelingType.POSITIVE, emotion: 'GRATEFUL', 
                action: 'Received drawing', subject: 'Zoey', reaction: 'Smiled',
                summary: 'Zoey drew me a picture', people: ['Zoey'], intensity: 7,
                text: "Zoey gave me a drawing of a cat. She is so sweet."
            },
            { 
                date: mkDate(prevYear, 11, 15), type: FeelingType.NEGATIVE, emotion: 'FRUSTRATED', 
                action: 'Worked on', subject: 'Project', reaction: 'Stressed',
                summary: 'Work deadline stress', people: [], intensity: 8,
                text: "Too much to do before the holidays."
            },
            { 
                date: mkDate(prevYear, 11, 18), type: FeelingType.POSITIVE, emotion: 'CALM', 
                action: 'Walked with', subject: 'Lidija', reaction: 'Relaxed',
                summary: 'Walk with Lidija', people: ['Lidija'], intensity: 5,
                text: "Lidija gave me some good advice about patience."
            },
            { 
                date: mkDate(prevYear, 11, 20), type: FeelingType.NEGATIVE, emotion: 'ANXIOUS', 
                action: 'Bought', subject: 'Gift for Lelo', reaction: 'Sweated',
                summary: 'Gift shopping anxiety', people: ['Lelo'], intensity: 7,
                text: "Bought a book for Lelo. Is it too personal? Not personal enough?"
            },
            { 
                date: mkDate(prevYear, 11, 23), type: FeelingType.SEXUAL, emotion: 'LUSTFUL', 
                action: 'Received', subject: 'Text from Lelo', reaction: 'Got hard',
                summary: 'Flirty text from Lelo', people: ['Lelo'], intensity: 8,
                text: "She sent a wink emoji. What does it mean? My mind is racing."
            },
            { 
                date: mkDate(prevYear, 11, 25), type: FeelingType.POSITIVE, emotion: 'HAPPY', 
                action: 'Celebrated', subject: 'Christmas', reaction: 'Felt warm',
                summary: 'Christmas Party', people: ['Simon', 'Lidija'], intensity: 9,
                text: "Great party at Simon's place. Lidija was there too."
            },
            { 
                date: mkDate(prevYear, 11, 28), type: FeelingType.NEGATIVE, emotion: 'SAD', 
                action: 'Experienced', subject: 'Post-holiday blues', reaction: 'Slept all day',
                summary: 'Holiday hangover', people: [], intensity: 4,
                text: "Everything is quiet now. Feeling empty."
            },
            { 
                date: mkDate(prevYear, 11, 31), type: FeelingType.POSITIVE, emotion: 'EXCITED', 
                action: 'Planned', subject: 'New Year', reaction: 'Cheered',
                summary: 'NYE Plans', people: ['Simon'], intensity: 8,
                text: "Going to the city with Simon for fireworks."
            },

            // JANUARY (Current Year)
            { 
                date: mkDate(currentYear, 0, 2), type: FeelingType.POSITIVE, emotion: 'HAPPY', 
                action: 'Started', subject: 'New Year', reaction: 'Felt motivated',
                summary: 'Fresh start', people: [], intensity: 7,
                text: "Feeling good about this year."
            },
            { 
                date: mkDate(currentYear, 0, 5), type: FeelingType.SEXUAL, emotion: 'PASSIONATE', 
                action: 'Saw', subject: 'Lelo at gym', reaction: 'Stared',
                summary: 'Lelo at the gym', people: ['Lelo'], intensity: 9,
                text: "Saw her working out. Incredible focus."
            },
            { 
                date: mkDate(currentYear, 0, 8), type: FeelingType.NEGATIVE, emotion: 'ANGRY', 
                action: 'Argued with', subject: 'Simon', reaction: 'Shouted',
                summary: 'Fight with Simon', people: ['Simon'], intensity: 8,
                text: "Simon was being a jerk about my feelings for Lelo."
            },
            { 
                date: mkDate(currentYear, 0, 10), type: FeelingType.POSITIVE, emotion: 'GRATEFUL', 
                action: 'Talked to', subject: 'Lidija', reaction: 'Felt heard',
                summary: 'Venting to Lidija', people: ['Lidija'], intensity: 7,
                text: "Lidija listened to my rant about Simon. She gets it."
            },
            { 
                date: mkDate(currentYear, 0, 14), type: FeelingType.SEXUAL, emotion: 'INTIMATE', 
                action: 'Shared', subject: 'Moment with Lelo', reaction: 'Held hands',
                summary: 'Deep talk with Lelo', people: ['Lelo'], intensity: 9,
                text: "We talked until 2AM. There was definitely a spark."
            },
            { 
                date: mkDate(currentYear, 0, 18), type: FeelingType.NEGATIVE, emotion: 'ANXIOUS', 
                action: 'Overthought', subject: 'The conversation', reaction: 'Panicked',
                summary: 'Did I say too much?', people: ['Lelo'], intensity: 6,
                text: "Worrying that I revealed my feelings too soon."
            },
            { 
                date: mkDate(currentYear, 0, 21), type: FeelingType.POSITIVE, emotion: 'HAPPY', 
                action: 'Attended', subject: 'Zoey Birthday', reaction: 'Played games',
                summary: 'Zoey\'s Birthday Party', people: ['Zoey', 'Lelo'], intensity: 9,
                text: "Zoey turned 6. Lelo was so happy watching her open gifts."
            },
            { 
                date: mkDate(currentYear, 0, 24), type: FeelingType.POSITIVE, emotion: 'CALM', 
                action: 'Read', subject: 'Book', reaction: 'Relaxed',
                summary: 'Quiet evening', people: [], intensity: 5,
                text: "Just reading and recovering from the week."
            }
        ];

        const finalEntries: FeelingEntry[] = demoEntries.map(e => ({
            id: generateId(),
            timestamp: e.date,
            type: e.type,
            emotion: e.emotion,
            intensity: e.intensity,
            text: e.text,
            summary: e.summary,
            reason: `${e.action} ${e.subject}`,
            reaction: e.reaction,
            people: e.people,
            tags: [],
            images: [],
            moodScore: e.type === FeelingType.POSITIVE ? 80 : e.type === FeelingType.NEGATIVE ? 30 : 90
        }));

        saveBulkEntries(finalEntries);

        // Enable all filters so user sees data
        const newSettings = { enablePositive: true, enableNegative: true, enableSexual: true };
        setSettings(newSettings);
        saveSettings(newSettings);

        alert("Success! Demo data loaded. The app will now reload.");
        window.location.reload();
        
    } catch (err: any) {
        console.error("Demo load failed", err);
        alert(`Failed to load demo data: ${err.message}`);
    }
  };

  return (
    <div className="flex flex-col h-full bg-navy-900 text-white animate-fade-in">
      {/* Header */}
      <header className="bg-navy-900 border-b border-white/10 p-4 z-10 sticky top-0">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="p-2 -ml-2 text-gray-400 hover:text-coral-500 transition-colors rounded-full hover:bg-white/5"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h2 className="text-xl font-serif font-bold text-coral-500">{t.settings}</h2>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6 md:p-8 max-w-2xl mx-auto w-full">
        
        {/* Data Import/Demo Section */}
        <div className="mb-8 p-6 bg-navy-800 rounded-xl border border-white/5">
            <div className="flex items-center gap-2 mb-2">
                <Database className="text-blue-500" size={24} />
                <h3 className="text-xl font-serif font-bold">Data Management</h3>
            </div>
            <p className="text-gray-400 mb-6">
                Manage your data or load sample content to test the app.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Import */}
                <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input type="file" accept=".json" ref={fileInputRef} className="hidden" onChange={handleFileSelect} />
                    
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className={`w-full py-3 rounded-lg font-bold border border-white/10 hover:bg-white/5 transition-all flex items-center justify-center gap-2 ${
                            importStatus === 'SUCCESS' ? 'text-green-500 border-green-500/50' : 
                            importStatus === 'ERROR' ? 'text-red-500 border-red-500/50' : 'text-white'
                        }`}
                    >
                        {importStatus === 'SUCCESS' ? <Check size={20} /> : <Upload size={20} />}
                        {importStatus === 'SUCCESS' ? t.importSuccess : 
                        importStatus === 'ERROR' ? t.importError : t.importData}
                    </button>

                     <button 
                        onClick={handleDownloadSample}
                        className="w-full py-3 rounded-lg font-bold bg-navy-900 border border-white/10 hover:border-coral-500/50 hover:text-coral-500 text-gray-400 transition-all flex items-center justify-center gap-2"
                    >
                        <Download size={20} />
                        Download Sample JSON
                    </button>
                </div>

                {/* Demo Data */}
                <div className="md:col-span-2">
                     <div className="relative flex items-center gap-2 my-2">
                        <div className="h-px bg-white/10 flex-1"></div>
                        <span className="text-xs text-gray-500 font-bold uppercase">or auto-generate</span>
                        <div className="h-px bg-white/10 flex-1"></div>
                     </div>

                    <button 
                        onClick={handleLoadDemoData}
                        className="w-full py-3 rounded-lg font-bold bg-navy-900 border border-white/10 hover:border-coral-500/50 hover:text-coral-500 text-gray-400 transition-all flex items-center justify-center gap-2"
                    >
                        <RefreshCw size={20} />
                        Load Auto-Generated Data
                    </button>
                </div>
            </div>
        </div>

        <div className="mb-6 border-t border-white/10 pt-8">
            <h3 className="text-2xl font-serif font-bold mb-2">{t.visibleFeelings}</h3>
            <p className="text-gray-400">{t.settingsSubtitle}</p>
        </div>

        <div className="space-y-4">
          
          {/* Positive Feelings Toggle */}
          <button
            onClick={() => toggleSetting('enablePositive')}
            className={`
              w-full flex items-center justify-between p-6 rounded-xl border transition-all duration-200
              ${settings.enablePositive 
                ? 'bg-navy-800 border-coral-500/50 shadow-md' 
                : 'bg-navy-900 border-white/5 opacity-60 hover:opacity-80'
              }
            `}
          >
            <div className="flex items-center gap-4">
              <div className={`
                p-3 rounded-full transition-colors
                ${settings.enablePositive ? 'bg-coral-500/10 text-coral-500' : 'bg-navy-950 text-gray-500'}
              `}>
                <Smile size={24} />
              </div>
              <span className={`text-lg font-medium ${settings.enablePositive ? 'text-white' : 'text-gray-400'}`}>
                {t.settingsPositive}
              </span>
            </div>
            
            <div className={`
              w-12 h-7 rounded-full flex items-center p-1 transition-colors duration-300
              ${settings.enablePositive ? 'bg-coral-500' : 'bg-navy-950 border border-white/10'}
            `}>
              <div className={`
                bg-white w-5 h-5 rounded-full shadow-sm transform transition-transform duration-300
                ${settings.enablePositive ? 'translate-x-5' : 'translate-x-0'}
              `} />
            </div>
          </button>

          {/* Negative Feelings Toggle */}
          <button
            onClick={() => toggleSetting('enableNegative')}
            className={`
              w-full flex items-center justify-between p-6 rounded-xl border transition-all duration-200
              ${settings.enableNegative 
                ? 'bg-navy-800 border-blue-500/30 shadow-md' 
                : 'bg-navy-900 border-white/5 opacity-60 hover:opacity-80'
              }
            `}
          >
            <div className="flex items-center gap-4">
              <div className={`
                p-3 rounded-full transition-colors
                ${settings.enableNegative ? 'bg-blue-500/10 text-blue-400' : 'bg-navy-950 text-gray-500'}
              `}>
                <CloudRain size={24} />
              </div>
              <span className={`text-lg font-medium ${settings.enableNegative ? 'text-white' : 'text-gray-400'}`}>
                {t.settingsNegative}
              </span>
            </div>
            
            <div className={`
              w-12 h-7 rounded-full flex items-center p-1 transition-colors duration-300
              ${settings.enableNegative ? 'bg-blue-500' : 'bg-navy-950 border border-white/10'}
            `}>
              <div className={`
                bg-white w-5 h-5 rounded-full shadow-sm transform transition-transform duration-300
                ${settings.enableNegative ? 'translate-x-5' : 'translate-x-0'}
              `} />
            </div>
          </button>

          {/* Sexual Feelings Toggle (18+) */}
          <button
            onClick={() => toggleSetting('enableSexual')}
            className={`
              w-full flex items-center justify-between p-6 rounded-xl border transition-all duration-200
              ${settings.enableSexual 
                ? 'bg-navy-800 border-purple-500/50 shadow-md' 
                : 'bg-navy-900 border-white/5 opacity-60 hover:opacity-80'
              }
            `}
          >
            <div className="flex items-center gap-4 text-left">
              <div className={`
                p-3 rounded-full transition-colors
                ${settings.enableSexual ? 'bg-purple-500/10 text-purple-500' : 'bg-navy-950 text-gray-500'}
              `}>
                <Flame size={24} />
              </div>
              <div>
                <span className={`text-lg font-medium block ${settings.enableSexual ? 'text-white' : 'text-gray-400'}`}>
                    {t.settingsSexual}
                </span>
                <span className="text-xs text-gray-500 uppercase tracking-wide">
                    {t.settingsSexualSub}
                </span>
              </div>
            </div>
            
            <div className={`
              w-12 h-7 rounded-full flex items-center p-1 transition-colors duration-300 flex-shrink-0
              ${settings.enableSexual ? 'bg-purple-600' : 'bg-navy-950 border border-white/10'}
            `}>
              <div className={`
                bg-white w-5 h-5 rounded-full shadow-sm transform transition-transform duration-300
                ${settings.enableSexual ? 'translate-x-5' : 'translate-x-0'}
              `} />
            </div>
          </button>

        </div>
      </main>
    </div>
  );
};