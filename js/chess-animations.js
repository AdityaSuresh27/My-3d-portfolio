// chess-animations.js - Handles chess piece animations with sound
console.log("♟️ Chess Animations Module Loading...");

class ChessAnimations {
  constructor(chessBoard, pieceObjects, squareMarkers, THREE) {
    this.chessBoard = chessBoard;
    this.pieceObjects = pieceObjects;
    this.squareMarkers = squareMarkers;
    this.THREE = THREE;
    
    // Load move sound
    this.moveSound = new Audio('./assets/audio/chess-move.m4a');
    this.moveSound.volume = 0.5;
  }
  
  playMoveSound() {
    try {
      // Clone and play to allow multiple sounds
      const sound = this.moveSound.cloneNode();
      sound.volume = 0.5;
      sound.play().catch(e => console.warn('Could not play sound:', e));
    } catch (e) {
      console.warn('Sound playback error:', e);
    }
  }
  
  animatePieceMove(from, to, onComplete = null) {
    from = from.toLowerCase();
    to = to.toLowerCase();
    
    const pieceName = window.chessGame.squareToPieceName[to];
    const pieceObj = this.pieceObjects[pieceName];
    
    if (!pieceObj) {
      console.warn(`⚠️ Piece not found for: ${pieceName} at ${to}`);
      if (onComplete) onComplete();
      return;
    }
    
    const targetMarker = this.squareMarkers[to.toUpperCase()];
    if (!targetMarker) {
      console.warn(`⚠️ Target marker not found for: ${to}`);
      if (onComplete) onComplete();
      return;
    }
    
    const targetWorldPos = new this.THREE.Vector3();
    targetMarker.getWorldPosition(targetWorldPos);
    
    const targetLocalPos = this.chessBoard.worldToLocal(targetWorldPos.clone());
    
    const startPos = {
      x: pieceObj.position.x,
      y: pieceObj.position.y,
      z: pieceObj.position.z
    };
    
    const finalPos = {
      x: targetLocalPos.x,
      y: startPos.y,
      z: targetLocalPos.z
    };
    
    console.log(`🎬 Animating ${pieceName} from (${startPos.x.toFixed(3)}, ${startPos.y.toFixed(3)}, ${startPos.z.toFixed(3)}) to (${finalPos.x.toFixed(3)}, ${finalPos.y.toFixed(3)}, ${finalPos.z.toFixed(3)})`);
    
    const duration = 600;
    const startTime = performance.now();
    let soundPlayed = false;
    
    const animate = () => {
      if (!pieceObj || !pieceObj.position) {
        if (onComplete) onComplete();
        return;
      }
      
      const elapsed = performance.now() - startTime;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      
      pieceObj.position.x = startPos.x + (finalPos.x - startPos.x) * eased;
      pieceObj.position.y = startPos.y + (finalPos.y - startPos.y) * eased;
      pieceObj.position.z = startPos.z + (finalPos.z - startPos.z) * eased;
      
      // Play sound when piece is 90% to destination
      if (!soundPlayed && t >= 0.9) {
        this.playMoveSound();
        soundPlayed = true;
      }
      
      if (t < 1) {
        requestAnimationFrame(animate);
      } else {
        console.log(`✅ Animation complete for ${pieceName}`);
        if (onComplete) onComplete();
      }
    };
    
    animate();
  }
  
  animatePieceMoveWithName(pieceName, from, to, onComplete = null) {
  // CRITICAL: Use the provided piece name instead of looking it up
  const pieceObj = this.pieceObjects[pieceName];
  
  if (!pieceObj) {
    console.warn(`⚠️ Piece not found for: ${pieceName}`);
    if (onComplete) onComplete();
    return;
  }
  
  // Normalize to lowercase for consistency
  from = from.toLowerCase();
  to = to.toLowerCase();
  
  const targetMarker = this.squareMarkers[to.toUpperCase()];
  if (!targetMarker) {
    console.warn(`⚠️ Target marker not found for: ${to}`);
    if (onComplete) onComplete();
    return;
  }
  
  const targetWorldPos = new this.THREE.Vector3();
  targetMarker.getWorldPosition(targetWorldPos);
  
  const targetLocalPos = this.chessBoard.worldToLocal(targetWorldPos.clone());
  
  const startPos = {
    x: pieceObj.position.x,
    y: pieceObj.position.y,
    z: pieceObj.position.z
  };
  
  const finalPos = {
    x: targetLocalPos.x,
    y: startPos.y,
    z: targetLocalPos.z
  };
  
  console.log(`🎬 Animating ${pieceName} from (${startPos.x.toFixed(3)}, ${startPos.y.toFixed(3)}, ${startPos.z.toFixed(3)}) to (${finalPos.x.toFixed(3)}, ${finalPos.y.toFixed(3)}, ${finalPos.z.toFixed(3)})`);
  
  const duration = 600;
  const startTime = performance.now();
  let soundPlayed = false;
  
  const animate = () => {
    if (!pieceObj || !pieceObj.position) {
      if (onComplete) onComplete();
      return;
    }
    
    const elapsed = performance.now() - startTime;
    const t = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - t, 3);
    
    pieceObj.position.x = startPos.x + (finalPos.x - startPos.x) * eased;
    pieceObj.position.y = startPos.y + (finalPos.y - startPos.y) * eased;
    pieceObj.position.z = startPos.z + (finalPos.z - startPos.z) * eased;
    
    // Play sound when piece is 90% to destination
    if (!soundPlayed && t >= 0.9) {
      this.playMoveSound();
      soundPlayed = true;
    }
    
    if (t < 1) {
      requestAnimationFrame(animate);
    } else {
      console.log(`✅ Animation complete for ${pieceName}`);
      if (onComplete) onComplete();
    }
  };
  
  animate();
}
  
  fadeOutPiece(pieceName, onComplete = null) {
    const pieceObj = this.pieceObjects[pieceName];
    if (!pieceObj) {
      console.warn(`⚠️ Piece to fade not found: ${pieceName}`);
      if (onComplete) onComplete();
      return;
    }
    
    console.log(`👻 Fading out ${pieceName}`);
    
    const duration = 400;
    const startTime = performance.now();
    const startScale = {
      x: pieceObj.scale.x,
      y: pieceObj.scale.y,
      z: pieceObj.scale.z
    };
    
    const animate = () => {
      if (!pieceObj || !pieceObj.scale) {
        if (onComplete) onComplete();
        return;
      }
      
      const elapsed = performance.now() - startTime;
      const t = Math.min(elapsed / duration, 1);
      const eased = t * t;
      
      const scale = 1 - eased;
      pieceObj.scale.x = startScale.x * scale;
      pieceObj.scale.y = startScale.y * scale;
      pieceObj.scale.z = startScale.z * scale;
      
      if (t < 1) {
        requestAnimationFrame(animate);
      } else {
        pieceObj.visible = false;
        console.log(`✅ ${pieceName} faded out`);
        if (onComplete) onComplete();
      }
    };
    
    animate();
  }
  
  lowerPiece(pieceObj, liftAmount = 0.07, onComplete = null) {
    if (!pieceObj || !pieceObj.position) {
      if (onComplete) onComplete();
      return;
    }
    
    const startPos = {
      x: pieceObj.position.x,
      y: pieceObj.position.y,
      z: pieceObj.position.z
    };
    
    const targetPos = {
      x: startPos.x,
      y: startPos.y - liftAmount,
      z: startPos.z
    };
    
    const duration = 200;
    const startTime = performance.now();
    
    const animate = () => {
      if (!pieceObj || !pieceObj.position) {
        if (onComplete) onComplete();
        return;
      }
      
      const elapsed = performance.now() - startTime;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      
      pieceObj.position.x = startPos.x + (targetPos.x - startPos.x) * eased;
      pieceObj.position.y = startPos.y + (targetPos.y - startPos.y) * eased;
      pieceObj.position.z = startPos.z + (targetPos.z - startPos.z) * eased;
      
      if (t < 1) {
        requestAnimationFrame(animate);
      } else {
        if (onComplete) onComplete();
      }
    };
    
    animate();
  }
  
  // Morph piece for promotion (scale down, then scale up with new type)
  morphPiece(pieceName, newType, onComplete = null) {
    const pieceObj = this.pieceObjects[pieceName];
    if (!pieceObj) {
      console.warn(`⚠️ Piece to morph not found: ${pieceName}`);
      if (onComplete) onComplete();
      return;
    }
    
    console.log(`🔄 Morphing ${pieceName} to ${newType}`);
    
    const duration = 800;
    const startTime = performance.now();
    const originalScale = {
      x: pieceObj.scale.x,
      y: pieceObj.scale.y,
      z: pieceObj.scale.z
    };
    
    const animate = () => {
      if (!pieceObj || !pieceObj.scale) {
        if (onComplete) onComplete();
        return;
      }
      
      const elapsed = performance.now() - startTime;
      const t = Math.min(elapsed / duration, 1);
      
      // Scale down then back up with easing
      let scale;
      if (t < 0.5) {
        // Scale down
        const t1 = t * 2;
        scale = 1 - (t1 * 0.3); // Scale to 70%
      } else {
        // Scale back up
        const t2 = (t - 0.5) * 2;
        scale = 0.7 + (t2 * 0.3);
      }
      
      pieceObj.scale.x = originalScale.x * scale;
      pieceObj.scale.y = originalScale.y * scale;
      pieceObj.scale.z = originalScale.z * scale;
      
      // Add rotation for visual effect
      pieceObj.rotation.y = t * Math.PI * 2;
      
      if (t < 1) {
        requestAnimationFrame(animate);
      } else {
        pieceObj.rotation.y = 0;
        pieceObj.scale.set(originalScale.x, originalScale.y, originalScale.z);
        console.log(`✅ ${pieceName} morphed to ${newType}`);
        if (onComplete) onComplete();
      }
    };
    
    animate();
  }
}

window.ChessAnimations = ChessAnimations;
console.log("✅ Chess Animations Module Loaded");