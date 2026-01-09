// Gemini AI utility functions
// This file handles all interactions with Google's Gemini API

import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Initialize Gemini API with the new SDK
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

/**
 * Get Gemini model name
 * Using gemini-2.5-flash for fast responses
 * Note: Returns model name string, not model instance
 */
export function getGeminiModelName(withVision = false) {
  // gemini-2.5-flash supports both text and vision
  const modelName = "gemini-2.5-flash";
  return modelName;
}

/**
 * Send a chat message to Gemini and get a response
 * @param {string} message - The user's message
 * @param {Array} conversationHistory - Previous conversation context
 * @returns {Promise<string>} - AI response text
 */
export async function sendChatMessage(message, conversationHistory = []) {
  try {
    const modelName = getGeminiModelName(false); // Text only

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

    const response = await ai.models.generateContent({
      model: modelName,
      contents: fullPrompt,
    });

    return response.text;
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
 * @param {string} imageFormat - Image format ('jpeg', 'png', 'jpg')
 * @returns {Promise<string>} - AI guidance text
 */
export async function analyzeScreenFrame(
  base64Image,
  userGoal,
  metadata = {},
  imageFormat = "jpeg"
) {
  try {

    // Use gemini-2.5-flash (supports both text and vision)
    const modelName = getGeminiModelName(true);

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

Analyze the screen image and provide ONE clear, concise action step. Tell the user EXACTLY what to click or do next. Keep your response to a SINGLE sentence (maximum 15 words). Be specific about UI elements.

Example responses:
- "Click the Chrome icon on your taskbar."
- "Type 'google.com' in the address bar and press Enter."
- "Click the search box in the center of the page."

Your response:`;

    // Determine correct MIME type
    let mimeType = "image/jpeg"; // Default to JPEG
    if (imageFormat.toLowerCase() === "png") {
      mimeType = "image/png";
    } else if (
      imageFormat.toLowerCase() === "jpg" ||
      imageFormat.toLowerCase() === "jpeg"
    ) {
      mimeType = "image/jpeg";
    }

    // Validate base64 data
    if (!base64Image || base64Image.trim() === "") {
      throw new Error("Base64 image data is empty");
    }

    // Use new SDK format with inline data
    const response = await ai.models.generateContent({
      model: modelName,
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inlineData: {
                data: base64Image,
                mimeType: mimeType,
              },
            },
          ],
        },
      ],
    });

    const responseText = response.text;
    
    return responseText;
  } catch (error) {
    console.error("❌ [Gemini] Error analyzing screen frame:", error);
    console.error("❌ [Gemini] Error name:", error.name);
    console.error("❌ [Gemini] Error message:", error.message);

    // Provide more specific error messages
    if (error.message.includes("API key")) {
      throw new Error(
        "Gemini API key is invalid or not set. Check GEMINI_API_KEY in .env"
      );
    } else if (
      error.message.includes("quota") ||
      error.message.includes("RESOURCE_EXHAUSTED")
    ) {
      throw new Error(
        "Gemini API quota exceeded. Please wait or upgrade your plan"
      );
    } else if (error.message.includes("INVALID_ARGUMENT")) {
      throw new Error(
        "Invalid image data sent to Gemini API. Check image format and encoding"
      );
    } else if (error.message.includes("timeout")) {
      throw new Error("Gemini API request timeout. Please try again");
    } else {
      throw new Error(`Gemini API error: ${error.message}`);
    }
  }
}

/**
 * Get AI response for a specific context with screen and chat combined
 * @param {Object} params - Parameters object
 * @param {string} params.message - User's message
 * @param {string} params.base64Image - Screen capture (optional)
 * @param {Array} params.conversationHistory - Conversation context
 * @param {string} params.userGoal - User's current goal
 * @param {Array} params.stepHistory - Array of completed steps
 * @param {boolean} params.isFirstMessage - Whether this is the first message
 * @returns {Promise<string>} - AI response
 */
export async function getContextualResponse({
  message,
  base64Image,
  conversationHistory = [],
  userGoal,
  stepHistory = [],
  isFirstMessage = false,
}) {
  try {
    // Use gemini-2.5-flash (supports both text and vision)
    const modelName = getGeminiModelName();

    let prompt = "";

    // Handle first message - extract and confirm goal
    if (isFirstMessage) {
      prompt = `The user is starting a new task assistance session. Their first message is: "${message}"

Extract their goal from this message and respond with:
1. A brief confirmation of their goal (one sentence)
2. The FIRST specific action step they should take (one sentence, maximum 15 words)

Example:
User: "I want to search for weather on Google"
Response: "I'll help you search for weather on Google. Click the Chrome icon on your taskbar."

Your response:`;
    } else {
      // Subsequent messages - provide next step based on screen and history
      prompt = `You are helping a user accomplish this goal: ${userGoal || "General assistance"}

`;

      // Add step history if available
      if (stepHistory.length > 0) {
        prompt += `Steps completed so far:\n`;
        stepHistory.slice(-3).forEach((step, index) => {
          prompt += `${index + 1}. ${step}\n`;
        });
        prompt += "\n";
      }

      prompt += `User's current message: "${message}"

Based on the screen image, provide the NEXT specific action step. Keep it to ONE sentence (maximum 15 words). Tell them exactly what to click or do.

Example responses:
- "Click the search box and type 'weather'."
- "Press Enter to search."
- "Click the first search result."

Your response:`;
    }

    let contents = [];

    // If image is provided, include it in the analysis
    if (base64Image) {
      contents = [
        {
          parts: [
            { text: prompt },
            {
              inlineData: {
                data: base64Image,
                mimeType: "image/jpeg",
              },
            },
          ],
        },
      ];
    } else {
      // Text-only response
      contents = [
        {
          parts: [{ text: prompt }],
        },
      ];
    }

    const response = await ai.models.generateContent({
      model: modelName,
      contents: contents,
    });

    return response.text;
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
    const modelName = getGeminiModelName(); // Text only, no vision needed

    const conversationSummary = messages
      .slice(0, 5)
      .map((msg) => msg.content)
      .join(" ");

    const prompt = `Based on this conversation: "${conversationSummary}"

Generate a short, descriptive title (4-6 words max) that captures the main topic or goal. Only return the title, nothing else.`;

    const response = await ai.models.generateContent({
      model: modelName,
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
    });

    return response.text.trim();
  } catch (error) {
    console.error("Error generating session title:", error);
    return "Untitled Session";
  }
}
