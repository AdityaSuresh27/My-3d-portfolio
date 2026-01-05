// LoadingScreen.js - Manages the loading screen UI

class LoadingScreen {
constructor() {
    this.canvas = null;
    this.ctx = null;
    this.starsCanvas = null;
    this.starsCtx = null;
    this.stars = [];
    this.progress = 0;
    this.targetProgress = 0; 
    this.time = 0;
    this.logoImg = null;
    this.animationFrame = null;
    this.transitionStarted = false;
    
    this.centerX = 0;
    this.centerY = 0;
    this.radius = 150;
    
    // Wave parameters
    this.waves = [
      { amp: 10, freq: 0.016, speed: 0.022, phase: 0, chaos: 0.25 },
      { amp: 7, freq: 0.028, speed: 0.029, phase: Math.PI / 3, chaos: 0.4 },
      { amp: 12, freq: 0.019, speed: 0.025, phase: Math.PI / 1.5, chaos: 0.3 },
      { amp: 6, freq: 0.038, speed: 0.035, phase: Math.PI, chaos: 0.5 },
      { amp: 9, freq: 0.022, speed: 0.031, phase: Math.PI / 6, chaos: 0.28 },
      { amp: 5, freq: 0.042, speed: 0.027, phase: Math.PI * 1.3, chaos: 0.42 },
      { amp: 8, freq: 0.033, speed: 0.033, phase: Math.PI / 4, chaos: 0.38 }
    ];
  }

  init() {
    // Create loading screen elements
    const loadingScreen = document.createElement('div');
    loadingScreen.id = 'loadingScreen';
    
    const overlay = document.createElement('div');
    overlay.className = 'transition-overlay';
    overlay.id = 'transitionOverlay';
    
    const starsCanvas = document.createElement('canvas');
    starsCanvas.id = 'starsCanvas';
    
    const container = document.createElement('div');
    container.className = 'loading-container';
    
    const liquidCanvas = document.createElement('canvas');
    liquidCanvas.id = 'liquidCanvas';
    liquidCanvas.width = 350;
    liquidCanvas.height = 350;
    
    container.appendChild(liquidCanvas);
    loadingScreen.appendChild(overlay);
    loadingScreen.appendChild(starsCanvas);
    loadingScreen.appendChild(container);
    document.body.appendChild(loadingScreen);
    
    // Setup canvases
    this.canvas = liquidCanvas;
    this.ctx = liquidCanvas.getContext('2d');
    this.centerX = liquidCanvas.width / 2;
    this.centerY = liquidCanvas.height / 2;
    
    this.starsCanvas = starsCanvas;
    this.starsCtx = starsCanvas.getContext('2d');
    this.starsCanvas.width = window.innerWidth;
    this.starsCanvas.height = window.innerHeight;
    
    // Load logo
    this.logoImg = new Image();
    this.logoImg.src = 'assets/icons/logo.png';
    
    // Initialize stars
    this.initStars();
    
    // Start animation
    this.animate();
    
    // Listen to asset loader
    if (window.assetLoader) {
      window.assetLoader.onProgress((progress) => {
        this.updateProgress(progress);
      });
      
      window.assetLoader.onComplete(() => {
        this.complete();
      });
      
    } else {
      console.error('AssetLoader not found!');
    }
  }

  initStars() {
    const numStars = 80;
    for (let i = 0; i < numStars; i++) {
      this.stars.push({
        x: Math.random() * this.starsCanvas.width,
        y: Math.random() * this.starsCanvas.height,
        size: Math.random() * 2 + 1,
        opacity: Math.random() * 0.5 + 0.5,
        twinkleSpeed: Math.random() * 0.008 + 0.004,
        driftX: (Math.random() - 0.5) * 0.1,
        driftY: (Math.random() - 0.5) * 0.05,
        color: Math.random() > 0.3 ? 'white' : 'black'
      });
    }
  }

  updateProgress(newProgress) {
    this.targetProgress = Math.min(newProgress, 100);
  }

  drawStars() {
    this.starsCtx.clearRect(0, 0, this.starsCanvas.width, this.starsCanvas.height);
    
    this.stars.forEach(star => {
      star.x += star.driftX;
      star.y += star.driftY;
      
      if (star.x < 0) star.x = this.starsCanvas.width;
      if (star.x > this.starsCanvas.width) star.x = 0;
      if (star.y < 0) star.y = this.starsCanvas.height;
      if (star.y > this.starsCanvas.height) star.y = 0;
      
      star.opacity += star.twinkleSpeed;
      if (star.opacity > 1 || star.opacity < 0.2) {
        star.twinkleSpeed *= -1;
      }
      
      this.starsCtx.save();
      this.starsCtx.translate(star.x, star.y);
      
      this.starsCtx.fillStyle = star.color === 'white' 
        ? `rgba(255, 255, 255, ${star.opacity})` 
        : `rgba(0, 0, 0, ${star.opacity * 0.7})`;
      
      this.starsCtx.beginPath();
      this.starsCtx.moveTo(0, -star.size);
      this.starsCtx.lineTo(star.size * 0.3, 0);
      this.starsCtx.lineTo(0, star.size);
      this.starsCtx.lineTo(-star.size * 0.3, 0);
      this.starsCtx.closePath();
      this.starsCtx.fill();
      
      this.starsCtx.beginPath();
      this.starsCtx.moveTo(-star.size, 0);
      this.starsCtx.lineTo(-star.size * 0.3, star.size * 0.2);
      this.starsCtx.lineTo(star.size * 0.3, star.size * 0.2);
      this.starsCtx.lineTo(star.size, 0);
      this.starsCtx.lineTo(star.size * 0.3, -star.size * 0.2);
      this.starsCtx.lineTo(-star.size * 0.3, -star.size * 0.2);
      this.starsCtx.closePath();
      this.starsCtx.fill();
      
      if (star.opacity > 0.7) {
        const glowSize = star.size * 2.5;
        const gradient = this.starsCtx.createRadialGradient(0, 0, 0, 0, 0, glowSize);
        gradient.addColorStop(0, star.color === 'white' 
          ? `rgba(255, 255, 255, ${(star.opacity - 0.7) * 0.4})` 
          : `rgba(0, 0, 0, ${(star.opacity - 0.7) * 0.3})`);
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        this.starsCtx.fillStyle = gradient;
        this.starsCtx.beginPath();
        this.starsCtx.arc(0, 0, glowSize, 0, Math.PI * 2);
        this.starsCtx.fill();
      }
      
      this.starsCtx.restore();
    });
  }

  calculateWaveOffset(x, t, layerOffset = 0) {
    let offset = 0;
    const waveDamping = this.progress > 95 ? Math.max(0, (100 - this.progress) / 5) : 1;
    
    this.waves.forEach((wave, i) => {
      const chaosValue = Math.sin(t * 0.012 * (i + 1) + x * 0.006) * wave.chaos;
      const waveValue = Math.sin(x * wave.freq + t * wave.speed + wave.phase + layerOffset + chaosValue);
      offset += waveValue * wave.amp * waveDamping;
    });
    
    offset += Math.sin(t * 0.015 + x * 0.01) * 3.5 * waveDamping;
    offset += Math.cos(t * 0.019 + x * 0.014) * 2.5 * waveDamping;
    offset += Math.sin(t * 0.023 + x * 0.008) * 1.5 * waveDamping;
    
    return offset;
  }

  drawLiquid() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // ULTRA SMOOTH exponential smoothing - faster response
    const progressDiff = this.targetProgress - this.progress;
    
    if (Math.abs(progressDiff) > 0.01) {
      // Much faster smoothing - moves 25% closer each frame (was 5%)
      this.progress += progressDiff * 0.25;
    } else {
      // Snap to target when very close
      this.progress = this.targetProgress;
    }
    
    // Outer glow
    const glowPulse = Math.sin(this.time * 0.02) * 0.05 + 0.95;
    const glowGradient = this.ctx.createRadialGradient(
      this.centerX, this.centerY, this.radius - 10,
      this.centerX, this.centerY, this.radius + 25
    );
    glowGradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
    glowGradient.addColorStop(0.7, 'rgba(255, 255, 255, 0)');
    glowGradient.addColorStop(1, `rgba(255, 255, 255, ${0.2 * glowPulse})`);
    this.ctx.fillStyle = glowGradient;
    this.ctx.beginPath();
    this.ctx.arc(this.centerX, this.centerY, this.radius + 25, 0, Math.PI * 2);
    this.ctx.fill();
    
    // White background
    this.ctx.fillStyle = '#f8f9fa';
    this.ctx.beginPath();
    this.ctx.arc(this.centerX, this.centerY, this.radius, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Inner shadow
    const shadowGradient = this.ctx.createRadialGradient(
      this.centerX, this.centerY, this.radius - 20,
      this.centerX, this.centerY, this.radius
    );
    shadowGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    shadowGradient.addColorStop(1, 'rgba(0, 0, 0, 0.12)');
    this.ctx.fillStyle = shadowGradient;
    this.ctx.beginPath();
    this.ctx.arc(this.centerX, this.centerY, this.radius, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Calculate liquid level - driven by smooth progress
    const fillHeight = (this.progress / 100) * (this.radius * 2);
    const liquidBottom = this.centerY + this.radius;
    const liquidTop = liquidBottom - fillHeight;
    
    // Clip to circle
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.arc(this.centerX, this.centerY, this.radius - 2, 0, Math.PI * 2);
    this.ctx.clip();
    
    // Liquid gradient
    const liquidGradient = this.ctx.createLinearGradient(0, liquidBottom, 0, liquidTop);
    const gradientProgress = Math.min(this.progress / 100, 1);
    
    liquidGradient.addColorStop(0, `rgba(35, 35, 35, ${0.85 + gradientProgress * 0.15})`);
    liquidGradient.addColorStop(0.25, `rgba(25, 25, 25, ${0.9 + gradientProgress * 0.1})`);
    liquidGradient.addColorStop(0.5, `rgba(15, 15, 15, ${0.95 + gradientProgress * 0.05})`);
    liquidGradient.addColorStop(0.75, `rgba(8, 8, 8, ${0.98 + gradientProgress * 0.02})`);
    liquidGradient.addColorStop(1, `rgba(0, 0, 0, 1)`);
    
    const startX = this.centerX - this.radius;
    const resolution = 0.8;
    
    // Draw main liquid
    this.ctx.fillStyle = liquidGradient;
    this.ctx.beginPath();
    this.ctx.moveTo(startX, liquidBottom);
    this.ctx.lineTo(this.centerX + this.radius, liquidBottom);
    this.ctx.lineTo(this.centerX + this.radius, liquidTop);
    
    // Draw wavy top surface (ALWAYS - this is the key!)
    for (let x = this.centerX + this.radius; x >= startX; x -= resolution) {
      const waveOffset = this.calculateWaveOffset(x, this.time);
      const y = liquidTop + waveOffset;
      this.ctx.lineTo(x, y);
    }
    
    this.ctx.lineTo(startX, liquidBottom);
    this.ctx.closePath();
    this.ctx.fill();
    
    // Wave layers (only show if filling, hide when complete)
    if (this.progress > 3 && this.progress < 97) {
      // Layer 1
      this.ctx.fillStyle = 'rgba(200, 200, 200, 0.22)';
      this.ctx.beginPath();
      
      for (let x = this.centerX + this.radius; x >= startX; x -= resolution) {
        const waveOffset = this.calculateWaveOffset(x, this.time, 0.4) * 0.92;
        const y = liquidTop + waveOffset - 6;
        if (x === this.centerX + this.radius) this.ctx.moveTo(x, y);
        this.ctx.lineTo(x, y);
      }
      
      for (let x = startX; x <= this.centerX + this.radius; x += resolution) {
        const waveOffset = this.calculateWaveOffset(x, this.time, 0.4) * 0.92;
        const y = liquidTop + waveOffset + 10;
        this.ctx.lineTo(x, y);
      }
      
      this.ctx.closePath();
      this.ctx.fill();
    }
    
    if (this.progress > 8 && this.progress < 96) {
      // Layer 2
      this.ctx.fillStyle = 'rgba(140, 140, 140, 0.16)';
      this.ctx.beginPath();
      
      for (let x = this.centerX + this.radius; x >= startX; x -= resolution) {
        const waveOffset = this.calculateWaveOffset(x + 60, this.time * 1.25, 1.1) * 0.72;
        const y = liquidTop + waveOffset + 8;
        if (x === this.centerX + this.radius) this.ctx.moveTo(x, y);
        this.ctx.lineTo(x, y);
      }
      
      for (let x = startX; x <= this.centerX + this.radius; x += resolution) {
        const waveOffset = this.calculateWaveOffset(x + 60, this.time * 1.25, 1.1) * 0.72;
        const y = liquidTop + waveOffset + 24;
        this.ctx.lineTo(x, y);
      }
      
      this.ctx.closePath();
      this.ctx.fill();
    }
    
    if (this.progress > 15 && this.progress < 95) {
      // Layer 3
      this.ctx.fillStyle = 'rgba(80, 80, 80, 0.12)';
      this.ctx.beginPath();
      
      for (let x = this.centerX + this.radius; x >= startX; x -= resolution) {
        const waveOffset = this.calculateWaveOffset(x - 40, this.time * 0.82, 1.9) * 0.58;
        const y = liquidTop + waveOffset + 18;
        if (x === this.centerX + this.radius) this.ctx.moveTo(x, y);
        this.ctx.lineTo(x, y);
      }
      
      for (let x = startX; x <= this.centerX + this.radius; x += resolution) {
        const waveOffset = this.calculateWaveOffset(x - 40, this.time * 0.82, 1.9) * 0.58;
        const y = liquidTop + waveOffset + 32;
        this.ctx.lineTo(x, y);
      }
      
      this.ctx.closePath();
      this.ctx.fill();
    }
    
    if (this.progress > 10 && this.progress < 96) {
      // Layer 4
      this.ctx.fillStyle = 'rgba(220, 220, 220, 0.18)';
      this.ctx.beginPath();
      
      for (let x = this.centerX + this.radius; x >= startX; x -= resolution * 1.5) {
        const waveOffset = this.calculateWaveOffset(x + 90, this.time * 1.42, 0.7) * 0.88;
        const y = liquidTop + waveOffset - 4;
        if (x === this.centerX + this.radius) this.ctx.moveTo(x, y);
        this.ctx.lineTo(x, y);
      }
      
      for (let x = startX; x <= this.centerX + this.radius; x += resolution * 1.5) {
        const waveOffset = this.calculateWaveOffset(x + 90, this.time * 1.42, 0.7) * 0.88;
        const y = liquidTop + waveOffset + 7;
        this.ctx.lineTo(x, y);
      }
      
      this.ctx.closePath();
      this.ctx.fill();
    }
    
    // Floating reflections
    if (this.progress > 20 && this.progress < 94) {
      const reflection1X = this.centerX + Math.sin(this.time * 0.018) * 40;
      const reflection1Y = liquidTop + Math.cos(this.time * 0.022) * 12;
      
      const spotGradient1 = this.ctx.createRadialGradient(reflection1X, reflection1Y, 0, reflection1X, reflection1Y, 50);
      spotGradient1.addColorStop(0, 'rgba(220, 220, 220, 0.18)');
      spotGradient1.addColorStop(0.5, 'rgba(160, 160, 160, 0.08)');
      spotGradient1.addColorStop(1, 'rgba(100, 100, 100, 0)');
      
      this.ctx.fillStyle = spotGradient1;
      this.ctx.beginPath();
      this.ctx.arc(reflection1X, reflection1Y, 50, 0, Math.PI * 2);
      this.ctx.fill();
      
      const reflection2X = this.centerX - Math.sin(this.time * 0.024) * 45;
      const reflection2Y = liquidTop + Math.sin(this.time * 0.019) * 14;
      
      const spotGradient2 = this.ctx.createRadialGradient(reflection2X, reflection2Y, 0, reflection2X, reflection2Y, 40);
      spotGradient2.addColorStop(0, 'rgba(200, 200, 200, 0.14)');
      spotGradient2.addColorStop(0.6, 'rgba(140, 140, 140, 0.06)');
      spotGradient2.addColorStop(1, 'rgba(90, 90, 90, 0)');
      
      this.ctx.fillStyle = spotGradient2;
      this.ctx.beginPath();
      this.ctx.arc(reflection2X, reflection2Y, 40, 0, Math.PI * 2);
      this.ctx.fill();
    }
    
    this.ctx.restore();
    
    // Draw logo with liquid fill effect
    if (this.logoImg.complete) {
      const circleHeight = this.radius * 2;
      const logoAspectRatio = this.logoImg.width / this.logoImg.height;
      const logoHeight = circleHeight * 0.775;
      const logoWidth = logoHeight * logoAspectRatio;
      
      const logoX = this.centerX - logoWidth / 2;
      const logoY = this.centerY - logoHeight / 2;
      
      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.arc(this.centerX, this.centerY, this.radius - 2, 0, Math.PI * 2);
      this.ctx.clip();
      
      // Unfilled part (black)
      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.rect(0, 0, this.canvas.width, liquidTop + 30);
      this.ctx.clip();
      this.ctx.drawImage(this.logoImg, logoX, logoY, logoWidth, logoHeight);
      this.ctx.restore();
      
      // Filled part (white)
      if (this.progress > 0) {
        this.ctx.save();
        this.ctx.beginPath();
        
        this.ctx.moveTo(startX, liquidBottom);
        this.ctx.lineTo(this.centerX + this.radius, liquidBottom);
        this.ctx.lineTo(this.centerX + this.radius, liquidTop);
        
        for (let x = this.centerX + this.radius; x >= startX; x -= resolution) {
          const waveOffset = this.calculateWaveOffset(x, this.time);
          const y = liquidTop + waveOffset;
          this.ctx.lineTo(x, y);
        }
        
        this.ctx.lineTo(startX, liquidBottom);
        this.ctx.closePath();
        this.ctx.clip();
        
        this.ctx.filter = 'invert(1) brightness(2)';
        this.ctx.drawImage(this.logoImg, logoX, logoY, logoWidth, logoHeight);
        this.ctx.filter = 'none';
        
        this.ctx.restore();
      }
      
      this.ctx.restore();
    }
    
    // Border
    this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.arc(this.centerX, this.centerY, this.radius, 0, Math.PI * 2);
    this.ctx.stroke();
  }

  animate() {
    this.time += 1;
    
    this.drawStars();
    this.drawLiquid();
    
    this.animationFrame = requestAnimationFrame(() => this.animate());
  }

complete() {
    if (this.transitionStarted) return;
    this.transitionStarted = true;
    
    // Wait for visual progress to catch up to 100%
    const waitForFullFill = () => {
      if (this.progress >= 98) {
        setTimeout(() => {
          this.startTransition();
        }, 400); // Reduced from 800ms to 400ms
      } else {
        // Check again next frame
        requestAnimationFrame(waitForFullFill);
      }
    };
    
    waitForFullFill();
  }

startTransition() {
    const loadingScreen = document.getElementById('loadingScreen');
    const overlay = document.getElementById('transitionOverlay');
    
    // Activate overlay
    overlay.classList.add('active');
    
    // Fade out loading screen faster
    setTimeout(() => {
      loadingScreen.classList.add('hidden');
    }, 200); // Reduced from 400ms
    
    // Remove completely after transition
    setTimeout(() => {
      cancelAnimationFrame(this.animationFrame);
      loadingScreen.remove();
      overlay.remove();
    }, 1200); // Reduced from 2000ms
  }
}

// Initialize on page load
window.loadingScreen = new LoadingScreen();