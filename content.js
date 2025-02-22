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
    if (params.upwardForcePersistence) this.upwardForcePersistence = parseFloat(params.upwardForcePersistence);
    if (params.maxUpwardSpeed) this.maxUpwardSpeed = parseFloat(params.maxUpwardSpeed);
    if (params.bounceFactor) this.bounceFactor = parseFloat(params.bounceFactor);
    if (params.minBounceVelocity) this.minBounceVelocity = parseFloat(params.minBounceVelocity);
  }

  start() {
    if (this.animating) return;
    
    // Force scroll to top
    window.scrollTo(0, 0);
    
    this.lastTime = performance.now();
    this.position = 0; // Start at top
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

    // Update maxScroll to handle dynamically loaded content
    this.maxScroll = document.documentElement.scrollHeight - window.innerHeight;

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
    } else if (this.position < 0) {
      // Hit top - just stop
      this.position = 0;
      this.velocity = 0;
      this.bouncing = false;
    } else if (prevPosition === this.maxScroll && this.position < this.maxScroll) {
      // Just left the bottom during a bounce - keep bouncing state
      this.bouncing = true;
    } else {
      // Moving freely - reset bounce state
      this.bouncing = false;
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
