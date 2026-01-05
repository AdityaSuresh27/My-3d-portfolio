// chess-interactions.js - Handles all chess piece interactions

class ChessInteractions {
  constructor(scene, camera, raycaster, mouse, pieceObjects, squareMarkers, chessBoard, chessPieceNames) {
    this.scene = scene;
    this.camera = camera;
    this.raycaster = raycaster;
    this.mouse = mouse;
    this.pieceObjects = pieceObjects;
    this.squareMarkers = squareMarkers;
    this.chessBoard = chessBoard;
    this.chessPieceNames = chessPieceNames;
    
    this.selectedPieceObj = null;
    this.selectedSquare = null;
    this.selectedPieceOriginalPos = null;
    this.highlightedSquares = [];
    this.whitePieceObjects = [];
    
    // Identify white pieces
    Object.entries(pieceObjects).forEach(([name, obj]) => {
      if (name.startsWith('White_') || name.startsWith('wp')) {
        this.whitePieceObjects.push(obj);
      }
    });
  }
  
  handleClick(chessGame, makePlayerMoveCallback) {
    if (!chessGame || chessGame.gameOver || chessGame.aiThinking) return;
    if (chessGame.currentTurn !== 'white') return;
    
    this.raycaster.setFromCamera(this.mouse, this.camera);
    
    // Check if clicking on a legal move square
    const visibleMarkers = Object.values(this.squareMarkers).filter(m => m.visible);
    const markerHits = this.raycaster.intersectObjects(visibleMarkers, false);
    
    if (markerHits.length > 0 && this.selectedPieceObj) {
      // Clicked on a legal move - make the move
      const clickedSquare = markerHits[0].object.name.toLowerCase();
      makePlayerMoveCallback(this.selectedSquare, clickedSquare);
      return;
    }
    
    const pieceHits = this.raycaster.intersectObjects(this.whitePieceObjects, true);
    
    if (pieceHits.length > 0) {
      const clickedPiece = pieceHits[0].object;
      
      
      let pieceObj = clickedPiece;
      let parent = clickedPiece;
      
      while (parent && !this.chessPieceNames.includes(parent.name)) {
        parent = parent.parent;
      }
      
      if (parent && this.chessPieceNames.includes(parent.name)) {
        pieceObj = parent;
      }
      
      // Find which square this piece is on
      const squareForPiece = Object.entries(chessGame.squareToPieceName).find(
        ([sq, name]) => name === pieceObj.name
      );
      
      if (squareForPiece) {
        const [square, name] = squareForPiece;
        const piece = chessGame.getPieceAt(square);
        
        if (piece && piece.color === 'white') {
          // If clicking same piece, deselect it
          if (this.selectedPieceObj === pieceObj) {
            this.deselectPiece();
            return;
          }
          
          // Switch to new piece
          if (this.selectedPieceObj && this.selectedPieceObj !== pieceObj) {
            this.deselectPiece();
          }
          
          // Select this piece
          this.selectPiece(pieceObj, square, chessGame);
        }
      }
    } else {
      // Clicked on empty space - deselect current piece
      if (this.selectedPieceObj) {
        this.deselectPiece();
      }
    }
  }
  
  selectPiece(pieceObj, square, chessGame) {
    this.selectedPieceObj = pieceObj;
    this.selectedSquare = square;
    this.selectedPieceOriginalPos = {
      x: pieceObj.position.x,
      y: pieceObj.position.y,
      z: pieceObj.position.z
    };
    
    const targetPos = {
      x: pieceObj.position.x,
      y: pieceObj.position.y + 0.07,
      z: pieceObj.position.z
    };
    
    this.animatePieceHeight(pieceObj, this.selectedPieceOriginalPos, targetPos, 300, () => {
      this.highlightLegalMoves(square, chessGame);
    });
  }
  
  deselectPiece() {
    if (this.selectedPieceObj && this.selectedPieceOriginalPos) {
      const pieceToAnimate = this.selectedPieceObj;
      const startPos = {
        x: pieceToAnimate.position.x,
        y: pieceToAnimate.position.y,
        z: pieceToAnimate.position.z
      };
      const targetPos = this.selectedPieceOriginalPos;
      
      this.animatePieceHeight(pieceToAnimate, startPos, targetPos, 300);
    }
    
    this.selectedPieceObj = null;
    this.selectedSquare = null;
    this.selectedPieceOriginalPos = null;
    this.clearHighlights();
  }
  
  animatePieceHeight(pieceObj, startPos, targetPos, duration, onComplete = null) {
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
  
  highlightLegalMoves(square, chessGame) {
    const moves = chessGame.getLegalMoves(square);
    this.highlightedSquares = moves;
    
    moves.forEach(move => {
      const marker = this.squareMarkers[move.toUpperCase()];
      if (marker && marker.material) {
        marker.visible = true;
        marker.material.opacity = 0.5;
      }
    });
  }
  
  clearHighlights() {
    this.highlightedSquares.forEach(square => {
      const marker = this.squareMarkers[square.toUpperCase()];
      if (marker && marker.material) {
        marker.visible = false;
        marker.material.opacity = 0;
      }
    });
    this.highlightedSquares = [];
  }
  
  getSelectedPiece() {
    return {
      obj: this.selectedPieceObj,
      square: this.selectedSquare,
      originalPos: this.selectedPieceOriginalPos
    };
  }
  
  resetSelection() {
    this.selectedPieceObj = null;
    this.selectedSquare = null;
    this.selectedPieceOriginalPos = null;
  }
}

window.ChessInteractions = ChessInteractions;