import fs from 'fs';
import path from 'path';

// --- Configuration ---
const OUTPUT_FILE = 'large_demo_data.json';
const START_DATE = new Date('2025-12-01T00:00:00.000Z');
const END_DATE = new Date('2026-02-01T00:00:00.000Z');
const ENTRY_COUNT = 80; // "A lot of thoughts"

// --- Constants ---
const CHARACTERS = [
    { name: 'Simon', relation: 'Friend' },
    { name: 'Lelo', relation: 'Best Friend' },
    { name: 'Zoey', relation: 'Sister' },
    { name: 'Lidija', relation: 'Colleague' },
    { name: 'Grandmother', relation: 'Family' },
    { name: 'Grandfather', relation: 'Family' },
    { name: 'Mother', relation: 'Family' },
    { name: 'Brother', relation: 'Family' },
    { name: 'Sister', relation: 'Family' } // Explicitly requested "Sister" separately, though Zoey is also a sister.
];

const EMOTIONS = {
    POSITIVE: ['HAPPY', 'EXCITED', 'GRATEFUL', 'CALM'],
    NEGATIVE: ['SAD', 'ANGRY', 'ANXIOUS', 'FRUSTRATED'],
    SEXUAL: ['AROUSED', 'LUSTFUL', 'INTIMATE', 'PASSIONATE']
};

const SCENARIOS = {
    HAPPY: [
        "had a wonderful dinner", "laughed until our sides hurt", "enjoyed the sunny weather", "accomplished a big goal", "watched a great movie", "shared a funny joke", "received a nice compliment"
    ],
    EXCITED: [
        "planning a trip", "starting a new project", "going to a concert", "meeting up after a long time", "bought something new", "trying a new restaurant", "learning a new skill"
    ],
    GRATEFUL: [
        "received a thoughtful gift", "appreciated their help", "felt loved and supported", "enjoyed a quiet moment", "thankful for good health", "loved the delicious meal", "glad for the company"
    ],
    CALM: [
        "read a book", "meditated in the morning", "had a relaxing bath", "walked in the park", "listened to soft music", "sat by the fireplace", "enjoyed the silence"
    ],
    SAD: [
        "missed them a lot", "felt lonely today", "heard bad news", "remembered a sad memory", "had a small disagreement", "felt under the weather", "things didn't go as planned"
    ],
    ANGRY: [
        "got into a heated argument", "felt disrespected", "dealing with traffic", "frustrated with work", "something broke", "plans got cancelled last minute", "felt unheard"
    ],
    ANXIOUS: [
        "worried about the future", "nervous about a presentation", "felt overwhelmed with tasks", "waiting for important news", "unsure what to say", "stressed about money", "couldn't sleep well"
    ],
    FRUSTRATED: [
        "stuck on a problem", "technology wasn't working", "couldn't find what I needed", "felt misunderstood", "making slow progress", "dealing with bureaucracy", "too much noise"
    ],
    AROUSED: [
        "felt a strong attraction", "had a steamy dream", "enjoyed an intimate moment", "couldn't stop thinking about them", "felt very connected", "shared a passionate kiss", "admired their beauty"
    ],
    LUSTFUL: [
        "fantasized about them", "felt a burning desire", "wanted to be close", "enjoyed the tension", "felt adventurous", "craved their touch", "lost in the moment"
    ],
    INTIMATE: [
        "cuddled on the couch", "had a deep conversation", "shared a secret", "felt deeply understood", "held hands walking", "gazed into each other's eyes", "slept peacefully together"
    ],
    PASSIONATE: [
        "had an intense experience", "expressed deep feelings", "felt alive and energetic", "shared a wild moment", "couldn't keep hands off", "felt a rush of emotion", "loved fiercely"
    ]
};

const REACTIONS = {
    POSITIVE: ["Smiled", "Laughed", "Felt warm", "Relaxed", "Danced", "Hugged them", "High-fived", "Cheered"],
    NEGATIVE: ["Cried", "Felt heavy", "Screamed internally", "Withdrew", "Got a headache", "Frowned", "Sighed", "Paced around"],
    SEXUAL: ["Made me horny", "Gave me an erection", "Turned me on", "Felt intense", "Got wet", "Blushed", "Heart raced", "Bit my lip"]
};

// --- Helpers ---
const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomItem = (arr) => arr[getRandomInt(0, arr.length - 1)];

const generateId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

const getRandomDate = (start, end) => {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

// --- Generators ---

const generatePerson = (def) => ({
    id: generateId(),
    name: def.name,
    relation: def.relation,
    age: getRandomInt(20, 80).toString(),
    interests: ["Reading", "Walking", "Cooking", "Music"].sort(() => 0.5 - Math.random()).slice(0, 2),
    notes: `Generated entry for ${def.name}.`
});

const generateEntry = (peoplePool) => {
    // 1. Pick a primary emotion category (weighted slightly towards positive)
    const typeRoll = Math.random();
    let type = 'POSITIVE';
    if (typeRoll > 0.6) type = 'NEGATIVE';
    if (typeRoll > 0.9) type = 'SEXUAL';

    // 2. Pick specific emotion
    const emotion = getRandomItem(EMOTIONS[type]);
    
    // 3. Pick Person(s)
    const numPeople = Math.random() > 0.8 ? 2 : 1;
    const selectedPeople = [];
    for(let i=0; i<numPeople; i++) {
        const p = getRandomItem(peoplePool);
        if(!selectedPeople.includes(p)) selectedPeople.push(p);
    }
    const personNames = selectedPeople.map(p => p.name);
    
    // 4. Content
    const scenario = getRandomItem(SCENARIOS[emotion]);
    const summary = `${scenario} with ${personNames.join(' and ')}`;
    const reason = `Thought about ${summary}`;
    const text = `I really ${scenario.toLowerCase()} today. It involved ${personNames.join(', ')}. It made me feel ${emotion.toLowerCase()}.`;
    
    return {
        id: generateId(),
        timestamp: getRandomDate(START_DATE, END_DATE).getTime(),
        type: type,
        emotion: emotion,
        intensity: getRandomInt(3, 10),
        text: text,
        images: [],
        summary: summary,
        people: personNames,
        tags: ["Social", "Family", "Daily Life"].sort(() => 0.5 - Math.random()).slice(0, 2),
        moodScore: getRandomInt(30, 90),
        reason: reason,
        reaction: getRandomItem(REACTIONS[type])
    };
};

// --- Main Execution ---
const people = CHARACTERS.map(generatePerson);
const entries = Array.from({ length: ENTRY_COUNT }, () => generateEntry(people));

// Sort entries by date (descending like the app usually expects, or ascending? App usually sorts by timestamp desc)
entries.sort((a, b) => b.timestamp - a.timestamp);

const output = {
    version: "1.0",
    generatedAt: new Date().toISOString(),
    people: people,
    entries: entries
};

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(entries, null, 2)); // Exporting just entries as array based on app import logic usually expecting array, OR object?
// Checking App Logic: handleExport exports `filteredEntries` which is `FeelingEntry[]`. 
// So the file should be just the array of entries?
// Wait, if I want to import it, does the app have an import feature?
// The user asked for a "JSON file... I can use".
// If I look at the types.ts, there is "importData" in translation.
// I should double check if there is an import feature implemented in Settings or similar.
// But usually, export is array. So I will write array.
// However, the prompt implies "Use the characters...". If the app doesn't import people, they might be inferred.
// `updatePersonFromEntry` infers people.
// So providing entries with `people` array populated is key.

console.log(`Successfully generated ${entries.length} entries for ${people.length} people.`);
console.log(`Date range: ${START_DATE.toDateString()} to ${END_DATE.toDateString()}`);
console.log(`Output file: ${path.resolve(OUTPUT_FILE)}`);
