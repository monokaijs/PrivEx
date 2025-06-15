import { Chat, ChatMessage } from './openai-types';

const STORAGE_KEYS = {
  CHATS: 'openai_chats',
  CONFIG: 'openai_config'
} as const;

export class OpenAIStorage {
  static async saveChat(chat: Chat): Promise<void> {
    try {
      const chats = await this.getAllChats();
      chats[chat.id] = chat;
      await chrome.storage.local.set({ [STORAGE_KEYS.CHATS]: chats });
    } catch (error) {
      console.error('Failed to save chat:', error);
      throw error;
    }
  }

  static async getChat(chatId: string): Promise<Chat | null> {
    try {
      const chats = await this.getAllChats();
      return chats[chatId] || null;
    } catch (error) {
      console.error('Failed to get chat:', error);
      return null;
    }
  }

  static async getAllChats(): Promise<Record<string, Chat>> {
    try {
      const result = await chrome.storage.local.get(STORAGE_KEYS.CHATS);
      return result[STORAGE_KEYS.CHATS] || {};
    } catch (error) {
      console.error('Failed to get all chats:', error);
      return {};
    }
  }

  static async deleteChat(chatId: string): Promise<void> {
    try {
      const chats = await this.getAllChats();
      delete chats[chatId];
      await chrome.storage.local.set({ [STORAGE_KEYS.CHATS]: chats });
    } catch (error) {
      console.error('Failed to delete chat:', error);
      throw error;
    }
  }

  static async clearAllChats(): Promise<void> {
    try {
      await chrome.storage.local.set({ [STORAGE_KEYS.CHATS]: {} });
    } catch (error) {
      console.error('Failed to clear all chats:', error);
      throw error;
    }
  }

  static async addMessageToChat(chatId: string, message: ChatMessage): Promise<void> {
    try {
      const chat = await this.getChat(chatId);
      if (!chat) {
        throw new Error(`Chat ${chatId} not found`);
      }

      chat.messages.push(message);
      chat.updatedAt = Date.now();
      chat.lastMessage = message.content.substring(0, 100);
      
      await this.saveChat(chat);
    } catch (error) {
      console.error('Failed to add message to chat:', error);
      throw error;
    }
  }

  static generateChatId(): string {
    return `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  static generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
