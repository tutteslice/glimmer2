
export enum Language {
  EN = 'EN',
  SV = 'SV',
  HR = 'HR'
}

export enum FeelingType {
  POSITIVE = 'POSITIVE',
  NEGATIVE = 'NEGATIVE',
  SEXUAL = 'SEXUAL'
}

export type Emotion = 
  | 'HAPPY' | 'EXCITED' | 'GRATEFUL' | 'CALM' 
  | 'SAD' | 'ANGRY' | 'ANXIOUS' | 'FRUSTRATED'
  | 'AROUSED' | 'LUSTFUL' | 'INTIMATE' | 'PASSIONATE';

export interface AppSettings {
  enablePositive: boolean;
  enableNegative: boolean;
  enableSexual: boolean;
}

export interface Person {
  id: string;
  name: string;
  relation?: string;
  age?: string;
  interests?: string[];
  notes?: string;
}

export interface FeelingEntry {
  id: string;
  timestamp: number;
  type: FeelingType;
  emotion?: Emotion; // Specific emotion
  intensity?: number; // 1-10
  text: string; // The full narrative or chat transcript
  images?: string[]; // Array of base64 image strings
  summary?: string;
  people?: string[];
  tags?: string[];
  moodScore?: number; // 0-100 derived from analysis, distinct from user intensity
  reason?: string; // Mandatory
  reaction?: string; // Mandatory (Smile/Cry etc)
}

export interface AnalysisResult {
  isComplete: boolean;
  nextQuestion?: string;
  summary?: string;
  people?: string[];
  tags?: string[];
  moodScore?: number;
  reason?: string;
  reaction?: string;
  // Optional intermediate fields for form auto-filling
  action?: string;
  subject?: string;
}

export interface DiaryInsight {
  title: string;
  emotionalTone: string;
  reflection: string;
  patterns: string[];
  advice: string;
}

export type View = 'HOME' | 'NEW_ENTRY' | 'DIARY' | 'SETTINGS';

export interface Translation {
  title: string;
  subtitle: string;
  definition: string;
  landingDescription: string;
  newFeeling: string;
  diary: string;
  save: string;
  analyzing: string;
  saved: string;
  placeholder: string;
  filterAll: string;
  filterPositive: string;
  filterNegative: string;
  filterSexual: string;
  searchPlaceholder: string;
  noEntries: string;
  back: string;
  listening: string;
  tapToSpeak: string;
  diaryTitle: string;
  delete: string;
  insightButton: string;
  insightTitle: string;
  copyToClipboard: string;
  copied: string;
  selectSentiment: string;
  chatPlaceholder: string;
  entryComplete: string;
  missingInfo: string;
  uploadImage: string;
  drawSomething: string;
  drawing: string;
  done: string;
  cancel: string;
  clear: string;
  // New keys
  intensity: string;
  emotions: Record<Emotion, string>;
  settings: string;
  visibleFeelings: string;
  settingsSubtitle: string;
  settingsPositive: string;
  settingsNegative: string;
  settingsSexual: string;
  settingsSexualSub: string;
  // API Settings
  apiSettingsTitle: string;
  apiSettingsSubtitle: string;
  apiKeyLabel: string;
  apiKeyPlaceholder: string;
  getApiKey: string;
  saveApiKey: string;
  apiKeySaved: string;
  // Export & Share
  exportData: string;
  shareSummary: string;
  shareTitle: string;
  downloadImage: string;
  shareHint: string;
  selectPersonToShare: string;
  statSmile: string;
  // People
  managePeople: string;
  addPerson: string;
  personName: string;
  personAge: string;
  personRelation: string;
  personInterests: string;
  personNotes: string;
  savePersonProfile: string;
  updatingProfile: string;
  noPeople: string;
  filterByPerson: string;
  allPeople: string;
  // Form Fields
  thoughtLabel: string;
  reactionLabel: string;
  notesLabel: string;
  autoFill: string;
  enhance: string;
  // Chat
  chatWithDiary: string;
  chatTitle: string;
  chatInputPlaceholder: string;
  chatTemplates: {
    happiness: string;
    patterns: string;
    summary: string;
    people: string;
  };
  // V2 Additions
  importData: string;
  importSuccess: string;
  importError: string;
  edit: string;
  update: string;
  calendarView: string;
  listView: string;
  compressing: string;
  // V3 Dashboard Update
  glimmersDiary: string;
  newEntry: string;
  previousEntries: string;
}

// Global API definition
declare global {
  interface Window {
    glimmer: {
      createEntry: (data: {
        text: string;
        emotion?: string;
        action?: string;
        subject?: string;
        reaction?: string;
      }) => void;
    }
  }
}