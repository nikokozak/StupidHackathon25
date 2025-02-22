class GravityScroll {
  constructor() {
    // Physics parameters
    this.g = 9.81;                // Gravitational acceleration (m/s²)
    this.pixelsPerMeter = 100;    // Conversion factor for physical simulation
    this.friction = 2.0;          // Friction coefficient (higher = more drag)
    this.scrollMultiplier = 50;   // Multiplier for scroll input strength
    this.upwardForcePersistence = 0.95; // How long upward force lasts (0-1)
    
    // State variables
    this.velocity = 0;            // Current velocity in pixels/s (positive = down)
    this.lastTime = null;         // Last animation frame timestamp
    this.position = 0;            // Current scroll position in pixels
    this.animating = false;
    this.upwardForce = 0;         // Track upward force from scrolling
    this.maxScroll = 0;
    
    // Bind handlers
    this.handleScroll = this.handleScroll.bind(this);
    this.animate = this.animate.bind(this);
    
    // Set up event listeners
    document.addEventListener('wheel', this.handleScroll, { passive: false });
    
    // Initialize
    this.start();
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
  }

  start() {
    if (this.animating) return;
    
    this.lastTime = performance.now();
    this.position = window.scrollY;
    this.maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    this.velocity = 0;
    this.upwardForce = 0;
    this.animating = true;
    
    requestAnimationFrame(this.animate);
  }

  animate(currentTime) {
    if (!this.animating) return;

    const deltaTime = (currentTime - this.lastTime) / 1000; // Convert to seconds
    this.lastTime = currentTime;

    // Calculate forces
    const gravityForce = this.g * this.pixelsPerMeter;
    const frictionForce = this.velocity * this.friction; // Linear friction for better control
    const netForce = gravityForce - this.upwardForce - frictionForce;
    
    // Update velocity based on net force
    this.velocity += netForce * deltaTime;

    // Update position based on velocity
    this.position += this.velocity * deltaTime;

    // Handle bounds
    if (this.position >= this.maxScroll) {
      this.position = this.maxScroll;
      this.velocity = 0;
    } else if (this.position < 0) {
      this.position = 0;
      this.velocity = 0;
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
  }
}

const scroller = new GravityScroll();

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.command === "updateParams") {
    scroller.updateParams(request.params);
  }
});
