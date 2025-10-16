// Gemini AI utility functions
// This file handles all interactions with Google's Gemini API

import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Get Gemini model instance
 * Using gemini-1.5-flash for fast responses (free tier)
 */
export function getGeminiModel() {
  return genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
}

/**
 * Send a chat message to Gemini and get a response
 * @param {string} message - The user's message
 * @param {Array} conversationHistory - Previous conversation context
 * @returns {Promise<string>} - AI response text
 */
export async function sendChatMessage(message, conversationHistory = []) {
  try {
    const model = getGeminiModel();

    // Build context from conversation history
    let context = "";
    if (conversationHistory.length > 0) {
      context = conversationHistory
        .map((msg) => `${msg.role}: ${msg.content}`)
        .join("\n");
      context += "\n\n";
    }

    // Combine context with new message
    const fullPrompt = context + `User: ${message}\n\nAssistant:`;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Failed to get AI response");
  }
}

/**
 * Analyze a screen frame and provide step-by-step guidance
 * @param {string} base64Image - Base64-encoded screen capture
 * @param {string} userGoal - What the user is trying to accomplish
 * @param {Object} metadata - Additional context (mouse position, detected elements, etc.)
 * @returns {Promise<string>} - AI guidance text
 */
export async function analyzeScreenFrame(base64Image, userGoal, metadata = {}) {
  try {
    const model = getGeminiModel();

    // Prepare the prompt for screen analysis
    const prompt = `You are an AI assistant helping a user accomplish a task on their computer.

User's Goal: ${userGoal}

Current Context:
${metadata.currentStep ? `- Current Step: ${metadata.currentStep}` : ""}
${
  metadata.mousePosition
    ? `- Mouse Position: (${metadata.mousePosition.x}, ${metadata.mousePosition.y})`
    : ""
}
${
  metadata.detectedElements
    ? `- Detected UI Elements: ${metadata.detectedElements}`
    : ""
}

Analyze the screen image and provide clear, concise guidance on what the user should do next. Be specific about which UI elements to click or interact with. Keep your response brief and actionable (2-3 sentences max).`;

    // Prepare image data for Gemini
    const imageParts = [
      {
        inlineData: {
          data: base64Image,
          mimeType: "image/png",
        },
      },
    ];

    const result = await model.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error analyzing screen frame:", error);
    throw new Error("Failed to analyze screen");
  }
}

/**
 * Get AI response for a specific context with screen and chat combined
 * @param {Object} params - Parameters object
 * @param {string} params.message - User's message
 * @param {string} params.base64Image - Screen capture (optional)
 * @param {Array} params.conversationHistory - Conversation context
 * @param {string} params.userGoal - User's current goal
 * @returns {Promise<string>} - AI response
 */
export async function getContextualResponse({
  message,
  base64Image,
  conversationHistory = [],
  userGoal,
}) {
  try {
    const model = getGeminiModel();

    // Build comprehensive prompt
    let prompt = `You are a helpful AI voice assistant guiding a user through tasks on their computer.

User's Goal: ${userGoal || "General assistance"}

`;

    // Add conversation history
    if (conversationHistory.length > 0) {
      prompt += "Conversation History:\n";
      conversationHistory.slice(-5).forEach((msg) => {
        prompt += `${msg.role}: ${msg.content}\n`;
      });
      prompt += "\n";
    }

    prompt += `Current User Message: ${message}\n\nProvide a helpful, concise response that guides the user toward their goal. If they're asking about what's on the screen, describe what you see and suggest next steps.`;

    // If image is provided, include it in the analysis
    if (base64Image) {
      const imageParts = [
        {
          inlineData: {
            data: base64Image,
            mimeType: "image/png",
          },
        },
      ];

      const result = await model.generateContent([prompt, ...imageParts]);
      const response = await result.response;
      return response.text();
    } else {
      // Text-only response
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    }
  } catch (error) {
    console.error("Error getting contextual response:", error);
    throw new Error("Failed to get AI response");
  }
}

/**
 * Generate a session title based on the conversation
 * @param {Array} messages - Array of conversation messages
 * @returns {Promise<string>} - Suggested title
 */
export async function generateSessionTitle(messages) {
  try {
    const model = getGeminiModel();

    const conversationSummary = messages
      .slice(0, 5)
      .map((msg) => msg.content)
      .join(" ");

    const prompt = `Based on this conversation: "${conversationSummary}"

Generate a short, descriptive title (4-6 words max) that captures the main topic or goal. Only return the title, nothing else.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error("Error generating session title:", error);
    return "Untitled Session";
  }
}
