# Glimmer - Project GEMINI.md

This document provides a comprehensive overview of the Glimmer project, its architecture, and development practices to be used as instructional context for future interactions.

## Project Overview

Glimmer is a smart, private emotional diary designed to help users document and reflect on their emotional journey. It is a web application built with **React 19** and **TypeScript**, styled with **Tailwind CSS**, and powered by the **Google Gemini API** for its AI-driven features.

The application allows users to create diary entries with structured data, including their thoughts, feelings, and reactions. It offers features like voice dictation, AI-powered analysis, mood tracking, and the ability to generate psychological insights. All data is stored locally in the user's browser to ensure privacy.

### Key Technologies

- **Frontend:** React 19, TypeScript
- **Bundler:** Vite
- **Styling:** Tailwind CSS
- **AI:** Google Gemini API (`@google/genai`)
- **State Management:** React Hooks and component state
- **Local Storage:** `localStorage` is used for all data persistence via `services/storageService.ts`.

### Architecture

The application is structured into several key directories:

- **`components/`**: Contains the React components that make up the user interface.
  - `EntryForm.tsx`: A complex component for creating and editing diary entries, including AI-powered features.
  - `Diary.tsx`: Displays the list of past entries.
  - `Settings.tsx`: Allows users to configure the application.
- **`services/`**: Contains modules for interacting with external services.
  - `geminiService.ts`: Handles all interactions with the Google Gemini API, including entry analysis, insight generation, and more.
  - `storageService.ts`: Manages reading from and writing to the browser's `localStorage`.
- **`types.ts`**: Defines the TypeScript types and interfaces used throughout the application.
- **`constants.ts`**: Contains constant values, such as translations.
- **`App.tsx`**: The main application component that handles routing and the overall layout.

## Building and Running

### Prerequisites

- **Node.js** (v18 or higher)
- **Google Gemini API Key**

### Installation and Setup

1.  **Install Dependencies:**
    ```bash
    npm install
    ```

2.  **Set API Key:**
    Create a `.env` file in the root of the project and add your Gemini API key:
    ```
    VITE_API_KEY=your_key_here
    ```
    The application code in `services/geminiService.ts` and `App.tsx` has been updated to use `import.meta.env.VITE_API_KEY` instead of `process.env.API_KEY` to align with Vite's environment variable handling.

### Key Commands

-   **Run the development server:**
    ```bash
    npm run dev
    ```

-   **Build for production:**
    ```bash
    npm run build
    ```

-   **Preview the production build:**
    ```bash
    npm run preview
    ```

## Development Conventions

-   **Styling:** The project uses Tailwind CSS for styling. Utility classes are preferred over custom CSS.
-   **State Management:** Application state is managed primarily through React Hooks (`useState`, `useEffect`, etc.). There is no external state management library like Redux or Zustand.
-   **API Interaction:** All interactions with the Gemini API are centralized in `services/geminiService.ts`.
-   **Data Persistence:** All diary entries and settings are stored in the browser's `localStorage`. The `services/storageService.ts` module provides an abstraction layer for these operations.
-   **Types:** The project is written in TypeScript, and types are defined in `types.ts`.
-   **Environment Variables:** The Gemini API key is expected to be available as an environment variable via `import.meta.env`.
