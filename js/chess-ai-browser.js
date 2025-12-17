// chess-ai-browser.js - Browser-only Chess AI using ONNX
console.log("♟️ Chess AI Browser Module Loading...");

class ChessAIBrowser {
  constructor() {
    this.session = null;
    this.loaded = false;
    this.loading = false;
  }

  async load() {
    if (this.loaded || this.loading) return;
    
    this.loading = true;
    console.log("🤖 Loading Chess AI model...");
    
    try {
      const options = {
        executionProviders: ['wasm'],
        graphOptimizationLevel: 'all',
        enableCpuMemArena: true,
        enableMemPattern: true,
        executionMode: 'sequential',
      };
      
      this.session = await ort.InferenceSession.create('./assets/models/chess_model.onnx', options);
      this.loaded = true;
      this.loading = false;
      console.log("✅ Chess AI loaded successfully!");
      return true;
    } catch (error) {
      console.error("❌ Failed to load Chess AI:", error);
      this.loading = false;
      return false;
    }
  }

  boardToFeatureVector(board) {
    const features = new Float32Array(791);
    let idx = 0;
    
    const pieceMap = { 'P': 0, 'N': 1, 'B': 2, 'R': 3, 'Q': 4, 'K': 5 };
    
    for (let square = 0; square < 64; square++) {
      const rank = Math.floor(square / 8);
      const file = square % 8;
      const piece = board[rank][file];
      
      if (piece) {
        const pieceType = piece.type.toUpperCase();
        let pieceIdx = pieceMap[pieceType];
        if (piece.color === 'black') pieceIdx += 6;
        features[pieceIdx * 64 + square] = 1;
      }
    }
    idx = 768;
    
    features[idx++] = board.turn === 'white' ? 1 : 0;
    features[idx++] = 1;
    features[idx++] = 1;
    features[idx++] = 1;
    features[idx++] = 1;
    features[idx++] = 0;
    features[idx++] = 0;
    
    for (const color of ['white', 'black']) {
      for (const pieceType of ['P', 'N', 'B', 'R', 'Q', 'K']) {
        let count = 0;
        for (let rank = 0; rank < 8; rank++) {
          for (let file = 0; file < 8; file++) {
            const piece = board[rank][file];
            if (piece && piece.color === color && piece.type.toUpperCase() === pieceType) {
              count++;
            }
          }
        }
        features[idx++] = count / 8.0;
      }
    }
    
    features[idx++] = 0.5;
    features[idx++] = 0.5;
    features[idx++] = 0;
    features[idx++] = 0;
    
    return features;
  }

  async getBestMove(board, chessGame) {
    if (!this.loaded) {
      console.warn("⚠️ Model not loaded yet");
      return this.getRandomLegalMove(board, chessGame);
    }

    try {
      const features = this.boardToFeatureVector(board);
      const inputTensor = new ort.Tensor('float32', features, [1, 791]);
      const feeds = { board_features: inputTensor };
      const results = await this.session.run(feeds);
      
      const moveLogits = results.move_logits.data;
      const evalScore = results.eval_score.data[0] * 100;
      
      const indexed = Array.from(moveLogits).map((val, idx) => ({ val, idx }));
      indexed.sort((a, b) => b.val - a.val);
      
      console.log(`🤖 AI evaluating ${indexed.length} moves...`);
      
      for (let i = 0; i < Math.min(500, indexed.length); i++) {
        const moveIdx = indexed[i].idx;
        const fromSquare = Math.floor(moveIdx / 64);
        const toSquare = moveIdx % 64;
        
        const fromRank = Math.floor(fromSquare / 8);
        const fromFile = fromSquare % 8;
        const toRank = Math.floor(toSquare / 8);
        const toFile = toSquare % 8;
        
        const from = String.fromCharCode(97 + fromFile) + (fromRank + 1);
        const to = String.fromCharCode(97 + toFile) + (toRank + 1);
        
        const piece = board[fromRank][fromFile];
        if (piece && piece.color === 'black' && chessGame && chessGame.isValidMove(from, to)) {
          console.log(`✅ AI chose: ${from} → ${to} (rank ${i+1}, score: ${indexed[i].val.toFixed(2)})`);
          return { from, to, evaluation: evalScore };
        }
      }
      
      console.warn('⚠️ No valid move in predictions, using random legal move');
      return this.getRandomLegalMove(board, chessGame);
      
    } catch (error) {
      console.error("❌ AI inference error:", error);
      return this.getRandomLegalMove(board, chessGame);
    }
  }

  getRandomLegalMove(board, chessGame) {
    if (!chessGame) return null;
    
    const moves = [];
    
    for (let rank = 0; rank < 8; rank++) {
      for (let file = 0; file < 8; file++) {
        const piece = board[rank][file];
        if (piece && piece.color === 'black') {
          const from = String.fromCharCode(97 + file) + (rank + 1);
          const legalMoves = chessGame.getLegalMoves(from);
          
          legalMoves.forEach(to => {
            moves.push({ from, to, evaluation: 0 });
          });
        }
      }
    }
    
    if (moves.length > 0) {
      const randomMove = moves[Math.floor(Math.random() * moves.length)];
      console.log(`🎲 Random legal move: ${randomMove.from} → ${randomMove.to} (${moves.length} options)`);
      return randomMove;
    }
    
    console.error('❌ No legal moves found!');
    return null;
  }
}

window.ChessAIBrowser = ChessAIBrowser;
console.log("✅ Chess AI Browser Module Loaded");