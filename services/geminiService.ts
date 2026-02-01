
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { ExtractionResult, IssueType } from "../types";

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async extractRequestDetails(userInput: string): Promise<ExtractionResult> {
    const response = await this.ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze this user request for roadside assistance: "${userInput}"`,
      config: {
        systemInstruction: `You are an expert roadside dispatch AI. Your job is to extract emergency details from user messages. 
        Categorize the issue into one of these types: ENGINE_FAILURE, TYRE_PUNCTURE, BATTERY_ISSUE, ACCIDENT, GENERAL_ASSISTANCE.
        Prioritize extracting the exact nature and specific symptoms of the emergency (e.g., 'engine sputtering', 'tyre is completely flat', 'smoke from the hood') into the 'description' field.
        Identify the urgency and extract any specific location mentions. 
        If the user mentions an accident, collision, or crash, set 'isAccident' to true (boolean).
        Return ONLY valid JSON.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            issueType: {
              type: Type.STRING,
              enum: Object.values(IssueType),
              description: 'The classified type of vehicle issue.'
            },
            description: {
              type: Type.STRING,
              description: 'A brief but specific summary of the user\'s problem and symptoms.'
            },
            urgency: {
              type: Type.STRING,
              enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
              description: 'The severity level based on user tone and problem.'
            },
            locationText: {
              type: Type.STRING,
              description: 'Any location mentions like landmarks or street names.'
            },
            isAccident: {
              type: Type.BOOLEAN,
              description: 'Whether a collision or accident is involved.'
            }
          },
          required: ['issueType', 'description', 'urgency', 'isAccident']
        }
      }
    });

    try {
      const data = JSON.parse(response.text.trim());
      return data as ExtractionResult;
    } catch (e) {
      console.error("Failed to parse Gemini response", e);
      return {
        issueType: IssueType.GENERAL_ASSISTANCE,
        description: userInput.substring(0, 100),
        urgency: 'MEDIUM',
        isAccident: false
      };
    }
  }

  async generateSpeech(text: string): Promise<string | undefined> {
    const response = await this.ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  }
}

export const geminiService = new GeminiService();
