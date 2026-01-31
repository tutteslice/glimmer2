import { FeelingEntry, AppSettings, Person } from "../types";

const STORAGE_KEY = 'glimmer_entries';
const SETTINGS_KEY = 'glimmer_settings';
const PEOPLE_KEY = 'glimmer_people';

// --- Entries ---
export const getEntries = (): FeelingEntry[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error("Failed to load entries", e);
    return [];
  }
};

export const saveEntry = (entry: FeelingEntry): void => {
  const entries = getEntries();
  const index = entries.findIndex(e => e.id === entry.id);
  
  let updated;
  if (index >= 0) {
      // Update existing
      updated = [...entries];
      updated[index] = entry;
  } else {
      // Add new to top
      updated = [entry, ...entries];
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
};

export const saveBulkEntries = (newEntries: FeelingEntry[]): void => {
    const currentEntries = getEntries();
    // Combine and deduplicate based on ID
    const currentIds = new Set(currentEntries.map(e => e.id));
    const filteredNew = newEntries.filter(e => !currentIds.has(e.id));
    
    const combined = [...filteredNew, ...currentEntries];
    // Sort by date desc
    combined.sort((a, b) => b.timestamp - a.timestamp);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(combined));
};

export const deleteEntry = (id: string): void => {
  const entries = getEntries();
  const updated = entries.filter(e => e.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
};

// --- Settings ---
export const getSettings = (): AppSettings => {
    try {
        const stored = localStorage.getItem(SETTINGS_KEY);
        if (stored) return JSON.parse(stored);
    } catch (e) {
        console.error("Failed to load settings", e);
    }
    // Default settings
    return {
        enablePositive: true,
        enableNegative: false,
        enableSexual: false
    };
};

export const saveSettings = (settings: AppSettings): void => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};

// --- People ---
export const getPeople = (): Person[] => {
    try {
        const stored = localStorage.getItem(PEOPLE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        console.error("Failed to load people", e);
        return [];
    }
};

export const savePerson = (person: Person): void => {
    const people = getPeople();
    const index = people.findIndex(p => p.id === person.id);
    
    let updated;
    if (index >= 0) {
        updated = [...people];
        updated[index] = person;
    } else {
        updated = [...people, person];
    }
    
    localStorage.setItem(PEOPLE_KEY, JSON.stringify(updated));
};

export const deletePerson = (id: string): void => {
    const people = getPeople();
    const updated = people.filter(p => p.id !== id);
    localStorage.setItem(PEOPLE_KEY, JSON.stringify(updated));
};

// --- Import ---
export const importData = (jsonStr: string): boolean => {
    try {
        const imported = JSON.parse(jsonStr);
        if (!Array.isArray(imported)) return false;
        
        // Basic validation: ensure items have at least an ID and timestamp
        const validImport = imported.filter((e: any) => e.id && e.timestamp);
        if (validImport.length === 0 && imported.length > 0) return false;

        const current = getEntries();
        const currentIds = new Set(current.map(e => e.id));
        
        // Filter out duplicates from import
        const newEntries = validImport.filter((e: any) => !currentIds.has(e.id));
        
        // Merge and sort
        const merged = [...newEntries, ...current].sort((a, b) => b.timestamp - a.timestamp);
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));

        // --- Auto-extract People ---
        const currentPeople = getPeople();
        const existingNames = new Set(currentPeople.map(p => p.name.toLowerCase()));
        const newPeopleToAdd: Person[] = [];
        const seenInImport = new Set<string>();

        validImport.forEach((entry: FeelingEntry) => {
            if (entry.people && Array.isArray(entry.people)) {
                entry.people.forEach(name => {
                    const lower = name.toLowerCase();
                    if (!existingNames.has(lower) && !seenInImport.has(lower)) {
                        seenInImport.add(lower);
                        // Generate simple ID if crypto is not available
                        let id = Math.random().toString(36).substring(2, 15);
                        try {
                             if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
                                 id = (crypto as any).randomUUID();
                             }
                        } catch(e) {}
                        
                        newPeopleToAdd.push({
                            id,
                            name: name,
                            relation: '',
                            interests: [],
                            notes: 'Imported from data.'
                        });
                    }
                });
            }
        });

        if (newPeopleToAdd.length > 0) {
            const updatedPeople = [...currentPeople, ...newPeopleToAdd];
            localStorage.setItem(PEOPLE_KEY, JSON.stringify(updatedPeople));
        }

        return true;
    } catch (e) {
        console.error("Import failed", e);
        return false;
    }
};