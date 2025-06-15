import {defineCommand} from './types';
import {store} from '../store';
import {setBackgroundBrightness, setBackgroundImage} from '../store/slices/configSlice';
import {selectBackgroundConfig} from '../store/selectors';

interface BackgroundConfig {
  image?: string;
  brightness?: number;
}

function getBackgroundConfig(): BackgroundConfig {
  const state = store.getState();
  return selectBackgroundConfig(state);
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
      type: ['background', 'show'],
      description: 'Setting to configure: background or show',
      required: true
    },
    {
      name: 'property',
      type: ['image', 'brightness'],
      description: 'Background property: image or brightness',
      required: false
    },
    {
      name: 'value',
      type: 'string',
      description: 'Value to set (URL for image, 0-1 for brightness)',
      required: false
    }
  ],
  examples: [
    'config show',
    'config background image https://example.com/bg.jpg',
    'config background image ""',
    'config background brightness 0.8',
    'config background brightness 0.2'
  ],
  handler: async (ctx, args) => {
    try {
      const setting = args.setting;

      if (setting === 'show') {
        const config = getBackgroundConfig();

        return `Terminal Configuration:
Background Image: ${config.image || '(none)'}
Background Brightness: ${config.brightness}

Usage:
  config background image <url>        Set background image URL
  config background image ""           Remove background image
  config background brightness <0-1>   Set terminal opacity (0=transparent, 1=opaque)`;
      }

      if (setting === 'background') {
        const property = args.property;
        const value = args.value;

        if (!property) {
          const config = getBackgroundConfig();
          return `Background Configuration:
Image: ${config.image || '(none)'}
Brightness: ${config.brightness}

Use: config background <image|brightness> <value>`;
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

        return 'Invalid property. Use: image or brightness';
      }

      return 'Invalid setting. Use: background or show';
    } catch (error) {
      return `Error configuring terminal: ${error}`;
    }
  }
});

export {getBackgroundConfig, applyBackgroundConfig};
