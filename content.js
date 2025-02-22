chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.command === "scroll") {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: "smooth"
    });
  }
});
