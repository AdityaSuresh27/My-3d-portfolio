// loading-connector.js - Handles transition from loading screen to main app

class LoadingConnector {
  constructor() {
    this.progress = 0;
    this.targetProgress = 0;
    this.loadingComplete = false;
  }

  // Simulate loading progress for assets
  simulateProgress() {
    const interval = setInterval(() => {
      if (this.targetProgress < 90) {
        this.targetProgress += Math.random() * 15;
        this.targetProgress = Math.min(this.targetProgress, 90);
        this.updateProgress();
      }
    }, 200);

    return interval;
  }

  updateProgress() {
    const diff = this.targetProgress - this.progress;
    this.progress += diff * 0.1;
    
    // Update any progress indicators if needed
    console.log(`Loading: ${Math.round(this.progress)}%`);
  }

  complete() {
    this.targetProgress = 100;
    this.loadingComplete = true;
    
    // Wait for liquid animation to finish (it goes to 100% automatically)
    setTimeout(() => {
      this.transitionToMain();
    }, 1800); // Wait for transition animation
  }

  transitionToMain() {
    // Redirect to index with loaded flag
    window.location.href = 'index.html?loaded=true';
  }
}

// Export for use in loading.html
window.LoadingConnector = LoadingConnector;