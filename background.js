// Background script is now minimal since scrolling is automatic
// Kept for potential future functionality

let isActive = false;

chrome.action.onClicked.addListener((tab) => {
  isActive = !isActive;
  
  // Update icon to reflect state
  chrome.action.setTitle({
    title: isActive ? "Gravity Scroll (Active)" : "Gravity Scroll (Inactive)"
  });
  
  // Send message to content script
  chrome.tabs.sendMessage(tab.id, {
    command: isActive ? "start" : "stop"
  });
});

