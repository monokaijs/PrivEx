import {defineCommand} from './types';
import {store} from '../store';
import {setBackgroundBrightness, setBackgroundBlur, setBackgroundImage, setLiveSuggestions} from '../store/slices/configSlice';
import {selectBackgroundConfig, selectTerminalConfig} from '../store/selectors';

interface BackgroundConfig {
  image?: string;
  brightness?: number;
  blur?: number;
}

interface TerminalConfig {
  liveSuggestions: boolean;
}

function getBackgroundConfig(): BackgroundConfig {
  const state = store.getState();
  return selectBackgroundConfig(state);
}

function getTerminalConfig(): TerminalConfig {
  const state = store.getState();
  return selectTerminalConfig(state);
}

function applyBackgroundConfig(config: BackgroundConfig) {
  const body = document.body;
  const terminalContainer = document.querySelector('.terminal-container') as HTMLElement;

  if (config.image) {
    body.style.backgroundImage = `url(${config.image})`;
    body.style.backgroundSize = 'cover';
    body.style.backgroundPosition = 'center';
    body.style.backgroundRepeat = 'no-repeat';
    body.style.backgroundAttachment = 'fixed';

    if (terminalContainer) {
      terminalContainer.style.opacity = (config.brightness ?? 0.5).toString();
    }
  } else {
    body.style.backgroundImage = '';
    body.style.backgroundSize = '';
    body.style.backgroundPosition = '';
    body.style.backgroundRepeat = '';
    body.style.backgroundAttachment = '';

    if (terminalContainer) {
      terminalContainer.style.opacity = '1';
    }
  }
}

export const configCommand = defineCommand({
  name: ['config'],
  description: 'Configure terminal settings',
  category: 'configuration',
  args: [
    {
      name: 'setting',
      type: ['background', 'terminal', 'show'],
      description: 'Setting to configure: background, terminal, or show',
      required: true
    },
    {
      name: 'property',
      type: ['image', 'brightness', 'blur', 'live-suggestions'],
      description: 'Property to configure: image, brightness, blur, or live-suggestions',
      required: false
    },
    {
      name: 'value',
      type: 'string',
      description: 'Value to set (URL for image, 0-1 for brightness, 0-100 for blur, true/false for live-suggestions)',
      required: false
    }
  ],
  examples: [
    'config show',
    'config background image https://example.com/bg.jpg',
    'config background image ""',
    'config background brightness 0.8',
    'config background brightness 0.2',
    'config background blur 25',
    'config background blur 0',
    'config terminal live-suggestions true',
    'config terminal live-suggestions false'
  ],
  handler: async (ctx, args) => {
    try {
      const setting = args.setting;

      if (setting === 'show') {
        const backgroundConfig = getBackgroundConfig();
        const terminalConfig = getTerminalConfig();

        return `Terminal Configuration:

Background:
  Image: ${backgroundConfig.image || '(none)'}
  Brightness: ${backgroundConfig.brightness}
  Blur: ${backgroundConfig.blur}

Terminal:
  Live Suggestions: ${terminalConfig.liveSuggestions ? 'enabled' : 'disabled'}

Usage:
  config background image <url>        Set background image URL
  config background image ""           Remove background image
  config background brightness <0-1>   Set terminal opacity (0=transparent, 1=opaque)
  config background blur <0-100>       Set backdrop blur (0=no blur, 100=max blur)
  config terminal live-suggestions <true|false>  Enable/disable live autocomplete suggestions`;
      }

      if (setting === 'background') {
        const property = args.property;
        const value = args.value;

        if (!property) {
          const config = getBackgroundConfig();
          return `Background Configuration:
Image: ${config.image || '(none)'}
Brightness: ${config.brightness}
Blur: ${config.blur}

Use: config background <image|brightness|blur> <value>`;
        }

        if (property === 'image') {
          if (value === undefined) {
            return 'Please specify an image URL or empty string to remove';
          }

          const imageUrl = value.trim();
          store.dispatch(setBackgroundImage(imageUrl));

          const config = getBackgroundConfig();
          applyBackgroundConfig(config);

          if (imageUrl) {
            return `Background image set to: ${imageUrl}`;
          } else {
            return 'Background image removed';
          }
        }

        if (property === 'brightness') {
          if (value === undefined) {
            return 'Please specify brightness value (0-1)';
          }

          const brightness = parseFloat(value);
          if (isNaN(brightness) || brightness < 0 || brightness > 1) {
            return 'Brightness must be a number between 0 (transparent) and 1 (opaque)';
          }

          store.dispatch(setBackgroundBrightness(brightness));

          const config = getBackgroundConfig();
          applyBackgroundConfig(config);

          return `Background brightness set to: ${brightness}`;
        }

        if (property === 'blur') {
          if (value === undefined) {
            return 'Please specify blur value (0-100)';
          }

          const blur = parseFloat(value);
          if (isNaN(blur) || blur < 0 || blur > 100) {
            return 'Blur must be a number between 0 (no blur) and 100 (max blur)';
          }

          store.dispatch(setBackgroundBlur(blur));

          const config = getBackgroundConfig();
          applyBackgroundConfig(config);

          return `Background blur set to: ${blur}`;
        }

        return 'Invalid property. Use: image, brightness, or blur';
      }

      if (setting === 'terminal') {
        const property = args.property;
        const value = args.value;

        if (!property) {
          const config = getTerminalConfig();
          return `Terminal Configuration:
Live Suggestions: ${config.liveSuggestions ? 'enabled' : 'disabled'}

Use: config terminal <live-suggestions> <true|false>`;
        }

        if (property === 'live-suggestions') {
          if (value === undefined) {
            return 'Please specify true or false';
          }

          const boolValue = value.toLowerCase();
          if (boolValue !== 'true' && boolValue !== 'false') {
            return 'Value must be true or false';
          }

          const enabled = boolValue === 'true';
          store.dispatch(setLiveSuggestions(enabled));

          return `Live suggestions ${enabled ? 'enabled' : 'disabled'}`;
        }

        return 'Invalid property. Use: live-suggestions';
      }

      return 'Invalid setting. Use: background, terminal, or show';
    } catch (error) {
      return `Error configuring terminal: ${error}`;
    }
  }
});

export {getBackgroundConfig, applyBackgroundConfig};
