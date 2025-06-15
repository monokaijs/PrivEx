import {defineConfig} from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-react', '@wxt-dev/auto-icons'],
  autoIcons: {
    sizes: [16, 32, 48, 128]
  },
  webExt: {
    disabled: true,
  },
  manifest: {
    name: 'Privex',
    description: 'A terminal-style new tab page for Chrome',
    permissions: [
      'storage',
      'history',
      'declarativeNetRequest',
      'declarativeNetRequestFeedback'
    ],
    host_permissions: [
      '*://suggestqueries.google.com/*'
    ]
  },
});
