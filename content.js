class GravityScroll {
  constructor() {
    // Physics parameters
    this.g = 9.81;                // Gravitational acceleration (m/s²)
    this.pixelsPerMeter = 400;    // Conversion factor for physical simulation
    this.friction = 0.1;          // Friction coefficient (higher = more drag)
    this.scrollMultiplier = 105;   // Multiplier for scroll input strength
    this.upwardForcePersistence = 0.1; // How long upward force lasts (0-1)
    this.maxUpwardSpeed = 900;   // Maximum upward scroll speed in pixels/s
    this.bounceFactor = 0.8;      // How bouncy the bottom edge is (0-1)
    this.minBounceVelocity = 100; // Minimum velocity needed to trigger a bounce
    
    // State variables
    this.velocity = 0;            // Current velocity in pixels/s (positive = down)
    this.lastTime = null;         // Last animation frame timestamp
    this.position = 0;            // Current scroll position in pixels
    this.animating = false;
    this.upwardForce = 0;         // Track upward force from scrolling
    this.maxScroll = 0;
    this.bouncing = false;        // Track if we're in a bounce state
    this.hasReachedMidway = false;
    this.hasReachedBottom = false;
    this.isScrollingUp = false;
    this.hasShownConfetti = false;
    
    // Create overlay elements
    this.setupOverlays();
    
    // Bind handlers
    this.handleScroll = this.handleScroll.bind(this);
    this.animate = this.animate.bind(this);
  }

  setupOverlays() {
    // Create middle text (hidden initially)
    this.midwayText = document.createElement('div');
    this.midwayText.textContent = "Halfway there! Keep going!";
    this.midwayText.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0, 0, 0, 0.7);
      color: white;
      padding: 10px 20px;
      border-radius: 20px;
      font-family: system-ui;
      font-size: 16px;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.3s ease;
      z-index: 10000;
    `;
    document.body.appendChild(this.midwayText);

    // Create bottom text
    this.bottomText = document.createElement('div');
    this.bottomText.textContent = "You've reached the bottom! Scroll your way up!!!";
    this.bottomText.style.cssText = `
      position: absolute;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.7);
      color: white;
      padding: 10px 20px;
      border-radius: 20px;
      font-family: system-ui;
      font-size: 16px;
      pointer-events: none;
      z-index: 10000;
    `;
    document.body.appendChild(this.bottomText);

    // Create confetti container (hidden initially)
    this.confetti_2 = document.createElement('div');
    this.confetti_2.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: ${document.documentElement.scrollHeight}px;
      opacity: 0;
      transition: opacity 0.5s ease;
      pointer-events: none;
      z-index: 9999;
      display: block;
      background: rgba(255, 255, 255, 0.1);
    `;
    
    // Load SVG from file
    fetch(chrome.runtime.getURL('confetti_2.svg'))
      .then(response => response.text())
      .then(svgContent => {
        this.confetti_2.innerHTML = svgContent;
        document.body.insertBefore(this.confetti_2, document.body.firstChild);
        
        // Ensure SVG is fixed to document body
        const svg = this.confetti_2.querySelector('svg');
        if (svg) {
          svg.style.cssText = `
            width: 100%;
            height: ${document.documentElement.scrollHeight}px;
            position: absolute;
            top: 0;
            left: 0;
          `;
        }
      });
  }

  // Handle user scroll events
  handleScroll(event) {
    event.preventDefault(); // Always prevent default scroll

    // Apply force based on scroll direction
    this.upwardForce = -event.deltaY * this.scrollMultiplier;
  }

  // Update simulation parameters
  updateParams(params) {
    if (params.g) this.g = parseFloat(params.g);
    if (params.pixelsPerMeter) this.pixelsPerMeter = parseFloat(params.pixelsPerMeter);
    if (params.friction) this.friction = parseFloat(params.friction);
    if (params.scrollMultiplier) this.scrollMultiplier = parseFloat(params.scrollMultiplier);
    if (params.upwardForcePersistence) this.upwardForcePersistence = parseFloat(params.upwardForcePersistence);
    if (params.maxUpwardSpeed) this.maxUpwardSpeed = parseFloat(params.maxUpwardSpeed);
    if (params.bounceFactor) this.bounceFactor = parseFloat(params.bounceFactor);
    if (params.minBounceVelocity) this.minBounceVelocity = parseFloat(params.minBounceVelocity);
  }

  start() {
    if (this.animating) return;
    
    // Add wheel event listener
    document.addEventListener('wheel', this.handleScroll, { passive: false });
    
    // Force scroll to top
    window.scrollTo(0, 0);
    
    this.lastTime = performance.now();
    this.position = 0; // Start at top
    this.maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    this.velocity = 0;
    this.upwardForce = 0;
    this.animating = true;
    this.hasReachedMidway = false;
    this.hasReachedBottom = false;
    this.isScrollingUp = false;
    this.hasShownConfetti = false;
    
    // Reset overlay states
    this.midwayText.style.opacity = '0';
    this.confetti_2.style.opacity = '0';

    // Position texts at their respective positions
    const midpoint = Math.floor(document.documentElement.scrollHeight / 2);
    this.midwayText.style.top = `${midpoint}px`;
    this.bottomText.style.top = `${document.documentElement.scrollHeight - 100}px`; // 100px from bottom
    
    requestAnimationFrame(this.animate);
  }

  animate(currentTime) {
    if (!this.animating) return;

    const deltaTime = (currentTime - this.lastTime) / 1000; // Convert to seconds
    this.lastTime = currentTime;

    // Update maxScroll to handle dynamically loaded content
    this.maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    
    // Update bottom text position for dynamic content
    this.bottomText.style.top = `${document.documentElement.scrollHeight - 100}px`;

    // Calculate forces
    const gravityForce = this.g * this.pixelsPerMeter;
    const frictionForce = this.velocity * this.friction; // Linear friction for better control
    
    // Reduce friction during bounce to maintain momentum
    const effectiveFriction = this.bouncing ? frictionForce * 0.5 : frictionForce;
    
    const netForce = gravityForce - this.upwardForce - effectiveFriction;
    
    // Update velocity based on net force
    this.velocity += netForce * deltaTime;

    // Cap upward velocity (negative = upward)
    if (this.velocity < 0) {
      this.velocity = Math.max(this.velocity, -this.maxUpwardSpeed);
    }

    // Update position based on velocity
    const prevPosition = this.position;
    this.position += this.velocity * deltaTime;

    // Track scroll direction
    this.isScrollingUp = this.position < prevPosition;

    // Handle bounds and bounce
    if (this.position >= this.maxScroll) {
      // Only bounce if we're moving downward and fast enough
      if (this.velocity > this.minBounceVelocity && !this.bouncing) {
        // Start bounce with reversed and dampened velocity
        this.velocity = -this.velocity * this.bounceFactor;
        this.bouncing = true;
      } else {
        // Not bouncing - stop at bottom
        this.velocity = 0;
        this.bouncing = false;
      }
      this.position = this.maxScroll;
      
      // Mark that we've reached bottom
      if (!this.hasReachedBottom) {
        this.hasReachedBottom = true;
      }
    } else if (this.position < 0) {
      // Hit top - just stop
      this.position = 0;
      this.velocity = 0;
      this.bouncing = false;

      // Show confetti when reaching top after having been at bottom
      if (this.hasReachedBottom && !this.hasShownConfetti) {
        this.hasShownConfetti = true;
        this.confetti_2.style.opacity = '1';
        // Hide confetti after 4 seconds
        setTimeout(() => {
          this.confetti_2.style.opacity = '0';
        }, 4000);
      }
    } else if (prevPosition === this.maxScroll && this.position < this.maxScroll) {
      // Just left the bottom during a bounce - keep bouncing state
      this.bouncing = true;
    } else {
      // Moving freely - reset bounce state
      this.bouncing = false;
    }

    // Show midway text only when scrolling up after reaching bottom
    const midpoint = this.maxScroll * 0.5;
    if (this.hasReachedBottom && this.isScrollingUp && !this.hasReachedMidway && this.position <= midpoint) {
      this.hasReachedMidway = true;
      this.midwayText.style.opacity = '1';
    }

    // Gradually decay upward force
    this.upwardForce *= this.upwardForcePersistence;

    // Apply the scroll
    window.scrollTo(0, this.position);
    requestAnimationFrame(this.animate);
  }

  stop() {
    this.animating = false;
    this.velocity = 0;
    this.upwardForce = 0;
    
    // Remove wheel event listener
    document.removeEventListener('wheel', this.handleScroll, { passive: false });
    
    // Clean up overlays
    if (this.bottomText) this.bottomText.remove();
    if (this.midwayText) this.midwayText.remove();
    if (this.confetti_2) this.confetti_2.remove();
  }
}

const scroller = new GravityScroll();

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.command === "updateParams") {
    scroller.updateParams(request.params);
  } else if (request.command === "start") {
    scroller.start();
  } else if (request.command === "stop") {
    scroller.stop();
  }
});
