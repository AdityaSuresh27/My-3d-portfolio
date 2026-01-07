//main.js
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";


let scene, camera, renderer, controls;
let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();

let currentMode = 'normal'; // 'normal', 'sofa', 'chess', 'family', 'laptop', 'desk', 'frame'
let previousMode = null; // Track mode history for exit button
let hoverEnabled = true;
let cameraControlEnabled = false; 
let normalModeCameraPos = new THREE.Vector3(1.8995096440842898, 1.2049732890027314, 1.1057035996481932);
let normalModeCameraTarget = new THREE.Vector3(-0.19339297685447426, 1.0415828316110889, 1.1253654180086836);

let selectable = [];
let laptopParts = [];
let sofaParts = []; // Bean bags, table
let deskParts = [];
let deskOutlineMeshes = [];
let frameParts = []; // Game and fantasy frames
let frameOutlineMeshes = [];
let boardParts = []; 
let boardOutlineMeshes = [];
let blockRotations = {}; // Store original rotations for blocks
let blockAnimating = false; // Track if blocks are animating
let boardAudio = null; 
let tvParts = []; 
let tvOutlineMeshes = [];

// Shelf mode variables
let shelfParts = [];
let shelfOutlineMeshes = [];
let shelfScrollPosition = 0; // 0 to 4 (for 5 positions)
let shelfOutlineOffsetX = 0;
let shelfOutlineOffsetY = 0;
let shelfScrolling = false;
let shelfTouchStartY = 0;
let shelfTouchCurrentY = 0;
let shelfIsSwiping = false;

// Radio mode variables
let radioParts = [];
let radioOutlineMeshes = [];
let radioPanel = null;
let volumeKnob = null;
let tuneKnob = null;
let isDraggingVolume = false;
let isDraggingTune = false;
let startAngle = 0;

// Shelf camera positions (5 positions total)
const shelfPositions = [
  {
    camera: { x: -0.0859741774289951, y: 1.5291292483291543, z: -0.2568612158995307 },
    target: { x: -0.06256457322971105, y: 1.572253178788147, z: -1.7993055491816197 },
    dialogue: "I minored in robotics because I love seeing things I build actually move, even though my main focus is software. You can scroll through this shelf using the arrow keys or your mouse",
    dialoguePos: "right"
  },
  {
    camera: { x: 0.15686608641575478, y: 1.2410753609864427, z: -0.19765471374559174 },
    target: { x: 0.15692930967994168, y: 1.229893186878728, z: -1.3320114959046097 },
    dialogue: "Click on the radio if you want to change the music and try out different tracks",
    dialoguePos: "left"
  },
  {
    camera: { x: -0.135033445364163, y: 0.9267996643472357, z: -0.27444583806655487 },
    target: { x: -0.11162336115874623, y: 0.969923594806249, z: -1.8168901640635515 },
    dialogue: "I love birds(In fact I had two lovebirds growing up) and getting lost in books like Harry Potter, Percy Jackson, The Alchemist, Murder on the Orient Express and more. Each story sparks my imagination and takes me to a different world",
    dialoguePos: "right"
  },
  {
    camera: { x: 0.17578137380019013, y: 0.6389576007712021, z: -0.1917181499956706 },
    target: { x: 0.17584458850885093, y: 0.6277754266634874, z: -1.326074932155163 },
    dialogue: "On the talk of sports, I play badminton and I have learnt taekwondo for a 4 years and acheived the rank of red belt",
    dialoguePos: "left"
  },
  {
    camera: { x: -0.10904628393301713, y: 0.31898528375917456, z: -0.2910584604488202 },
    target: { x: -0.08563192086289545, y: 0.350444516581331, z: -1.8337847124110054 },
    dialogue: "Another hobby I love is cooking, especially baking. I enjoy making treats and sharing them with my friends and family",
    dialoguePos: "right"
  }
];

let currentShelfPosition = 0;
let targetShelfPosition = 0;
let tvScreen = null; // TV screen controller
let tvScreenMesh = null;
let familyFrameParts = []; // fam_frame, fam_frame2
let laptopTargetScale = 1;
let laptopCurrentScale = 1;
let chessTargetScale = 1;
let chessCurrentScale = 1;
let outlineMeshes = [];
let sofaOutlineMeshes = [];
let familyOutlineMeshes = [];
let chessOutlineMeshes = [];

let isCameraAnimating = false;
let animationStart = 0;
let laptopScreen = null;
let screenMesh = null;
const animationDuration = 2.2;
const cameraStartPos = new THREE.Vector3();
const cameraEndPos = new THREE.Vector3();
const cameraStartTarget = new THREE.Vector3();
const cameraEndTarget = new THREE.Vector3();

const chessPieceNames = [
  "Black_rook_1", "Black_knight_1", "Black_bishop_1", "Black_king", "Black_queen",
  "Black_elephant2", "Black_knight_2", "Black_rook_2",
  "bp1", "bp2", "bp3", "bp4", "bp5", "bp6", "bp7", "bp8",
  "White_rook1", "White_knight1", "White_bishop1", "White_queen", "White_king",
  "White_bishop2", "White_knight2", "White_rook2",
  "wp1", "wp2", "wp3", "wp4", "wp5", "wp6", "wp7", "wp8"
];

let chessBoard = null;
let squareMarkers = {};
let chessPieces = [];
let pulseDirection = 1;
let currentOpacity = 0.3;
let lockedCameraPos = new THREE.Vector3();
let lockedCameraTarget = new THREE.Vector3();
let isUserInteracting = false;

let chessGame = null;
let chessAI = null;
let chessInteractions = null;
let chessAnimations = null;
let pieceObjects = {};
let gameStarted = false;
let isResetting = false;
let isAnimating = false;
let pendingPromotionMove = null;
let moveCount = 0;
let isProcessingMove = false;

let dialogueBox = null;
let dialogueText = null;
let dialogueClickPrompt = null;
let dialogueVisible = false;
let currentDialogueIndex = 0;
let isTyping = false;
let hasSeenIntroDialogue = false;
let normalModeInteractionBlocked = false;

const introDialogues = [
  "Welcome to my interactive 3D portfolio. I designed this space to reflect what a comfortable room feels like to me, a place where you can explore and get to know me",
  "To explore my technical skills, click on the laptop on the desk under the window",
  "To view my certifications, click on the board at the back, to the left of the window",
  "Every section has its own story to tell, so please do check out everything in the room and thank you"
];

const certificates = [
  {
    title: "Foundations of AI",
    issuer: "Microsoft & Edunet Foundation",
    description: "Introductory AI concepts and foundations, covering basic AI techniques and applications",
    link: "https://www.linkedin.com/posts/aditya-suresh-26b457298_ai-microsoft-edunet-activity-7333147161745903617-KxrI/?utm_source=share&utm_medium=member_desktop&rcm=ACoAAEf4NbMBA_gbu08UFg_9KUxb9KDA3d2NCt4"
  },
  {
    title: "AI & Data Analytics (Green Skills)",
    issuer: "AICTE, Shell India & Edunet",
    description: "Applied AI and data analytics with a focus on sustainable and green technologies",
    link: "https://www.linkedin.com/posts/aditya-suresh-26b457298_skills4future-ai-dataanalytics-activity-7334262036190638080-SaFS"
  },
  {
    title: "Microsoft Azure AI: Natural Language Processing",
    issuer: "Microsoft",
    description: "Hands-on training on building NLP solutions using Azure AI services",
    link: "https://learn.microsoft.com/en-us/users/adityasuresh-1198/achievements/w27urs4n"
  },
  {
    title: "AI Agent Development on Azure",
    issuer: "Microsoft",
    description: "Developed AI agents and intelligent applications on Azure platform",
    link: "https://learn.microsoft.com/en-us/users/adityasuresh-1198/achievements/3aygycrh?"
  },
  {
    title: "Certificate of Conducting Webots Hackathon",
    issuer: "Edunet",
    description: "Organized and conducted a hackathon using Webots for robotics simulation",
    link: "https://www.linkedin.com/feed/update/urn:li:activity:7413285080808214528/"
  }
];

let certificateBoard = null;
let certificateBoardVisible = false;

const dialogueContent = {
  sofa: "A comfy corner to sit down with a friend",
  chess: "This chess AI was built using an ML neural network model. Limited computational power (aka a potato PC) held it back in training, so while it plays legal moves, its strategy is… questionable",
  family: "I sincerely thank my family, who helped and encouraged me throughout my life and made it possible for me to reach where I am today",
  desk: "A calm place to sit and work, facing the window, ready to start with a cup of coffee",
  laptop: "Welcome to my portfolio. You can check out my projects, skills, learn more about me, and find my contact details and GitHub work here",
  frame: "I enjoy gaming and game development, with a particular love for fantasy stories and worlds",
  tv: "This is my gaming corner. Use WASD to navigate and ENTER to choose a game. Have fun!"
};

// Sofa mode objects
let beanBags = [];
let tableObj = null;

//After heavy compression some of my textures got corrupted, so I am manually applying the texture
window.addEventListener('DOMContentLoaded', () => {
  
  // Initialize loading screen FIRST
  if (window.loadingScreen) {
    window.loadingScreen.init();
  }
  
  // Small delay to ensure loading screen canvas is ready
  setTimeout(() => {
    // Initialize Three.js scene (but don't load assets yet)
    init();
    
    // Initialize audio manager
    if (typeof AudioManager !== 'undefined') {
      window.audioManager = new AudioManager();
      window.audioManager.init();
    }
    
    // Start animation loop (won't show scene until loaded)
    animate();
    
    // Register all assets BEFORE loading starts
    registerAllAssets();

    setTimeout(() => {
      loadScene();
    }, 100);
  }, 200);
});

function registerAllAssets() {
  
  window.assetLoader.addAsset(); 
  
  window.assetLoader.addAsset(); 
  const chessModelPath = './assets/models/chess_model.onnx';
  fetch(chessModelPath, { method: 'HEAD' })
    .then(() => {
      window.assetLoader.addAsset();
    })
    .catch(() => {
      console.log('Chess AI model not found - chess will work without AI');
    });
  
}

function init() {
  scene = new THREE.Scene();
  
  scene.background = new THREE.Color(0x1a1a2e);
  
  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);
  camera.position.set(1.8995096440842898, 1.2049732890027314, 1.1057035996481932);
  
  const spotLight = new THREE.SpotLight(0xffffff, 12.0);
  spotLight.position.set(-2.0794731965482103, 2.3485767272873055, 3.1517927212249153);
  spotLight.target.position.set(-2.185583254084098, -0.08812173603994009, 2.935340840979555);
  spotLight.angle = Math.PI / 5;
  spotLight.penumbra = 0.6;
  spotLight.decay = 1.0;
  spotLight.distance = 40;
  spotLight.castShadow = false;
  scene.add(spotLight);
  scene.add(spotLight.target);

  const ambientLight = new THREE.AmbientLight(0xb490ca, 2.4);
  scene.add(ambientLight);

  const rimLight = new THREE.DirectionalLight(0x5ee7df, 1.6);
  rimLight.position.set(5, 3, -5);
  scene.add(rimLight);

  const accentLight = new THREE.PointLight(0xfbc2eb, 1.2, 20);
  accentLight.position.set(-3, 1.5, 0);
  scene.add(accentLight);

  renderer = new THREE.WebGLRenderer({ 
    antialias: true,
    powerPreference: "high-performance",
    stencil: false,
    depth: true
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  document.body.appendChild(renderer.domElement);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.8;

  controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(-0.19350259303174752, 1.0415828316110878, 1.1136973219807842);
  controls.enableDamping = true;
  controls.addEventListener('start', () => { isUserInteracting = true; });
  controls.addEventListener('end', () => { isUserInteracting = false; });

  window.addEventListener("resize", onWindowResize);
  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerdown", onPointerClick);
  window.addEventListener("wheel", onMouseWheel, { passive: false });
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("touchstart", onTouchStart, { passive: false });
  window.addEventListener("touchmove", onTouchMove, { passive: false });
  window.addEventListener("touchend", onTouchEnd, { passive: false });

  setupChessUI();
  setupDialogueSystem();
  setupCertificateBoard();
  setupRadioPanel();
  setupCameraToggle();
  setupMobileControls();
}

function updateCameraDebug() {
  const pos = camera.position;
  const target = controls.target;
  
  //console.log(`📷 Pos:(${pos.x.toFixed(4)}, ${pos.y.toFixed(4)}, ${pos.z.toFixed(4)})`);
  //console.log(`🎯 Target:(${target.x.toFixed(4)}, ${target.y.toFixed(4)}, ${target.z.toFixed(4)})`);
}


function setupUniversalExitButton() {
  const exitBtn = document.getElementById('universalExitBtn');
  if (!exitBtn) {
    const btn = document.createElement('button');
    btn.id = 'universalExitBtn';
    btn.className = 'exit-btn';
    btn.innerHTML = '✕';
    btn.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        background: linear-gradient(135deg, rgba(20, 25, 40, 0.95) 0%, rgba(15, 20, 35, 0.98) 100%);
        color: #5ee7df;
        border: 2px solid rgba(94, 231, 223, 0.5);
        font-size: 26px;
        font-weight: 400;
        cursor: pointer;
        display: none;
        z-index: 10002;
        transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5), 
                    0 0 30px rgba(94, 231, 223, 0.15),
                    inset 0 1px 0 rgba(94, 231, 223, 0.2);
        backdrop-filter: blur(12px);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        line-height: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        user-select: none;
        -webkit-tap-highlight-color: transparent;
      `;
    btn.addEventListener('mouseenter', () => {
      btn.style.background = 'linear-gradient(135deg, rgba(94, 231, 223, 0.25) 0%, rgba(94, 200, 223, 0.3) 100%)';
      btn.style.borderColor = 'rgba(94, 231, 223, 0.9)';
      btn.style.color = '#ffffff';
      btn.style.transform = 'scale(1.15) rotate(90deg)';
      btn.style.boxShadow = '0 6px 30px rgba(94, 231, 223, 0.4), 0 0 40px rgba(94, 231, 223, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.3)';
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.background = 'linear-gradient(135deg, rgba(20, 25, 40, 0.95) 0%, rgba(15, 20, 35, 0.98) 100%)';
      btn.style.borderColor = 'rgba(94, 231, 223, 0.5)';
      btn.style.color = '#5ee7df';
      btn.style.transform = 'scale(1) rotate(0deg)';
      btn.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.5), 0 0 30px rgba(94, 231, 223, 0.15), inset 0 1px 0 rgba(94, 231, 223, 0.2)';
    });
btn.addEventListener('click', exitCurrentMode);
btn.style.pointerEvents = 'auto'; 
btn.style.display = 'none'; 
document.body.appendChild(btn);
  }
  
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && currentMode !== 'normal' && currentMode !== 'tv') {
    exitCurrentMode();
  }
});
}

function setupCameraToggle() {
  const toggleSwitch = document.getElementById('toggleSwitch');
  const toggleContainer = document.querySelector('.toggle-container');
  
  if (!toggleSwitch) return;
  
  toggleContainer.addEventListener('click', () => {
    cameraControlEnabled = !cameraControlEnabled;
    
    if (cameraControlEnabled) {
      toggleSwitch.classList.add('active');
      controls.enabled = true;
      controls.enablePan = true;
      controls.enableZoom = true;
      controls.enableRotate = true;
      controls.enableDamping = true;
    } else {
      toggleSwitch.classList.remove('active');
      
      controls.enabled = false;
      controls.enablePan = false;
      controls.enableZoom = false;
      controls.enableRotate = false;

      animateCameraTo(
        normalModeCameraPos.x, normalModeCameraPos.y, normalModeCameraPos.z,
        normalModeCameraTarget.x, normalModeCameraTarget.y, normalModeCameraTarget.z
      );
      
    }
  });

}

function setupMobileControls() {
  // Detect mobile
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                   ('ontouchstart' in window) || 
                   (navigator.maxTouchPoints > 0);
  
  if (!isMobile) return;
  
  if (document.documentElement.requestFullscreen) {
    document.documentElement.requestFullscreen().catch(err => {
    });
  }
  
  // Create mobile control container (BOTTOM CORNERS ONLY)
  const mobileControls = document.createElement('div');
  mobileControls.id = 'mobileControls';
  mobileControls.style.cssText = `
    position: fixed;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: none;
    pointer-events: none;
    z-index: 1000;
  `;
  
  // LEFT CORNER: D-pad container (4-directional)
  const dpadContainer = document.createElement('div');
  dpadContainer.id = 'dpadContainer';
  dpadContainer.style.cssText = `
    position: absolute;
    bottom: 30px;
    left: 30px;
    display: grid;
    grid-template-columns: repeat(3, 60px);
    grid-template-rows: repeat(3, 60px);
    gap: 8px;
    pointer-events: auto;
  `;
  
  const dpadButtons = {
    up: { row: 1, col: 2, symbol: '▲', keys: ['w', 'ArrowUp'], id: 'btnUp' },
    left: { row: 2, col: 1, symbol: '◄', keys: ['a', 'ArrowLeft'], id: 'btnLeft' },
    down: { row: 3, col: 2, symbol: '▼', keys: ['s', 'ArrowDown'], id: 'btnDown' },
    right: { row: 2, col: 3, symbol: '►', keys: ['d', 'ArrowRight'], id: 'btnRight' }
  };
  
  Object.entries(dpadButtons).forEach(([dir, config]) => {
    const btn = document.createElement('button');
    btn.id = config.id;
    btn.className = 'mobile-btn dpad-btn';
    btn.textContent = config.symbol;
    btn.style.cssText = `
      grid-row: ${config.row};
      grid-column: ${config.col};
      width: 60px;
      height: 60px;
      border-radius: 12px;
      background: linear-gradient(135deg, rgba(94, 231, 223, 0.25) 0%, rgba(94, 200, 223, 0.2) 100%);
      border: 2px solid rgba(94, 231, 223, 0.5);
      color: #5ee7df;
      font-size: 24px;
      font-weight: bold;
      cursor: pointer;
      transition: all 0.15s ease;
      backdrop-filter: blur(10px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      user-select: none;
      -webkit-tap-highlight-color: transparent;
      pointer-events: auto;
    `;
    
    btn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      btn.style.background = 'linear-gradient(135deg, rgba(94, 231, 223, 0.6) 0%, rgba(94, 200, 223, 0.5) 100%)';
      btn.style.transform = 'scale(0.95)';
      config.keys.forEach(key => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
      });
    });
    
    btn.addEventListener('touchend', (e) => {
      e.preventDefault();
      btn.style.background = 'linear-gradient(135deg, rgba(94, 231, 223, 0.25) 0%, rgba(94, 200, 223, 0.2) 100%)';
      btn.style.transform = 'scale(1)';
      config.keys.forEach(key => {
        window.dispatchEvent(new KeyboardEvent('keyup', { key, bubbles: true }));
      });
    });
    
    dpadContainer.appendChild(btn);
  });
  
  // RIGHT CORNER: Action buttons container
  const actionContainer = document.createElement('div');
  actionContainer.id = 'actionContainer';
  actionContainer.style.cssText = `
    position: absolute;
    bottom: 30px;
    right: 30px;
    display: flex;
    flex-direction: column;
    gap: 15px;
    align-items: center;
    pointer-events: auto;
  `;
  
  // ENTER button (for menu navigation)
  const enterBtn = document.createElement('button');
  enterBtn.id = 'btnEnter';
  enterBtn.className = 'mobile-btn action-btn';
  enterBtn.textContent = 'ENTER';
  enterBtn.style.cssText = `
    width: 120px;
    height: 55px;
    border-radius: 12px;
    background: linear-gradient(135deg, rgba(94, 231, 223, 0.3) 0%, rgba(94, 200, 223, 0.25) 100%);
    border: 2px solid rgba(94, 231, 223, 0.6);
    color: #5ee7df;
    font-size: 16px;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.15s ease;
    backdrop-filter: blur(10px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    user-select: none;
    -webkit-tap-highlight-color: transparent;
    letter-spacing: 2px;
    pointer-events: auto;
  `;
  
  enterBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    enterBtn.style.background = 'linear-gradient(135deg, rgba(94, 231, 223, 0.7) 0%, rgba(94, 200, 223, 0.6) 100%)';
    enterBtn.style.transform = 'scale(0.95)';
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  });
  
  enterBtn.addEventListener('touchend', (e) => {
    e.preventDefault();
    enterBtn.style.background = 'linear-gradient(135deg, rgba(94, 231, 223, 0.3) 0%, rgba(94, 200, 223, 0.25) 100%)';
    enterBtn.style.transform = 'scale(1)';
  });
  
  // FIRE button (for Space Invaders - hidden by default)
  const fireBtn = document.createElement('button');
  fireBtn.id = 'btnFire';
  fireBtn.className = 'mobile-btn action-btn';
  fireBtn.textContent = 'FIRE';
  fireBtn.style.cssText = `
    width: 120px;
    height: 55px;
    border-radius: 12px;
    background: linear-gradient(135deg, rgba(255, 68, 68, 0.3) 0%, rgba(255, 100, 100, 0.25) 100%);
    border: 2px solid rgba(255, 68, 68, 0.6);
    color: #ff4444;
    font-size: 16px;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.15s ease;
    backdrop-filter: blur(10px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    user-select: none;
    -webkit-tap-highlight-color: transparent;
    letter-spacing: 2px;
    pointer-events: auto;
    display: none;
  `;
  
  fireBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    fireBtn.style.background = 'linear-gradient(135deg, rgba(255, 68, 68, 0.7) 0%, rgba(255, 100, 100, 0.6) 100%)';
    fireBtn.style.transform = 'scale(0.95)';
    window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
  });
  
  fireBtn.addEventListener('touchend', (e) => {
    e.preventDefault();
    fireBtn.style.background = 'linear-gradient(135deg, rgba(255, 68, 68, 0.3) 0%, rgba(255, 100, 100, 0.25) 100%)';
    fireBtn.style.transform = 'scale(1)';
  });
  
  // ROTATE button (for Tetris - hidden by default)
  const rotateBtn = document.createElement('button');
  rotateBtn.id = 'btnRotate';
  rotateBtn.className = 'mobile-btn action-btn';
  rotateBtn.textContent = 'ROTATE';
  rotateBtn.style.cssText = `
    width: 120px;
    height: 55px;
    border-radius: 12px;
    background: linear-gradient(135deg, rgba(255, 170, 0, 0.3) 0%, rgba(255, 200, 0, 0.25) 100%);
    border: 2px solid rgba(255, 170, 0, 0.6);
    color: #ffaa00;
    font-size: 14px;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.15s ease;
    backdrop-filter: blur(10px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    user-select: none;
    -webkit-tap-highlight-color: transparent;
    letter-spacing: 1px;
    pointer-events: auto;
    display: none;
  `;
  
  rotateBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    rotateBtn.style.background = 'linear-gradient(135deg, rgba(255, 170, 0, 0.7) 0%, rgba(255, 200, 0, 0.6) 100%)';
    rotateBtn.style.transform = 'scale(0.95)';
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'w', bubbles: true }));
  });
  
  rotateBtn.addEventListener('touchend', (e) => {
    e.preventDefault();
    rotateBtn.style.background = 'linear-gradient(135deg, rgba(255, 170, 0, 0.3) 0%, rgba(255, 200, 0, 0.25) 100%)';
    rotateBtn.style.transform = 'scale(1)';
  });
  
  // RETRY button (hidden by default, shown on game over)
  const retryBtn = document.createElement('button');
  retryBtn.id = 'btnRetry';
  retryBtn.className = 'mobile-btn';
  retryBtn.textContent = 'RETRY';
  retryBtn.style.cssText = `
    position: absolute;
    bottom: 30px;
    left: 50%;
    transform: translateX(-50%);
    width: 140px;
    height: 60px;
    border-radius: 12px;
    background: linear-gradient(135deg, rgba(0, 255, 136, 0.4) 0%, rgba(0, 200, 136, 0.3) 100%);
    border: 3px solid rgba(0, 255, 136, 0.8);
    color: #00ff88;
    font-size: 18px;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.15s ease;
    backdrop-filter: blur(10px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    user-select: none;
    -webkit-tap-highlight-color: transparent;
    letter-spacing: 2px;
    pointer-events: auto;
    display: none;
  `;
  
  retryBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    retryBtn.style.background = 'linear-gradient(135deg, rgba(0, 255, 136, 0.8) 0%, rgba(0, 200, 136, 0.7) 100%)';
    retryBtn.style.transform = 'translateX(-50%) scale(0.95)';
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'r', bubbles: true }));
  });
  
  retryBtn.addEventListener('touchend', (e) => {
    e.preventDefault();
    retryBtn.style.background = 'linear-gradient(135deg, rgba(0, 255, 136, 0.4) 0%, rgba(0, 200, 136, 0.3) 100%)';
    retryBtn.style.transform = 'translateX(-50%) scale(1)';
  });
  
  actionContainer.appendChild(enterBtn);
  actionContainer.appendChild(fireBtn);
  actionContainer.appendChild(rotateBtn);
  
  mobileControls.appendChild(dpadContainer);
  mobileControls.appendChild(actionContainer);
  mobileControls.appendChild(retryBtn);
  document.body.appendChild(mobileControls);
  
  // Global functions to show/hide/customize controls
  window.showMobileControls = (mode = 'default') => {
    mobileControls.style.display = 'block';
    
    // Hide ALL buttons first (clean slate)
    document.getElementById('btnUp').style.display = 'none';
    document.getElementById('btnDown').style.display = 'none';
    document.getElementById('btnLeft').style.display = 'none';
    document.getElementById('btnRight').style.display = 'none';
    document.getElementById('btnEnter').style.display = 'none';
    document.getElementById('btnFire').style.display = 'none';
    document.getElementById('btnRotate').style.display = 'none';
    document.getElementById('btnRetry').style.display = 'none';
    
    // Customize based on mode
    if (mode === 'menu') {
      // Menu: Only LEFT, RIGHT, ENTER
      document.getElementById('btnLeft').style.display = 'block';
      document.getElementById('btnRight').style.display = 'block';
      document.getElementById('btnEnter').style.display = 'block';
    } else if (mode === 'snake') {
      // Snake: All 4 directions, no ENTER
      document.getElementById('btnUp').style.display = 'block';
      document.getElementById('btnDown').style.display = 'block';
      document.getElementById('btnLeft').style.display = 'block';
      document.getElementById('btnRight').style.display = 'block';
    } else if (mode === 'pong') {
      // Pong: Only UP, DOWN
      document.getElementById('btnUp').style.display = 'block';
      document.getElementById('btnDown').style.display = 'block';
    } else if (mode === 'tetris') {
      // Tetris: LEFT, RIGHT, DOWN, ROTATE
      document.getElementById('btnLeft').style.display = 'block';
      document.getElementById('btnRight').style.display = 'block';
      document.getElementById('btnDown').style.display = 'block';
      document.getElementById('btnRotate').style.display = 'block';
    } else if (mode === 'invaders') {
      // Space Invaders: LEFT, RIGHT, FIRE
      document.getElementById('btnLeft').style.display = 'block';
      document.getElementById('btnRight').style.display = 'block';
      document.getElementById('btnFire').style.display = 'block';
    }
  };
  
  window.hideMobileControls = () => {
    mobileControls.style.display = 'none';
  };
  
  window.showRetryButton = () => {
    // Hide all game buttons
    document.getElementById('btnUp').style.display = 'none';
    document.getElementById('btnDown').style.display = 'none';
    document.getElementById('btnLeft').style.display = 'none';
    document.getElementById('btnRight').style.display = 'none';
    document.getElementById('btnEnter').style.display = 'none';
    document.getElementById('btnFire').style.display = 'none';
    document.getElementById('btnRotate').style.display = 'none';
    
    // Show retry button
    document.getElementById('btnRetry').style.display = 'block';
  };
}

function setupDialogueSystem() {
  dialogueBox = document.createElement('div');
  dialogueBox.id = 'dialogueBox';
  dialogueBox.style.cssText = `
    position: fixed;
    padding: 35px 40px 30px 40px;
    background: linear-gradient(145deg, rgba(20, 20, 35, 0.98) 0%, rgba(25, 25, 45, 0.95) 100%);
    backdrop-filter: blur(25px) saturate(180%);
    border: 2px solid;
    border-image: linear-gradient(135deg, rgba(94, 231, 223, 0.8), rgba(180, 144, 202, 0.6)) 1;
    border-radius: 15px;
    color: #e8e8e8;
    font-family: 'Courier New', 'Courier', monospace;
    font-size: 18px;
    font-weight: 400;
    line-height: 1.9;
    max-width: 420px;
    min-width: 350px;
    z-index: 999;
    opacity: 0;
    pointer-events: none;
    transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 25px 70px rgba(0, 0, 0, 0.8), 
                inset 0 1px 0 rgba(255, 255, 255, 0.05),
                0 0 40px rgba(94, 231, 223, 0.15);
  `;
  
  dialogueText = document.createElement('p');
  dialogueText.style.cssText = `
    margin: 0 0 15px 0;
    min-height: 90px;
    font-weight: 400;
    letter-spacing: 0.8px;
    color: #f0f0f0;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  `;
  
  dialogueClickPrompt = document.createElement('div');
  dialogueClickPrompt.style.cssText = `
    text-align: center;
    color: rgba(94, 231, 223, 0.85);
    font-size: 13px;
    font-weight: 400;
    font-family: 'Segoe UI', sans-serif;
    margin-top: 12px;
    opacity: 0;
    animation: gentlePulse 2.5s ease-in-out infinite;
    letter-spacing: 1.5px;
    text-transform: uppercase;
  `;
  dialogueClickPrompt.textContent = 'Click to continue';
  
// Create X button for mode dialogues
  const closeBtn = document.createElement('button');
  closeBtn.id = 'dialogueCloseBtn';
  closeBtn.innerHTML = '×';
  closeBtn.style.cssText = `
  position: absolute;
  top: 8px;
  right: 8px;
  width: 32px;
  height: 32px;
  border: 2px solid rgba(94, 231, 223, 0.6);
  background: rgba(94, 231, 223, 0.25);
  color: #5ee7df;
  font-size: 24px;
  cursor: pointer;
  border-radius: 50%;
  display: none;
  transition: all 0.3s ease;
  line-height: 1;
  padding: 0;
  z-index: 1;
  pointer-events: auto;
`;

  closeBtn.addEventListener('mouseenter', () => {
    closeBtn.style.background = 'rgba(94, 231, 223, 0.6)';
    closeBtn.style.transform = 'scale(1.1)';
  });
  closeBtn.addEventListener('mouseleave', () => {
    closeBtn.style.background = 'rgba(94, 231, 223, 0.3)';
    closeBtn.style.transform = 'scale(1)';
  });
  
closeBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  e.preventDefault();
  dialogueBox.style.pointerEvents = 'auto';
  

  if (currentMode === 'laptop' || currentMode === 'frame' || currentMode === 'chess' || currentMode === 'family') {
    hideModeDialogue();
  } else {
    hideModeDialogue();
  }
});
  
  const style = document.createElement('style');
  style.textContent = `
    @keyframes gentlePulse {
      0%, 100% { opacity: 0.5; }
      50% { opacity: 0.9; }
    }
  `;
  document.head.appendChild(style);
  
dialogueBox.appendChild(dialogueText);
  dialogueBox.appendChild(dialogueClickPrompt);
  dialogueBox.appendChild(closeBtn); // ← X button INSIDE dialogue box
  document.body.appendChild(dialogueBox);
  
  setupUniversalExitButton();
}

function setupCertificateBoard() {
  certificateBoard = document.createElement('div');
  certificateBoard.id = 'certificateBoard';
  certificateBoard.style.cssText = `
    position: fixed;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%) scale(0.8);
    width: 700px;
    max-width: 90vw;
    max-height: 80vh;
    background: linear-gradient(145deg, rgba(15, 15, 25, 0.98) 0%, rgba(20, 20, 35, 0.95) 100%);
    backdrop-filter: blur(25px) saturate(180%);
    border: 3px solid;
    border-image: linear-gradient(135deg, rgba(94, 231, 223, 0.9), rgba(180, 144, 202, 0.7)) 1;
    border-radius: 20px;
    padding: 40px 35px;
    z-index: 10000;
    opacity: 0;
    pointer-events: none;
    transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 30px 90px rgba(0, 0, 0, 0.9), 
                inset 0 1px 0 rgba(255, 255, 255, 0.08),
                0 0 60px rgba(94, 231, 223, 0.2);
    overflow: hidden;
  `;
  
  // Create title
  const title = document.createElement('h2');
  title.style.cssText = `
    margin: 0 0 25px 0;
    font-family: 'Courier New', monospace;
    font-size: 28px;
    font-weight: bold;
    text-align: center;
    color: #5ee7df;
    text-shadow: 0 0 20px rgba(94, 231, 223, 0.5);
    letter-spacing: 2px;
    text-transform: uppercase;
  `;
  title.textContent = 'My Certificates';
  
  const scrollContainer = document.createElement('div');
  scrollContainer.style.cssText = `
    max-height: calc(80vh - 140px);
    overflow-y: auto;
    padding-right: 15px;
    scrollbar-width: thin;
    scrollbar-color: rgba(94, 231, 223, 0.5) rgba(255, 255, 255, 0.1);
  `;
  
  const style = document.createElement('style');
  style.textContent = `
    #certificateBoard div::-webkit-scrollbar {
      width: 8px;
    }
    #certificateBoard div::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.05);
      border-radius: 10px;
    }
    #certificateBoard div::-webkit-scrollbar-thumb {
      background: rgba(94, 231, 223, 0.5);
      border-radius: 10px;
    }
    #certificateBoard div::-webkit-scrollbar-thumb:hover {
      background: rgba(94, 231, 223, 0.8);
    }
  `;
  document.head.appendChild(style);
  
  certificates.forEach((cert, index) => {
  const card = document.createElement('div');
  card.style.cssText = `
    background: linear-gradient(135deg, rgba(94, 231, 223, 0.08) 0%, rgba(180, 144, 202, 0.08) 100%);
    border: 2px solid rgba(94, 231, 223, 0.3);
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 18px;
    transition: all 0.3s ease;
    cursor: ${cert.link ? 'pointer' : 'default'};
  `;
  
  // Make entire card clickable if link exists
  if (cert.link) {
    card.addEventListener('click', () => {
      window.open(cert.link, '_blank');
    });
  }
  
  card.addEventListener('mouseenter', () => {
    card.style.borderColor = 'rgba(94, 231, 223, 0.8)';
    card.style.transform = 'translateX(5px)';
    card.style.boxShadow = '0 10px 30px rgba(94, 231, 223, 0.2)';
  });
  
  card.addEventListener('mouseleave', () => {
    card.style.borderColor = 'rgba(94, 231, 223, 0.3)';
    card.style.transform = 'translateX(0)';
    card.style.boxShadow = 'none';
  });
  
  const certTitle = document.createElement('h3');
  certTitle.style.cssText = `
    margin: 0 0 8px 0;
    font-family: 'Courier New', monospace;
    font-size: 20px;
    font-weight: bold;
    color: #5ee7df;
    text-shadow: 0 0 10px rgba(94, 231, 223, 0.3);
    display: flex;
    align-items: center;
    gap: 8px;
  `;
  certTitle.textContent = cert.title;
  
  // Add link icon if URL exists
  if (cert.link) {
    const linkIcon = document.createElement('span');
    linkIcon.innerHTML = '🔗';
    linkIcon.style.cssText = `
      font-size: 16px;
      opacity: 0.7;
    `;
    certTitle.appendChild(linkIcon);
  }
  
  const certIssuer = document.createElement('div');
  certIssuer.style.cssText = `
    margin: 0 0 6px 0;
    font-family: 'Segoe UI', sans-serif;
    font-size: 14px;
    color: rgba(180, 144, 202, 0.9);
    font-weight: 600;
  `;
  certIssuer.textContent = cert.issuer;
  
  const certDesc = document.createElement('p');
  certDesc.style.cssText = `
    margin: 0;
    font-family: 'Segoe UI', sans-serif;
    font-size: 15px;
    line-height: 1.6;
    color: rgba(255, 255, 255, 0.8);
  `;
  certDesc.textContent = cert.description;
  
  card.appendChild(certTitle);
  card.appendChild(certIssuer);
  card.appendChild(certDesc);
  scrollContainer.appendChild(card);
});
  
  const closeBtn = document.createElement('button');
  closeBtn.innerHTML = '×';
  closeBtn.style.cssText = `
    position: absolute;
    top: 15px;
    right: 15px;
    width: 40px;
    height: 40px;
    border: 2px solid rgba(94, 231, 223, 0.6);
    background: rgba(94, 231, 223, 0.2);
    color: #5ee7df;
    font-size: 28px;
    cursor: pointer;
    border-radius: 50%;
    transition: all 0.3s ease;
    line-height: 1;
    padding: 0;
    font-weight: bold;
  `;
  
  closeBtn.addEventListener('mouseenter', () => {
    closeBtn.style.background = 'rgba(94, 231, 223, 0.6)';
    closeBtn.style.transform = 'scale(1.1) rotate(90deg)';
  });
  
  closeBtn.addEventListener('mouseleave', () => {
    closeBtn.style.background = 'rgba(94, 231, 223, 0.2)';
    closeBtn.style.transform = 'scale(1) rotate(0deg)';
  });
  
  closeBtn.addEventListener('click', hideCertificateBoard);
  
  certificateBoard.appendChild(title);
  certificateBoard.appendChild(scrollContainer);
  certificateBoard.appendChild(closeBtn);
  document.body.appendChild(certificateBoard);
}

function showCertificateBoard() {
  if (!certificateBoard) return;
  
  certificateBoardVisible = true;
  certificateBoard.style.display = 'block';
  certificateBoard.style.pointerEvents = 'auto';
  
  setTimeout(() => {
    certificateBoard.style.opacity = '1';
    certificateBoard.style.transform = 'translate(-50%, -50%) scale(1)';
  }, 100);
}

function hideCertificateBoard() {
  if (!certificateBoard) return;
  
  certificateBoardVisible = false;
  certificateBoard.style.opacity = '0';
  certificateBoard.style.transform = 'translate(-50%, -50%) scale(0.8)';
  certificateBoard.style.pointerEvents = 'none';
  
  setTimeout(() => {
    certificateBoard.style.display = 'none';
  }, 600);
}

function playBoardAudio(audioFile) {
  if (boardAudio) {
    boardAudio.pause();
    boardAudio.currentTime = 0;
  }
  
  boardAudio = new Audio(audioFile);
  boardAudio.volume = 0.5; 
  
  boardAudio.addEventListener('error', (e) => {
    console.log('Board audio not available:', audioFile);
  });
  
  boardAudio.play().catch(err => {
    console.log('Audio playback not available');
  });
}

function setupRadioPanel() {
  const radioBackdrop = document.createElement('div');
  radioBackdrop.id = 'radioBackdrop';
  radioBackdrop.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(8px);
    z-index: 10000;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.6s ease;
  `;
  document.body.appendChild(radioBackdrop);
  radioPanel = document.createElement('div');
  radioPanel.id = 'radioPanel';
  
  radioPanel.innerHTML = `
    <div class="radio-header">
      <h2>RADIO</h2>
      <div class="subtitle">Vintage Sound System</div>
    </div>
    
    <div class="track-display">
      <div class="track-name" id="currentTrackName">Track 1</div>
    </div>
    
    <div class="radio-controls">
      <div class="knob-container">
        <div class="knob-label">Volume</div>
        <div class="radio-knob" id="volumeKnob">
          <div class="knob-pointer"></div>
          <div class="knob-center"></div>
        </div>
        <div class="volume-indicator" id="volumePercent">60%</div>
      </div>
      
      <div class="button-container">
        <button class="radio-button power-btn" id="powerBtn" title="Power On/Off">
          <span>⏻</span>
        </button>
        <button class="radio-button" id="prevBtn" title="Previous Track">
          <span>◄</span>
        </button>
        <button class="radio-button" id="nextBtn" title="Next Track">
          <span>►</span>
        </button>
      </div>
      
      <div class="knob-container">
        <div class="knob-label">Tune</div>
        <div class="radio-knob" id="tuneKnob">
          <div class="knob-pointer"></div>
          <div class="knob-center"></div>
        </div>
      </div>
    </div>
    
    <button id="radioPanelClose">×</button>
  `;
  
  document.body.appendChild(radioPanel);
  
  // Setup event listeners
  volumeKnob = document.getElementById('volumeKnob');
  tuneKnob = document.getElementById('tuneKnob');
  
  // Volume knob drag
  volumeKnob.addEventListener('mousedown', (e) => {
    isDraggingVolume = true;
    startAngle = getAngle(e, volumeKnob);
  });
  
  // Tune knob drag (switches tracks)
  tuneKnob.addEventListener('mousedown', (e) => {
    isDraggingTune = true;
    startAngle = getAngle(e, tuneKnob);
  });
  
  document.addEventListener('mousemove', (e) => {
    if (isDraggingVolume) {
      const angle = getAngle(e, volumeKnob);
      const delta = angle - startAngle;
      startAngle = angle;
      
      if (window.audioManager) {
        const currentVol = window.audioManager.getVolume();
        const newVol = Math.max(0, Math.min(1, currentVol + delta / 360));
        window.audioManager.setVolumeInstant(newVol); // ← CHANGED: Use instant method
        updateVolumeDisplay(newVol);
        rotateKnob(volumeKnob, newVol * 270 - 135);
      }
    } else if (isDraggingTune) {
      const angle = getAngle(e, tuneKnob);
      const delta = angle - startAngle;
      
      if (Math.abs(delta) > 30) {
        if (delta > 0 && window.audioManager) {
          window.audioManager.nextTrack(); 
          updateTrackDisplay();
        } else if (delta < 0 && window.audioManager) {
          window.audioManager.prevTrack(); 
          updateTrackDisplay(); 
        }
        startAngle = angle;
      }
    }
  });
  
  document.addEventListener('mouseup', () => {
    isDraggingVolume = false;
    isDraggingTune = false;
  });
  
  // Button listeners
  document.getElementById('powerBtn').addEventListener('click', () => {
    const btn = document.getElementById('powerBtn');
    if (window.audioManager) {
      if (window.audioManager.isPlaying) {
        window.audioManager.pause();
        btn.classList.remove('active');
      } else {
        window.audioManager.play();
        btn.classList.add('active');
      }
    }
  });
  
 document.getElementById('prevBtn').addEventListener('click', () => {
    if (window.audioManager) {
      window.audioManager.prevTrack(); 
      updateTrackDisplay(); 
    }
  });
  
  document.getElementById('nextBtn').addEventListener('click', () => {
    if (window.audioManager) {
      window.audioManager.nextTrack();  
      updateTrackDisplay();  
    }
  });
  
  document.getElementById('radioPanelClose').addEventListener('click', hideRadioPanel);
  
  // Initialize power button state
  if (window.audioManager && window.audioManager.isPlaying) {
    document.getElementById('powerBtn').classList.add('active');
  }
}

function getAngle(event, element) {
  const rect = element.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const angle = Math.atan2(event.clientY - centerY, event.clientX - centerX);
  return angle * (180 / Math.PI);
}

function rotateKnob(knob, degrees) {
  const pointer = knob.querySelector('.knob-pointer');
  if (pointer) {
    pointer.style.transform = `translateX(-50%) rotate(${degrees}deg)`;
    pointer.style.transformOrigin = 'center bottom';
  }
}

function updateVolumeDisplay(volume) {
  const percent = document.getElementById('volumePercent');
  if (percent) {
    percent.textContent = Math.round(volume * 100) + '%';
  }
}

function updateTrackDisplay() {
  const trackName = document.getElementById('currentTrackName');
  if (trackName && window.audioManager) {
    const track = window.audioManager.getCurrentTrack();
    
    trackName.style.animation = 'none';
    trackName.offsetHeight; 
    trackName.style.animation = 'trackChange 0.4s ease';

    trackName.textContent = track.name;
  }
}

function showRadioPanel() {
  if (!radioPanel) return;
  
  // Block shelf scrolling and all interactions
  const backdrop = document.getElementById('radioBackdrop');
  if (backdrop) {
    backdrop.style.opacity = '1';
    backdrop.style.pointerEvents = 'auto';
  }
  
  // Disable shelf scrolling
  window.removeEventListener('wheel', onMouseWheel);
  window.removeEventListener('keydown', onKeyDown);
  hoverEnabled = false;
  
  // Hide universal exit button temporarily
  const exitBtn = document.getElementById('universalExitBtn');
  if (exitBtn) exitBtn.style.pointerEvents = 'none';
  
  radioPanel.style.zIndex = '10001'; // Above backdrop
  radioPanel.classList.add('active');
  
  // Update displays
  if (window.audioManager) {
    const volume = window.audioManager.getVolume();
    updateVolumeDisplay(volume);
    rotateKnob(volumeKnob, volume * 270 - 135);
    updateTrackDisplay();
    
    if (window.audioManager.isPlaying) {
      document.getElementById('powerBtn').classList.add('active');
    }
  }
}

function hideRadioPanel() {
  if (!radioPanel) return;
  
  // Hide backdrop
  const backdrop = document.getElementById('radioBackdrop');
  if (backdrop) {
    backdrop.style.opacity = '0';
    backdrop.style.pointerEvents = 'none';
  }
  
  // Re-enable shelf scrolling
  window.addEventListener('wheel', onMouseWheel, { passive: false });
  window.addEventListener('keydown', onKeyDown);
  hoverEnabled = true;
  
  // Re-enable universal exit button
  const exitBtn = document.getElementById('universalExitBtn');
  if (exitBtn) exitBtn.style.pointerEvents = 'auto';
  
  radioPanel.classList.remove('active');
}

function showIntroDialogue() {
  hasSeenIntroDialogue = true;
  currentDialogueIndex = 0;
  normalModeInteractionBlocked = true; // Block interactions
  
  // Disable controls during dialogue
  controls.enabled = false;
  
  // Center position
  dialogueBox.style.left = '50%';
  dialogueBox.style.top = '50%';
  dialogueBox.style.right = 'auto';
  dialogueBox.style.bottom = 'auto';
  dialogueBox.style.transform = 'translate(-50%, -50%) scale(0.9)';
  dialogueBox.style.opacity = '0';
  dialogueBox.style.pointerEvents = 'auto';
  dialogueBox.style.cursor = 'pointer';
  
  // Show click prompt for intro dialogue
  dialogueClickPrompt.style.display = 'block';
  
  // Animate in
  setTimeout(() => {
    dialogueBox.style.opacity = '1';
    dialogueBox.style.transform = 'translate(-50%, -50%) scale(1)';
  }, 100);
  
  typewriterEffect(introDialogues[0]);
  
  // Click to advance dialogue
  dialogueBox.onclick = advanceIntroDialogue;
}

function advanceIntroDialogue() {
  // Prevent spam clicking
  if (isCameraAnimating) return;
  
  // If typing, complete it instantly
  if (isTyping) {
    completeTyping();
    return;
  }
  
  currentDialogueIndex++;
  
  if (currentDialogueIndex < introDialogues.length) {
    // Prevent further clicks during transition
    dialogueBox.style.pointerEvents = 'none';
    
    // Fade out current text
    dialogueText.style.opacity = '0';
    dialogueText.style.transition = 'opacity 0.4s';
    
    setTimeout(() => {
      typewriterEffect(introDialogues[currentDialogueIndex]);
      dialogueText.style.opacity = '1';
      // Re-enable clicks after text appears
      dialogueBox.style.pointerEvents = 'auto';
    }, 400);
  } else {
    // Final click - hide dialogue box
    hideDialogueBox();
    dialogueBox.onclick = null;
    normalModeInteractionBlocked = false;
    controls.enabled = true;
  }
}
function hideDialogueBox() {
  dialogueBox.style.opacity = '0';
  dialogueBox.style.transform = dialogueBox.style.transform.replace('scale(1)', 'scale(0.9)');
  dialogueBox.style.pointerEvents = 'none';
  
  setTimeout(() => {
    dialogueBox.style.display = 'none';
  }, 800);
}

function showModeDialogue(mode) {
  if (!dialogueContent[mode]) return;
  
  // CRITICAL: Clear any old content and reset completely
  dialogueText.textContent = '';
  if (typingTimeout) {
    clearTimeout(typingTimeout);
    isTyping = false;
  }
  
  // Reset for new dialogue
  dialogueBox.style.display = 'block';
  dialogueBox.style.cursor = 'default';
  dialogueBox.onclick = null;
  
  if (mode === 'laptop') {
  dialogueBox.style.pointerEvents = 'auto';
  dialogueBox.style.zIndex = '10001'; // Above laptop screen (which is 10000)
} else {
  dialogueBox.style.pointerEvents = 'auto';
  dialogueBox.style.zIndex = '999';
}

  // Hide click prompt for mode dialogues
  dialogueClickPrompt.style.display = 'none';
  
// Smaller size for mode dialogues
  const isBottomMode = (mode === 'laptop');

  // Show X button for mode dialogues (now inside dialogue box)
  const closeBtn = document.getElementById('dialogueCloseBtn');
  if (closeBtn) {
    closeBtn.style.display = 'block';
  }

  dialogueBox.style.maxWidth = '320px';
  dialogueBox.style.minWidth = '280px';
  dialogueBox.style.padding = '25px 30px 20px 30px';
  dialogueBox.style.fontSize = '16px';
  dialogueText.style.minHeight = '60px';
  
  // Position based on mode
  if (isBottomMode) {
    // Bottom center for ONLY laptop mode
    dialogueBox.style.left = '50%';
    dialogueBox.style.right = 'auto';
    dialogueBox.style.top = 'auto';
    dialogueBox.style.bottom = '40px';
    dialogueBox.style.transform = 'translateX(-50%) scale(0.95)';
  } else {
    dialogueBox.style.top = '50%';
    dialogueBox.style.bottom = 'auto';
    dialogueBox.style.transform = 'translateY(-50%) scale(0.95)';
    
    if (mode === 'sofa') {
      // Left side - ONLY sofa
      dialogueBox.style.left = '40px';
      dialogueBox.style.right = 'auto';
    } else {
      // Right side - desk, chess, family, frame
      dialogueBox.style.left = 'auto';
      dialogueBox.style.right = '40px';
    }
  }
  
  // Theme colors
  if (mode === 'sofa') {
    dialogueBox.style.borderImage = 'linear-gradient(135deg, rgba(94, 180, 223, 0.85), rgba(100, 150, 220, 0.7)) 1';
    dialogueBox.style.background = 'linear-gradient(145deg, rgba(20, 30, 50, 0.98) 0%, rgba(25, 40, 65, 0.95) 100%)';
    dialogueBox.style.boxShadow = '0 25px 70px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 0 40px rgba(94, 180, 223, 0.25)';
  } else {
    dialogueBox.style.borderImage = 'linear-gradient(135deg, rgba(94, 231, 223, 0.8), rgba(180, 144, 202, 0.6)) 1';
    dialogueBox.style.background = 'linear-gradient(145deg, rgba(20, 20, 35, 0.98) 0%, rgba(25, 25, 45, 0.95) 100%)';
    dialogueBox.style.boxShadow = '0 25px 70px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 0 40px rgba(94, 231, 223, 0.15)';
  }
  
  setTimeout(() => {
    dialogueBox.style.opacity = '1';
    dialogueBox.style.transform = dialogueBox.style.transform.replace('scale(0.95)', 'scale(1)');
    typewriterEffect(dialogueContent[mode]);
  }, 400);
}

function hideModeDialogue() {
  // Clear any ongoing typing immediately
  if (typingTimeout) {
    clearTimeout(typingTimeout);
    isTyping = false;
  }
  
  // Clear text content immediately
  dialogueText.textContent = '';
  
  // Force immediate hiding with no delays
  dialogueBox.style.opacity = '0';
  dialogueBox.style.pointerEvents = 'none';
  dialogueBox.style.display = 'none';
  dialogueBox.style.transform = 'translate(-50%, -50%) scale(0.95)'; // Reset transform completely
  
  // Hide close button too
  const closeBtn = document.getElementById('dialogueCloseBtn');
  if (closeBtn) closeBtn.style.display = 'none';
  
  // Hide click prompt
  dialogueClickPrompt.style.display = 'none';
}

let typingTimeout = null;
let currentTypingText = '';
let currentTypingIndex = 0;

function completeTyping() {
  if (typingTimeout) {
    clearTimeout(typingTimeout);
  }
  dialogueText.textContent = currentTypingText;
  isTyping = false;
}

function typewriterEffect(text, speed = 20) {
  isTyping = true;
  currentTypingText = text;
  currentTypingIndex = 0;
  dialogueText.textContent = '';
  
  if (typingTimeout) {
    clearTimeout(typingTimeout);
  }
  
  const type = () => {
    if (currentTypingIndex < currentTypingText.length) {
      dialogueText.textContent += currentTypingText.charAt(currentTypingIndex);
      currentTypingIndex++;
      typingTimeout = setTimeout(type, speed);
    } else {
      isTyping = false;
    }
  };
  
  type();
}

function showExitButton() {
  const btn = document.getElementById('universalExitBtn');
  if (btn) {
    btn.style.display = 'block';
  }
}

function hideExitButton() {
  const btn = document.getElementById('universalExitBtn');
  if (btn) {
    btn.style.display = 'none';
  }
}

function exitCurrentMode() {
  // Update background music for mode change
  if (window.audioManager) {
    window.audioManager.updateForMode('normal');
  }
  
  hideModeDialogue();
  
  const cameraToggle = document.getElementById('cameraToggle');
  if (cameraToggle) {
    cameraToggle.classList.remove('active');
  }
  
  // Hide all outlines
  outlineMeshes.forEach(o => (o.visible = false));
  sofaOutlineMeshes.forEach(o => (o.visible = false));
  familyOutlineMeshes.forEach(o => (o.visible = false));
  chessOutlineMeshes.forEach(o => (o.visible = false));
  deskOutlineMeshes.forEach(o => (o.visible = false));
  frameOutlineMeshes.forEach(o => (o.visible = false));
  boardOutlineMeshes.forEach(o => (o.visible = false));
  tvOutlineMeshes.forEach(o => (o.visible = false));
  
  // Reset scales
  laptopTargetScale = 1.0;
  chessTargetScale = 1.0;
  
  if (currentMode === 'laptop') {
    exitLaptopMode();
  } else if (currentMode === 'chess') {
    exitChessMode();
  } else if (currentMode === 'family') {
    exitFamilyMode();
  } else if (currentMode === 'sofa') {
    exitSofaMode();
  } else if (currentMode === 'desk') {
    exitDeskMode();
  } else if (currentMode === 'frame') {
    exitFrameMode();
  } else if (currentMode === 'board') {
    exitBoardMode();
  } else if (currentMode === 'tv') {
    exitTVMode();
  } else if (currentMode === 'shelf') {
    exitShelfMode();
  }
}

function exitLaptopMode() {
  hideModeDialogue();
  
  if (laptopScreen) {
    laptopScreen.deactivate();
  }
  
  currentMode = 'desk';
  previousMode = null;
  hoverEnabled = true;
  
  isCameraAnimating = true;
  isUserInteracting = false;
  
  controls.enabled = false;
  controls.enablePan = false;
  controls.enableZoom = false;
  
  // Animate camera back to desk view
  animateCameraTo(
    -3.2778681575996984, 1.258073897524341, 1.1635086207775198,
    -4.972655773234403, 1.0606562348962882, 1.0511241695012494
  );
  
}

function exitChessMode() {
  hideModeDialogue();
  
  if (chessInteractions) {
    chessInteractions.deselectPiece();
  }
  
  Object.values(squareMarkers).forEach(marker => {
    marker.visible = false;
  });
  
  document.getElementById('chessStatus').classList.remove('active');
  document.getElementById('chessControls').classList.remove('active');
  document.getElementById('chessWelcome').classList.remove('active');
  document.getElementById('chessWelcome').style.display = 'none';
  hidePromotionUI();
  
  // Return to sofa mode
  currentMode = 'sofa';
  previousMode = null;
  hoverEnabled = true;
  isUserInteracting = false;
  
  controls.enabled = false; 
  controls.enablePan = false;
  controls.enableZoom = false;
  
  // Animate camera back to sofa view
  animateCameraTo(
    -2.0817795986579544, 1.002890579523843, 1.326450881697992,
    -2.08570808037242, 0.985057465166684, 2.3500947571065485
  );
  
}

function exitFamilyMode() {
  hideModeDialogue();
  
  // Return to sofa mode
  currentMode = 'sofa';
  previousMode = null;
  hoverEnabled = true;
  isUserInteracting = false;
  
  controls.enabled = false; 
  controls.enablePan = false;
  controls.enableZoom = false;
  
  // Animate camera back to sofa view
  animateCameraTo(
    -2.0817795986579544, 1.002890579523843, 1.326450881697992,
    -2.08570808037242, 0.985057465166684, 2.3500947571065485
  );
  
}

function exitSofaMode() {
  // Hide dialogue
  hideModeDialogue();
  
  // Return to normal mode
  currentMode = 'normal';
  previousMode = null;
  hoverEnabled = true;
  isUserInteracting = false;
  
  controls.enabled = true;
  controls.enablePan = true;
  controls.enableZoom = true;
  hideExitButton();
  
  // Animate camera back to normal view
  animateCameraTo(
  1.8995096440842898, 1.2049732890027314, 1.1057035996481932,
  -0.19339297685447426, 1.0415828316110889, 1.1253654180086836
);
  // Show camera toggle when returning to normal
  const cameraToggle = document.getElementById('cameraToggle');
  if (cameraToggle) {
    cameraToggle.classList.add('active');
  }
}

function exitDeskMode() {
  hideModeDialogue();
  
  // Return to normal mode
  currentMode = 'normal';
  previousMode = null;
  hoverEnabled = true;
  isUserInteracting = false;
  
  controls.enabled = true;
  controls.enablePan = true;
  controls.enableZoom = true;
  hideExitButton();
  
  // Animate camera back to normal view
 animateCameraTo(
  1.8995096440842898, 1.2049732890027314, 1.1057035996481932,
  -0.19339297685447426, 1.0415828316110889, 1.1253654180086836
);
  const cameraToggle = document.getElementById('cameraToggle');
  if (cameraToggle) {
    cameraToggle.classList.add('active');
  }
}

function exitFrameMode() {
  hideModeDialogue();
  
  // Return to desk mode
  currentMode = 'desk';
  previousMode = null;
  hoverEnabled = true;
  
  isCameraAnimating = true;
  isUserInteracting = false;
  
  controls.enabled = false;
  controls.enablePan = false;
  controls.enableZoom = false;
  
  // Animate camera back to desk view
  animateCameraTo(
    -3.2778681575996984, 1.258073897524341, 1.1635086207775198,
    -4.972655773234403, 1.0606562348962882, 1.0511241695012494
  );
}

function exitBoardMode() {
  hideModeDialogue();
  hideCertificateBoard();
  playBoardAudio('./assets/audio/bo2.mp3');
  
  // First animate blocks back to original position
  blockAnimating = true;
  Object.values(blockRotations).forEach(block => {
    block.animating = true;
    block.returning = true; // Flag to indicate returning to original
    block.exitAnimationSpeed = 0.15; 
  });
  
  // Get audio duration dynamically
  const exitAudio = new Audio('./assets/audio/bo2.mp3');
  exitAudio.addEventListener('loadedmetadata', () => {
    const audioDuration = exitAudio.duration * 1000; 
    
    setTimeout(() => {
      // Return to normal mode
      currentMode = 'normal';
      previousMode = null;
      hoverEnabled = false;
      isUserInteracting = false;
      
      controls.enabled = true;
      controls.enablePan = true;
      controls.enableZoom = true;
      hideExitButton();
      
      // Animate camera back to normal view
      animateCameraTo(
  1.8995096440842898, 1.2049732890027314, 1.1057035996481932,
  -0.19339297685447426, 1.0415828316110889, 1.1253654180086836
);
    const cameraToggle = document.getElementById('cameraToggle');
    if (cameraToggle) {
      cameraToggle.classList.add('active');
    }
      
    }, Math.max(audioDuration, 1200)); 
  });
}

function exitTVMode() {
  hideModeDialogue();
  
  if (tvScreen && tvScreen.currentGame) {
    tvScreen.wasInGame = true;
    tvScreen.savedGameState = tvScreen.currentGame;
  } else {
    tvScreen.wasInGame = false;
    tvScreen.savedGameState = null;
  }
  
  if (tvScreen) {
    tvScreen.deactivate();
  }
  
  if (tvScreen && tvScreen.gameMenuBtn) {
    tvScreen.gameMenuBtn.style.display = 'none';
  }
  
  // Hide mobile controls completely
  if (window.hideMobileControls) {
    window.hideMobileControls();
  }
  
  const retryBtn = document.getElementById('btnRetry');
  if (retryBtn) {
    retryBtn.style.display = 'none';
  }
  
  // Return to normal mode
  currentMode = 'normal';
  previousMode = null;
  hoverEnabled = true;
  isUserInteracting = false;
  
  controls.enabled = true;
  controls.enablePan = true;
  controls.enableZoom = true;
  hideExitButton();
  
  // Animate camera back to normal view
  animateCameraTo(
    1.8995096440842898, 1.2049732890027314, 1.1057035996481932,
    -0.19339297685447426, 1.0415828316110889, 1.1253654180086836
  );
  const cameraToggle = document.getElementById('cameraToggle');
  if (cameraToggle) {
    cameraToggle.classList.add('active');
  }
}

function enterShelfMode() {
  currentMode = 'shelf';
  const cameraToggle = document.getElementById('cameraToggle');
  if (cameraToggle) cameraToggle.classList.remove('active');
  previousMode = 'normal';
  hoverEnabled = true;
  shelfOutlineMeshes.forEach(item => (item.mesh.visible = false));
  
  currentShelfPosition = 0;
  targetShelfPosition = 0;
  if (dialogueBox) {
    delete dialogueBox.dataset.currentShelfPosition;
  }
  // Lock camera
  controls.enabled = false;
  controls.enablePan = false;
  controls.enableZoom = false;
  
  showExitButton();
  if (window.audioManager) window.audioManager.updateForMode('shelf');
  // Animate to first position
  const pos = shelfPositions[0];
  animateCameraTo(
    pos.camera.x, pos.camera.y, pos.camera.z,
    pos.target.x, pos.target.y, pos.target.z
  );
  
  // Show first position dialogue after animation
  setTimeout(() => {
    showShelfDialogue(0);
  }, 2500);
}

function exitShelfMode() {
  hideModeDialogue();
  
  // Return to normal mode
  currentMode = 'normal';
  previousMode = null;
  hoverEnabled = true;
  isUserInteracting = false;
  
  controls.enabled = true;
  controls.enablePan = true;
  controls.enableZoom = true;
  hideExitButton();
  
  // Animate camera back to normal view
  animateCameraTo(
  1.8995096440842898, 1.2049732890027314, 1.1057035996481932,
  -0.19339297685447426, 1.0415828316110889, 1.1253654180086836
);
  const cameraToggle = document.getElementById('cameraToggle');
  if (cameraToggle) {
    cameraToggle.classList.add('active');
  }
}

function onMouseWheel(event) {
  if (currentMode !== 'shelf' || isCameraAnimating) return;
  
  event.preventDefault();
  
  const delta = Math.sign(event.deltaY); 
  
  targetShelfPosition += delta * 0.1; // Smooth incremental movement
  targetShelfPosition = Math.max(0, Math.min(4, targetShelfPosition)); // Clamp to bounds
}

function onKeyDown(event) {
  if (currentMode !== 'shelf' || isCameraAnimating) return;

  if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
    event.preventDefault();
    
    const delta = event.key === 'ArrowDown' ? 1 : -1;
    
    targetShelfPosition += delta * 0.1;
    targetShelfPosition = Math.max(0, Math.min(4, targetShelfPosition));
  }
}

function onTouchStart(event) {
  if (currentMode !== 'shelf') return;
  
  shelfTouchStartY = event.touches[0].clientY;
  shelfTouchCurrentY = shelfTouchStartY;
  shelfIsSwiping = true;
}

function onTouchMove(event) {
  if (currentMode !== 'shelf' || !shelfIsSwiping) return;
  
  event.preventDefault();
  
  shelfTouchCurrentY = event.touches[0].clientY;
  const deltaY = shelfTouchStartY - shelfTouchCurrentY;
  const scrollAmount = deltaY / 1000;
  
  targetShelfPosition = currentShelfPosition + scrollAmount;
  targetShelfPosition = Math.max(0, Math.min(4, targetShelfPosition));
}

function onTouchEnd(event) {
  if (currentMode !== 'shelf' || !shelfIsSwiping) return;
  
  shelfIsSwiping = false;
  
  const totalDelta = shelfTouchStartY - shelfTouchCurrentY;
  
  if (Math.abs(totalDelta) > 50) { 
    if (totalDelta > 0) {
      targetShelfPosition = Math.min(4, Math.ceil(currentShelfPosition));
    } else {
      targetShelfPosition = Math.max(0, Math.floor(currentShelfPosition));
    }
  } else {
    targetShelfPosition = Math.round(currentShelfPosition);
  }
}


function updateShelfCamera() {
  if (currentMode !== 'shelf') return;
  
  const diff = targetShelfPosition - currentShelfPosition;
  
  if (Math.abs(diff) > 0.001) { 
    currentShelfPosition += diff * 0.12; 

    const lowerIndex = Math.floor(currentShelfPosition);
    const upperIndex = Math.ceil(currentShelfPosition);
    const t = currentShelfPosition - lowerIndex; // 0 to 1 between positions
    
    const lowerPos = shelfPositions[lowerIndex];
    const upperPos = shelfPositions[Math.min(upperIndex, 4)];
    
    // Lerp camera position
    camera.position.set(
      THREE.MathUtils.lerp(lowerPos.camera.x, upperPos.camera.x, t),
      THREE.MathUtils.lerp(lowerPos.camera.y, upperPos.camera.y, t),
      THREE.MathUtils.lerp(lowerPos.camera.z, upperPos.camera.z, t)
    );
    
    // Lerp camera target
    controls.target.set(
      THREE.MathUtils.lerp(lowerPos.target.x, upperPos.target.x, t),
      THREE.MathUtils.lerp(lowerPos.target.y, upperPos.target.y, t),
      THREE.MathUtils.lerp(lowerPos.target.z, upperPos.target.z, t)
    );
    
    controls.update();
    
    // Update dialogue when crossing position thresholds
    const nearestPosition = Math.round(currentShelfPosition);
    if (Math.abs(currentShelfPosition - nearestPosition) < 0.15) {
      showShelfDialogue(nearestPosition);
    }
  } else {
    currentShelfPosition = targetShelfPosition;
  }
}
function showShelfDialogue(positionIndex) {
  const pos = shelfPositions[positionIndex];
  if (!pos) return;
  
  // Prevent showing same dialogue repeatedly
  if (dialogueBox.dataset.currentShelfPosition === positionIndex.toString()) {
    return;
  }
  
  dialogueBox.dataset.currentShelfPosition = positionIndex.toString();
  
  // Clear previous content
  dialogueText.textContent = '';
  if (typingTimeout) {
    clearTimeout(typingTimeout);
    isTyping = false;
  }
  
  // Setup dialogue box
  dialogueBox.style.display = 'block';
  dialogueBox.style.pointerEvents = 'auto';
  dialogueBox.style.cursor = 'default';
  dialogueBox.style.zIndex = '999';
  dialogueBox.onclick = null;
  
  // Hide click prompt
  dialogueClickPrompt.style.display = 'none';
  
  // Show X button
  const closeBtn = document.getElementById('dialogueCloseBtn');
  if (closeBtn) closeBtn.style.display = 'block';
  
  // Smaller size
  dialogueBox.style.maxWidth = '320px';
  dialogueBox.style.minWidth = '280px';
  dialogueBox.style.padding = '25px 30px 20px 30px';
  dialogueBox.style.fontSize = '16px';
  dialogueText.style.minHeight = '60px';
  
  // Position: alternate left/right
  dialogueBox.style.top = '50%';
  dialogueBox.style.bottom = 'auto';
  dialogueBox.style.transform = 'translateY(-50%) scale(0.95)';
  
  if (pos.dialoguePos === 'left') {
    dialogueBox.style.left = '40px';
    dialogueBox.style.right = 'auto';
  } else {
    dialogueBox.style.left = 'auto';
    dialogueBox.style.right = '40px';
  }
  
  // Default theme colors
  dialogueBox.style.borderImage = 'linear-gradient(135deg, rgba(94, 231, 223, 0.8), rgba(180, 144, 202, 0.6)) 1';
  dialogueBox.style.background = 'linear-gradient(145deg, rgba(20, 20, 35, 0.98) 0%, rgba(25, 25, 45, 0.95) 100%)';
  dialogueBox.style.boxShadow = '0 25px 70px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 0 40px rgba(94, 231, 223, 0.15)';
  
  setTimeout(() => {
    dialogueBox.style.opacity = '1';
    dialogueBox.style.transform = dialogueBox.style.transform.replace('scale(0.95)', 'scale(1)');
    typewriterEffect(pos.dialogue);
  }, 400);
}

function animateCameraTo(posX, posY, posZ, targetX, targetY, targetZ) {
  isCameraAnimating = true;
  animationStart = performance.now() / 1000;
  cameraStartPos.copy(camera.position);
  cameraStartTarget.copy(controls.target);
  cameraEndPos.set(posX, posY, posZ);
  cameraEndTarget.set(targetX, targetY, targetZ);
}

function setupChessUI() {
  document.getElementById('startChessBtn').addEventListener('click', async () => {
    const btn = document.getElementById('startChessBtn');
    const loadingText = document.getElementById('aiLoadingText');
    
    btn.disabled = true;
    loadingText.style.display = 'block';
    
    if (!chessAI) {
      chessAI = new ChessAIBrowser();
      await chessAI.load();
    }
    
    loadingText.style.display = 'none';
    
    // Hide welcome screen completely before starting
    const welcomeScreen = document.getElementById('chessWelcome');
    welcomeScreen.classList.remove('active');
    
    setTimeout(() => {
      welcomeScreen.style.display = 'none';
      startChessGame();
    }, 500);
  });
  
  document.getElementById('resetBtn').addEventListener('click', () => {
  if (isResetting || isAnimating) {
    return;
  }
  resetChessGame();
  });
  
  document.getElementById('playAgainBtn').addEventListener('click', () => {
    document.getElementById('gameOverScreen').classList.remove('show');
    resetChessGame();
  });
  

  
  document.querySelectorAll('.promo-piece').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const pieceType = e.target.dataset.piece;
      handlePromotionChoice(pieceType);
    });
  });
}

function startChessGame() {
  gameStarted = true;
  
  const welcomeScreen = document.getElementById('chessWelcome');
  welcomeScreen.classList.remove('active');
  welcomeScreen.style.opacity = '0';
  welcomeScreen.style.pointerEvents = 'none';
  
  document.getElementById('chessStatus').classList.add('active');
  document.getElementById('chessControls').classList.add('active');
  updateChessUI();
}

function updateChessUI() {
  if (!chessGame) return;
  
  const turn = chessGame.currentTurn === 'white' ? 'You' : 'AI';
  const turnEl = document.getElementById('turnIndicator');
  turnEl.textContent = turn;
  turnEl.className = 'status-value ' + (chessGame.currentTurn === 'white' ? 'turn-white' : 'turn-black');
  
  document.getElementById('moveCounter').textContent = moveCount;
  
  if (chessGame.isInCheck(chessGame.currentTurn)) {
    if (chessGame.isCheckmate()) {
      const winner = chessGame.currentTurn === 'white' ? 'black' : 'white';
      showGameOver(winner);
    } else {
      showMoveIndicator('⚠️ CHECK!');
    }
  } else if (chessGame.isStalemate()) {
    showGameOver('draw');
  }
}

function showMoveIndicator(text) {
  const indicator = document.getElementById('moveIndicator');
  indicator.textContent = text;
  indicator.classList.add('show');
  
  setTimeout(() => {
    indicator.classList.remove('show');
  }, 2000);
}

function showPromotionUI(color) {
  const promoUI = document.getElementById('promotionUI');
  const promoTitle = document.getElementById('promotionTitle');
  promoTitle.textContent = color === 'white' ? 'Choose Your Piece' : 'AI Promoting...';
  promoUI.classList.add('show');
  
  if (color === 'black') {
    setTimeout(() => {
      handlePromotionChoice('Q');
    }, 800);
  }
}

function hidePromotionUI() {
  document.getElementById('promotionUI').classList.remove('show');
}

function handlePromotionChoice(pieceType) {
  if (!pendingPromotionMove) {
    return;
  }
  
  hidePromotionUI();
  
  const { from, to, isAI } = pendingPromotionMove;
  
  // Get the piece at destination (already moved there)
  const [toFile, toRank] = chessGame.squareToIndices(to);
  const piece = chessGame.board[toRank][toFile];
  
  if (!piece) {
    isProcessingMove = false;
    return;
  }
  
  // Update piece type
  piece.type = pieceType;
  piece.moved = true;
  
  // Update pieceNameMap
  const pieceName = chessGame.squareToPieceName[to];
  if (pieceName && chessGame.pieceNameMap[pieceName]) {
    chessGame.pieceNameMap[pieceName].type = pieceType;
  }
  
  // Update move history
  chessGame.moveHistory.push({ 
    from, 
    to, 
    piece, 
    captured: null, 
    enPassantCapture: null,
    promotion: pieceType 
  });
  
  // Switch turn
  chessGame.currentTurn = chessGame.currentTurn === 'white' ? 'black' : 'white';
  chessGame.board.turn = chessGame.currentTurn;
  
  moveCount++;
  
  // Visual update: replace pawn model with promoted piece model
  const color = isAI ? 'black' : 'white';
  const newModelName = getModelNameForPromotion(pieceType, color);
  
  if (pieceName && newModelName && pieceObjects[newModelName]) {
    replacePromotedPieceModel(pieceName, newModelName, to, pieceType);
  }
  
  pendingPromotionMove = null;
  
  // Small delay to ensure sync
  setTimeout(() => {
    if (isAI) {
      chessGame.aiThinking = false;
      updateChessUI();
      isProcessingMove = false;
    } else {
      updateChessUI();
      chessInteractions.resetSelection();
      chessInteractions.clearHighlights();
      // Player promotion done - now AI's turn
      setTimeout(() => makeAIMove(), 800);
    }
  }, 50);
}

function getModelNameForPromotion(pieceType, color) {
  const mapping = {
    'white': {
      'Q': 'White_queen',
      'R': 'White_rook1',
      'B': 'White_bishop1',
      'N': 'White_knight1'
    },
    'black': {
      'Q': 'Black_queen',
      'R': 'Black_rook_1',
      'B': 'Black_bishop_1',
      'N': 'Black_knight_1'
    }
  };
  
  return mapping[color]?.[pieceType];
}

function replacePromotedPieceModel(oldPieceName, newModelName, square, pieceType) {
  const oldPiece = pieceObjects[oldPieceName];
  const templatePiece = pieceObjects[newModelName];
  
  if (!oldPiece || !templatePiece) {
    return;
  }
  
  
  const newPiece = templatePiece.clone(true);
  newPiece.traverse((child) => {
    if (child.isMesh && child.material) {
      child.material = child.material.clone();
    }
  });
  
  // Use template piece's original scale
  const originalScale = templatePiece.userData.originalScale
    ? templatePiece.userData.originalScale.clone()
    : new THREE.Vector3(1, 1, 1);
  
  newPiece.scale.copy(originalScale);
  newPiece.userData.originalScale = originalScale.clone();
  
  
  const targetMarker = squareMarkers[square.toUpperCase()];
let correctY = 0.07; // Default elevated height

if (targetMarker) {
  const targetWorldPos = new THREE.Vector3();
  targetMarker.getWorldPosition(targetWorldPos);
  const targetLocalPos = chessBoard.worldToLocal(targetWorldPos.clone());
  correctY = targetLocalPos.y + 0.12; 
} else if (oldPiece.userData.originalPosition) {
  correctY = oldPiece.userData.originalPosition.y;
}

  newPiece.position.set(
    oldPiece.position.x,
    correctY,  
    oldPiece.position.z
  );
  
  // Store position - use elevated Y
  newPiece.userData.originalPosition = {
    x: oldPiece.position.x,
    y: correctY,
    z: oldPiece.position.z
  };

  // Set correct rotation based on piece type
  const isKnight = (pieceType === 'N' || newModelName.includes('knight'));
  if (isKnight) {
    newPiece.rotation.y = 0;
  } else {
    newPiece.rotation.copy(oldPiece.rotation);
  }
  
  newPiece.visible = true;
  
  // Mark as promoted piece
  newPiece.userData.isPromotedPiece = true;
  newPiece.userData.originalPawnName = oldPieceName;
  newPiece.name = oldPieceName;
  
  // Hide old piece
  oldPiece.visible = false;
  oldPiece.traverse((child) => {
    if (child.isMesh) {
      child.visible = false;
    }
  });
  
  // Add to scene
  chessBoard.add(newPiece);
  
  // Update references
  pieceObjects[oldPieceName] = newPiece;
  
  // Update interactions array (white pieces only)
  if (oldPieceName.startsWith('White_') || oldPieceName.startsWith('wp')) {
    const oldIndex = chessInteractions.whitePieceObjects.indexOf(oldPiece);
    if (oldIndex !== -1) {
      chessInteractions.whitePieceObjects[oldIndex] = newPiece;
    } else {
      chessInteractions.whitePieceObjects.push(newPiece);
    }
  }
}

function resetChessGame() {
  // Block if already resetting or animating
  if (isResetting || isAnimating) {
    return;
  }
  
  isResetting = true;
  
  // STEP 1: Clear ALL game state immediately
  if (chessInteractions) {
    chessInteractions.deselectPiece();
    chessInteractions.clearHighlights();
  }

  Object.values(squareMarkers).forEach(marker => {
    marker.visible = false;
  });

  if (chessGame) {
    chessGame.aiThinking = false;
    chessGame.gameOver = false;
  }
  
  // STEP 2: Store the ORIGINAL board state from when game loaded
  const originalBoardState = {
    'White_rook1': { square: 'h1', type: 'R', color: 'white' },
    'White_knight1': { square: 'g1', type: 'N', color: 'white' },
    'White_bishop1': { square: 'f1', type: 'B', color: 'white' },
    'White_queen': { square: 'd1', type: 'Q', color: 'white' },
    'White_king': { square: 'e1', type: 'K', color: 'white' },
    'White_bishop2': { square: 'c1', type: 'B', color: 'white' },
    'White_knight2': { square: 'b1', type: 'N', color: 'white' },
    'White_rook2': { square: 'a1', type: 'R', color: 'white' },
    'wp1': { square: 'h2', type: 'P', color: 'white' },
    'wp2': { square: 'g2', type: 'P', color: 'white' },
    'wp3': { square: 'f2', type: 'P', color: 'white' },
    'wp4': { square: 'e2', type: 'P', color: 'white' },
    'wp5': { square: 'd2', type: 'P', color: 'white' },
    'wp6': { square: 'c2', type: 'P', color: 'white' },
    'wp7': { square: 'b2', type: 'P', color: 'white' },
    'wp8': { square: 'a2', type: 'P', color: 'white' },
    
    'Black_rook_1': { square: 'h8', type: 'r', color: 'black' },
    'Black_knight_1': { square: 'g8', type: 'n', color: 'black' },
    'Black_bishop_1': { square: 'f8', type: 'b', color: 'black' },
    'Black_queen': { square: 'd8', type: 'q', color: 'black' },
    'Black_king': { square: 'e8', type: 'k', color: 'black' },
    'Black_elephant2': { square: 'c8', type: 'b', color: 'black' },
    'Black_knight_2': { square: 'b8', type: 'n', color: 'black' },
    'Black_rook_2': { square: 'a8', type: 'r', color: 'black' },
    'bp1': { square: 'h7', type: 'p', color: 'black' },
    'bp2': { square: 'g7', type: 'p', color: 'black' },
    'bp3': { square: 'f7', type: 'p', color: 'black' },
    'bp4': { square: 'e7', type: 'p', color: 'black' },
    'bp5': { square: 'd7', type: 'p', color: 'black' },
    'bp6': { square: 'c7', type: 'p', color: 'black' },
    'bp7': { square: 'b7', type: 'p', color: 'black' },
    'bp8': { square: 'a7', type: 'p', color: 'black' }
  };
  
  // STEP 3: Find and clean up ALL promoted pieces
  const promotedPieces = [];
  Object.entries(pieceObjects).forEach(([name, piece]) => {
    if (piece && piece.userData.isPromotedPiece) {
      promotedPieces.push({ name, piece });
    }
  });
  
  // Remove promoted pieces completely
  promotedPieces.forEach(({ name, piece }) => {
    
    // Dispose geometry and material
    if (piece.geometry) piece.geometry.dispose();
    if (piece.material) {
      if (Array.isArray(piece.material)) {
        piece.material.forEach(mat => mat.dispose());
      } else {
        piece.material.dispose();
      }
    }
    
    // Remove from scene
    if (piece.parent) piece.parent.remove(piece);
    
    // Remove from interactions array
    const index = chessInteractions.whitePieceObjects.indexOf(piece);
    if (index !== -1) {
      chessInteractions.whitePieceObjects.splice(index, 1);
    }
    
    // Clear reference
    pieceObjects[name] = null;
  });
  
  // STEP 4: Find ALL original piece models and restore them
  Object.entries(originalBoardState).forEach(([name, data]) => {
    let originalPiece = null;
    
    chessBoard.traverse((child) => {
      if (child.name === name && 
          child.userData.isOriginalModel && 
          !child.userData.isPromotedPiece) {
        originalPiece = child;
      }
    });
    
    // Fallback: search entire scene
    if (!originalPiece) {
      scene.traverse((child) => {
        if (child.name === name && 
            child.userData.isOriginalModel && 
            !child.userData.isPromotedPiece) {
          originalPiece = child;
        }
      });
    }
    
    if (originalPiece) {
      // Update pieceObjects reference
      pieceObjects[name] = originalPiece;
      
      // Clear any promoted flags
      delete originalPiece.userData.isPromotedPiece;
      delete originalPiece.userData.originalPawnName;
      
      // Ensure it's parented to chessBoard
      if (originalPiece.parent !== chessBoard) {
        const worldPos = new THREE.Vector3();
        originalPiece.getWorldPosition(worldPos);
        
        if (originalPiece.parent) {
          originalPiece.parent.remove(originalPiece);
        }
        chessBoard.add(originalPiece);
        
        const localPos = chessBoard.worldToLocal(worldPos);
        originalPiece.position.copy(localPos);
      }
      
      // Reset scale
      if (originalPiece.userData.originalScale) {
        originalPiece.scale.copy(originalPiece.userData.originalScale);
      }
      
      // Make visible
      originalPiece.visible = true;
      originalPiece.traverse((child) => {
        if (child.isMesh) {
          child.visible = true;
          if (child.material) {
            child.material.opacity = 1.0;
            child.material.transparent = false;
            child.material.needsUpdate = true;
          }
        }
      });
      
      // Add to interactions (white pieces only)
      if (data.color === 'white') {
        const existingIndex = chessInteractions.whitePieceObjects.indexOf(originalPiece);
        if (existingIndex === -1) {
          chessInteractions.whitePieceObjects.push(originalPiece);
        }
      }
      
    } else {
      console.warn(`⚠️ Could not find original model for: ${name}`);
    }
  });
  
  // STEP 5: Position ALL pieces to starting squares
  Object.entries(originalBoardState).forEach(([name, data]) => {
    const piece = pieceObjects[name];
    
    if (piece && squareMarkers[data.square.toUpperCase()]) {
      const targetMarker = squareMarkers[data.square.toUpperCase()];
      const targetWorldPos = new THREE.Vector3();
      targetMarker.getWorldPosition(targetWorldPos);
      const targetLocalPos = chessBoard.worldToLocal(targetWorldPos.clone());
      
      // Use stored original Y position
      const correctY = piece.userData.originalPosition 
        ? piece.userData.originalPosition.y 
        : targetLocalPos.y + 0.07;
      
      // Set position
      piece.position.set(
        targetLocalPos.x,
        correctY,
        targetLocalPos.z
      );
      
      // Reset rotation (preserve BLACK knight rotations)
      const isBlackKnight = (name.includes('knight') || name.includes('Knight')) && data.color === 'black';
      if (!isBlackKnight) {
        piece.rotation.y = data.color === 'black' ? Math.PI : 0;
      }
      
      // Force visibility
      piece.visible = true;
      piece.traverse((child) => {
        if (child.isMesh) {
          child.visible = true;
          if (child.material) {
            child.material.opacity = 1.0;
            child.material.transparent = false;
          }
        }
      });
    }
  });
  
  // STEP 6: Create fresh game state
  chessGame = new ChessGame();
  window.chessGame = chessGame;
  moveCount = 0;
  pendingPromotionMove = null;
  
  // STEP 7: Sync game state with visual state
  chessGame.pieceNameMap = {};
  chessGame.squareToPieceName = {};
  
  chessGame.board = Array(8).fill(null).map(() => Array(8).fill(null));
  
  Object.entries(originalBoardState).forEach(([name, data]) => {
    const piece = pieceObjects[name];
    if (piece && piece.visible) {
      chessGame.pieceNameMap[name] = {
        square: data.square, 
        type: data.type,
        color: data.color
      };
      
      // Add to square-to-piece map (ALSO LOWERCASE - this was the bug!)
      chessGame.squareToPieceName[data.square] = name;
      
      // Add to board array
      const [file, rank] = chessGame.squareToIndices(data.square);
      chessGame.board[rank][file] = {
        type: data.type,
        color: data.color,
        name: name,
        moved: false
      };
    }
  });
  
  chessGame.currentTurn = 'white';
  chessGame.board.turn = 'white';
  chessGame.enPassantTarget = null;
  chessGame.moveHistory = [];

  
  // STEP 8: Final cleanup
  if (chessInteractions) {
    chessInteractions.deselectPiece();
    chessInteractions.clearHighlights();
    chessInteractions.resetSelection();
  }

  Object.values(squareMarkers).forEach(marker => {
    marker.visible = false;
  });
  
  updateChessUI();
  showMoveIndicator('♟️ Board Reset!');
  
  // Re-enable interactions after short delay
  setTimeout(() => {
    isResetting = false;
    isProcessingMove = false;
  }, 500);
}

function showGameOver(winner) {
  const screen = document.getElementById('gameOverScreen');
  const title = document.getElementById('gameOverTitle');
  const message = document.getElementById('gameOverMessage');
  
  if (winner === 'white') {
    title.innerHTML = '<span class="winner">🎉 You Win!</span>';
    message.textContent = 'Congratulations! You defeated the AI!';
  } else if (winner === 'black') {
    title.innerHTML = '<span class="loser">😔 AI Wins!</span>';
    message.textContent = 'Better luck next time!';
  } else {
    title.textContent = '🤝 Draw!';
    message.textContent = 'The game ended in a draw.';
  }
  
  chessGame.gameOver = true;
  screen.classList.add('show');
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function loadScene() {
  const loader = new GLTFLoader();
  
  loader.load(
    "./assets/models/scene.glb",
    (gltf) => {
      // Mark GLB as loaded
      if (window.assetLoader) {
        window.assetLoader.assetLoaded();
      }
      
      scene.add(gltf.scene);
      
      let chessPiecesToParent = [];
      
      gltf.scene.traverse((child) => {
        if (child.isMesh) {
          
          // FIX CORRUPTED MATERIALS FROM COMPRESSION
          if (child.material) {
            if (child.material.transmission !== undefined && child.material.transmission > 0) {
              const oldColor = child.material.color ? child.material.color.clone() : new THREE.Color(0xcccccc);
              child.material = new THREE.MeshStandardMaterial({
                color: oldColor,
                metalness: child.material.metalness || 0.5,
                roughness: child.material.roughness || 0.5,
                side: THREE.DoubleSide // Fix for fantasy frames
              });
            }
            
            if (child.name === 'fantasy_frame_1' || child.name === 'fantasy_frame_2') {
              if (!child.material.isMeshStandardMaterial) {
                const oldColor = child.material.color ? child.material.color.clone() : new THREE.Color(0xcccccc);
                child.material = new THREE.MeshStandardMaterial({
                  color: oldColor,
                  metalness: 0.3,
                  roughness: 0.7,
                  side: THREE.DoubleSide
                });
              }
              child.material.side = THREE.DoubleSide;
              child.material.needsUpdate = true;
            }
            
            child.material = child.material.clone();
            // FIX WINDOWS - Make Object_58 and Object_60 transparent
            if (child.name === "Object_58" || child.name === "Object_60") {
              child.material = new THREE.MeshPhysicalMaterial({
                color: 0x88ccff,
                metalness: 0,
                roughness: 0.1,
                transmission: 0.9,
                transparent: true,
                opacity: 0.3,
                side: THREE.DoubleSide
              });
            }
          }
          
          selectable.push(child);

          // ADD BOTH LAPTOP PARTS TO SAME GROUP
          if (child.name === "laptop_laptop_0") {
            laptopParts.push(child);
            deskParts.push(child);
          }

          if (child.name === "screen_laptopScreen_0") {
            laptopParts.push(child);
            deskParts.push(child);
            screenMesh = child;
            
            child.position.y += 0.002;
            child.position.z -= 0;
            child.rotation.x -= 0.055;
            
            // Get screen's world position and size
            child.geometry.computeBoundingBox();
            const bbox = child.geometry.boundingBox;
            const width = bbox.max.x - bbox.min.x;
            const height = bbox.max.y - bbox.min.y;
            
            // Store original transform
            const originalPosition = child.position.clone();
            const originalRotation = child.rotation.clone();
            const originalScale = child.scale.clone();
            const originalQuaternion = child.quaternion.clone();
          
            
            const oldGeometry = child.geometry;
            
            const newGeometry = new THREE.PlaneGeometry(width, height, 1, 1);
            
            child.geometry = newGeometry;
            oldGeometry.dispose();
              
            // Restore transform
            child.position.copy(originalPosition);
            child.rotation.copy(originalRotation);
            child.scale.copy(originalScale);
            child.updateMatrix();
            child.updateMatrixWorld(true);
            
            // Force visibility
            child.visible = true;
            child.castShadow = false;
            child.receiveShadow = false;
            
            // Create optimized screen material
            child.material = new THREE.MeshStandardMaterial({
              color: 0xffffff,
              emissive: 0x111111,
              emissiveIntensity: 0.2,
              metalness: 0.1,
              roughness: 0.4,
              side: THREE.DoubleSide,
              transparent: false,
              opacity: 1.0
            });
            
          }
          
          if (child.name === "chess_board") {
            chessBoard = child;
          }

          // SOFA MODE OBJECTS
          if (child.name === "Bean_Bag_m_chair_0" || child.name === "Bean_Bag_m_chair_0_1") {
            beanBags.push(child);
            sofaParts.push(child);
          }
          
          if (child.name === "fam_frame" || child.name === "fam_frame2") {
            familyFrameParts.push(child);
            sofaParts.push(child);
          }
          
          
      if (child.name === "table") {
        tableObj = child;
        sofaParts.push(child);
        child.position.x += 0.02; 
        
        // Load and apply texture
        const textureLoader = new THREE.TextureLoader();
        textureLoader.load('./assets/icons/texture.jpg', (texture) => {

          // Mark texture as loaded
          if (window.assetLoader) {
            window.assetLoader.assetLoaded();
          }
          
          texture.wrapS = THREE.RepeatWrapping;
          texture.wrapT = THREE.RepeatWrapping;
          texture.repeat.set(2, 2); // Increase to see pattern more clearly
          texture.colorSpace = THREE.SRGBColorSpace; // Ensure correct color space
          texture.needsUpdate = true;
          
          // COMPLETELY REPLACE material (don't clone corrupted one)
          child.material = new THREE.MeshStandardMaterial({
            map: texture,
            color: 0xffffff, // White multiplier (doesn't change texture color)
            metalness: 0.1,   // Less metallic to see texture better
            roughness: 0.9,   // More rough for better texture visibility
            side: THREE.DoubleSide
          });
          
          child.material.needsUpdate = true;
        
        }, 
        (progress) => {
          console.log('📥 Loading texture:', (progress.loaded / progress.total * 100).toFixed(0) + '%');
        },
        (err) => {
          console.error('Failed to load table texture:', err);
          
        });
      }

          // DESK MODE OBJECTS
          const deskObjectNames = [
            'chair1', 'chair2', 'chair3', 'chair4', 'chair5', 'chair6',
            'tab1', 'tab2', 'tab3', 'tab4',
            'cat1', 'cat2', 'cat3', 'cat4', 'cat5', 'cat6',
            'Object_41', // cat mug
            'Object_36', 'Object_35', 'Object_34', 'Object_33' // plant parts
          ];
          
          if (deskObjectNames.includes(child.name)) {
            deskParts.push(child);
          }
          
          // FRAME MODE OBJECTS
          if (child.name === 'game_frame1' || child.name === 'game_frame2' || 
              child.name === 'fantasy_frame_1' || child.name === 'fantasy_frame_2') {
            if (child.name === 'game_frame1' || child.name === 'game_frame2') {
              child.position.z += 0.02; // Move slightly back to align with frame
            }
            
            if (child.name === 'fantasy_frame_1' || child.name === 'fantasy_frame_2') {
              if (child.material) {
                child.material.side = THREE.DoubleSide;
                child.material.transparent = false;
                child.material.depthTest = true;
                child.material.depthWrite = true;
              }
            }
            
            frameParts.push(child);
            deskParts.push(child); 
          }
if (child.name && (child.name.startsWith('board') || child.name.startsWith('block-'))) {
  boardParts.push(child);
  
  const blockRotationMap = {
    'block-A1': -4,
    'block-C1': -75,
    'block-C2': -20,
    'block-E1': 0,
    'block-F1': 49,
    'block-I1': 5,
    'block-I2': -5,
    'block-I3': 20,
    'block-R1': -170,
    'block-O1': -2,
    'block-S1': -50,
    'block-N1': -100,
    'block-T1': -25,
    'block-T2': 45
  };
  
  if (blockRotationMap[child.name] !== undefined) {
    blockRotations[child.name] = {
      original: child.rotation.x,
      target: child.rotation.x + (blockRotationMap[child.name] * Math.PI / 180),
      current: child.rotation.x,
      mesh: child
    };
  }
}

// TV MODE OBJECTS
const tvObjectNames = ['tv_screen', 'seat', 'mat', 'con_1', 'con_2'];
if (tvObjectNames.includes(child.name)) {
  tvParts.push(child);

// Store TV screen mesh for texture replacement
if (child.name === 'tv_screen') {
  tvScreenMesh = child;
  
  child.geometry.computeBoundingBox();
  const bbox = child.geometry.boundingBox;
  const width = bbox.max.x - bbox.min.x;
  const height = bbox.max.y - bbox.min.y;
  
  
  // Store original transform BEFORE replacing geometry
  const originalPosition = child.position.clone();
  const originalRotation = child.rotation.clone();
  const originalScale = child.scale.clone();
  const originalQuaternion = child.quaternion.clone();
  
  // Replace corrupted geometry with fresh plane
  const oldGeometry = child.geometry;
  child.geometry = new THREE.PlaneGeometry(width, height, 1, 1);
  oldGeometry.dispose();
  
  // RESTORE original transform
  child.position.copy(originalPosition);
  child.rotation.copy(originalRotation);
  child.scale.copy(originalScale);
  child.rotation.y -= 0.15; 
  child.updateMatrix();
  child.updateMatrixWorld(true);
  
  // Create proper material
  child.material = new THREE.MeshStandardMaterial({
    color: 0x000000,
    emissive: 0x000000,
    metalness: 0.1,
    roughness: 0.4,
    side: THREE.DoubleSide
  });
  
  // Force visibility
  child.visible = true;
  child.castShadow = false;
  child.receiveShadow = false;
  
}
  
}

// SHELF MODE OBJECTS
if (child.name === "shelf") {
  shelfParts.push(child);
}

// RADIO MODE OBJECT
if (child.name === "radio") {
  radioParts.push(child);
}

if (chessPieceNames.includes(child.name)) {
  chessPiecesToParent.push(child);
  pieceObjects[child.name] = child;
  child.userData.isOriginalModel = true;
}

if (child.name && /^[A-H][1-8]$/.test(child.name)) {
      squareMarkers[child.name] = child;
      child.visible = false;
      if (child.material) {
        child.material.transparent = true;
        child.material.opacity = 0;
      }
    }
  }
});

if (chessBoard) {
  chessPiecesToParent.forEach((piece) => {
    const worldPos = new THREE.Vector3();
    piece.getWorldPosition(worldPos);
    chessBoard.attach(piece);
    const localPos = chessBoard.worldToLocal(worldPos);
    piece.position.copy(localPos);
    piece.userData.originalScale = piece.scale.clone();
    piece.userData.originalPosition = { 
      x: localPos.x, 
      y: localPos.y, 
      z: localPos.z 
    };
  });
        
  chessPieces.push(chessBoard);
  chessBoard.userData.originalScale = chessBoard.scale.clone();
}

// Ensure screen has original scale saved
if (screenMesh && !screenMesh.userData.originalScale) {
  screenMesh.userData.originalScale = screenMesh.scale.clone();
}

laptopParts.forEach((part) => {
  part.userData.originalScale = part.userData.originalScale || part.scale.clone();
  const outlineGeo = part.geometry.clone();
const outlineMat = new THREE.MeshBasicMaterial({
    color: 0x00ffff,
    side: THREE.BackSide,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    depthTest: true,
    polygonOffset: true,      
    polygonOffsetFactor: -1,  
    polygonOffsetUnits: -1    
});
  const outlineMesh = new THREE.Mesh(outlineGeo, outlineMat);
  outlineMesh.scale.multiplyScalar(1.04); 
  outlineMesh.renderOrder = 999; 
  part.add(outlineMesh);
  outlineMeshes.push(outlineMesh);
  outlineMesh.visible = false;
  outlineMesh.userData.targetOpacity = 0;
  outlineMesh.userData.currentOpacity = 0;
});

sofaParts.forEach((part) => {
  part.userData.originalScale = part.userData.originalScale || part.scale.clone();
  const outlineGeo = part.geometry.clone();
  const outlineMat = new THREE.MeshBasicMaterial({
    color: 0x00ffff,
    side: THREE.BackSide,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    depthTest: true,
    polygonOffset: true,     
    polygonOffsetFactor: -1,  
    polygonOffsetUnits: -1    
});
  const outlineMesh = new THREE.Mesh(outlineGeo, outlineMat);
  outlineMesh.scale.multiplyScalar(1.05); 
  outlineMesh.renderOrder = 999;
  part.add(outlineMesh);
  sofaOutlineMeshes.push({ mesh: outlineMesh, parent: part });
  outlineMesh.visible = false;
  outlineMesh.userData.targetOpacity = 0;
  outlineMesh.userData.currentOpacity = 0;
});

deskParts.forEach((part) => {
  part.userData.originalScale = part.userData.originalScale || part.scale.clone();
  const outlineGeo = part.geometry.clone();
  const outlineMat = new THREE.MeshBasicMaterial({
    color: 0x00ffff,
    side: THREE.BackSide,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    depthTest: true,
    polygonOffset: true,      
    polygonOffsetFactor: -1,  
    polygonOffsetUnits: -1    
});
  const outlineMesh = new THREE.Mesh(outlineGeo, outlineMat);
  outlineMesh.scale.multiplyScalar(1.05); 
  outlineMesh.renderOrder = 999;
  part.add(outlineMesh);
  deskOutlineMeshes.push({ mesh: outlineMesh, parent: part });
  outlineMesh.visible = false;
  outlineMesh.userData.targetOpacity = 0;
  outlineMesh.userData.currentOpacity = 0;
});

frameParts.forEach((part) => {
  part.userData.originalScale = part.userData.originalScale || part.scale.clone();
  const outlineGeo = part.geometry.clone();
  const outlineMat = new THREE.MeshBasicMaterial({
    color: 0x00ffff,
    side: THREE.BackSide,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    depthTest: true,
    polygonOffset: true,      
    polygonOffsetFactor: -1,  
    polygonOffsetUnits: -1    
});
  const outlineMesh = new THREE.Mesh(outlineGeo, outlineMat);
  outlineMesh.scale.multiplyScalar(1.06); 
  outlineMesh.renderOrder = 999;
  part.add(outlineMesh);
  frameOutlineMeshes.push({ mesh: outlineMesh, parent: part });
  outlineMesh.visible = false;
  outlineMesh.userData.targetOpacity = 0;
  outlineMesh.userData.currentOpacity = 0;
});

// Create outlines for board mode objects (only board1 and board2)
boardParts.forEach((part) => {
  if (part.name !== 'board1' && part.name !== 'board2') return;
  
  part.userData.originalScale = part.userData.originalScale || part.scale.clone();
  const outlineGeo = part.geometry.clone();
  const outlineMat = new THREE.MeshBasicMaterial({
    color: 0x00ffff,
    side: THREE.BackSide,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    depthTest: true,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1
  });
  const outlineMesh = new THREE.Mesh(outlineGeo, outlineMat);
  outlineMesh.scale.multiplyScalar(1.06); // Thicker for visibility

  outlineMesh.renderOrder = 999;
  part.add(outlineMesh);
  boardOutlineMeshes.push({ mesh: outlineMesh, parent: part });
  outlineMesh.visible = false;
  outlineMesh.userData.targetOpacity = 0;
outlineMesh.userData.currentOpacity = 0;
});

// Create outlines for TV mode objects
tvParts.forEach((part) => {
  part.userData.originalScale = part.userData.originalScale || part.scale.clone();
  
  // Only TV screen gets thick outline
  const isTVScreen = (part.name === 'tv_screen');

  if (isTVScreen) {
    // SPECIAL HANDLING FOR TV SCREEN - Create SEPARATE geometry
    const outlineGeo = new THREE.PlaneGeometry(
      part.geometry.parameters.width * 1.06,
      part.geometry.parameters.height * 1.06,
      1, 1
    );
    
    const outlineMat = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      side: THREE.DoubleSide, // Both sides visible
      transparent: true,
      opacity: 0,
      depthWrite: false,
      depthTest: false, // Always render on top
    });

    const outlineMesh = new THREE.Mesh(outlineGeo, outlineMat);
    outlineMesh.position.z = -0.005; // Slightly behind screen
    outlineMesh.renderOrder = 998;
    
    part.add(outlineMesh);
    tvOutlineMeshes.push({ mesh: outlineMesh, parent: part });
    outlineMesh.visible = false;
    outlineMesh.userData.targetOpacity = 0;
    outlineMesh.userData.currentOpacity = 0;
    
  } else {
    // NORMAL OUTLINE for other TV objects
    const outlineGeo = part.geometry.clone();
    const outlineMat = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      side: THREE.BackSide,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      depthTest: true,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1
    });

    const outlineMesh = new THREE.Mesh(outlineGeo, outlineMat);
    outlineMesh.scale.multiplyScalar(1.05);
    outlineMesh.renderOrder = 999;
    
    part.add(outlineMesh);
    tvOutlineMeshes.push({ mesh: outlineMesh, parent: part });
    outlineMesh.visible = false;
    outlineMesh.userData.targetOpacity = 0;
    outlineMesh.userData.currentOpacity = 0;
  }
});

// Create outlines for shelf mode objects
shelfParts.forEach((part) => {
  part.userData.originalScale = part.userData.originalScale || part.scale.clone();
  const outlineGeo = part.geometry.clone();
  const outlineMat = new THREE.MeshBasicMaterial({
    color: 0x00ffff,
    side: THREE.BackSide,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    depthTest: true,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1
  });
  const outlineMesh = new THREE.Mesh(outlineGeo, outlineMat);
  outlineMesh.scale.multiplyScalar(1.03);
  outlineMesh.renderOrder = 999;
  part.add(outlineMesh);
  outlineMesh.position.x = shelfOutlineOffsetX; // Apply X offset
  outlineMesh.position.y = shelfOutlineOffsetY; // Apply Y offset
  shelfOutlineMeshes.push({ mesh: outlineMesh, parent: part });
  shelfOutlineMeshes.push({ mesh: outlineMesh, parent: part });
  outlineMesh.visible = false;
  outlineMesh.userData.targetOpacity = 0;
  outlineMesh.userData.currentOpacity = 0;
});

// Create outlines for radio object
radioParts.forEach((part) => {
  part.userData.originalScale = part.userData.originalScale || part.scale.clone();
  const outlineGeo = part.geometry.clone();
  const outlineMat = new THREE.MeshBasicMaterial({
    color: 0x00ffff,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    depthTest: false,
    polygonOffset: false
  });
  const outlineMesh = new THREE.Mesh(outlineGeo, outlineMat);
  outlineMesh.scale.multiplyScalar(1.01);
  outlineMesh.renderOrder = 1001;
  part.add(outlineMesh);
  radioOutlineMeshes.push({ mesh: outlineMesh, parent: part });
  outlineMesh.visible = false;
  outlineMesh.userData.targetOpacity = 0;
  outlineMesh.userData.currentOpacity = 0;
  outlineMesh.userData.maxOpacity = 0.35; // NEW: Lower max opacity for subtle effect
});

familyFrameParts.forEach((part) => {
  const outlineGeo = part.geometry.clone();
  const outlineMat = new THREE.MeshBasicMaterial({
    color: 0x00ffff,
    side: THREE.BackSide,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    depthTest: true,
    polygonOffset: true,      
    polygonOffsetFactor: -1,  
    polygonOffsetUnits: -1    
});
  const outlineMesh = new THREE.Mesh(outlineGeo, outlineMat);
  outlineMesh.scale.multiplyScalar(1.05); 
  outlineMesh.renderOrder = 999;
  part.add(outlineMesh);
  familyOutlineMeshes.push({ mesh: outlineMesh, parent: part });
  outlineMesh.visible = false;
  outlineMesh.userData.targetOpacity = 0;
  outlineMesh.userData.currentOpacity = 0;
});

if (chessBoard) {
  const outlineGeo = chessBoard.geometry.clone();
  const outlineMat = new THREE.MeshBasicMaterial({
    color: 0x00ffff,
    side: THREE.BackSide,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    depthTest: false, // Render on top
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2
  });
  const outlineMesh = new THREE.Mesh(outlineGeo, outlineMat);
  
  outlineMesh.scale.set(1.08, 1.08, 1.08); // Simple uniform scale
  
  outlineMesh.position.y += 0.008; // RAISE HIGHER
  outlineMesh.renderOrder = 1000; // Render ABOVE everything
  chessBoard.add(outlineMesh);
  chessOutlineMeshes.push(outlineMesh);
  outlineMesh.visible = false;
  outlineMesh.userData.targetOpacity = 0;
  outlineMesh.userData.currentOpacity = 0;
  
}
      
      // Mark GLB as loaded
      if (window.assetLoader) {
        window.assetLoader.assetLoaded();
      }
      
      controls.enabled = false;
      controls.enablePan = false;
      controls.enableZoom = false;
      const cameraToggle = document.getElementById('cameraToggle');
      if (cameraToggle) {
        cameraToggle.classList.add('active');
      }

     // Show intro dialogue AFTER loading transition completes
      setTimeout(() => {
        if (!hasSeenIntroDialogue) {
          showIntroDialogue();
        }
      }, 1500); 
      if (screenMesh && typeof LaptopScreen !== 'undefined') {
        screenMesh.visible = true;
        screenMesh.material.transparent = false;
        screenMesh.material.opacity = 1.0;
        
        laptopScreen = new LaptopScreen(screenMesh, THREE, renderer);
        laptopScreen.setCamera(camera);
      }

      if (typeof ChessGame !== 'undefined') {
        chessGame = new ChessGame();
        window.chessGame = chessGame;
      }
      
      if (typeof ChessInteractions !== 'undefined') {
        chessInteractions = new ChessInteractions(
          scene, camera, raycaster, mouse, pieceObjects, squareMarkers, chessBoard, chessPieceNames
        );
      }
      
      if (typeof ChessAnimations !== 'undefined') {
        chessAnimations = new ChessAnimations(chessBoard, pieceObjects, squareMarkers, THREE);
      }
      
      // Initialize TV screen
if (tvScreenMesh && typeof TVScreen !== 'undefined') {
  tvScreen = new TVScreen(tvScreenMesh, THREE, renderer);
} else {
  if (!tvScreenMesh) console.error("TV screen mesh not found in scene!");
  if (typeof TVScreen === 'undefined') console.error("TVScreen class not loaded!");
}
    },
    undefined,
    (err) => {
      document.getElementById("loading").innerText = "Error loading GLB";
      console.error(err);
    }
  );
}

function onPointerMove(event) {
  if (isCameraAnimating || normalModeInteractionBlocked) return;
  
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  
  raycaster.setFromCamera(mouse, camera);
  
// Normal mode - hover over laptop, sofa, desk, and board objects
if (currentMode === 'normal') {
  if (!hoverEnabled) return;
  
  const hits = raycaster.intersectObjects(selectable, true);
  
  const hoveringLaptop = hits.some(h => laptopParts.includes(h.object));
  const hoveringSofa = hits.some(h => sofaParts.includes(h.object));
  const hoveringDesk = hits.some(h => deskParts.includes(h.object));
  const hoveringBoard = hits.some(h => boardParts.includes(h.object));
  const hoveringTV = hits.some(h => tvParts.includes(h.object));
  const hoveringShelf = hits.some(h => shelfParts.includes(h.object));
  
  outlineMeshes.forEach(o => {
    o.visible = true;
    o.userData.targetOpacity = hoveringLaptop ? 0.9 : 0;
  });
  sofaOutlineMeshes.forEach(item => {
    item.mesh.visible = true;
    item.mesh.userData.targetOpacity = hoveringSofa ? 0.9 : 0;
  });
  deskOutlineMeshes.forEach(item => {
    item.mesh.visible = true;
    item.mesh.userData.targetOpacity = hoveringDesk ? 0.9 : 0;
  });
  boardOutlineMeshes.forEach(item => {
    item.mesh.visible = true;
    item.mesh.userData.targetOpacity = hoveringBoard ? 0.9 : 0;
  });
  tvOutlineMeshes.forEach(item => {
    item.mesh.visible = true;
    item.mesh.userData.targetOpacity = hoveringTV ? 0.9 : 0;
  });
  shelfOutlineMeshes.forEach(item => {
    item.mesh.visible = true;
    item.mesh.userData.targetOpacity = hoveringShelf ? 0.9 : 0;
  });
}
  
  // Sofa mode - hover over chess board and family frames 
else if (currentMode === 'sofa') {
  if (!hoverEnabled) return;
  
  const hits = raycaster.intersectObjects(selectable, true);
  
  const hoveringChess = hits.some(h => {
    let obj = h.object;
    while (obj) {
      if (obj === chessBoard) return true;
      obj = obj.parent;
    }
    return false;
  });
  

  const hoveringFamily = hits.some(h => familyFrameParts.includes(h.object));
  
  chessOutlineMeshes.forEach(o => {
    o.visible = true;
    o.userData.targetOpacity = hoveringChess ? 0.9 : 0;
  });
  familyOutlineMeshes.forEach(item => {
    item.mesh.visible = true;
    item.mesh.userData.targetOpacity = hoveringFamily ? 0.9 : 0;
  });
}

// Shelf mode - hover over radio
else if (currentMode === 'shelf') {
  if (!hoverEnabled) return;
  
  const hits = raycaster.intersectObjects(selectable, true);
  
  const hoveringRadio = hits.some(h => {
    if (radioParts.includes(h.object)) return true;
    
    // Check if the parent is a radio part
    if (h.object.parent && radioParts.includes(h.object.parent)) return true;
    
    // Check if the name contains 'radio'
    if (h.object.name && h.object.name.toLowerCase().includes('radio')) return true;
    
    return false;
  });
  
  
radioOutlineMeshes.forEach(item => {
    item.mesh.visible = true;
    const maxOpacity = item.mesh.userData.maxOpacity || 0.35;
    item.mesh.userData.targetOpacity = hoveringRadio ? maxOpacity : 0;
  });
}

// Desk mode - hover over laptop and frames 
else if (currentMode === 'desk') {
  if (!hoverEnabled) return;
  
  const hits = raycaster.intersectObjects(selectable, true);
  
  const hoveringLaptop = hits.some(h => laptopParts.includes(h.object));
  const hoveringFrame = hits.some(h => frameParts.includes(h.object));
  
  outlineMeshes.forEach(o => {
    o.visible = true;
    o.userData.targetOpacity = hoveringLaptop ? 0.9 : 0;
  });
  frameOutlineMeshes.forEach(item => {
    item.mesh.visible = true;
    item.mesh.userData.targetOpacity = hoveringFrame ? 0.9 : 0;
  });
}
  
  // Chess, Family, Frame, Laptop modes - no outlines
  else {
    // No hover effects in these modes
  }
}

function onPointerClick(event) {
  if (isCameraAnimating || normalModeInteractionBlocked || isResetting || isAnimating) return;
  
  updateCameraDebug();
  //console.log('Camera Position:', camera.position);
  //console.log('Camera Target:', controls.target);
  
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  
  raycaster.setFromCamera(mouse, camera);
  
  // Block all scene interaction in laptop, family, frame modes
  if (currentMode === 'laptop' || currentMode === 'family' || currentMode === 'frame') {
    return;
  }
  
  // Chess mode - handle chess interactions
if (currentMode === 'chess' && gameStarted && chessInteractions) {
  if (isProcessingMove || isAnimating || isResetting || chessGame.aiThinking) {
    return;
  }
  chessInteractions.handleClick(chessGame, makePlayerMove);
  return;
}
  const hits = raycaster.intersectObjects(selectable, true);
  
  
// Normal mode - can click sofa, desk, or board objects
if (currentMode === 'normal') {
  const clickedSofa = hits.find(h => sofaParts.includes(h.object));
  const clickedDesk = hits.find(h => deskParts.includes(h.object));
  const clickedBoard = hits.find(h => boardParts.includes(h.object));
  const clickedTV = hits.find(h => tvParts.includes(h.object));
  const clickedShelf = hits.find(h => shelfParts.includes(h.object));
  
  if (clickedSofa) {
    enterSofaMode();
  } else if (clickedDesk) {
    enterDeskMode();
  } else if (clickedBoard) {
    enterBoardMode();
  } else if (clickedTV) {
    enterTVMode();
  } else if (clickedShelf) {
    enterShelfMode();
  }
}

  // Sofa mode - can click chess or family frames
  else if (currentMode === 'sofa') {
    const clickedChess = hits.find(h => {
      let obj = h.object;
      while (obj) {
        if (obj === chessBoard) return true;
        obj = obj.parent;
      }
      return false;
    });
    
    const clickedFamily = hits.find(h => familyFrameParts.includes(h.object));
    
    if (clickedChess) {
      enterChessMode();
    } else if (clickedFamily) {
      enterFamilyMode();
    }
  }
  
  // Shelf mode - can click radio
else if (currentMode === 'shelf') {
  const clickedRadio = hits.find(h => radioParts.includes(h.object));
  
  if (clickedRadio) {
    showRadioPanel();
    radioOutlineMeshes.forEach(item => (item.mesh.visible = false));
  }
}

  // Desk mode - can click laptop or frames
  else if (currentMode === 'desk') {
    const clickedLaptop = hits.find(h => laptopParts.includes(h.object));
    const clickedFrame = hits.find(h => frameParts.includes(h.object));
    
    if (clickedLaptop) {
      enterLaptopMode();
    } else if (clickedFrame) {
      enterFrameMode();
    }
  }
}

function enterLaptopMode() {
  // Determine which mode we're coming from
  const fromDesk = (currentMode === 'desk');
  
  currentMode = 'laptop';
  const cameraToggle = document.getElementById('cameraToggle');
  if (cameraToggle) cameraToggle.classList.remove('active');
  previousMode = fromDesk ? 'desk' : 'normal';
  hoverEnabled = false;
  outlineMeshes.forEach(o => (o.visible = false));
  
  // Lock camera completely
  controls.enabled = false;
  
  if (laptopScreen) {
    laptopScreen.activate();
  }
  
  showExitButton();
  
  animateCameraTo(
    -4.0128, 1.1213, 1.0702,
    -4.8249, 1.0837, 0.6311
  );
  if (window.audioManager) window.audioManager.updateForMode('laptop');
  // Show dialogue after animation
  setTimeout(() => {
    showModeDialogue('laptop');
  }, 2500);
  
}

function enterSofaMode() {
  currentMode = 'sofa';
  const cameraToggle = document.getElementById('cameraToggle');
  if (cameraToggle) cameraToggle.classList.remove('active');
  previousMode = 'normal';
  hoverEnabled = true;
  sofaOutlineMeshes.forEach(item => (item.mesh.visible = false));
  
  // Lock camera
  controls.enabled = false;
  controls.enablePan = false;
  controls.enableZoom = false;
  
  showExitButton();
  
  animateCameraTo(
    -2.0817795986579544, 1.002890579523843, 1.326450881697992,
    -2.08570808037242, 0.985057465166684, 2.3500947571065485
  );
  if (window.audioManager) window.audioManager.updateForMode('sofa');
  // Show dialogue after camera animation
  setTimeout(() => {
    showModeDialogue('sofa');
  }, 2500);
  
}

function enterChessMode() {
  // Hide sofa dialogue first
  hideModeDialogue();
  
  currentMode = 'chess';
  previousMode = 'sofa';
  hoverEnabled = false;
  chessOutlineMeshes.forEach(o => (o.visible = false));
  chessTargetScale = 1.0;
  
  // Lock camera
  controls.enabled = false;
  controls.enablePan = false;
  controls.enableZoom = false;
  
  animateCameraTo(
    -1.8996698124012572, 0.7098220507034887, 2.6055384244448687,
    -1.9347355354125648, 0.6560897143493751, 2.605015467376186
  );
  if (window.audioManager) window.audioManager.updateForMode('chess');
  // Show dialogue after camera animation
  setTimeout(() => {
    showModeDialogue('chess');
  }, 2500);
  
}

function enterFamilyMode() {
  // Hide sofa dialogue first
  hideModeDialogue();
  
  currentMode = 'family';
  previousMode = 'sofa';
  hoverEnabled = false;
  familyOutlineMeshes.forEach(item => (item.mesh.visible = false));
  
  // Lock camera
  controls.enabled = false;
  controls.enablePan = false;
  controls.enableZoom = false;
  
  animateCameraTo(
    -2.0828301115624637, 1.5957608975876931, 2.488499381626821,
    -2.0867611244597835, 1.585668276781064, 3.5122488249675508
  );
  if (window.audioManager) window.audioManager.updateForMode('family');
  // Show dialogue after camera animation
  setTimeout(() => {
    showModeDialogue('family');
  }, 2500);
}

function enterDeskMode() {
  currentMode = 'desk';
  const cameraToggle = document.getElementById('cameraToggle');
  if (cameraToggle) cameraToggle.classList.remove('active');
  previousMode = 'normal';
  hoverEnabled = true;
  deskOutlineMeshes.forEach(item => (item.mesh.visible = false));
  
  // Lock camera
  controls.enabled = false;
  controls.enablePan = false;
  controls.enableZoom = false;
  
  showExitButton();
  
  animateCameraTo(
    -3.2778681575996984, 1.258073897524341, 1.1635086207775198,
    -4.972655773234403, 1.0606562348962882, 1.0511241695012494
  );
  if (window.audioManager) window.audioManager.updateForMode('desk');
  // Show dialogue after camera animation
  setTimeout(() => {
    showModeDialogue('desk');
  }, 2500);
}

function enterFrameMode() {
  // Hide desk dialogue first
  hideModeDialogue();
  
  currentMode = 'frame';
  previousMode = 'desk';
  hoverEnabled = false;
  frameOutlineMeshes.forEach(item => (item.mesh.visible = false));
  
  // Lock camera
  controls.enabled = false;
  controls.enablePan = false;
  controls.enableZoom = false;
  
  animateCameraTo(
    -4.190787687432334, 1.1577778797148508, 1.699200132516048,
    -4.668236173654875, 0.9293795081269588, 1.9420963955123245
  );
  if (window.audioManager) window.audioManager.updateForMode('frame');
  // Show dialogue after camera animation
  setTimeout(() => {
    showModeDialogue('frame');
  }, 2500);
}

function enterBoardMode() {
  currentMode = 'board';
  const cameraToggle = document.getElementById('cameraToggle');
  if (cameraToggle) cameraToggle.classList.remove('active');
  previousMode = 'normal';
  hoverEnabled = false;
  boardOutlineMeshes.forEach(item => (item.mesh.visible = false));
  
  // Lock camera
  controls.enabled = false;
  controls.enablePan = false;
  controls.enableZoom = false;
  
  showExitButton();
  if (window.audioManager) window.audioManager.updateForMode('board');
  // DON'T start block animation yet - wait for camera to finish
  animateCameraTo(
    -4.274350092309905, 1.5743882076196263, 2.711131867410986,
    -7.130103486312447, 1.5894207255690969, 2.7379573381311144
  );
  
   setTimeout(() => {
    showCertificateBoard();
  }, 3500);
}

function enterTVMode() {
  currentMode = 'tv';
  const cameraToggle = document.getElementById('cameraToggle');
  if (cameraToggle) cameraToggle.classList.remove('active');
  previousMode = 'normal';
  hoverEnabled = false;
  tvOutlineMeshes.forEach(item => (item.mesh.visible = false));
  
  // Lock camera
  controls.enabled = false;
  controls.enablePan = false;
  controls.enableZoom = false;
  
  showExitButton();
  
  animateCameraTo(
    -1.3944157496967235, 1.2781273683184076, 0.08927901029766028,
    -1.3981622231195188, 1.276980057445429, -0.4099905446231163
  );
  if (window.audioManager) window.audioManager.updateForMode('tv');
  // Show dialogue after camera animation
  setTimeout(() => {
    showModeDialogue('tv');
  }, 2500);
}

function makePlayerMove(from, to) {
  // CRITICAL: Block if ANY operation is in progress
  if (isResetting || isAnimating || isProcessingMove) {
    return;
  }
  
  isProcessingMove = true; // Lock ALL interactions
  isAnimating = true;
  
  const piece = chessGame.getPieceAt(from);
  if (!piece) {
    console.error(`No piece at ${from} to move!`);
    isProcessingMove = false;
    isAnimating = false;
    return;
  }
  
  const [fromFile, fromRank] = chessGame.squareToIndices(from);
  const [toFile, toRank] = chessGame.squareToIndices(to);
  const isPawn = piece.type.toLowerCase() === 'p';
  const promotionRank = piece.color === 'white' ? 7 : 0;
  const needsPromotion = isPawn && toRank === promotionRank;
  
  // Get selected piece object BEFORE moving
  const selected = chessInteractions.getSelectedPiece();
  const pieceObj = selected.obj;
  
  // If promotion needed, handle capture FIRST, then animate, then show UI
  if (needsPromotion) {
    
    // Check for capture
    const capturedPieceName = chessGame.squareToPieceName[to];
    if (capturedPieceName) {
      chessAnimations.fadeOutPiece(capturedPieceName);
    }
    
    // Store the move details for later
    pendingPromotionMove = { from, to, isAI: false };
    
    // CRITICAL: Update board position IMMEDIATELY (without promotion type yet)
    // This makes the piece disappear from the old square
    chessGame.board[toRank][toFile] = piece;
    chessGame.board[fromRank][fromFile] = null;
    
    // Update piece name mappings
    const pieceName = chessGame.squareToPieceName[from];
    if (pieceName) {
      delete chessGame.squareToPieceName[from];
      chessGame.squareToPieceName[to] = pieceName;
      
      if (chessGame.pieceNameMap[pieceName]) {
        chessGame.pieceNameMap[pieceName].square = to;
      }
    }
    
    // Handle captured piece removal from maps
    if (capturedPieceName) {
      if (chessGame.pieceNameMap[capturedPieceName]) {
        delete chessGame.pieceNameMap[capturedPieceName];
      }
    }
    
    // NOW animate piece to destination
    chessAnimations.animatePieceMove(from, to, () => {
      chessAnimations.lowerPiece(pieceObj, 0.07, () => {
        // Piece is now visually at destination - show promotion UI
        showPromotionUI('white');
        isAnimating = false;
        // Keep isProcessingMove locked until promotion choice made
      });
    });
    
    return; // EXIT - wait for promotion choice
  }
  
  // NORMAL (non-promotion) move - proceed as usual
  const moveData = chessGame.makeMove(from, to);
  if (!moveData) {
    console.error('makeMove returned null');
    isProcessingMove = false;
    isAnimating = false;
    return;
  }
  
  moveCount++;
  
  const capturedPieceName = moveData.capturedPieceName;
  const enPassantCaptureSquare = moveData.enPassantCaptureSquare;
  const captureDelay = (capturedPieceName || enPassantCaptureSquare) ? 500 : 0;
  
  if (capturedPieceName && chessAnimations) {
    chessAnimations.fadeOutPiece(capturedPieceName);
  }
  
  if (enPassantCaptureSquare && !capturedPieceName) {
    const enPassantCaptureName = chessGame.moveHistory[chessGame.moveHistory.length - 1].enPassantCapture?.name;
    if (enPassantCaptureName && chessAnimations) {
      chessAnimations.fadeOutPiece(enPassantCaptureName);
    }
  }
  
  if (moveData.castlingRookMove && chessAnimations) {
    setTimeout(() => {
      chessAnimations.animatePieceMove(
        moveData.castlingRookMove.from,
        moveData.castlingRookMove.to
      );
    }, captureDelay);
  }
  
  setTimeout(() => {
    if (pieceObj) {
      chessAnimations.animatePieceMove(from, to, () => {
        chessAnimations.lowerPiece(pieceObj, 0.07, () => {
          // Normal move complete
          updateChessUI();
          chessInteractions.resetSelection();
          chessInteractions.clearHighlights();
          isAnimating = false;
          // Keep isProcessingMove locked until AI finishes
          setTimeout(() => makeAIMove(), 800);
        });
      });
    }
  }, captureDelay);
}

async function makeAIMove() {
  if (!chessGame || !chessAI || chessGame.gameOver) {
    isProcessingMove = false; // Unlock on exit
    return;
  }
  
  isAnimating = true;
  chessGame.aiThinking = true;
  updateChessUI();
  
  try {
    const move = await chessAI.getBestMove(chessGame.board, chessGame);
    
    if (move && chessGame.isValidMove(move.from, move.to)) {
      const moveData = chessGame.makeMove(move.from, move.to);
      moveCount++;
      
      const captureDelay = (moveData.capturedPieceName || moveData.enPassantCaptureSquare) ? 500 : 0;
      
      if (moveData.capturedPieceName && chessAnimations) {
        chessAnimations.fadeOutPiece(moveData.capturedPieceName);
      }
      
      if (moveData.enPassantCaptureSquare && !moveData.capturedPieceName) {
        const enPassantCaptureName = chessGame.moveHistory[chessGame.moveHistory.length - 1].enPassantCapture?.name;
        if (enPassantCaptureName && chessAnimations) {
          chessAnimations.fadeOutPiece(enPassantCaptureName);
        }
      }
      
      if (moveData.castlingRookMove && chessAnimations) {
        setTimeout(() => {
          chessAnimations.animatePieceMove(
            moveData.castlingRookMove.from,
            moveData.castlingRookMove.to
          );
        }, captureDelay);
      }
      
      setTimeout(() => {
        if (chessAnimations) {
          chessAnimations.animatePieceMove(move.from, move.to, () => {
            if (moveData.needsPromotion) {
              pendingPromotionMove = { from: move.from, to: move.to, isAI: true };
              showPromotionUI('black');
              isAnimating = false;
              // Keep isProcessingMove locked until promotion completes
            } else {
              chessGame.aiThinking = false;
              updateChessUI();
              isAnimating = false;
              isProcessingMove = false; // UNLOCK - AI move complete
            }
          });
        }
      }, captureDelay);
    } else {
      // No valid move
      chessGame.aiThinking = false;
      isAnimating = false;
      isProcessingMove = false; // UNLOCK
      updateChessUI();
    }
  } catch (error) {
    console.error('AI move error:', error);
    chessGame.aiThinking = false;
    isAnimating = false;
    isProcessingMove = false; // UNLOCK on error
    updateChessUI();
  }
}

function animate() {
  requestAnimationFrame(animate);
  
  if (isCameraAnimating) {
    const elapsed = performance.now() / 1000 - animationStart;
    const t = Math.min(elapsed / animationDuration, 1);
    const ease = t * (2 - t); // Original smooth easing
    
    // Update both camera position and target together synchronously
    camera.position.lerpVectors(cameraStartPos, cameraEndPos, ease);
    const newTarget = new THREE.Vector3().lerpVectors(cameraStartTarget, cameraEndTarget, ease);
    controls.target.copy(newTarget);
    controls.update(); // Update controls immediately after setting target

    if (t >= 1) {
  isCameraAnimating = false;
  
  if (currentMode === 'laptop') {
    controls.enabled = false;
    lockedCameraPos.copy(camera.position);
    lockedCameraTarget.copy(controls.target);
  } else if (currentMode === 'desk') {
    controls.enabled = false;
    lockedCameraPos.copy(camera.position);
    lockedCameraTarget.copy(controls.target);
    hoverEnabled = true;
  } else if (currentMode === 'frame') {
    controls.enabled = false;
    lockedCameraPos.copy(camera.position);
    lockedCameraTarget.copy(controls.target);
  } else if (currentMode === 'chess') {
    lockedCameraPos.copy(camera.position);
    lockedCameraTarget.copy(controls.target);
    controls.enabled = false;
    
    Object.values(squareMarkers).forEach(marker => {
      marker.visible = false;
    });
    
    if (gameStarted) {
      document.getElementById('chessStatus').classList.add('active');
      document.getElementById('chessControls').classList.add('active');
    } else {
      const welcomeScreen = document.getElementById('chessWelcome');
      welcomeScreen.style.display = 'block';
      welcomeScreen.classList.add('active');
    }
      } else if (currentMode === 'sofa') {
        controls.enabled = false;
        lockedCameraPos.copy(camera.position);
        lockedCameraTarget.copy(controls.target);
        hoverEnabled = true;
      } else if (currentMode === 'family') {
        controls.enabled = false;
        lockedCameraPos.copy(camera.position);
        lockedCameraTarget.copy(controls.target);
     } else if (currentMode === 'board') {
        controls.enabled = false;
        lockedCameraPos.copy(camera.position);
        lockedCameraTarget.copy(controls.target);
        hoverEnabled = false;
        
        // Play enter audio and start block rotation animation
        playBoardAudio('./assets/audio/bo1.mp3');
        
        blockAnimating = true;
        Object.values(blockRotations).forEach(block => {
          block.animating = true;
        });
        
     } else if (currentMode === 'tv') {
        controls.enabled = false;
        lockedCameraPos.copy(camera.position);
        lockedCameraTarget.copy(controls.target);
        hoverEnabled = false;
        
        if (tvScreen) {
          tvScreen.activate();
        }
        
        // Show mobile controls for TV menu mode (LEFT, RIGHT, ENTER)
        if (window.showMobileControls) {
          window.showMobileControls('menu');
        }
        
      } else if (currentMode === 'shelf') {
      controls.enabled = false;
      lockedCameraPos.copy(camera.position);
      lockedCameraTarget.copy(controls.target);
      hoverEnabled = true;
      }else if (currentMode === 'normal') {
        controls.enabled = true;
        hoverEnabled = true;
      }
    }
  }
  else if (currentMode === 'normal') {
    if (cameraControlEnabled) {
      controls.update();
    } else {
      camera.position.lerp(normalModeCameraPos, 0.05);
      controls.target.lerp(normalModeCameraTarget, 0.05);
      controls.update();
    }
  }
  else if (currentMode !== 'normal' && currentMode !== 'shelf') {
    camera.position.lerp(lockedCameraPos, 0.05);
    controls.target.lerp(lockedCameraTarget, 0.05);
    controls.update();
  }
  
  if (currentMode === 'normal') {
    chessCurrentScale += (chessTargetScale - chessCurrentScale) * 0.08;
    chessPieces.forEach(piece => {
      const origScale = piece.userData.originalScale;
      piece.scale.set(
        origScale.x * chessCurrentScale,
        origScale.y * chessCurrentScale,
        origScale.z * chessCurrentScale
      );
    });
  } else {
    chessPieces.forEach(piece => {
      const origScale = piece.userData.originalScale;
      piece.scale.copy(origScale);
    });
  }
  
  if (currentMode === 'chess' && gameStarted) {
    currentOpacity += pulseDirection * 0.008;
    if (currentOpacity >= 0.8) {
      currentOpacity = 0.8;
      pulseDirection = -1;
    } else if (currentOpacity <= 0.5) {
      currentOpacity = 0.5;
      pulseDirection = 1;
    }
    Object.values(squareMarkers).forEach(marker => {
      if (marker.visible && marker.material) {
        marker.material.opacity = currentOpacity;
      }
    });
  }
  
  // Animate block rotations in board mode
  if (blockAnimating && Object.keys(blockRotations).length > 0) {
    let allComplete = true;
    
    Object.values(blockRotations).forEach(block => {
      if (!block.animating) return;
      
      const targetRot = block.returning ? block.original : block.target;
      const diff = targetRot - block.current;
      
      // Use different speeds for enter vs exit
      const speed = block.exitAnimationSpeed || 0.045; 
      
      if (Math.abs(diff) > 0.001) {
        allComplete = false;
        block.current += diff * speed;
        block.mesh.rotation.x = block.current;
      } else {
        block.current = targetRot;
        block.mesh.rotation.x = targetRot;
        block.animating = false;
        if (block.returning) {
          block.returning = false;
          delete block.exitAnimationSpeed; // Clean up
        }
      }
    });
    
    if (allComplete) {
      blockAnimating = false;
    }
  }
  
 if (laptopScreen && currentMode === 'laptop') {
    laptopScreen.update();
  }
  
  if (tvScreen && currentMode === 'tv') {
    tvScreen.update();
  }
  
  if (currentMode === 'shelf') {
    updateShelfCamera();
  }
const animateOutlines = (outlineArray) => {
    outlineArray.forEach(item => {
      const outline = item.mesh || item;
      if (outline.material && outline.material.transparent) {
        const target = outline.userData.targetOpacity || 0;
        outline.userData.currentOpacity = outline.userData.currentOpacity || 0;
        outline.userData.currentOpacity += (target - outline.userData.currentOpacity) * 0.4; // Even smoother
        outline.material.opacity = outline.userData.currentOpacity;
        
        if (outline.userData.currentOpacity < 0.01) {
          outline.visible = false;
        }
      }
    });
  };
  
  animateOutlines(outlineMeshes);
  animateOutlines(sofaOutlineMeshes);
  animateOutlines(deskOutlineMeshes);
  animateOutlines(frameOutlineMeshes);
  animateOutlines(familyOutlineMeshes);
  animateOutlines(chessOutlineMeshes);
  animateOutlines(boardOutlineMeshes);
  animateOutlines(tvOutlineMeshes);
  animateOutlines(shelfOutlineMeshes);
  animateOutlines(radioOutlineMeshes);
  
  if (laptopScreen && currentMode === 'laptop') {
    laptopScreen.update();
  }
  
  renderer.render(scene, camera);
}