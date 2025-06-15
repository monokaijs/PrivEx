import RuleActionType = chrome.declarativeNetRequest.RuleActionType;
import HeaderOperation = chrome.declarativeNetRequest.HeaderOperation;

export default defineBackground(() => {
  (async () => {
    const oldRules = await chrome.declarativeNetRequest.getDynamicRules();
    const oldRuleIds = oldRules.map(rule => rule.id);

    await chrome.declarativeNetRequest
      .updateDynamicRules({
        removeRuleIds: oldRuleIds,
        addRules: [
          {
            id: 1,
            action: {
              type: RuleActionType.MODIFY_HEADERS,
              requestHeaders: [{
                header: 'origin',
                operation: HeaderOperation.SET,
                value: 'https://suggestqueries.google.com'
              }]
            },
            condition: {
              urlFilter: "https://suggestqueries.google.com/*"
            }
          },
        ]
      })
  })().then(() => {
    console.log('Google Origin Header Set');
  })
});
