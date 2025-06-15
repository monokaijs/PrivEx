import OpenAI from 'openai';
import { Chat, ChatMessage, OpenAIConfig, StreamingResponse } from './openai-types';
import { OpenAIStorage } from './openai-storage';

export class OpenAIService {
  private client: OpenAI | null = null;
  private config: OpenAIConfig | null = null;

  constructor() {
    this.initializeClient();
  }

  private async initializeClient(): Promise<void> {
    try {
      const result = await chrome.storage.local.get('openai_config');
      if (result.openai_config?.apiKey) {
        this.config = result.openai_config;
        this.client = new OpenAI({
          apiKey: this.config?.apiKey || '',
          dangerouslyAllowBrowser: true
        });
      }
    } catch (error) {
      console.error('Failed to initialize OpenAI client:', error);
    }
  }

  async updateConfig(config: Partial<OpenAIConfig>): Promise<void> {
    try {
      const currentConfig = await this.getConfig();
      const newConfig = { ...currentConfig, ...config };
      
      await chrome.storage.local.set({ openai_config: newConfig });
      this.config = newConfig;
      
      if (newConfig.apiKey) {
        this.client = new OpenAI({
          apiKey: newConfig.apiKey,
          dangerouslyAllowBrowser: true
        });
      }
    } catch (error) {
      console.error('Failed to update OpenAI config:', error);
      throw error;
    }
  }

  async getConfig(): Promise<OpenAIConfig> {
    try {
      const result = await chrome.storage.local.get('openai_config');
      return result.openai_config || {
        apiKey: '',
        model: 'gpt-4o',
        systemPrompt: 'You are a helpful assistant.'
      };
    } catch (error) {
      console.error('Failed to get OpenAI config:', error);
      return {
        apiKey: '',
        model: 'gpt-4o',
        systemPrompt: 'You are a helpful assistant.'
      };
    }
  }

  async createChat(name?: string): Promise<Chat> {
    if (!this.client) {
      throw new Error('OpenAI client not initialized. Please set API key first.');
    }

    try {
      // Create assistant
      const assistant = await this.client.beta.assistants.create({
        name: name || 'Privex Assistant',
        instructions: this.config?.systemPrompt || 'You are a helpful assistant.',
        model: this.config?.model || 'gpt-4o'
      });

      // Create thread
      const thread = await this.client.beta.threads.create();

      const chat: Chat = {
        id: OpenAIStorage.generateChatId(),
        name: name || `Chat ${new Date().toLocaleString()}`,
        threadId: thread.id,
        assistantId: assistant.id,
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      await OpenAIStorage.saveChat(chat);
      return chat;
    } catch (error) {
      console.error('Failed to create chat:', error);
      throw error;
    }
  }

  async sendMessage(chatId: string, content: string): Promise<AsyncGenerator<StreamingResponse>> {
    if (!this.client) {
      throw new Error('OpenAI client not initialized. Please set API key first.');
    }

    const chat = await OpenAIStorage.getChat(chatId);
    if (!chat) {
      throw new Error(`Chat ${chatId} not found`);
    }

    try {
      // Add user message to storage
      const userMessage: ChatMessage = {
        id: OpenAIStorage.generateMessageId(),
        role: 'user',
        content,
        timestamp: Date.now()
      };
      await OpenAIStorage.addMessageToChat(chatId, userMessage);

      // Add message to thread
      await this.client.beta.threads.messages.create(chat.threadId, {
        role: 'user',
        content
      });

      // Create and stream run
      const stream = this.client.beta.threads.runs.stream(chat.threadId, {
        assistant_id: chat.assistantId
      });

      return this.processStream(stream, chatId);
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  }

  private async *processStream(stream: any, chatId: string): AsyncGenerator<StreamingResponse> {
    let assistantMessage = '';
    let messageId = '';

    try {
      for await (const event of stream) {
        if (event.event === 'thread.message.delta') {
          const delta = event.data.delta;
          if (delta.content && delta.content[0]?.text?.value) {
            const chunk = delta.content[0].text.value;
            assistantMessage += chunk;
            yield {
              content: chunk,
              isComplete: false
            };
          }
        } else if (event.event === 'thread.message.created') {
          messageId = event.data.id;
        } else if (event.event === 'thread.run.completed') {
          // Save complete assistant message
          if (assistantMessage && messageId) {
            const message: ChatMessage = {
              id: OpenAIStorage.generateMessageId(),
              role: 'assistant',
              content: assistantMessage,
              timestamp: Date.now()
            };
            await OpenAIStorage.addMessageToChat(chatId, message);
          }

          yield {
            content: '',
            isComplete: true
          };
          break;
        } else if (event.event === 'thread.run.failed') {
          yield {
            content: '',
            isComplete: true,
            error: 'Run failed'
          };
          break;
        }
      }
    } catch (error) {
      yield {
        content: '',
        isComplete: true,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async getAllChats(): Promise<Chat[]> {
    const chats = await OpenAIStorage.getAllChats();
    return Object.values(chats).sort((a, b) => b.updatedAt - a.updatedAt);
  }

  async deleteChat(chatId: string): Promise<void> {
    const chat = await OpenAIStorage.getChat(chatId);
    if (chat && this.client) {
      try {
        // Clean up OpenAI resources
        await this.client.beta.assistants.delete(chat.assistantId);
        await this.client.beta.threads.delete(chat.threadId);
      } catch (error) {
        console.warn('Failed to delete OpenAI resources:', error);
      }
    }
    await OpenAIStorage.deleteChat(chatId);
  }

  async clearAllChats(): Promise<void> {
    const chats = await this.getAllChats();
    
    if (this.client) {
      // Clean up OpenAI resources
      for (const chat of chats) {
        try {
          await this.client.beta.assistants.delete(chat.assistantId);
          await this.client.beta.threads.delete(chat.threadId);
        } catch (error) {
          console.warn(`Failed to delete OpenAI resources for chat ${chat.id}:`, error);
        }
      }
    }

    await OpenAIStorage.clearAllChats();
  }

  isConfigured(): boolean {
    return !!(this.config?.apiKey);
  }
}

export const openaiService = new OpenAIService();
