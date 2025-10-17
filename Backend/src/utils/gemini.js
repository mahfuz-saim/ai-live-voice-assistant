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
  console.log(`🤖 [Gemini] Using model: ${modelName}`);
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
    console.log(`🔍 [Gemini] Starting screen analysis...`);
    console.log(`🔍 [Gemini] Image format: ${imageFormat}`);
    console.log(
      `🔍 [Gemini] Base64 data length: ${base64Image.length} characters`
    );
    console.log(
      `🔍 [Gemini] Estimated image size: ${Math.round(
        base64Image.length / 1024
      )}KB`
    );

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

Analyze the screen image and provide clear, concise guidance on what the user should do next. Be specific about which UI elements to click or interact with. Keep your response brief and actionable (2-3 sentences max).`;

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

    console.log(`🔍 [Gemini] Using MIME type: ${mimeType}`);

    // Validate base64 data
    if (!base64Image || base64Image.trim() === "") {
      throw new Error("Base64 image data is empty");
    }

    console.log(`🔍 [Gemini] Sending request to Gemini API...`);

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

    console.log(`🔍 [Gemini] Received response from Gemini API`);
    const responseText = response.text;

    console.log(
      `✅ [Gemini] Analysis complete. Response length: ${responseText.length} characters`
    );

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
 * @returns {Promise<string>} - AI response
 */
export async function getContextualResponse({
  message,
  base64Image,
  conversationHistory = [],
  userGoal,
}) {
  try {
    // Use gemini-2.5-flash (supports both text and vision)
    const modelName = getGeminiModelName();

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
