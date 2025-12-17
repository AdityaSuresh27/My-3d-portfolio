// tv-screen.js
class TVScreen {
  constructor(screenMesh, THREE, renderer) {
    this.screenMesh = screenMesh;
    this.THREE = THREE;
    this.renderer = renderer;
    this.isActive = false;
    this.canvas = null;
    this.ctx = null;
    this.texture = null;
    
    // Console OS state
    this.selectedGame = 0;
this.games = [
  { name: 'SNAKE GAME', description: 'Classic snake arcade', icon: '🐍' },
  { name: 'PONG GAME', description: 'Retro paddle challenge', icon: '🏓' },
  { name: 'TETRIS GAME', description: 'Block stacking puzzle', icon: '🟦' },
  { name: 'SPACE INVADERS', description: 'Alien shoot-em-up', icon: '👾' }
];
    
    this.animationFrame = 0;
    this.glitchEffect = 0;

    // Audio system
    this.backgroundMusic = null;
    this.clickSound = null;
    this.setupAudio();
    
    this.setupCanvas();
    this.setupControls();
  }
  
setupCanvas() {
  this.canvas = document.createElement('canvas');
  this.canvas.width = 1024;
  this.canvas.height = 768;
  this.ctx = this.canvas.getContext('2d', {
    alpha: false,
    willReadFrequently: false
  });
  
  // Draw bright test pattern
  this.ctx.fillStyle = '#00ff00';
  this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  this.ctx.fillStyle = '#000000';
  this.ctx.font = 'bold 80px Arial';
  this.ctx.textAlign = 'center';
  this.ctx.textBaseline = 'middle';
  this.ctx.fillText('TV SCREEN TEST', this.canvas.width/2, this.canvas.height/2);
  
  this.texture = new this.THREE.CanvasTexture(this.canvas);
  this.texture.minFilter = this.THREE.LinearFilter;
  this.texture.magFilter = this.THREE.LinearFilter;
  this.texture.generateMipmaps = false;
  this.texture.needsUpdate = true;
  
  console.log('📺 Canvas created:', this.canvas.width, 'x', this.canvas.height);
  console.log('📺 Test pattern drawn');
}
  
setupAudio() {
  // Background music
  this.backgroundMusic = new Audio('./assets/audio/game_music.mp3');
  this.backgroundMusic.loop = true;
  this.backgroundMusic.volume = 0.4;
  
  // Click sound
  this.clickSound = new Audio('./assets/audio/click.mp3');
  this.clickSound.volume = 0.6;
  
  // Beep sound (for game actions)
  this.beepSound = new Audio('./assets/audio/beep.mp3');
  this.beepSound.volume = 0.5;
  
  console.log('🔊 TV Audio system initialized');
}

playClickSound() {
  if (this.clickSound) {
    this.clickSound.currentTime = 0;
    this.clickSound.play().catch(err => console.warn('Click sound failed:', err));
  }
}

playBeepSound() {
  if (this.beepSound) {
    // Create a new audio instance for overlapping sounds
    const beep = this.beepSound.cloneNode();
    beep.volume = 0.5;
    beep.play().catch(err => console.warn('Beep sound failed:', err));
  }
}

playClickSound() {
  if (this.clickSound) {
    this.clickSound.currentTime = 0;
    this.clickSound.play().catch(err => console.warn('Click sound failed:', err));
  }
}

setupControls() {
  this.scrollOffset = 0;
  this.targetScroll = 0;
  
  this.keyHandler = (e) => {
    if (!this.isActive) return;
    
    // LEFT/A = Previous game
    if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') {
      e.preventDefault();
      this.selectedGame = (this.selectedGame - 1 + this.games.length) % this.games.length;
      this.targetScroll = this.selectedGame;
      this.playBeep();
    } 
    // RIGHT/D = Next game
    else if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') {
      e.preventDefault();
      this.selectedGame = (this.selectedGame + 1) % this.games.length;
      this.targetScroll = this.selectedGame;
      this.playBeep();
    } 
    // ENTER = Launch game
    else if (e.key === 'Enter') {
      this.playClickSound(); // Play click sound
      this.launchGame(this.selectedGame);
    }
  };
  
  window.addEventListener('keydown', this.keyHandler);
}

  playBeep() {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'square';
    
    gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
    
    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 0.1);
  }
  
launchGame(gameIndex) {
  console.log('🎮 Launching game:', this.games[gameIndex].name);
  
  // Stop background music when entering a game
  if (this.backgroundMusic) {
    this.backgroundMusic.pause();
  }
  
  // Play launch sound
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  
  oscillator.frequency.setValueAtTime(400, audioCtx.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.2);
  oscillator.type = 'sawtooth';
  
  gainNode.gain.setValueAtTime(0.4, audioCtx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
  
  oscillator.start(audioCtx.currentTime);
  oscillator.stop(audioCtx.currentTime + 0.3);
  
  // Launch the actual game
  if (gameIndex === 0) {
    this.startSnakeGame();
  } else if (gameIndex === 1) {
    this.startPongGame();
  } else if (gameIndex === 2) {
    this.startTetrisGame();
  } else if (gameIndex === 3) {
    this.startSpaceInvadersGame();
  }
}
  
activate() {
  this.isActive = true;
  
  if (this.screenMesh && this.screenMesh.material) {
    // Store old material
    const oldMaterial = this.screenMesh.material;
    
    // Create new emissive material for bright display
    this.screenMesh.material = new this.THREE.MeshBasicMaterial({
      map: this.texture,
      side: this.THREE.DoubleSide,
      toneMapped: false,
      transparent: false,
      depthWrite: true,
      depthTest: true
    });
    
    this.screenMesh.userData.oldMaterial = oldMaterial;
    this.screenMesh.visible = true;
    this.screenMesh.renderOrder = 0;
    
    // Draw console OS immediately
    this.drawConsoleOS();
    this.texture.needsUpdate = true;
    
    console.log('📺 TV Screen activated - Console OS ready');
    console.log('Material type:', this.screenMesh.material.type);
    console.log('Texture size:', this.texture.image.width, 'x', this.texture.image.height);
    console.log('Texture needs update:', this.texture.needsUpdate);
  } else {
    console.error('❌ TV screen mesh or material missing!');
  }
  // Start background music
if (this.backgroundMusic) {
  this.backgroundMusic.currentTime = 0;
  this.backgroundMusic.play().catch(err => {
    console.warn('Background music autoplay blocked:', err);
  });
}
}
  
deactivate() {
  this.isActive = false;
  
  if (this.screenMesh && this.screenMesh.userData.oldMaterial) {
    // Restore original material
    const currentMaterial = this.screenMesh.material;
    this.screenMesh.material = this.screenMesh.userData.oldMaterial;
    
    // Dispose of temp material
    if (currentMaterial && currentMaterial.dispose) {
      currentMaterial.dispose();
    }
    
    delete this.screenMesh.userData.oldMaterial;
  }
  
  console.log('📺 TV Screen deactivated');
  // Stop background music
if (this.backgroundMusic) {
  this.backgroundMusic.pause();
  this.backgroundMusic.currentTime = 0;
}
}
  
update() {
  if (!this.isActive) return;
  
  this.animationFrame++;
  this.glitchEffect = Math.sin(this.animationFrame * 0.05) * 2;
  
  // Smoother scroll animation with easing
  this.scrollOffset += (this.targetScroll - this.scrollOffset) * 0.25;
  
  // Check if in game mode
  if (this.currentGame) {
if (this.currentGame === 'snake') this.updateSnakeGame();
else if (this.currentGame === 'pong') this.updatePongGame();
else if (this.currentGame === 'tetris') this.updateTetrisGame();
else if (this.currentGame === 'invaders') this.updateSpaceInvadersGame();
  } else {
    this.drawConsoleOS();
  }
  
  // Force texture update
  this.texture.needsUpdate = true;
  
  // Force material update
  if (this.screenMesh && this.screenMesh.material) {
    this.screenMesh.material.needsUpdate = true;
  }
}

drawConsoleOS() {
  const ctx = this.ctx;
  const w = this.canvas.width;
  const h = this.canvas.height;
  
  // Clear and fill with solid dark background first
  ctx.fillStyle = '#0a0a1a';
  ctx.fillRect(0, 0, w, h);
  
  // Brighter gradient overlay
  const gradient = ctx.createLinearGradient(0, 0, 0, h);
  gradient.addColorStop(0, 'rgba(10, 10, 30, 0.9)');
  gradient.addColorStop(0.5, 'rgba(15, 15, 40, 0.9)');
  gradient.addColorStop(1, 'rgba(10, 10, 30, 0.9)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);
  
  // Animated grid background
  ctx.strokeStyle = 'rgba(0, 255, 136, 0.05)';
  ctx.lineWidth = 1;
  const gridSize = 40;
  const offset = (this.animationFrame * 0.5) % gridSize;
  for (let i = -gridSize; i < w + gridSize; i += gridSize) {
    ctx.beginPath();
    ctx.moveTo(i + offset, 0);
    ctx.lineTo(i + offset, h);
    ctx.stroke();
  }
  for (let i = -gridSize; i < h + gridSize; i += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, i + offset);
    ctx.lineTo(w, i + offset);
    ctx.stroke();
  }
    
  // Scanlines
  ctx.fillStyle = 'rgba(0, 255, 100, 0.02)';
  for (let i = 0; i < h; i += 4) {
    ctx.fillRect(0, i, w, 2);
  }
  
  // Vignette effect
  const vignette = ctx.createRadialGradient(w/2, h/2, 100, w/2, h/2, w * 0.8);
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(0,0,0,0.6)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, w, h);
  
  // Animated corner decorations
  const cornerPulse = 0.5 + Math.sin(this.animationFrame * 0.05) * 0.5;
  ctx.strokeStyle = `rgba(0, 255, 136, ${cornerPulse * 0.6})`;
  ctx.lineWidth = 3;
  
  // Top-left corner
  ctx.beginPath();
  ctx.moveTo(40, 80);
  ctx.lineTo(40, 40);
  ctx.lineTo(80, 40);
  ctx.stroke();
  
  // Top-right corner
  ctx.beginPath();
  ctx.moveTo(w - 40, 80);
  ctx.lineTo(w - 40, 40);
  ctx.lineTo(w - 80, 40);
  ctx.stroke();
  
  // Bottom-left corner
  ctx.beginPath();
  ctx.moveTo(40, h - 80);
  ctx.lineTo(40, h - 40);
  ctx.lineTo(80, h - 40);
  ctx.stroke();
  
  // Bottom-right corner
  ctx.beginPath();
  ctx.moveTo(w - 40, h - 80);
  ctx.lineTo(w - 40, h - 40);
  ctx.lineTo(w - 80, h - 40);
  ctx.stroke();
  
  // Header with enhanced styling - PROPER POSITION
  ctx.fillStyle = '#00ff88';
  ctx.font = 'bold 48px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  const headerY = 120 + Math.sin(this.animationFrame * 0.05) * 3;
  
  // Header shadow effect
  ctx.shadowColor = '#00ff88';
  ctx.shadowBlur = 20;
  ctx.fillText('◢◤ RETRO ARCADE ◥◣', w/2, headerY);
  ctx.shadowBlur = 0;
  
  // Subtitle with glitch - PROPER POSITION
  ctx.font = '16px "Courier New", monospace';
  ctx.fillStyle = '#00ddff';
  ctx.textBaseline = 'alphabetic';
  const glitchOffset = Math.random() < 0.05 ? Math.random() * 4 - 2 : 0;
  ctx.fillText('SELECT GAME [A/D or ←/→] • LAUNCH [ENTER]', w/2 + glitchOffset, 165);
  
  // Decorative line under subtitle - PROPER POSITION
  const lineWidth = 300;
  ctx.strokeStyle = '#00ddff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(w/2 - lineWidth/2, 180);
  ctx.lineTo(w/2 + lineWidth/2, 180);
  ctx.stroke();
  
  // HORIZONTAL SCROLL LAYOUT - CENTERED POSITION
  const cardWidth = 280;
  const cardHeight = 200;
  const spacing = 80;
  const startX = w / 2;
  const centerY = h / 2 + 80;
  
  // Calculate scroll offset for smooth infinite scrolling
  const scrollAmount = this.scrollOffset * (cardWidth + spacing);
  
// Draw cards horizontally with proper infinite scroll
this.games.forEach((game, index) => {
  // Calculate base position
  const baseX = index * (cardWidth + spacing);
  const totalWidth = this.games.length * (cardWidth + spacing);
  
  // Normalize scroll to handle wrapping - wrap scrollAmount first
  const wrappedScroll = ((scrollAmount % totalWidth) + totalWidth) % totalWidth;
  
  // Calculate position with wrapping
  let x = startX + baseX - wrappedScroll;
  
  // Draw multiple instances for seamless wrapping
  const positions = [x];
  if (x < -cardWidth) positions.push(x + totalWidth);
  if (x > w + cardWidth) positions.push(x - totalWidth);
  // Always draw adjacent copies for smooth wrapping
  positions.push(x - totalWidth);
  positions.push(x + totalWidth);
  
  positions.forEach(xPos => {
    // Skip if completely off-screen
    if (xPos < -cardWidth * 2 || xPos > w + cardWidth * 2) return;
    
    const y = centerY - cardHeight / 2;
    const isSelected = index === this.selectedGame;
    
    // Calculate distance from center for scaling/fading effect
    const distFromCenter = Math.abs(xPos - w/2);
    const maxDist = cardWidth + spacing;
    const scale = Math.max(0.7, 1 - (distFromCenter / (maxDist * 2)));
    const opacity = Math.max(0.3, 1 - (distFromCenter / (maxDist * 1.5)));
    
    ctx.save();
    
    // Apply scaling transform
    const scaledWidth = cardWidth * scale;
    const scaledHeight = cardHeight * scale;
    const scaledX = xPos - scaledWidth / 2;
    const scaledY = y + (cardHeight - scaledHeight) / 2;
    
    // Card glow effect for selected
    if (isSelected && Math.abs(distFromCenter) < 50) {
      ctx.shadowColor = '#00ff88';
      ctx.shadowBlur = 40 + Math.sin(this.animationFrame * 0.1) * 15;
    } else {
      ctx.shadowBlur = 0;
    }
    
    // Card background with opacity
    ctx.globalAlpha = opacity;
    ctx.fillStyle = isSelected && Math.abs(distFromCenter) < 50 
      ? 'rgba(0, 255, 136, 0.15)' 
      : 'rgba(255, 255, 255, 0.05)';
    ctx.fillRect(scaledX, scaledY, scaledWidth, scaledHeight);
    
    // Card border
    ctx.strokeStyle = isSelected && Math.abs(distFromCenter) < 50 ? '#00ff88' : '#00ddff';
    ctx.lineWidth = isSelected && Math.abs(distFromCenter) < 50 ? 4 : 2;
    ctx.strokeRect(scaledX, scaledY, scaledWidth, scaledHeight);
    
    // Selection indicator (arrows on sides)
    if (isSelected && Math.abs(distFromCenter) < 50) {
      ctx.fillStyle = '#00ff88';
      ctx.font = 'bold 40px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('◀', scaledX - 50, y + cardHeight/2 + 10);
      ctx.fillText('▶', scaledX + scaledWidth + 50, y + cardHeight/2 + 10);
    }
    
    // Game icon - centered in card
    ctx.font = `bold ${Math.floor(50 * scale)}px "Courier New", monospace`;
    ctx.fillStyle = isSelected && Math.abs(distFromCenter) < 50 ? '#00ff88' : '#00ddff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(game.icon, xPos, scaledY + scaledHeight * 0.35);
    
    // Game name - centered in card
    ctx.font = `bold ${Math.floor(20 * scale)}px "Courier New", monospace`;
    ctx.fillStyle = isSelected && Math.abs(distFromCenter) < 50 ? '#ffffff' : '#aaaaaa';
    ctx.fillText(game.name, xPos, scaledY + scaledHeight * 0.62);
    
    // Game description - centered in card
    ctx.font = `${Math.floor(14 * scale)}px "Courier New", monospace`;
    ctx.fillStyle = isSelected && Math.abs(distFromCenter) < 50 ? '#00ddff' : '#666666';
    ctx.fillText(game.description, xPos, scaledY + scaledHeight * 0.78);

    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1.0;
    ctx.restore();
  });
});
  
  // Footer hint
  const pulse = 0.5 + Math.sin(this.animationFrame * 0.1) * 0.5;
  ctx.fillStyle = `rgba(0, 221, 255, ${pulse})`;
  ctx.font = '18px "Courier New", monospace';
  ctx.textAlign = 'center';
}
  
dispose() {
  window.removeEventListener('keydown', this.keyHandler);
  if (this.gameKeyHandler) {
    window.removeEventListener('keydown', this.gameKeyHandler);
  }
  if (this.gameKeyUpHandler) {
    window.removeEventListener('keyup', this.gameKeyUpHandler);
  }
  
  // Stop and cleanup audio
  if (this.backgroundMusic) {
    this.backgroundMusic.pause();
    this.backgroundMusic = null;
  }
  if (this.clickSound) {
    this.clickSound = null;
  }
  
  if (this.texture) {
    this.texture.dispose();
  }
}

// ==================== SNAKE GAME ====================
  startSnakeGame() {
    this.currentGame = 'snake';
    this.snake = {
      body: [{x: 10, y: 10}],
      dir: {x: 1, y: 0},
      nextDir: {x: 1, y: 0},
      food: {x: 15, y: 15},
      score: 0,
      gameOver: false,
      speed: 8 // frames per move
    };
    this.snakeCounter = 0;
    
    this.gameKeyHandler = (e) => {
      if (e.key === 'w' || e.key === 'ArrowUp') {
        if (this.snake.dir.y === 0) this.snake.nextDir = {x: 0, y: -1};
      } else if (e.key === 's' || e.key === 'ArrowDown') {
        if (this.snake.dir.y === 0) this.snake.nextDir = {x: 0, y: 1};
      } else if (e.key === 'a' || e.key === 'ArrowLeft') {
        if (this.snake.dir.x === 0) this.snake.nextDir = {x: -1, y: 0};
      } else if (e.key === 'd' || e.key === 'ArrowRight') {
        if (this.snake.dir.x === 0) this.snake.nextDir = {x: 1, y: 0};
      } else if (e.key === 'Escape') {
        this.exitGame();
      }
    };
    
    window.removeEventListener('keydown', this.keyHandler);
    window.addEventListener('keydown', this.gameKeyHandler);
  }
  
  updateSnakeGame() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const gridSize = 25;
    const cellSize = Math.min(w, h) / gridSize;
    const offsetX = (w - gridSize * cellSize) / 2;
    const offsetY = (h - gridSize * cellSize) / 2;
    
    // Background
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, w, h);
    
    // Game logic
    this.snakeCounter++;
    if (this.snakeCounter >= this.snake.speed && !this.snake.gameOver) {
      this.snakeCounter = 0;
      this.snake.dir = {...this.snake.nextDir};
      
      const head = {...this.snake.body[0]};
      head.x += this.snake.dir.x;
      head.y += this.snake.dir.y;
      
      // Check collisions
      if (head.x < 0 || head.x >= gridSize || head.y < 0 || head.y >= gridSize ||
          this.snake.body.some(s => s.x === head.x && s.y === head.y)) {
        this.snake.gameOver = true;
      } else {
        this.snake.body.unshift(head);
        
        // Check food
if (head.x === this.snake.food.x && head.y === this.snake.food.y) {
  this.snake.score++;
  this.playBeepSound(); // Play beep when eating food
  this.snake.food = {
    x: Math.floor(Math.random() * gridSize),
    y: Math.floor(Math.random() * gridSize)
  };
} else {
  this.snake.body.pop();
}
      }
    }
    
    // Draw grid
    ctx.strokeStyle = 'rgba(0, 255, 136, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= gridSize; i++) {
      ctx.beginPath();
      ctx.moveTo(offsetX + i * cellSize, offsetY);
      ctx.lineTo(offsetX + i * cellSize, offsetY + gridSize * cellSize);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(offsetX, offsetY + i * cellSize);
      ctx.lineTo(offsetX + gridSize * cellSize, offsetY + i * cellSize);
      ctx.stroke();
    }
    
    // Draw food
    ctx.fillStyle = '#ff0088';
    ctx.fillRect(
      offsetX + this.snake.food.x * cellSize + 2,
      offsetY + this.snake.food.y * cellSize + 2,
      cellSize - 4, cellSize - 4
    );
    
    // Draw snake
    this.snake.body.forEach((segment, i) => {
      ctx.fillStyle = i === 0 ? '#00ff88' : '#00ddff';
      ctx.fillRect(
        offsetX + segment.x * cellSize + 2,
        offsetY + segment.y * cellSize + 2,
        cellSize - 4, cellSize - 4
      );
    });
    
    // Score
    ctx.fillStyle = '#00ff88';
    ctx.font = 'bold 32px "Courier New"';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${this.snake.score}`, 40, 60);
    
    // Game Over
    if (this.snake.gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#ff0088';
      ctx.font = 'bold 64px "Courier New"';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', w/2, h/2 - 40);
      ctx.font = '32px "Courier New"';
      ctx.fillStyle = '#00ddff';
      ctx.fillText(`Final Score: ${this.snake.score}`, w/2, h/2 + 20);
      ctx.font = '20px "Courier New"';
      ctx.fillText('Press ESC to return', w/2, h/2 + 80);
    } else {
      ctx.fillStyle = '#00ddff';
      ctx.font = '16px "Courier New"';
      ctx.textAlign = 'center';
      ctx.fillText('WASD/Arrows to move • ESC to return to menu', w/2, h - 30);
    }
  }
  
  // ==================== PONG GAME ====================
  startPongGame() {
    this.currentGame = 'pong';
    this.pong = {
  paddleHeight: 100,
  paddleWidth: 15,
  player: { y: 300, score: 0, moveUp: false, moveDown: false },
  ai: { y: 300, score: 0 },
  ball: { x: 512, y: 384, dx: 5, dy: 4 },
  gameOver: false,
  paddleSpeed: 8
};
    
    this.gameKeyHandler = (e) => {
  if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') {
    e.preventDefault();
    this.pong.player.moveUp = true;
  } else if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') {
    e.preventDefault();
    this.pong.player.moveDown = true;
  } else if (e.key === 'Escape') {
    this.exitGame();
  }
};

this.gameKeyUpHandler = (e) => {
  if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') {
    this.pong.player.moveUp = false;
  } else if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') {
    this.pong.player.moveDown = false;
  }
};

window.removeEventListener('keydown', this.keyHandler);
window.addEventListener('keydown', this.gameKeyHandler);
window.addEventListener('keyup', this.gameKeyUpHandler);
  }
  
updatePongGame() {
  const ctx = this.ctx;
  const w = this.canvas.width;
  const h = this.canvas.height;
  const p = this.pong;
  
  // Background
  ctx.fillStyle = '#0a0a1a';
  ctx.fillRect(0, 0, w, h);
  
  // Animated background
  ctx.strokeStyle = 'rgba(0, 255, 136, 0.03)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 10; i++) {
    const y = (i * 80 + this.animationFrame) % h;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
  
  // Center line
  ctx.strokeStyle = 'rgba(0, 255, 136, 0.3)';
  ctx.lineWidth = 4;
  ctx.setLineDash([20, 15]);
  ctx.beginPath();
  ctx.moveTo(w/2, 0);
  ctx.lineTo(w/2, h);
  ctx.stroke();
  ctx.setLineDash([]);
  
  // Smooth player movement
  if (p.player.moveUp) {
    p.player.y = Math.max(0, p.player.y - p.paddleSpeed);
  }
  if (p.player.moveDown) {
    p.player.y = Math.min(h - p.paddleHeight, p.player.y + p.paddleSpeed);
  }
  
  // Update ball
  if (!p.gameOver) {
    p.ball.x += p.ball.dx;
    p.ball.y += p.ball.dy;
    
    // Ball collision with top/bottom
    if (p.ball.y <= 0 || p.ball.y >= h) {
      p.ball.dy *= -1;
      this.playBeepSound(); // Beep on wall hit
    }
    
    // Ball collision with player paddle
    if (p.ball.x <= 50 && 
        p.ball.y >= p.player.y && 
        p.ball.y <= p.player.y + p.paddleHeight &&
        p.ball.dx < 0) {
      p.ball.dx = Math.abs(p.ball.dx) * 1.05; // Slight speed increase
      const hitPos = (p.ball.y - p.player.y) / p.paddleHeight - 0.5;
      p.ball.dy = hitPos * 8;
      this.playBeepSound(); // Beep on paddle hit
    }
    
    // Ball collision with AI paddle
    if (p.ball.x >= w - 50 && 
        p.ball.y >= p.ai.y && 
        p.ball.y <= p.ai.y + p.paddleHeight &&
        p.ball.dx > 0) {
      p.ball.dx = -Math.abs(p.ball.dx) * 1.05; // Slight speed increase
      const hitPos = (p.ball.y - p.ai.y) / p.paddleHeight - 0.5;
      p.ball.dy = hitPos * 8;
      this.playBeepSound(); // Beep on paddle hit
    }
    
    // Score
    if (p.ball.x < 0) {
      p.ai.score++;
      p.ball = { x: w/2, y: h/2, dx: -5, dy: 4 };
    }
    if (p.ball.x > w) {
      p.player.score++;
      p.ball = { x: w/2, y: h/2, dx: 5, dy: 4 };
    }
    
    // Improved AI movement with prediction
    const predictedY = p.ball.y + (p.ball.dy * ((w - p.ball.x) / Math.abs(p.ball.dx)));
    const targetY = Math.max(0, Math.min(h - p.paddleHeight, predictedY - p.paddleHeight / 2));
    const aiSpeed = 3.75; // Balanced AI speed
    
    // AI moves towards predicted position regardless of ball direction
    const centerDiff = (targetY + p.paddleHeight/2) - (p.ai.y + p.paddleHeight/2);
    
    if (Math.abs(centerDiff) > 2) { // Dead zone to prevent jittering
      if (centerDiff > 0) {
        p.ai.y = Math.min(h - p.paddleHeight, p.ai.y + aiSpeed);
      } else {
        p.ai.y = Math.max(0, p.ai.y - aiSpeed);
      }
    }
    
    // Check win
    if (p.player.score >= 5 || p.ai.score >= 5) {
      p.gameOver = true;
    }
  }
  
  // Draw paddles with glow
  ctx.shadowBlur = 15;
  ctx.shadowColor = '#00ff88';
  ctx.fillStyle = '#00ff88';
  ctx.fillRect(30, p.player.y, p.paddleWidth, p.paddleHeight);
  
  ctx.shadowColor = '#ff0088';
  ctx.fillStyle = '#ff0088';
  ctx.fillRect(w - 30 - p.paddleWidth, p.ai.y, p.paddleWidth, p.paddleHeight);
  ctx.shadowBlur = 0;
  
  // Draw ball with trail effect
  ctx.shadowBlur = 20;
  ctx.shadowColor = '#00ddff';
  ctx.fillStyle = '#00ddff';
  ctx.beginPath();
  ctx.arc(p.ball.x, p.ball.y, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  
  // Scores with glow
  ctx.shadowBlur = 10;
  ctx.fillStyle = '#00ff88';
  ctx.font = 'bold 48px "Courier New"';
  ctx.textAlign = 'center';
  ctx.shadowColor = '#00ff88';
  ctx.fillText(p.player.score, w/4, 80);
  
  ctx.shadowColor = '#ff0088';
  ctx.fillStyle = '#ff0088';
  ctx.fillText(p.ai.score, 3*w/4, 80);
  ctx.shadowBlur = 0;
  
  // Game Over
  if (p.gameOver) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, w, h);
    const winner = p.player.score > p.ai.score ? 'YOU WIN!' : 'AI WINS!';
    ctx.fillStyle = p.player.score > p.ai.score ? '#00ff88' : '#ff0088';
    ctx.font = 'bold 64px "Courier New"';
    ctx.fillText(winner, w/2, h/2);
    ctx.font = '20px "Courier New"';
    ctx.fillStyle = '#00ddff';
    ctx.fillText('Press ESC to return', w/2, h/2 + 60);
  } else {
    ctx.fillStyle = '#00ddff';
    ctx.font = '16px "Courier New"';
    ctx.fillText('W/S to move • First to 5 wins • ESC to return to menu', w/2, h - 30);
  }
}
  
  // ==================== TETRIS GAME ====================
  startTetrisGame() {
    this.currentGame = 'tetris';
    this.tetris = {
      grid: Array(20).fill(null).map(() => Array(10).fill(0)),
      current: null,
      score: 0,
      gameOver: false,
      dropCounter: 0,
      dropInterval: 30
    };
    this.spawnTetromino();
    
    this.gameKeyHandler = (e) => {
      if (e.key === 'a' || e.key === 'ArrowLeft') {
        this.moveTetromino(-1, 0);
      } else if (e.key === 'd' || e.key === 'ArrowRight') {
        this.moveTetromino(1, 0);
      } else if (e.key === 's' || e.key === 'ArrowDown') {
        this.moveTetromino(0, 1);
      } else if (e.key === 'w' || e.key === 'ArrowUp' || e.key === ' ') {
        this.rotateTetromino();
      } else if (e.key === 'Escape') {
        this.exitGame();
      }
    };
    
    window.removeEventListener('keydown', this.keyHandler);
    window.addEventListener('keydown', this.gameKeyHandler);
  }
  
  spawnTetromino() {
    const shapes = [
      [[1,1,1,1]], // I
      [[1,1],[1,1]], // O
      [[1,1,1],[0,1,0]], // T
      [[1,1,0],[0,1,1]], // S
      [[0,1,1],[1,1,0]], // Z
      [[1,1,1],[1,0,0]], // L
      [[1,1,1],[0,0,1]]  // J
    ];
    const colors = [1, 2, 3, 4, 5, 6, 7];
    const shape = shapes[Math.floor(Math.random() * shapes.length)];
    this.tetris.current = {
      shape: shape,
      x: 3,
      y: 0,
      color: colors[Math.floor(Math.random() * colors.length)]
    };
  }
  
  moveTetromino(dx, dy) {
    if (this.tetris.gameOver) return;
    
    this.tetris.current.x += dx;
    this.tetris.current.y += dy;
    
    if (this.checkCollision()) {
      this.tetris.current.x -= dx;
      this.tetris.current.y -= dy;
      
      if (dy > 0) {
        this.lockTetromino();
      }
    }
  }
  
  rotateTetromino() {
    if (this.tetris.gameOver) return;
    
    const shape = this.tetris.current.shape;
    const rotated = shape[0].map((_, i) => shape.map(row => row[i]).reverse());
    const oldShape = this.tetris.current.shape;
    this.tetris.current.shape = rotated;
    
    if (this.checkCollision()) {
      this.tetris.current.shape = oldShape;
    }
  }
  
  checkCollision() {
    const {shape, x, y} = this.tetris.current;
    for (let row = 0; row < shape.length; row++) {
      for (let col = 0; col < shape[row].length; col++) {
        if (shape[row][col]) {
          const newY = y + row;
          const newX = x + col;
          if (newX < 0 || newX >= 10 || newY >= 20) return true;
          if (newY >= 0 && this.tetris.grid[newY][newX]) return true;
        }
      }
    }
    return false;
  }
  
  lockTetromino() {
    const {shape, x, y, color} = this.tetris.current;
    for (let row = 0; row < shape.length; row++) {
      for (let col = 0; col < shape[row].length; col++) {
        if (shape[row][col]) {
          const newY = y + row;
          const newX = x + col;
          if (newY < 0) {
            this.tetris.gameOver = true;
            return;
          }
          this.tetris.grid[newY][newX] = color;
        }
      }
    }
    
    this.clearLines();
    this.spawnTetromino();
    
    if (this.checkCollision()) {
      this.tetris.gameOver = true;
    }
  }
  
  clearLines() {
    for (let row = 19; row >= 0; row--) {
      if (this.tetris.grid[row].every(cell => cell !== 0)) {
        this.tetris.grid.splice(row, 1);
        this.tetris.grid.unshift(Array(10).fill(0));
        this.tetris.score += 100;
        row++;
      }
    }
  }
  
  updateTetrisGame() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const cellSize = 30;
    const offsetX = (w - 10 * cellSize) / 2;
    const offsetY = (h - 20 * cellSize) / 2;
    
    // Background
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, w, h);
    
    // Game logic
    if (!this.tetris.gameOver) {
      this.tetris.dropCounter++;
      if (this.tetris.dropCounter >= this.tetris.dropInterval) {
        this.moveTetromino(0, 1);
        this.tetris.dropCounter = 0;
      }
    }
    
    // Draw grid
    ctx.strokeStyle = 'rgba(0, 255, 136, 0.2)';
    ctx.lineWidth = 1;
    for (let row = 0; row <= 20; row++) {
      ctx.beginPath();
      ctx.moveTo(offsetX, offsetY + row * cellSize);
      ctx.lineTo(offsetX + 10 * cellSize, offsetY + row * cellSize);
      ctx.stroke();
    }
    for (let col = 0; col <= 10; col++) {
      ctx.beginPath();
      ctx.moveTo(offsetX + col * cellSize, offsetY);
      ctx.lineTo(offsetX + col * cellSize, offsetY + 20 * cellSize);
      ctx.stroke();
    }
    
    // Draw locked blocks
    const colors = ['#000', '#00ff88', '#00ddff', '#ff0088', '#ffaa00', '#aa00ff', '#ff00aa', '#aaff00'];
    for (let row = 0; row < 20; row++) {
      for (let col = 0; col < 10; col++) {
        if (this.tetris.grid[row][col]) {
          ctx.fillStyle = colors[this.tetris.grid[row][col]];
          ctx.fillRect(offsetX + col * cellSize + 1, offsetY + row * cellSize + 1, cellSize - 2, cellSize - 2);
        }
      }
    }
    
    // Draw current piece
    if (this.tetris.current) {
      const {shape, x, y, color} = this.tetris.current;
      ctx.fillStyle = colors[color];
      for (let row = 0; row < shape.length; row++) {
        for (let col = 0; col < shape[row].length; col++) {
          if (shape[row][col]) {
            ctx.fillRect(
              offsetX + (x + col) * cellSize + 1,
              offsetY + (y + row) * cellSize + 1,
              cellSize - 2, cellSize - 2
            );
          }
        }
      }
    }
    
    // Score
    ctx.fillStyle = '#00ff88';
    ctx.font = 'bold 32px "Courier New"';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${this.tetris.score}`, 40, 60);
    
    // Game Over
    if (this.tetris.gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#ff0088';
      ctx.font = 'bold 64px "Courier New"';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', w/2, h/2 - 40);
      ctx.font = '32px "Courier New"';
      ctx.fillStyle = '#00ddff';
      ctx.fillText(`Score: ${this.tetris.score}`, w/2, h/2 + 20);
      ctx.font = '20px "Courier New"';
      ctx.fillText('Press ESC to return', w/2, h/2 + 80);
    } else {
      ctx.fillStyle = '#00ddff';
      ctx.font = '16px "Courier New"';
      ctx.textAlign = 'center';
      ctx.fillText('A/D: Move • W/Space: Rotate • S: Drop • ESC: Exit', w/2, h - 30);
    }
  };

// ==================== SPACE INVADERS GAME ====================
startSpaceInvadersGame() {
  this.currentGame = 'invaders';
this.invaders = {
    player: { x: 512, width: 40, height: 30, moveLeft: false, moveRight: false, speed: 8 },
    aliens: [],
    bullets: [],
    alienBullets: [],
    score: 0,
    gameOver: false,
    alienSpeed: 1,
    alienDirection: 1,
    shootCooldown: 0
  };
  
  // Create alien grid (5 rows x 11 columns)
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 11; col++) {
      this.invaders.aliens.push({
        x: 150 + col * 60,
        y: 100 + row * 50,
        alive: true,
        type: row < 1 ? 3 : row < 3 ? 2 : 1 // Different alien types
      });
    }
  }
  
  this.gameKeyHandler = (e) => {
    if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') {
      e.preventDefault();
      this.invaders.player.moveLeft = true;
    } else if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') {
      e.preventDefault();
      this.invaders.player.moveRight = true;
    } else if (e.key === ' ' || e.key === 'w' || e.key === 'W') {
      if (this.invaders.shootCooldown === 0) {
        this.invaders.bullets.push({
          x: this.invaders.player.x + 20,
          y: this.canvas.height - 60
        });
        this.invaders.shootCooldown = 15;
      }
    } else if (e.key === 'Escape') {
      this.exitGame();
    }
  };
  
  this.gameKeyUpHandler = (e) => {
    if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') {
      this.invaders.player.moveLeft = false;
    } else if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') {
      this.invaders.player.moveRight = false;
    }
  };
  
  window.removeEventListener('keydown', this.keyHandler);
  window.addEventListener('keydown', this.gameKeyHandler);
  window.addEventListener('keyup', this.gameKeyUpHandler);
}

updateSpaceInvadersGame() {
  const ctx = this.ctx;
  const w = this.canvas.width;
  const h = this.canvas.height;
  const inv = this.invaders;
  
  // Background
  ctx.fillStyle = '#0a0a1a';
  ctx.fillRect(0, 0, w, h);
  
  // Stars background
  for (let i = 0; i < 50; i++) {
    const x = (i * 123) % w;
    const y = (i * 456 + this.animationFrame) % h;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(x, y, 2, 2);
  }
  
  if (!inv.gameOver) {
    // Update cooldown
    if (inv.shootCooldown > 0) inv.shootCooldown--;
    
    // Update cooldown
    if (inv.shootCooldown > 0) inv.shootCooldown--;
    
    // Smooth player movement
    if (inv.player.moveLeft) {
      inv.player.x = Math.max(20, inv.player.x - inv.player.speed);
    }
    if (inv.player.moveRight) {
      inv.player.x = Math.min(w - 60, inv.player.x + inv.player.speed);
    }

    // Move aliens
    let hitEdge = false;
    inv.aliens.forEach(alien => {
      if (!alien.alive) return;
      alien.x += inv.alienSpeed * inv.alienDirection;
      if (alien.x <= 20 || alien.x >= w - 40) hitEdge = true;
    });
    
    if (hitEdge) {
      inv.alienDirection *= -1;
      inv.aliens.forEach(alien => {
        alien.y += 20;
        if (alien.y > h - 100) inv.gameOver = true;
      });
    }
    
    // Alien shooting
    if (Math.random() < 0.02) {
      const aliveAliens = inv.aliens.filter(a => a.alive);
      if (aliveAliens.length > 0) {
        const shooter = aliveAliens[Math.floor(Math.random() * aliveAliens.length)];
        inv.alienBullets.push({ x: shooter.x + 15, y: shooter.y + 20 });
      }
    }
    
    // Update bullets
inv.bullets = inv.bullets.filter(b => {
  b.y -= 8;
  if (b.y < 0) return false;
  
  // Check collision with aliens
  for (let alien of inv.aliens) {
    if (alien.alive && 
        b.x > alien.x && b.x < alien.x + 30 &&
        b.y > alien.y && b.y < alien.y + 20) {
      alien.alive = false;
      inv.score += alien.type * 10;
      this.playBeepSound(); // Beep when hitting alien
      return false;
    }
  }
  return true;
});
    
    // Update alien bullets
inv.alienBullets = inv.alienBullets.filter(b => {
  b.y += 5;
  if (b.y > h) return false;
  
  // Check collision with player
  if (b.x > inv.player.x && b.x < inv.player.x + 40 &&
      b.y > h - 50 && b.y < h - 20) {
    this.playBeepSound(); // Beep when player gets hit
    inv.gameOver = true;
    return false;
  }
  return true;
});
    
    // Check win condition
    if (inv.aliens.every(a => !a.alive)) {
      inv.gameOver = true;
    }
  }
  
  // Draw aliens
  const alienColors = ['#ff00aa', '#00ddff', '#ffaa00'];
  inv.aliens.forEach(alien => {
    if (!alien.alive) return;
    ctx.fillStyle = alienColors[alien.type - 1];
    
    // Simple alien shape
    ctx.fillRect(alien.x + 5, alien.y, 20, 15);
    ctx.fillRect(alien.x, alien.y + 5, 30, 10);
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(alien.x + 8, alien.y + 5, 5, 5);
    ctx.fillRect(alien.x + 17, alien.y + 5, 5, 5);
  });
  
  // Draw player
  ctx.fillStyle = '#00ff88';
  ctx.fillRect(inv.player.x, h - 50, 40, 10);
  ctx.fillRect(inv.player.x + 15, h - 60, 10, 20);
  
  // Draw bullets
  ctx.fillStyle = '#00ff88';
  inv.bullets.forEach(b => {
    ctx.fillRect(b.x - 2, b.y - 8, 4, 12);
  });
  
  ctx.fillStyle = '#ff0088';
  inv.alienBullets.forEach(b => {
    ctx.fillRect(b.x - 2, b.y - 8, 4, 12);
  });
  
  // Score
  ctx.fillStyle = '#00ff88';
  ctx.font = 'bold 32px "Courier New"';
  ctx.textAlign = 'left';
  ctx.fillText(`Score: ${inv.score}`, 40, 60);
  
  // Game Over
  if (inv.gameOver) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, w, h);
    
    const allDead = inv.aliens.every(a => !a.alive);
    if (allDead) {
      ctx.fillStyle = '#00ff88';
      ctx.font = 'bold 64px "Courier New"';
      ctx.textAlign = 'center';
      ctx.fillText('VICTORY!', w/2, h/2 - 40);
    } else {
      ctx.fillStyle = '#ff0088';
      ctx.font = 'bold 64px "Courier New"';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', w/2, h/2 - 40);
    }
    
    ctx.font = '32px "Courier New"';
    ctx.fillStyle = '#00ddff';
    ctx.fillText(`Final Score: ${inv.score}`, w/2, h/2 + 20);
    ctx.font = '20px "Courier New"';
    ctx.fillText('Press ESC to return', w/2, h/2 + 80);
  } else {
    ctx.fillStyle = '#00ddff';
    ctx.font = '16px "Courier New"';
    ctx.textAlign = 'center';
    ctx.fillText('A/D: Move • W/Space: Shoot • ESC: Exit', w/2, h - 30);
  }
}

exitGame() {
  this.currentGame = null;
  window.removeEventListener('keydown', this.gameKeyHandler);
  if (this.gameKeyUpHandler) {
    window.removeEventListener('keyup', this.gameKeyUpHandler);
  }
  window.addEventListener('keydown', this.keyHandler);
  this.scrollOffset = 0;
  this.targetScroll = this.selectedGame;
  
  // Resume background music
  if (this.backgroundMusic) {
    this.backgroundMusic.currentTime = 0;
    this.backgroundMusic.play().catch(err => {
      console.warn('Background music resume failed:', err);
    });
  }
  
  console.log('🎮 Returned to game selection menu');
}
}
// Make it globally available
window.TVScreen = TVScreen;