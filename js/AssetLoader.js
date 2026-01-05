// AssetLoader.js - Handles actual asset loading and progress tracking

class AssetLoader {
  constructor() {
    this.totalAssets = 0;
    this.loadedAssets = 0;
    this.progress = 0;
    this.onProgressCallbacks = [];
    this.onCompleteCallbacks = [];
  }

  // Register a callback for progress updates
  onProgress(callback) {
    this.onProgressCallbacks.push(callback);
  }

  // Register a callback for completion
  onComplete(callback) {
    this.onCompleteCallbacks.push(callback);
  }

  // Increment total assets count
  addAsset() {
    this.totalAssets++;
  }

  // Mark an asset as loaded
  assetLoaded() {
    this.loadedAssets++;
    this.updateProgress();
  }

  // Calculate and broadcast progress
  updateProgress() {
    if (this.totalAssets === 0) {
      this.progress = 0;
    } else {
      this.progress = (this.loadedAssets / this.totalAssets) * 100;
    }
    // Notify all progress callbacks with smooth updates
    this.onProgressCallbacks.forEach(callback => {
      callback(this.progress);
    });

    // Check if complete
    if (this.loadedAssets >= this.totalAssets && this.totalAssets > 0) {
      this.onCompleteCallbacks.forEach(callback => {
        callback();
      });
    }
  }

  // Get current progress
  getProgress() {
    return this.progress;
  }

  // Reset loader
  reset() {
    this.totalAssets = 0;
    this.loadedAssets = 0;
    this.progress = 0;
  }
}

// Create global instance
window.assetLoader = new AssetLoader();