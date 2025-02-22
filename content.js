class GravityScroll {
  constructor() {
    this.g = 9.81; // m/s²
    this.pixelsPerMeter = 100;
    this.startTime = null;
    this.startPosition = null;
    this.maxScroll = null;
    this.animating = false;
  }

  start() {
    if (this.animating) return;

    this.startTime = performance.now();
    this.startPosition = window.scrollY;
    this.maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    this.animating = true;

    requestAnimationFrame(this.animate.bind(this));
  }

  animate(currentTime) {
    if (!this.animating) return;

    const elapsed = (currentTime - this.startTime) / 1000; // Convert to seconds
    const distance = 0.5 * this.g * elapsed * elapsed; // d = 1/2 * g * t²
    const pixelDistance = distance * this.pixelsPerMeter;

    const newPosition = this.startPosition + pixelDistance;

    if (newPosition >= this.maxScroll) {
      window.scrollTo(0, this.maxScroll);
      this.animating = false;
      return;
    }

    window.scrollTo(0, newPosition);
    requestAnimationFrame(this.animate.bind(this));
  }

  stop() {
    this.animating = false;
  }
}

const scroller = new GravityScroll();

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.command === "scroll") {
    scroller.start();
  }
});
