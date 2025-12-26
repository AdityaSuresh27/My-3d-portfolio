// AudioManager.js - Handles background music and volume control with smooth transitions
class AudioManager {
  constructor() {
    this.tracks = [
      { id: 1, path: './assets/audio/bm1.mp3', name: 'Track 1' },
      { id: 2, path: './assets/audio/bm2.mp3', name: 'Track 2' },
      { id: 3, path: './assets/audio/bm3.mp3', name: 'Track 3' }
    ];
    
    this.currentTrackIndex = 0;
    this.audio = new Audio(this.tracks[0].path);
    this.audio.loop = true;
    this.audio.volume = 0;
    this.baseVolume = 0.6;
    this.isDimmed = false;
    this.isPlaying = false;
    this.targetVolume = 0.6;
    this.isFading = false;
    this.currentFadeTimeout = null;
    
    // Percentage-based volume adjustments
    this.dimmedPercentage = 0.25; // 25% of base volume for dimmed modes
    this.mutedPercentage = 0.0;   // 0% for muted modes
    
    this.fullVolumeModes = ['normal', 'shelf', 'board', 'sofa', 'family', 'frame'];
    this.mutedModes = ['tv'];
    this.dimmedModes = ['desk', 'laptop', 'chess'];
    
    // Fade settings
    this.fadeInterval = 20; // ms between steps
  }
  
  init() {
    document.addEventListener('click', () => {
      if (!this.isPlaying) {
        this.play();
      }
    }, { once: true });
  }
  
  // Cancel any ongoing fade
  cancelFade() {
    if (this.currentFadeTimeout) {
      clearTimeout(this.currentFadeTimeout);
      this.currentFadeTimeout = null;
    }
    this.isFading = false;
  }
  
  async fadeVolume(targetVolume, duration = 1000) {
    // Cancel any existing fade
    this.cancelFade();
    
    this.isFading = true;
    const startVolume = this.audio.volume;
    const volumeDelta = targetVolume - startVolume;
    const steps = Math.ceil(duration / this.fadeInterval);
    const stepSize = volumeDelta / steps;
    
    return new Promise((resolve) => {
      let currentStep = 0;
      
      const fadeStep = () => {
        currentStep++;
        
        if (currentStep >= steps) {
          this.audio.volume = Math.max(0, Math.min(1, targetVolume));
          this.isFading = false;
          this.currentFadeTimeout = null;
          resolve();
        } else {
          const newVolume = startVolume + (stepSize * currentStep);
          this.audio.volume = Math.max(0, Math.min(1, newVolume));
          this.currentFadeTimeout = setTimeout(fadeStep, this.fadeInterval);
        }
      };
      
      fadeStep();
    });
  }
  
  async play() {
    try {
      await this.audio.play();
      this.isPlaying = true;
      
      // Fade in from 0 to target volume
      await this.fadeVolume(this.targetVolume, 2000);
      
      console.log('🎵 Background music started');
    } catch (err) {
      console.warn('Audio playback failed:', err);
    }
  }
  
  async pause(fadeOut = true) {
    if (fadeOut) {
      await this.fadeVolume(0, 1000);
    }
    this.audio.pause();
    this.isPlaying = false;
  }
  
  async setTrack(index) {
    const wasPlaying = this.isPlaying;
    
    if (wasPlaying) {
      await this.fadeVolume(0, 800);
      this.audio.pause();
    }
    
    this.audio.src = this.tracks[index].path;
    this.audio.currentTime = 0;
    
    if (wasPlaying) {
      await this.audio.play();
      await this.fadeVolume(this.targetVolume, 800);
    }
    
  }
  
  nextTrack() {
    this.currentTrackIndex = (this.currentTrackIndex + 1) % this.tracks.length;
    this.setTrack(this.currentTrackIndex);
    return this.tracks[this.currentTrackIndex]; // Return new track immediately
  }
  
  prevTrack() {
    this.currentTrackIndex = (this.currentTrackIndex - 1 + this.tracks.length) % this.tracks.length;
    this.setTrack(this.currentTrackIndex);
    return this.tracks[this.currentTrackIndex]; // Return new track immediately
  }
  
  // NEW: Set volume INSTANTLY (for radio knob)
  setVolumeInstant(volume) {
    this.baseVolume = Math.max(0, Math.min(1, volume));
    
    // Cancel any ongoing fade
    this.cancelFade();
    
    // Calculate actual volume based on current mode
    let actualVolume;
    if (this.isDimmed) {
      // If dimmed, apply percentage to base volume
      actualVolume = this.baseVolume * this.dimmedPercentage;
    } else {
      actualVolume = this.baseVolume;
    }
    
    // Set instantly
    this.audio.volume = actualVolume;
    this.targetVolume = actualVolume;
    
    console.log('🔊 Volume set instantly to:', Math.round(this.baseVolume * 100) + '%', `(actual: ${Math.round(actualVolume * 100)}%)`);
  }
  
  // MODIFIED: Set volume with fade (for UI controls outside radio)
  async setVolume(volume) {
    this.baseVolume = Math.max(0, Math.min(1, volume));
    
    if (!this.isDimmed) {
      this.targetVolume = this.baseVolume;
      await this.fadeVolume(this.baseVolume, 500);
    } else {
      // If dimmed, update target but keep current dimmed level
      this.targetVolume = this.baseVolume * this.dimmedPercentage;
    }
    
    console.log('🔊 Volume set to:', Math.round(this.baseVolume * 100) + '%');
  }
  
  async updateForMode(mode) {
    let newTargetVolume;
    
    if (this.mutedModes.includes(mode)) {
      // Mute = 0% of base volume
      newTargetVolume = this.baseVolume * this.mutedPercentage;
      this.isDimmed = true;
      console.log('🔇 Music muting for mode:', mode);
    } else if (this.fullVolumeModes.includes(mode)) {
      // Full volume = 100% of base volume
      newTargetVolume = this.baseVolume;
      this.isDimmed = false;
      console.log('🔊 Music full volume for mode:', mode);
    } else if (this.dimmedModes.includes(mode)) {
      // Dimmed = 25% of base volume (or whatever percentage is set)
      newTargetVolume = this.baseVolume * this.dimmedPercentage;
      this.isDimmed = true;
      console.log('🔉 Music dimming for mode:', mode, `(${Math.round(this.dimmedPercentage * 100)}% of base)`);
    } else {
      return;
    }
    
    this.targetVolume = newTargetVolume;
    
    // Smooth transition to new volume
    await this.fadeVolume(newTargetVolume, 1200);
  }
  
  getCurrentTrack() {
    return this.tracks[this.currentTrackIndex];
  }
  
  getVolume() {
    return this.baseVolume;
  }
  
  getActualVolume() {
    return this.audio.volume;
  }
}

// Create global instance
window.audioManager = new AudioManager();