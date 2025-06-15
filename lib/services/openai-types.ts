export interface OpenAIConfig {
  apiKey: string;
  model: string;
  systemPrompt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export interface Chat {
  id: string;
  name: string;
  threadId: string;
  assistantId: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
  lastMessage?: string;
}

export interface OpenAIState {
  config: OpenAIConfig;
  chats: Record<string, Chat>;
  currentChatId: string | null;
  isInChatMode: boolean;
  isStreaming: boolean;
}

export interface StreamingResponse {
  content: string;
  isComplete: boolean;
  error?: string;
}

export const DEFAULT_OPENAI_CONFIG: OpenAIConfig = {
  apiKey: '',
  model: 'gpt-4o',
  systemPrompt: 'You are a helpful assistant.'
};
