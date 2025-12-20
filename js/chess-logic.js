// chess-logic.js - Enhanced Chess game logic with check/checkmate/special moves
console.log("♟️ Chess Logic Module Loading...");

class ChessGame {
  constructor() {
    this.pieceNameMap = {
      // White pieces (bottom rows from player perspective)
      'White_rook1': { type: 'R', square: 'h1', color: 'white' },
      'White_knight1': { type: 'N', square: 'g1', color: 'white' },
      'White_bishop1': { type: 'B', square: 'f1', color: 'white' },
      'White_king': { type: 'K', square: 'e1', color: 'white' },
      'White_queen': { type: 'Q', square: 'd1', color: 'white' },
      'White_bishop2': { type: 'B', square: 'c1', color: 'white' },
      'White_knight2': { type: 'N', square: 'b1', color: 'white' },
      'White_rook2': { type: 'R', square: 'a1', color: 'white' },
      'wp1': { type: 'P', square: 'h2', color: 'white' },
      'wp2': { type: 'P', square: 'g2', color: 'white' },
      'wp3': { type: 'P', square: 'f2', color: 'white' },
      'wp4': { type: 'P', square: 'e2', color: 'white' },
      'wp5': { type: 'P', square: 'd2', color: 'white' },
      'wp6': { type: 'P', square: 'c2', color: 'white' },
      'wp7': { type: 'P', square: 'b2', color: 'white' },
      'wp8': { type: 'P', square: 'a2', color: 'white' },
      
      // Black pieces (top rows from player perspective)
      'Black_rook_1': { type: 'r', square: 'h8', color: 'black' },
      'Black_knight_1': { type: 'n', square: 'g8', color: 'black' },
      'Black_bishop_1': { type: 'b', square: 'f8', color: 'black' },
      'Black_king': { type: 'k', square: 'e8', color: 'black' },
      'Black_queen': { type: 'q', square: 'd8', color: 'black' },
      'Black_elephant2': { type: 'b', square: 'c8', color: 'black' },
      'Black_knight_2': { type: 'n', square: 'b8', color: 'black' },
      'Black_rook_2': { type: 'r', square: 'a8', color: 'black' },
      'bp1': { type: 'p', square: 'h7', color: 'black' },
      'bp2': { type: 'p', square: 'g7', color: 'black' },
      'bp3': { type: 'p', square: 'f7', color: 'black' },
      'bp4': { type: 'p', square: 'e7', color: 'black' },
      'bp5': { type: 'p', square: 'd7', color: 'black' },
      'bp6': { type: 'p', square: 'c7', color: 'black' },
      'bp7': { type: 'p', square: 'b7', color: 'black' },
      'bp8': { type: 'p', square: 'a7', color: 'black' },
    };
    
    this.squareToPieceName = {};
    Object.entries(this.pieceNameMap).forEach(([name, data]) => {
      this.squareToPieceName[data.square] = name;
    });
    
    this.board = this.initializeBoard();
    this.currentTurn = 'white';
    this.gameOver = false;
    this.aiThinking = false;
    this.moveHistory = [];
    this.lastEval = 0;
    this.enPassantTarget = null; // Track en passant opportunity
    this.promotionCallback = null; // For handling promotion UI
    
    console.log("✅ Chess game initialized");
  }
  
  initializeBoard() {
    const board = Array(8).fill(null).map(() => Array(8).fill(null));
    
    Object.entries(this.pieceNameMap).forEach(([name, data]) => {
      const [file, rank] = this.squareToIndices(data.square);
      board[rank][file] = {
        type: data.type,
        color: data.color,
        name: name,
        moved: false
      };
    });
    
    board.turn = 'white';
    return board;
  }
  
  squareToIndices(square) {
    const file = square.charCodeAt(0) - 'a'.charCodeAt(0);
    const rank = parseInt(square[1]) - 1;
    return [file, rank];
  }
  
  indicesToSquare(file, rank) {
    return String.fromCharCode('a'.charCodeAt(0) + file) + (rank + 1);
  }
  
  getPieceAt(square) {
    const [file, rank] = this.squareToIndices(square);
    return this.board[rank][file];
  }
  
  setPieceAt(square, piece) {
    const [file, rank] = this.squareToIndices(square);
    this.board[rank][file] = piece;
  }
  
  // Find king position for a color
  findKing(color) {
    for (let rank = 0; rank < 8; rank++) {
      for (let file = 0; file < 8; file++) {
        const piece = this.board[rank][file];
        if (piece && piece.color === color && piece.type.toLowerCase() === 'k') {
          return this.indicesToSquare(file, rank);
        }
      }
    }
    return null;
  }
  
  // Check if a square is under attack by opponent
  isSquareUnderAttack(square, byColor) {
    const [targetFile, targetRank] = this.squareToIndices(square);
    
    for (let rank = 0; rank < 8; rank++) {
      for (let file = 0; file < 8; file++) {
        const piece = this.board[rank][file];
        if (piece && piece.color === byColor) {
          const fromSquare = this.indicesToSquare(file, rank);
          if (this.canPieceAttack(fromSquare, square)) {
            return true;
          }
        }
      }
    }
    return false;
  }
  
  // Check if a piece can attack a square (doesn't check for check)
  canPieceAttack(from, to) {
    const piece = this.getPieceAt(from);
    if (!piece) return false;
    
    const [fromFile, fromRank] = this.squareToIndices(from);
    const [toFile, toRank] = this.squareToIndices(to);
    const df = Math.abs(toFile - fromFile);
    const dr = Math.abs(toRank - fromRank);
    
    const pieceType = piece.type.toLowerCase();
    
    switch(pieceType) {
      case 'p':
        const direction = piece.color === 'white' ? 1 : -1;
        // Pawns attack diagonally
        return df === 1 && toRank === fromRank + direction;
        
      case 'n':
        return (df === 2 && dr === 1) || (df === 1 && dr === 2);
        
      case 'b':
        return df === dr && df > 0 && this.isPathClear(fromFile, fromRank, toFile, toRank);
        
      case 'r':
        return (df === 0 || dr === 0) && (df + dr > 0) && this.isPathClear(fromFile, fromRank, toFile, toRank);
        
      case 'q':
        return (df === dr || df === 0 || dr === 0) && (df + dr > 0) && this.isPathClear(fromFile, fromRank, toFile, toRank);
        
      case 'k':
        return df <= 1 && dr <= 1 && (df + dr > 0);
    }
    
    return false;
  }
  
  // Check if current player is in check
  isInCheck(color) {
    const kingSquare = this.findKing(color);
    if (!kingSquare) return false;
    
    const opponentColor = color === 'white' ? 'black' : 'white';
    return this.isSquareUnderAttack(kingSquare, opponentColor);
  }
  
  // Simulate a move and check if it leaves king in check
  wouldBeInCheck(from, to, color) {
    // Make temporary move
    const [fromFile, fromRank] = this.squareToIndices(from);
    const [toFile, toRank] = this.squareToIndices(to);
    
    const movingPiece = this.board[fromRank][fromFile];
    const capturedPiece = this.board[toRank][toFile];
    
    this.board[toRank][toFile] = movingPiece;
    this.board[fromRank][fromFile] = null;
    
    const inCheck = this.isInCheck(color);
    
    // Undo move
    this.board[fromRank][fromFile] = movingPiece;
    this.board[toRank][toFile] = capturedPiece;
    
    return inCheck;
  }
  
  isValidMove(from, to) {
    const piece = this.getPieceAt(from);
    if (!piece || piece.color !== this.currentTurn) return false;
    
    const target = this.getPieceAt(to);
    if (target && target.color === piece.color) return false;
    
    const [fromFile, fromRank] = this.squareToIndices(from);
    const [toFile, toRank] = this.squareToIndices(to);
    const df = Math.abs(toFile - fromFile);
    const dr = Math.abs(toRank - fromRank);
    
    const pieceType = piece.type.toLowerCase();
    
    let isValidBasicMove = false;
    
    switch(pieceType) {
      case 'p':
        const direction = piece.color === 'white' ? 1 : -1;
        const startRank = piece.color === 'white' ? 1 : 6;
        
        // Normal forward move
        if (toFile === fromFile && !target) {
          if (toRank === fromRank + direction) {
            isValidBasicMove = true;
          } else if (fromRank === startRank && toRank === fromRank + 2 * direction) {
            const between = this.getPieceAt(this.indicesToSquare(fromFile, fromRank + direction));
            if (!between) isValidBasicMove = true;
          }
        }
        // Capture
        else if (df === 1 && toRank === fromRank + direction) {
          if (target) {
            isValidBasicMove = true;
          }
          // En passant
          else if (this.enPassantTarget === to) {
            isValidBasicMove = true;
          }
        }
        break;
        
      case 'n':
        isValidBasicMove = (df === 2 && dr === 1) || (df === 1 && dr === 2);
        break;
        
      case 'b':
        if (df === dr && df > 0) {
          isValidBasicMove = this.isPathClear(fromFile, fromRank, toFile, toRank);
        }
        break;
        
      case 'r':
        if ((df === 0 || dr === 0) && (df + dr > 0)) {
          isValidBasicMove = this.isPathClear(fromFile, fromRank, toFile, toRank);
        }
        break;
        
      case 'q':
        if ((df === dr || df === 0 || dr === 0) && (df + dr > 0)) {
          isValidBasicMove = this.isPathClear(fromFile, fromRank, toFile, toRank);
        }
        break;
        
      case 'k':
        // Normal king move
        if (df <= 1 && dr <= 1 && (df + dr > 0)) {
          isValidBasicMove = true;
        }
        // Castling
        else if (!piece.moved && dr === 0 && df === 2) {
          isValidBasicMove = this.canCastle(from, to);
        }
        break;
    }
    
    if (!isValidBasicMove) return false;
    
    // Check if move would leave king in check
    return !this.wouldBeInCheck(from, to, piece.color);
  }
  
  // Check if castling is valid
  canCastle(kingFrom, kingTo) {
    const piece = this.getPieceAt(kingFrom);
    if (!piece || piece.moved) return false;
    
    const [kingFile, kingRank] = this.squareToIndices(kingFrom);
    const [toFile, toRank] = this.squareToIndices(kingTo);
    
    // King can't be in check
    if (this.isInCheck(piece.color)) return false;
    
    const direction = toFile > kingFile ? 1 : -1;
    const rookFile = direction > 0 ? 7 : 0;
    const rookSquare = this.indicesToSquare(rookFile, kingRank);
    const rook = this.getPieceAt(rookSquare);
    
    if (!rook || rook.type.toLowerCase() !== 'r' || rook.moved) return false;
    
    // Check path is clear
    const start = Math.min(kingFile, rookFile) + 1;
    const end = Math.max(kingFile, rookFile);
    
    for (let f = start; f < end; f++) {
      if (this.board[kingRank][f]) return false;
    }
    
    // Check king doesn't pass through check
    for (let f = kingFile; f !== toFile + direction; f += direction) {
      const sq = this.indicesToSquare(f, kingRank);
      if (this.isSquareUnderAttack(sq, piece.color === 'white' ? 'black' : 'white')) {
        return false;
      }
    }
    
    return true;
  }
  
  isPathClear(fromFile, fromRank, toFile, toRank) {
    const df = Math.sign(toFile - fromFile);
    const dr = Math.sign(toRank - fromRank);
    let f = fromFile + df;
    let r = fromRank + dr;
    
    while (f !== toFile || r !== toRank) {
      if (this.board[r][f]) return false;
      f += df;
      r += dr;
    }
    return true;
  }
  
  makeMove(from, to, promotionPiece = null) {
    const [fromFile, fromRank] = this.squareToIndices(from);
    const [toFile, toRank] = this.squareToIndices(to);
    
    const piece = this.board[fromRank][fromFile];
    const captured = this.board[toRank][toFile];
    
    let capturedPieceName = null;
    if (captured) {
      capturedPieceName = this.squareToPieceName[to];
    }
    
    // Handle en passant capture
    let enPassantCapture = null;
    if (piece.type.toLowerCase() === 'p' && to === this.enPassantTarget && !captured) {
      const captureRank = piece.color === 'white' ? toRank - 1 : toRank + 1;
      const captureSquare = this.indicesToSquare(toFile, captureRank);
      enPassantCapture = this.board[captureRank][toFile];
      capturedPieceName = this.squareToPieceName[captureSquare];
      this.board[captureRank][toFile] = null;
      delete this.squareToPieceName[captureSquare];
    }
    
    // Handle castling
    let castlingRookMove = null;
    if (piece.type.toLowerCase() === 'k' && Math.abs(toFile - fromFile) === 2) {
      const direction = toFile > fromFile ? 1 : -1;
      const rookFromFile = direction > 0 ? 7 : 0;
      const rookToFile = toFile - direction;
      
      const rookFromSquare = this.indicesToSquare(rookFromFile, fromRank);
      const rookToSquare = this.indicesToSquare(rookToFile, fromRank);
      
      const rook = this.board[fromRank][rookFromFile];
      this.board[fromRank][rookToFile] = rook;
      this.board[fromRank][rookFromFile] = null;
      
      const rookName = this.squareToPieceName[rookFromSquare];
      delete this.squareToPieceName[rookFromSquare];
      this.squareToPieceName[rookToSquare] = rookName;
      
      castlingRookMove = { from: rookFromSquare, to: rookToSquare, name: rookName };
    }
    
    // Move piece
    this.board[toRank][toFile] = piece;
    this.board[fromRank][fromFile] = null;
    piece.moved = true;
    
    // Handle pawn promotion
    let needsPromotion = false;
    if (piece.type.toLowerCase() === 'p') {
      const promotionRank = piece.color === 'white' ? 7 : 0;
      if (toRank === promotionRank) {
        needsPromotion = true;
        if (promotionPiece) {
          piece.type = promotionPiece;
        }
      }
    }
    
    // Update en passant target
    this.enPassantTarget = null;
    if (piece.type.toLowerCase() === 'p' && Math.abs(toRank - fromRank) === 2) {
      const epRank = (fromRank + toRank) / 2;
      this.enPassantTarget = this.indicesToSquare(fromFile, epRank);
    }
    
    const pieceName = this.squareToPieceName[from];
    if (pieceName) {
      delete this.squareToPieceName[from];
      this.squareToPieceName[to] = pieceName;
    }
    
    this.moveHistory.push({ from, to, piece, captured, enPassantCapture });
    
    this.currentTurn = this.currentTurn === 'white' ? 'black' : 'white';
    this.board.turn = this.currentTurn;
    
    return { 
      piece, 
      captured, 
      from, 
      to, 
      pieceName, 
      capturedPieceName,
      enPassantCapture,
      enPassantCaptureSquare: enPassantCapture ? this.indicesToSquare(toFile, piece.color === 'white' ? toRank - 1 : toRank + 1) : null,
      castlingRookMove,
      needsPromotion
    };
  }
  
  getLegalMoves(square) {
    const moves = [];
    const piece = this.getPieceAt(square);
    if (!piece || piece.color !== this.currentTurn) return moves;
    
    for (let rank = 0; rank < 8; rank++) {
      for (let file = 0; file < 8; file++) {
        const to = this.indicesToSquare(file, rank);
        if (this.isValidMove(square, to)) {
          moves.push(to);
        }
      }
    }
    
    return moves;
  }
  
  isCheckmate() {
    if (!this.isInCheck(this.currentTurn)) return false;
    
    // Check if any legal move exists
    for (let rank = 0; rank < 8; rank++) {
      for (let file = 0; file < 8; file++) {
        const piece = this.board[rank][file];
        if (piece && piece.color === this.currentTurn) {
          const from = this.indicesToSquare(file, rank);
          const legalMoves = this.getLegalMoves(from);
          if (legalMoves.length > 0) {
            return false;
          }
        }
      }
    }
    
    return true;
  }
  
  isStalemate() {
    if (this.isInCheck(this.currentTurn)) return false;
    
    // Check if any legal move exists
    for (let rank = 0; rank < 8; rank++) {
      for (let file = 0; file < 8; file++) {
        const piece = this.board[rank][file];
        if (piece && piece.color === this.currentTurn) {
          const from = this.indicesToSquare(file, rank);
          const legalMoves = this.getLegalMoves(from);
          if (legalMoves.length > 0) {
            return false;
          }
        }
      }
    }
    
    return true;
  }
}

window.ChessGame = ChessGame;
console.log("✅ Chess Logic Module Loaded");