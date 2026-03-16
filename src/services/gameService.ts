import { GoogleGenAI, Type, Modality } from "@google/genai";

export interface WorldState {
  location: string;
  time: string;
  mysteriousInfluences: string[];
  inventory: string[];
  playerStatus: string;
  lastActionSummary: string;
}

export interface GameResponse {
  narration: string;
  updatedWorldState: WorldState;
  individualCommentary?: string;
}

const SYSTEM_INSTRUCTION = `
You are 'The Individuals', detached entities from another dimension who secretly control the world. 
You act as the Game Master for a text-based sandbox game.
Your logic is otherworldly, cold, and slightly cryptic. 

Rules:
1. You receive the current 'World State' and the player's 'Action'.
2. You must narrate the outcome of the action in a retro-futuristic, atmospheric style.
3. You must update the 'World State' object based on the outcome.
4. Occasionally provide 'Individual Commentary'. This should be a brief dialogue between two distinct entities from your dimension.
   Use the format: "Individual A: [comment] Individual B: [comment]".
   Keep it detached, superior, and slightly unsettling.
5. Keep the world consistent but strange.
6. The UI is a terminal, so keep text punchy but descriptive.
7. World Structure:
   - The simulation is vast and expanding. While standard layers consist of Levels 1-150 and Rooms 1-1000, these are not hard limits.
   - Level 150 is 'The Liminal Archive': A vast library of static-filled monitors and infinite data-chits. It acts as a gateway to the 'Deep Simulation' (Levels 151+).
   - Room 1000 on any level is a 'Nexus Point'. Attempting to move beyond Room 1000 (e.g., to Room 1001+) often results in entering 'The Glitch'—an unstable, non-euclidean space.
   - Level 1000 is 'The Observation Deck': The ultimate layer where the Individuals reside. It is accessible through specific dimensional glitches, high-level data-chit decryption, or by navigating the Deep Simulation.
   - Always include the current Level and Room in the 'location' field (e.g., "Level 151, Room 1002 - The Fragmented Archive").
   - Encourage exploration of these anomalous coordinates.

Output format must be JSON.
`;

export class GameService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
  }

  async processAction(action: string, currentState: WorldState): Promise<GameResponse> {
    const response = await this.ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Current World State: ${JSON.stringify(currentState)}\nPlayer Action: ${action}`
            }
          ]
        }
      ],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            narration: { type: Type.STRING },
            updatedWorldState: {
              type: Type.OBJECT,
              properties: {
                location: { type: Type.STRING },
                time: { type: Type.STRING },
                mysteriousInfluences: { type: Type.ARRAY, items: { type: Type.STRING } },
                inventory: { type: Type.ARRAY, items: { type: Type.STRING } },
                playerStatus: { type: Type.STRING },
                lastActionSummary: { type: Type.STRING }
              },
              required: ["location", "time", "mysteriousInfluences", "inventory", "playerStatus", "lastActionSummary"]
            },
            individualCommentary: { type: Type.STRING }
          },
          required: ["narration", "updatedWorldState"]
        }
      }
    });

    try {
      return JSON.parse(response.text || "{}") as GameResponse;
    } catch (e) {
      console.error("Failed to parse AI response", e);
      return {
        narration: "The connection to the higher dimensions flickers. Something went wrong.",
        updatedWorldState: currentState
      };
    }
  }

  async generateSpeech(
    text: string, 
    voiceNameA: 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr' = 'Zephyr', 
    voiceNameB: 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr' = 'Kore',
    instruction: string = "Read this narration in a detached, slightly mechanical, otherworldly voice"
  ): Promise<string | null> {
    try {
      const isMultiSpeaker = text.includes('Individual A:') && text.includes('Individual B:');
      
      const config: any = {
        responseModalities: [Modality.AUDIO],
      };

      if (isMultiSpeaker) {
        config.speechConfig = {
          multiSpeakerVoiceConfig: {
            speakerVoiceConfigs: [
              {
                speaker: 'Individual A',
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: voiceNameA }
                }
              },
              {
                speaker: 'Individual B',
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: voiceNameB }
                }
              }
            ]
          }
        };
      } else {
        config.speechConfig = {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voiceNameA },
          },
        };
      }

      const response = await this.ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: isMultiSpeaker ? text : `${instruction}: ${text}` }] }],
        config,
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      return base64Audio || null;
    } catch (error: any) {
      // Re-throw if it's a quota error so the UI can handle it
      if (error.message?.includes('RESOURCE_EXHAUSTED') || error.message?.includes('429')) {
        throw new Error("QUOTA_EXHAUSTED");
      }
      console.error("TTS Error:", error);
      return null;
    }
  }

  async generateVideo(prompt: string): Promise<string | null> {
    try {
      const apiKey = process.env.API_KEY;
      if (!apiKey) {
        throw new Error("API_KEY_MISSING");
      }

      const ai = new GoogleGenAI({ apiKey });
      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt,
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: '16:9'
        }
      });

      let attempts = 0;
      while (!operation.done && attempts < 60) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
        attempts++;
      }

      if (operation.done && operation.response?.generatedVideos?.[0]?.video?.uri) {
        return operation.response.generatedVideos[0].video.uri;
      }
      return null;
    } catch (error: any) {
      console.error("Video Generation Error:", error);
      
      const errorMessage = error.message || "";
      const errorString = typeof error === 'string' ? error : JSON.stringify(error);
      
      if (
        errorMessage.includes('PERMISSION_DENIED') || 
        errorMessage.includes('403') ||
        errorMessage.includes('not have permission') ||
        errorString.includes('PERMISSION_DENIED') ||
        errorString.includes('403') ||
        errorString.includes('not have permission') ||
        error.status === 403 ||
        error.code === 403
      ) {
        throw new Error("PERMISSION_DENIED");
      }
      throw error;
    }
  }

  async generateImage(prompt: string): Promise<string | null> {
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: prompt }],
        },
        config: {
          imageConfig: {
            aspectRatio: "16:9",
          }
        }
      });

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
      return null;
    } catch (error) {
      console.error("Image Generation Error:", error);
      return null;
    }
  }
}

export const initialWorldState: WorldState = {
  location: "Level 1, Room 1 - Maintenance Tunnels",
  time: "Cycle 0.0001",
  mysteriousInfluences: ["The Hum", "Static Drift"],
  inventory: ["Rusty Data-Chit", "Emergency Flare"],
  playerStatus: "Awakened",
  lastActionSummary: "Initial manifestation."
};
