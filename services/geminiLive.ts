import { GoogleGenAI, LiveServerMessage, Modality, FunctionDeclaration, Type } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";

// Define the function tool the model can use to update app state
const updateGestureFunction: FunctionDeclaration = {
  name: 'updateGesture',
  parameters: {
    type: Type.OBJECT,
    description: 'Updates the detected hand gesture state.',
    properties: {
      state: {
        type: Type.STRING,
        description: 'The detected state of the hand: OPEN (expand), CLOSED (contract), PINCH (aggregate), or IDLE.',
        enum: ['OPEN', 'CLOSED', 'IDLE', 'PINCH']
      },
    },
    required: ['state'],
  },
};

export class GeminiLiveService {
  private ai: GoogleGenAI;
  private session: any = null; // Typing for session is complex in current SDK version, utilizing any for flexibility
  private onGestureCallback: ((state: string) => void) | null = null;
  private onConnectionChange: ((connected: boolean) => void) | null = null;
  private onError: ((error: string) => void) | null = null;

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
  }

  setCallbacks(
    onGesture: (state: string) => void,
    onConnection: (connected: boolean) => void,
    onError: (error: string) => void
  ) {
    this.onGestureCallback = onGesture;
    this.onConnectionChange = onConnection;
    this.onError = onError;
  }

  async connect() {
    try {
      this.session = await this.ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            console.log('Gemini Live Session Opened');
            this.onConnectionChange?.(true);
          },
          onmessage: (message: LiveServerMessage) => {
            this.handleMessage(message);
          },
          onclose: (e: CloseEvent) => {
            console.log('Gemini Live Session Closed', e);
            this.onConnectionChange?.(false);
          },
          onerror: (e: ErrorEvent) => {
            console.error('Gemini Live Session Error', e);
            this.onError?.('Connection error. Check API Key or Network.');
            this.onConnectionChange?.(false);
          }
        },
        config: {
          responseModalities: [Modality.AUDIO], // Required by API even if we only want tools
          systemInstruction: SYSTEM_INSTRUCTION,
          tools: [{ functionDeclarations: [updateGestureFunction] }],
        }
      });
    } catch (err: any) {
      console.error("Failed to connect to Gemini Live:", err);
      this.onError?.(err.message || "Failed to connect");
      this.onConnectionChange?.(false);
    }
  }

  handleMessage(message: LiveServerMessage) {
    // Check for tool calls (Function Calling)
    if (message.toolCall) {
      for (const fc of message.toolCall.functionCalls) {
        if (fc.name === 'updateGesture') {
          const state = (fc.args as any).state;
          if (this.onGestureCallback && state) {
            this.onGestureCallback(state);
          }

          // We must send a response back to the model to acknowledge the tool call
          // even if the result is just "ok". This keeps the turn loop healthy.
          if (this.session) {
            this.session.sendToolResponse({
              functionResponses: {
                id: fc.id,
                name: fc.name,
                response: { result: 'ok' },
              }
            });
          }
        }
      }
    }
  }

  sendFrame(base64Data: string, mimeType: string) {
    if (this.session) {
      this.session.sendRealtimeInput({
        media: {
          mimeType,
          data: base64Data
        }
      });
    }
  }

  disconnect() {
    if (this.session) {
      // There isn't a documented clean .close() on the session object in the snippets provided, 
      // but usually we just stop sending frames. 
      // If the SDK supports close, we'd call it here.
      // For now, we rely on the caller to stop utilizing the service.
      this.session = null;
      this.onConnectionChange?.(false);
    }
  }
}
