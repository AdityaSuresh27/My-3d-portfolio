// AudioManager.js - Handles background music and volume control
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
    this.audio.volume = 0.6; // Default volume
    this.baseVolume = 0.6;
    this.dimmedVolume = 0.15; // For dimmed modes
    this.isDimmed = false;
    this.isPlaying = false;
    
    // Modes where music should NOT be dimmed
    this.fullVolumeModes = ['normal', 'shelf', 'board', 'sofa', 'family', 'frame'];
    
    // Modes where music should be muted
    this.mutedModes = ['tv'];
    
    // Modes where music should be dimmed
    this.dimmedModes = ['desk', 'laptop', 'chess'];
  }
  
  init() {
    // Start playing on user interaction
    document.addEventListener('click', () => {
      if (!this.isPlaying) {
        this.play();
      }
    }, { once: true });
  }
  
  play() {
    this.audio.play().catch(err => {
      console.warn('Audio playback failed:', err);
    });
    this.isPlaying = true;
    console.log('🎵 Background music started');
  }
  
  pause() {
    this.audio.pause();
    this.isPlaying = false;
  }
  
  setTrack(index) {
    const wasPlaying = this.isPlaying;
    const currentTime = this.audio.currentTime;
    
    this.audio.pause();
    this.currentTrackIndex = index;
    this.audio.src = this.tracks[index].path;
    this.audio.currentTime = 0;
    
    if (wasPlaying) {
      this.audio.play();
    }
    
    console.log('🎵 Switched to:', this.tracks[index].name);
  }
  
  nextTrack() {
    const nextIndex = (this.currentTrackIndex + 1) % this.tracks.length;
    this.setTrack(nextIndex);
  }
  
  prevTrack() {
    const prevIndex = (this.currentTrackIndex - 1 + this.tracks.length) % this.tracks.length;
    this.setTrack(prevIndex);
  }
  
  setVolume(volume) {
    this.baseVolume = Math.max(0, Math.min(1, volume));
    if (!this.isDimmed) {
      this.audio.volume = this.baseVolume;
    }
    console.log('🔊 Volume set to:', Math.round(this.baseVolume * 100) + '%');
  }
  
  updateForMode(mode) {
    if (this.mutedModes.includes(mode)) {
      // Mute in TV mode
      this.audio.volume = 0;
      this.isDimmed = true;
      console.log('🔇 Music muted for mode:', mode);
    } else if (this.fullVolumeModes.includes(mode)) {
      // Full volume in normal, shelf, board, sofa, family, frame modes
      this.audio.volume = this.baseVolume;
      this.isDimmed = false;
      console.log('🔊 Music full volume for mode:', mode);
    } else if (this.dimmedModes.includes(mode)) {
      // Dimmed in desk, laptop, chess modes
      this.audio.volume = this.dimmedVolume;
      this.isDimmed = true;
      console.log('🔉 Music dimmed for mode:', mode);
    }
  }
  
  getCurrentTrack() {
    return this.tracks[this.currentTrackIndex];
  }
  
  getVolume() {
    return this.baseVolume;
  }
}

// Create global instance
window.audioManager = new AudioManager();