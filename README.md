
# Glimmer

**Find your light.**

Glimmer is a smart, private emotional diary designed to help you document the moments that move you. Whether it's a fleeting moment of joy ("glimmer"), a difficult emotional struggle, or an intimate experience, Glimmer helps you capture, analyze, and reflect on your journey.

Powered by **Google Gemini AI**, Glimmer offers structured analysis, mood tracking, and intelligent insights into your emotional patterns.

## Features

- **Smart Entry Capture:** 
  - Structured inputs for Action, Subject, and Reaction.
  - **Voice Dictation:** Tap to speak and let Glimmer capture your story.
  - **Magic Fill:** AI analyzes your raw notes and auto-fills the structured fields.
  - **Drawing Canvas:** Express feelings visually when words aren't enough.
  - **Image Upload:** Attach photos to your memories.

- **AI-Powered Insights:**
  - **Mood Scoring:** AI determines a mood score (0-100) based on your entry.
  - **Pattern Recognition:** Generate psychological insights based on your recent history.
  - **Shareable Summaries:** Generate heartwarming, shareable cards for friends or loved ones mentioned in your entries.

- **Privacy & Customization:**
  - **Local Storage:** All data stays in your browser's local storage.
  - **Configurable Categories:** Toggle Positive, Negative, or Sexual (18+) feeling tracking in Settings.
  - **People Management:** Tag specific people to filter entries and see how they impact your life.

- **Multilingual Support:**
  - English (EN)
  - Swedish (SV)
  - Croatian (HR)

## Tech Stack

- **Frontend:** React 19, TypeScript
- **Styling:** Tailwind CSS
- **AI:** Google Gemini API (`@google/genai`)
- **Icons:** Lucide React
- **Utils:** UUID, html2canvas

## Getting Started

### Prerequisites

1.  **Node.js** (v18 or higher recommended)
2.  **Google Gemini API Key** obtained from AI Studio.

### Installation

1.  Clone the repository.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Set your API Key. Ensure `process.env.API_KEY` is available in your build environment.
    *   If using Vite, create a `.env` file: `VITE_API_KEY=your_key_here` (and update code to use `import.meta.env`).
    *   If using a standard bundler, configure your environment variables accordingly.

4.  Start the development server:
    ```bash
    npm start
    ```

## Usage

1.  **New Entry:** Click "Start Entry". Select an emotion, use voice or text to describe the event, or draw a picture. Use "Auto-fill" to let AI structure your thoughts.
2.  **Diary View:** View your history. Filter by Emotion type (Positive, Negative, Sexual), or Filter by specific People.
    - **Enhanced Search:** The search bar searches through your Notes, Tags, Summaries, Reasons (Action + Subject), and Reactions.
3.  **Insights:** Click "Generate Insight" in the Diary view to get a psychological summary of your recent entries.
4.  **Settings:** Toggle specific emotion categories on or off depending on your needs.

## License

Private & Secure.
