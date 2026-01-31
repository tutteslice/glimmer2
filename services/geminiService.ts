import { GoogleGenAI } from "@google/genai";
import { AnalysisResult, DiaryInsight, FeelingEntry, Language, Person } from "../types";

// Dynamic AI getter to prevent app crash if SDK fails to load
const getAi = async () => {
    // API key must be obtained from Vite's environment variables
    if (!import.meta.env.VITE_API_KEY) {
        console.warn("API Key is missing. Make sure to set VITE_API_KEY in your .env file.");
        return null;
    }
    try {
        return new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });
    } catch (e) {
        console.error("Failed to initialize GoogleGenAI or SDK missing", e);
        return null;
    }
};

export interface StructuredInput {
    action: string;
    subject: string;
    reaction: string;
    notes: string;
    emotion: string;
}

// 1. Analyze Structured Entry
export const analyzeStructuredEntry = async (
  input: StructuredInput,
  language: Language,
  knownPeople: Person[] = []
): Promise<AnalysisResult> => {
  const ai = await getAi();
  
  // Fallback immediately if no AI or Key
  if (!ai) {
      return {
          isComplete: true,
          summary: `${input.action} ${input.subject}`,
          people: [],
          tags: [],
          moodScore: 50,
          reason: `${input.action} ${input.subject}`,
          reaction: input.reaction
      };
  }
  
  const peopleNames = knownPeople.map(p => p.name).join(", ");
  const systemInstruction = `
    You are an intelligent Thought Journal assistant.
    Input Language: ${language}.
    User Input: Emotion: ${input.emotion}, Context: ${input.action}, Thought/Subject: ${input.subject}, Reaction: ${input.reaction}, Details: ${input.notes}
    Known People: [${peopleNames}]
    
    Tasks: 
    1. Summary (A concise 3-5 word title for this thought).
    2. Tags (Keywords related to the thought pattern).
    3. Mood Score (0-100 based on the positivity/negativity of the thought).
    4. People (extract names mentioned in the thought).
    5. Suggestions:
       - Refine 'suggestedSubject' (The core thought).
       - Refine 'suggestedReaction' (Emotional or physical response).
       - Ignore 'suggestedAction' unless absolutely necessary (default to "Thought about").
       - If the user provided inputs are vague, make them more specific and descriptive.
    
    Return JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Analyze and refine this thought entry.",
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
      },
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No response");
    const result = JSON.parse(jsonText);

    return {
      isComplete: true,
      summary: result.summary,
      people: result.people || [],
      tags: result.tags || [],
      moodScore: result.moodScore,
      reason: `${input.action} ${input.subject}`,
      action: "Thought about", // Force consistency
      subject: result.suggestedSubject,
      reaction: result.suggestedReaction || input.reaction
    };
  } catch (error) {
    console.error("Analysis failed:", error);
    return {
      isComplete: true,
      summary: `${input.action} ${input.subject}`,
      people: [],
      tags: [],
      moodScore: 50,
      reason: `${input.action} ${input.subject}`,
      reaction: input.reaction
    };
  }
};

// 2. Generate Insight (Structured)
export const generateInsight = async (
  entries: FeelingEntry[],
  language: Language
): Promise<DiaryInsight | null> => {
  const ai = await getAi();
  if (!ai || entries.length === 0) return null;

  // OPTIMIZATION: Limit to recent 50 entries to prevent payload size errors (XHR 6 / 500)
  const recentEntries = [...entries]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 50);

  const entriesLog = recentEntries.map(e => 
    `Date: ${new Date(e.timestamp).toLocaleDateString()}, Emotion: ${e.emotion}, Summary: ${e.summary}, Thought: ${e.reason}`
  ).join('\n');
  
  const systemInstruction = `
    You are a compassionate psychological analyst specializing in Cognitive Behavioral Therapy (CBT) patterns.
    Analyze the user's thought journal entries and provide a structured insight in JSON format.
    Language: ${language}.
    
    Structure Required:
    {
        "title": "A short, engaging title for this period of thinking",
        "emotionalTone": "3-5 words describing the overall headspace",
        "reflection": "A 2-3 sentence deep reflection on what is driving their thought patterns.",
        "patterns": ["List 3 specific recurring thought patterns or cognitive distortions (e.g. 'You often catastrophize about work', 'Social interactions trigger joy')"],
        "advice": "One actionable, warm piece of advice for managing these thoughts."
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Here are the recent thought entries to analyze:\n${entriesLog}`,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json"
      }
    });
    
    const jsonStr = response.text;
    if (!jsonStr) return null;
    return JSON.parse(jsonStr) as DiaryInsight;

  } catch (error) {
    console.error("Insight failed:", error);
    // Return null to allow UI to handle it gracefully without crashing
    return null;
  }
};

// 3. Generate Shareable Summary (Updated for strict 'You' usage)
export const generateShareableSummary = async (
  entries: FeelingEntry[],
  language: Language,
  personDetails?: Person
): Promise<string> => {
  const ai = await getAi();
  if (!ai || entries.length === 0) return "";

  // Limit raw notes to avoid hitting token limits
  const entriesLog = entries.map(e => `Date: ${new Date(e.timestamp).toLocaleDateString()}\nSummary: ${e.summary}\nRaw Notes: ${e.text?.substring(0, 500)}`).join('\n---\n');
  
  let personContext = "";
  if (personDetails) {
      personContext = `
        Target Person: ${personDetails.name}
        Relation: ${personDetails.relation || 'Unknown'}
      `;
  }

  const personName = personDetails?.name || 'Person';

  const prompt = `
    I am writing a heartfelt note to ${personName} based on my thoughts about them.
    Select 3 to 5 specific, heartwarming thoughts from the provided entries.

    ${personContext}

    STRICT GENERATION RULES:
    1. Write in the **Second Person** ("You"). Address ${personName} directly.
    2. **ABSOLUTELY FORBIDDEN:** Do not use the name "${personName}" in the output list.
    3. **REQUIRED:** Start sentences with "You..." or implied "You".
       - BAD: "${personName} shared a cookie."
       - GOOD: "You shared your cookie with me."
       - GOOD: "You were so excited about the magic rock."
    4. Keep the tone warm, personal, and authentic.
    5. Format as a bulleted list using "• ".
    6. Language: ${language}.

    Diary Entries:
    ${entriesLog}
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text || "";
  } catch (error) {
    console.error("Shareable summary failed:", error);
    return "Sharing moments of gratitude.";
  }
};

// 4. Update Person Profile from Entry
export const updatePersonFromEntry = async (
    person: Person,
    entry: FeelingEntry,
    language: Language
): Promise<Person> => {
    const ai = await getAi();
    if (!ai) return person;

    const currentProfile = JSON.stringify({
        age: person.age,
        interests: person.interests || [],
        notes: person.notes || "",
        relation: person.relation || ""
    });

    const entryContext = `
        Summary: ${entry.summary}
        Text: ${entry.text}
        Emotion: ${entry.emotion}
    `;

    const systemInstruction = `
        You are an assistant maintaining a profile for a person named "${person.name}".
        Your task is to update their profile based on a new thought entry involving them.
        
        Current Profile: ${currentProfile}
        New Entry: ${entryContext}
        Language: ${language}

        Rules:
        1. Update 'interests' if new ones are mentioned. Keep existing ones unless contradicted.
        2. Update 'notes' to summarize key memories or facts. Append new info to existing notes concisely.
        3. Infer 'relation' if missing (e.g., friend, sister).
        4. Infer 'age' if mentioned.
        5. Return the updated profile as JSON matching the input structure.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: "Update profile.",
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
            },
        });

        const text = response.text;
        if (!text) return person;
        const updates = JSON.parse(text);

        return {
            ...person,
            age: updates.age || person.age,
            relation: updates.relation || person.relation,
            interests: updates.interests || person.interests,
            notes: updates.notes || person.notes
        };

    } catch (e) {
        console.error("Profile update failed", e);
        return person;
    }
};

// 5. Chat with Diary
export const createDiaryChat = async (
    entries: FeelingEntry[],
    language: Language
) => {
    const ai = await getAi();
    if (!ai) return null;

    // Limit context to prevent oversized payloads
    const context = entries.map(e => `[${new Date(e.timestamp).toLocaleDateString()}] ${e.emotion}: ${e.summary}. Thought: ${e.reason}. Notes: ${e.text}`).join('\n');

    const systemInstruction = `
        You are the user's personal emotional companion.
        You have access to their past thought journal entries:
        ${context.substring(0, 20000)} // Limit context size

        Language: ${language}.
        Role: Be empathetic, insightful, and supportive. Answer questions about thought patterns, specific events, or just chat.
        If asked about patterns, look at the provided entries.
    `;

    try {
        const chat = ai.chats.create({
            model: "gemini-3-flash-preview",
            config: {
                systemInstruction: systemInstruction
            }
        });
        return chat;
    } catch (e) {
        console.error("Chat init failed", e);
        return null;
    }
};