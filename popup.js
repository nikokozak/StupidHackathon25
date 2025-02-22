// Get DOM elements
const gravitySlider = document.getElementById('gravity');
const pixelsSlider = document.getElementById('pixels');
const frictionSlider = document.getElementById('friction');
const scrollMultiplierSlider = document.getElementById('scrollMultiplier');
const persistenceSlider = document.getElementById('persistence');
const maxSpeedSlider = document.getElementById('maxSpeed');
const bounceSlider = document.getElementById('bounce');
const minBounceVelSlider = document.getElementById('minBounceVel');

const gravityValue = document.getElementById('gravity-value');
const pixelsValue = document.getElementById('pixels-value');
const frictionValue = document.getElementById('friction-value');
const scrollMultiplierValue = document.getElementById('scrollMultiplier-value');
const persistenceValue = document.getElementById('persistence-value');
const maxSpeedValue = document.getElementById('maxSpeed-value');
const bounceValue = document.getElementById('bounce-value');
const minBounceVelValue = document.getElementById('minBounceVel-value');

// Load saved parameters
chrome.storage.sync.get({
  // Default values if not set
  g: 9.81,
  pixelsPerMeter: 400,
  friction: 0.1,
  scrollMultiplier: 105,
  upwardForcePersistence: 0.1,
  maxUpwardSpeed: 900,
  bounceFactor: 0.8,
  minBounceVelocity: 100
}, function(items) {
  // Update sliders with saved values
  gravitySlider.value = items.g;
  pixelsSlider.value = items.pixelsPerMeter;
  frictionSlider.value = items.friction;
  scrollMultiplierSlider.value = items.scrollMultiplier;
  persistenceSlider.value = items.upwardForcePersistence;
  maxSpeedSlider.value = items.maxUpwardSpeed;
  bounceSlider.value = items.bounceFactor;
  minBounceVelSlider.value = items.minBounceVelocity;
  
  // Update display values
  updateDisplayValues();
  
  // Send initial values to content script
  sendToContentScript();
});

// Update display values
function updateDisplayValues() {
  gravityValue.textContent = gravitySlider.value;
  pixelsValue.textContent = pixelsSlider.value;
  frictionValue.textContent = frictionSlider.value;
  scrollMultiplierValue.textContent = scrollMultiplierSlider.value;
  persistenceValue.textContent = persistenceSlider.value;
  maxSpeedValue.textContent = maxSpeedSlider.value;
  bounceValue.textContent = bounceSlider.value;
  minBounceVelValue.textContent = minBounceVelSlider.value;
}

// Send parameters to content script and save to storage
function sendToContentScript() {
  const params = {
    g: parseFloat(gravitySlider.value),
    pixelsPerMeter: parseFloat(pixelsSlider.value),
    friction: parseFloat(frictionSlider.value),
    scrollMultiplier: parseFloat(scrollMultiplierSlider.value),
    upwardForcePersistence: parseFloat(persistenceSlider.value),
    maxUpwardSpeed: parseFloat(maxSpeedSlider.value),
    bounceFactor: parseFloat(bounceSlider.value),
    minBounceVelocity: parseFloat(minBounceVelSlider.value)
  };
  
  // Save to storage
  chrome.storage.sync.set(params);
  
  // Send to active tab
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {
      command: "updateParams",
      params: params
    });
  });
}

// Add event listeners
gravitySlider.addEventListener('input', () => {
  updateDisplayValues();
  sendToContentScript();
});
pixelsSlider.addEventListener('input', () => {
  updateDisplayValues();
  sendToContentScript();
});
frictionSlider.addEventListener('input', () => {
  updateDisplayValues();
  sendToContentScript();
});
scrollMultiplierSlider.addEventListener('input', () => {
  updateDisplayValues();
  sendToContentScript();
});
persistenceSlider.addEventListener('input', () => {
  updateDisplayValues();
  sendToContentScript();
});
maxSpeedSlider.addEventListener('input', () => {
  updateDisplayValues();
  sendToContentScript();
});
bounceSlider.addEventListener('input', () => {
  updateDisplayValues();
  sendToContentScript();
});
minBounceVelSlider.addEventListener('input', () => {
  updateDisplayValues();
  sendToContentScript();
}); 