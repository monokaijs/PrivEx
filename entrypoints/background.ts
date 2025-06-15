export default defineBackground(() => {
  console.log('Privex background script started', { id: browser.runtime.id });

  // Background script is now minimal - domain loading happens on-demand
  // when users type in the terminal
});
