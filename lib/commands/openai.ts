import { defineCommand } from './types';
import { openaiService } from '../services/openai';
import { store } from '../store';
import { enterChatMode, clearAllChats, setConfig, updateConfig, addChat } from '../store/slices/openaiSlice';

export const openaiCommand = defineCommand({
  name: 'openai',
  description: 'OpenAI assistant management',
  category: 'ai',
  args: [
    {
      name: 'subcommand',
      type: 'string',
      description: 'Subcommand to execute',
      required: true,
      choices: ['config', 'clear', 'list', 'join']
    },
    {
      name: 'action',
      type: 'string',
      description: 'Action for config subcommand',
      required: false,
      choices: ['key', 'model', 'prompt']
    },
    {
      name: 'value',
      type: 'string',
      description: 'Value to set',
      required: false
    }
  ],
  examples: [
    'openai config',
    'openai config key sk-...',
    'openai config model gpt-4o',
    'openai config prompt "You are a helpful coding assistant"',
    'openai clear',
    'openai list',
    'openai join chat_123'
  ],
  handler: async (ctx, args) => {
    const { subcommand, action, value } = args;

    switch (subcommand) {
      case 'config':
        return await handleConfigCommand(action, value);
      
      case 'clear':
        return await handleClearCommand();
      
      case 'list':
        return await handleListCommand();
      
      case 'join':
        return await handleJoinCommand(action); // action is chat ID in this case
      
      default:
        return `Unknown subcommand: ${subcommand}. Use: config, clear, list, join`;
    }
  }
});

export const chatCommand = defineCommand({
  name: 'chat',
  description: 'Quickly create a new chat and join it',
  category: 'ai',
  args: [
    {
      name: 'name',
      type: 'string',
      description: 'Optional name for the chat',
      required: false
    }
  ],
  examples: [
    'chat',
    'chat "Coding Help"'
  ],
  handler: async (ctx, args) => {
    const { name } = args;

    if (!openaiService.isConfigured()) {
      return 'OpenAI not configured. Please set your API key first with: openai config key YOUR_API_KEY';
    }

    try {
      // Show loading indicator
      const loadingMessage = '🔄 Creating new chat (setting up assistant and thread)...';

      const chat = await openaiService.createChat(name);
      store.dispatch(addChat(chat));
      store.dispatch(enterChatMode(chat.id));

      return `✅ Created and joined chat: ${chat.name}
Chat ID: ${chat.id}

You are now in chat mode. Type your messages and press Enter to chat with the AI.
Type 'exit' or 'leave' to return to command mode.`;
    } catch (error) {
      return `❌ Failed to create chat: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }
});

export const exitCommand = defineCommand({
  name: ['exit', 'leave'],
  description: 'Exit chat mode and return to command mode',
  category: 'ai',
  examples: ['exit', 'leave'],
  handler: async (ctx, args) => {
    const state = store.getState();
    if (!state.openai.isInChatMode) {
      return 'Not currently in chat mode.';
    }

    // This will be handled by the Terminal component
    return 'EXIT_CHAT_MODE';
  }
});

async function handleConfigCommand(action?: string, value?: string): Promise<string> {
  if (!action) {
    // Show current config
    const config = await openaiService.getConfig();
    return `OpenAI Configuration:
API Key: ${config.apiKey ? '***' + config.apiKey.slice(-4) : 'Not set'}
Model: ${config.model}
System Prompt: ${config.systemPrompt}

To update configuration:
- openai config key YOUR_API_KEY
- openai config model MODEL_NAME
- openai config prompt "Your system prompt"`;
  }

  if (!value) {
    return `Please provide a value for ${action}`;
  }

  try {
    switch (action) {
      case 'key':
        await openaiService.updateConfig({ apiKey: value });
        return 'API key updated successfully';
      
      case 'model':
        await openaiService.updateConfig({ model: value });
        return `Model updated to: ${value}`;
      
      case 'prompt':
        await openaiService.updateConfig({ systemPrompt: value });
        return `System prompt updated to: ${value}`;
      
      default:
        return `Unknown config action: ${action}. Use: key, model, prompt`;
    }
  } catch (error) {
    return `Failed to update config: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}

async function handleClearCommand(): Promise<string> {
  try {
    await openaiService.clearAllChats();
    store.dispatch(clearAllChats());
    return 'All chats cleared successfully';
  } catch (error) {
    return `Failed to clear chats: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}

async function handleListCommand(): Promise<string> {
  try {
    const chats = await openaiService.getAllChats();
    
    if (chats.length === 0) {
      return 'No chats found. Create a new chat with: chat';
    }

    const chatList = chats.map(chat => {
      const lastMessage = chat.lastMessage || 'No messages';
      const date = new Date(chat.updatedAt).toLocaleString();
      return `${chat.id}: ${chat.name}
  Last: ${lastMessage}
  Updated: ${date}`;
    }).join('\n\n');

    return `Chats (${chats.length}):\n\n${chatList}

To join a chat: openai join CHAT_ID`;
  } catch (error) {
    return `Failed to list chats: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}

async function handleJoinCommand(chatId?: string): Promise<string> {
  if (!chatId) {
    return 'Please provide a chat ID: openai join CHAT_ID';
  }

  if (!openaiService.isConfigured()) {
    return 'OpenAI not configured. Please set your API key first with: openai config key YOUR_API_KEY';
  }

  try {
    const chats = await openaiService.getAllChats();
    const chat = chats.find(c => c.id === chatId);
    
    if (!chat) {
      return `Chat not found: ${chatId}. Use 'openai list' to see available chats.`;
    }

    store.dispatch(addChat(chat));
    store.dispatch(enterChatMode(chatId));
    
    return `Joined chat: ${chat.name}
Chat ID: ${chat.id}

You are now in chat mode. Type your messages and press Enter to chat with the AI.
Type 'exit' or 'leave' to return to command mode.`;
  } catch (error) {
    return `Failed to join chat: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}
