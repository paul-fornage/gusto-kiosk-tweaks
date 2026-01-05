/**
 * Background Script
 * Handles extension icon clicks to open options page
 */

// Open options page when extension icon is clicked
chrome.action.onClicked.addListener(() => {
  chrome.runtime.openOptionsPage();
});
