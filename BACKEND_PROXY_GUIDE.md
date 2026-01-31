
# Securing API Keys: Backend Proxy Guide

## The Security Risk
Currently, the Glimmer app runs entirely in the browser (or WebView on mobile). This means the Google Gemini API key is embedded in the JavaScript code (`process.env.API_KEY`).
In a production environment, especially for mobile apps distributed via stores, experienced users can decompile the app or inspect network traffic to extract your API key. This could lead to unauthorized quota usage and billing.

## The Solution
To secure your API key, you should move the interaction with the Gemini API to a server that you control. The API key is stored securely on the server (e.g., in environment variables) and never exposed to the client.

### Architecture

**Current (Insecure):**
`Client App (holds Key)` -> `Google Gemini API`

**Secure Proxy:**
`Client App (Authenticated User)` -> `Your Backend Server (holds Key)` -> `Google Gemini API`

---

## Step 1: Create a Simple Backend Server

You can use Node.js with Express, Python with FastAPI, or Serverless functions (like AWS Lambda, Firebase Functions, or Vercel API Routes).

Here is an example using **Node.js/Express**:

1.  **Initialize Project:**
    ```bash
    mkdir glimmer-backend
    cd glimmer-backend
    npm init -y
    npm install express cors dotenv @google/genai
    ```

2.  **Create `server.js`:**

    ```javascript
    require('dotenv').config();
    const express = require('express');
    const cors = require('cors');
    const { GoogleGenAI } = require('@google/genai');

    const app = express();
    app.use(cors()); // Configure this to allow only your app's domain
    app.use(express.json());

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // Endpoint for Structured Analysis
    app.post('/api/analyze', async (req, res) => {
      try {
        const { systemInstruction, contents, model } = req.body;
        
        // You might want to validate user inputs here
        
        const response = await ai.models.generateContent({
          model: model || 'gemini-3-flash-preview',
          contents: contents,
          config: {
            systemInstruction: systemInstruction,
            responseMimeType: 'application/json'
          }
        });

        res.json(response);
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to process request' });
      }
    });

    // Endpoint for Insight/Summary
    app.post('/api/generate', async (req, res) => {
      try {
        const { prompt, model } = req.body;
        
        const response = await ai.models.generateContent({
          model: model || 'gemini-3-flash-preview',
          contents: prompt
        });

        res.json({ text: response.text });
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to generate content' });
      }
    });

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    ```

3.  **Environment Variables:**
    Create a `.env` file on the server:
    ```
    API_KEY=your_actual_gemini_api_key
    ```

## Step 2: Refactor Frontend (`services/geminiService.ts`)

Instead of importing `@google/genai` directly in the frontend, you will make HTTP requests to your new backend.

**Before:**
```typescript
import { GoogleGenAI } from "@google/genai";
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
// ... ai.models.generateContent(...)
```

**After:**
```typescript
const BACKEND_URL = 'https://your-backend-url.com/api';

export const analyzeStructuredEntry = async (input, language, knownPeople) => {
  // Construct the system instruction and content locally
  const systemInstruction = `...`; 
  
  try {
    const response = await fetch(`${BACKEND_URL}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gemini-3-flash-preview',
        contents: "Analyze this entry.",
        systemInstruction: systemInstruction
      })
    });

    if (!response.ok) throw new Error('Backend error');
    
    const data = await response.json();
    // Parse the result similar to how the SDK return was handled
    // The specific parsing depends on your backend response structure.
    
    // ... return formatted AnalysisResult
  } catch (error) {
    console.error(error);
    // ... fallback logic
  }
};
```

## Step 3: Security Best Practices

1.  **Authentication:** Ensure your backend endpoint is not public. Use a mechanism like JWT (JSON Web Tokens) or Firebase Auth to verify that the request is coming from a logged-in user of your app.
2.  **Rate Limiting:** Implement rate limiting on your backend (e.g., using `express-rate-limit`) to prevent abuse if someone does discover your endpoint URL.
3.  **Input Validation:** Validate the prompt size and content type on the server before sending it to Gemini to save costs on malformed or malicious requests.
4.  **CORS:** Configure Cross-Origin Resource Sharing (CORS) on the server to only accept requests from your web app's domain (or mobile app's origin).

This setup ensures your Google Gemini API key remains private on your server.
