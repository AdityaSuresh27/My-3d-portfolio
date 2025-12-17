//main.js
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

console.log("MAIN.JS LOADED ✅");

let scene, camera, renderer, controls;
let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();

let currentMode = 'normal'; // 'normal', 'sofa', 'chess', 'family', 'laptop', 'desk', 'frame'
let previousMode = null; // Track mode history for exit button
let hoverEnabled = true;

let selectable = [];
let laptopParts = [];
let sofaParts = []; // Bean bags, table
let deskParts = []; // Desk mode objects
let deskOutlineMeshes = [];
let frameParts = []; // Game and fantasy frames
let frameOutlineMeshes = [];
let boardParts = []; // Board mode objects
let boardOutlineMeshes = [];
let blockRotations = {}; // Store original rotations for blocks
let blockAnimating = false; // Track if blocks are animating
let boardAudio = null; // Audio for board rotation
let tvParts = []; // TV mode objects
let tvOutlineMeshes = [];
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
let pendingPromotionMove = null;
let moveCount = 0;

let dialogueBox = null;
let dialogueText = null;
let dialogueClickPrompt = null;
let dialogueVisible = false;
let currentDialogueIndex = 0;
let isTyping = false;
let hasSeenIntroDialogue = false;
let normalModeInteractionBlocked = false;

const introDialogues = [
  "Welcome to my interactive 3D portfolio...",
  "Click around to explore different areas of my work and interests.",
  "Each section has its own story to tell.",
  "Let's begin your journey!"
];

const certificates = [
  {
    title: "Full Stack Web Development",
    issuer: "Udemy",
    date: "2023",
    description: "Comprehensive course covering HTML, CSS, JavaScript, Node.js, Express, MongoDB, and React"
  },
  {
    title: "React - The Complete Guide",
    issuer: "Udemy",
    date: "2023",
    description: "In-depth React.js training including Hooks, Context API, Redux, and Next.js"
  },
  {
    title: "Three.js Journey",
    issuer: "Three.js Journey",
    date: "2024",
    description: "Master 3D graphics in the browser with WebGL and Three.js"
  },
  {
    title: "AWS Certified Cloud Practitioner",
    issuer: "Amazon Web Services",
    date: "2024",
    description: "Cloud computing fundamentals and AWS services certification"
  },
  {
    title: "Python Data Science",
    issuer: "Coursera",
    date: "2022",
    description: "Data analysis, visualization, and machine learning with Python"
  }
];

let certificateBoard = null;
let certificateBoardVisible = false;

const dialogueContent = {
  sofa: "This is my cozy corner where I relax and brainstorm ideas. The family photos remind me of what matters most.",
  chess: "I love strategy games! This chess set represents my analytical thinking and problem-solving skills.",
  family: "Family is everything. These frames hold memories of the people who inspire and support me every day.",
  desk: "My workspace where creativity meets productivity. Every item here tells a story of late nights and breakthrough moments.",
  laptop: "This is where the magic happens. Code, designs, and ideas all come to life on this screen.",
  frame: "These frames showcase my passion for gaming and fantasy worlds. They remind me to never stop exploring new realms.",
  tv: "My retro gaming corner! Use WASD to navigate and ENTER to select your game. Let's play!"
};

// Sofa mode objects
let beanBags = [];
let tableObj = null;

init();
loadScene();
animate();

function init() {
  scene = new THREE.Scene();
  
  scene.background = new THREE.Color(0x1a1a2e);
  
  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);
  camera.position.set(1.695342022365481, 1.1890427194070448, 1.0959525309104552);
  
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

  setupChessUI();
  setupDialogueSystem();
  setupCertificateBoard();
}

function updateCameraDebug() {
  const pos = camera.position;
  const target = controls.target;
  
  console.log(`📷 Pos:(${pos.x.toFixed(4)}, ${pos.y.toFixed(4)}, ${pos.z.toFixed(4)})`);
  console.log(`🎯 Target:(${target.x.toFixed(4)}, ${target.y.toFixed(4)}, ${target.z.toFixed(4)})`);
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
      background: rgba(94, 231, 223, 0.9);
      color: #1a1a2e;
      border: none;
      font-size: 24px;
      cursor: pointer;
      display: none;
      z-index: 1000;
      transition: all 0.3s ease;
      font-weight: bold;
    `;
    btn.addEventListener('mouseenter', () => {
      btn.style.background = 'rgba(94, 231, 223, 1)';
      btn.style.transform = 'scale(1.1)';
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.background = 'rgba(94, 231, 223, 0.9)';
      btn.style.transform = 'scale(1)';
    });
btn.addEventListener('click', exitCurrentMode);
btn.style.pointerEvents = 'auto'; 
document.body.appendChild(btn);
  }
  
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && currentMode !== 'normal' && currentMode !== 'tv') {
    exitCurrentMode();
  }
});
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
  console.log('❌ X button clicked - hiding dialogue');
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
      cursor: default;
    `;
    
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
    `;
    certTitle.textContent = cert.title;
    
    const certIssuer = document.createElement('div');
    certIssuer.style.cssText = `
      margin: 0 0 6px 0;
      font-family: 'Segoe UI', sans-serif;
      font-size: 14px;
      color: rgba(180, 144, 202, 0.9);
      font-weight: 600;
    `;
    certIssuer.textContent = `${cert.issuer} • ${cert.date}`;
    
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
  
  console.log('📋 Certificate board shown');
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
  
  console.log('📋 Certificate board hidden');
}

function playBoardAudio(audioFile) {
  // Stop any existing audio
  if (boardAudio) {
    boardAudio.pause();
    boardAudio.currentTime = 0;
  }
  
  // Create and play new audio
  boardAudio = new Audio(audioFile);
  boardAudio.volume = 0.5; // Adjust volume as needed
  
  boardAudio.play().catch(err => {
    console.warn('Audio playback failed:', err);
  });
  
  console.log('🔊 Playing board audio:', audioFile);
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
  
  console.log('💬 Showing dialogue for mode:', mode);
  
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
  console.log('🚫 Hiding mode dialogue completely');
  
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
  console.log(`Exiting ${currentMode} mode`);
  
  hideModeDialogue();
  
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
  }
}

function exitLaptopMode() {
  hideModeDialogue();
  
  if (laptopScreen) {
    laptopScreen.deactivate();
  }
  
  // Hide laptop UI
  const laptopExitBtn = document.getElementById('laptopExitBtn');
  const laptopModeIndicator = document.getElementById('laptopModeIndicator');
  const laptopHint = document.getElementById('laptopHint');
  if (laptopExitBtn) laptopExitBtn.classList.remove('active');
  if (laptopModeIndicator) laptopModeIndicator.classList.remove('active');
  if (laptopHint) laptopHint.classList.remove('active');
  
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
  
  console.log("Exited laptop mode to desk mode");
}

function exitChessMode() {
  hideModeDialogue();
  
  if (chessInteractions) {
    chessInteractions.deselectPiece();
  }
  
  Object.values(squareMarkers).forEach(marker => {
    marker.visible = false;
  });
  
  // Hide chess UI
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
  
  controls.enabled = false; // Keep locked in sofa mode
  controls.enablePan = false;
  controls.enableZoom = false;
  
  // Animate camera back to sofa view
  animateCameraTo(
    -2.0817795986579544, 1.002890579523843, 1.326450881697992,
    -2.08570808037242, 0.985057465166684, 2.3500947571065485
  );
  
  console.log("♟️ Exited chess mode to sofa mode");
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
  
  console.log("🖼️ Exited family mode to sofa mode");
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
    1.695342022365481, 1.1890427194070448, 1.0959525309104552,
    -0.19350259303174752, 1.0415828316110878, 1.1136973219807842
  );
  
  console.log("🛋️ Exited sofa mode to normal mode");
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
    1.695342022365481, 1.1890427194070448, 1.0959525309104552,
    -0.19350259303174752, 1.0415828316110878, 1.1136973219807842
  );
  
  console.log("Exited desk mode to normal mode");
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
  
  console.log("Exited frame mode to desk mode");
}

function exitBoardMode() {
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
    console.log('📋 Exit audio duration:', audioDuration + 'ms');
    
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
        1.695342022365481, 1.1890427194070448, 1.0959525309104552,
        -0.19350259303174752, 1.0415828316110878, 1.1136973219807842
      );
      
      console.log("📋 Exited board mode to normal mode");
    }, Math.max(audioDuration, 1200)); 
  });
}

function exitTVMode() {
  // Hide dialogue IMMEDIATELY
  hideModeDialogue();
  
  if (tvScreen) {
    tvScreen.deactivate();
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
    1.695342022365481, 1.1890427194070448, 1.0959525309104552,
    -0.19350259303174752, 1.0415828316110878, 1.1136973219807842
  );
  
  console.log("📺 Exited TV mode to normal mode");
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
  
  document.getElementById('resetBtn').addEventListener('click', resetChessGame);
  
  document.getElementById('playAgainBtn').addEventListener('click', () => {
    document.getElementById('gameOverScreen').classList.remove('show');
    resetChessGame();
  });
  
  document.getElementById('exitGameBtn').addEventListener('click', () => {
    document.getElementById('gameOverScreen').classList.remove('show');
    exitChessMode();
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
    console.warn('No pending promotion move');
    return;
  }
  
  hidePromotionUI();
  
  const { from, to, isAI } = pendingPromotionMove;
  const piece = chessGame.getPieceAt(to);
  
  if (piece) {
    piece.type = pieceType;
    console.log(`✅ Piece type updated to ${pieceType} at ${to}`);
  }
  
  const pieceName = chessGame.squareToPieceName[to];
  const color = isAI ? 'black' : 'white';
  const newModelName = getModelNameForPromotion(pieceType, color);
  
  if (pieceName && newModelName && pieceObjects[newModelName]) {
    console.log(`🔄 Replacing ${pieceName} model with ${newModelName}`);
    replacePromotedPieceModel(pieceName, newModelName, to);
  }
  
  pendingPromotionMove = null;
  
  if (isAI) {
    chessGame.aiThinking = false;
    updateChessUI();
  } else {
    updateChessUI();
    setTimeout(() => makeAIMove(), 800);
  }
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

function replacePromotedPieceModel(oldPieceName, newModelName, square) {
  const oldPiece = pieceObjects[oldPieceName];
  const templatePiece = pieceObjects[newModelName];
  
  if (!oldPiece || !templatePiece) {
    console.warn('Cannot replace piece model - missing pieces');
    return;
  }
  
  const newPiece = templatePiece.clone(true);
  newPiece.traverse((child) => {
    if (child.isMesh && child.material) {
      child.material = child.material.clone();
    }
  });
  
  const originalScale = templatePiece.userData.originalScale
    ? templatePiece.userData.originalScale.clone()
    : new THREE.Vector3(1, 1, 1);
  
  newPiece.scale.copy(originalScale);
  newPiece.userData.originalScale = originalScale.clone();
  newPiece.position.copy(oldPiece.position);
  newPiece.rotation.copy(oldPiece.rotation);
  newPiece.rotation.y += Math.PI;
  newPiece.visible = true;
  
  newPiece.traverse((child) => {
    if (child.isMesh) {
      child.visible = true;
    }
  });
  
  newPiece.name = oldPieceName;
  
  chessBoard.remove(oldPiece);
  
  const oldIndex = chessInteractions.whitePieceObjects.indexOf(oldPiece);
  if (oldIndex !== -1) {
    chessInteractions.whitePieceObjects.splice(oldIndex, 1);
  }
  
  chessBoard.add(newPiece);
  chessInteractions.whitePieceObjects.push(newPiece);
  pieceObjects[oldPieceName] = newPiece;
  
  console.log(`✅ Replaced ${oldPieceName} with ${newModelName} model at scale (${originalScale.x}, ${originalScale.y}, ${originalScale.z})`);
}

function resetChessGame() {
  const initialBoardState = {};
  Object.entries(chessGame.pieceNameMap).forEach(([name, data]) => {
    initialBoardState[name] = { square: data.square, type: data.type, color: data.color };
  });
  
  chessGame = new ChessGame();
  window.chessGame = chessGame;
  moveCount = 0;
  pendingPromotionMove = null;
  
  Object.entries(initialBoardState).forEach(([name, data]) => {
    const pieceObj = pieceObjects[name];
    if (pieceObj && squareMarkers[data.square.toUpperCase()]) {
      const targetMarker = squareMarkers[data.square.toUpperCase()];
      const targetWorldPos = new THREE.Vector3();
      targetMarker.getWorldPosition(targetWorldPos);
      const targetLocalPos = chessBoard.worldToLocal(targetWorldPos.clone());
      
      pieceObj.position.copy(targetLocalPos);
      pieceObj.visible = true;
      pieceObj.scale.copy(pieceObj.userData.originalScale || new THREE.Vector3(1, 1, 1));
      pieceObj.rotation.y = data.color === 'black' ? Math.PI : 0;
    }
  });
  
  if (chessInteractions) {
    chessInteractions.deselectPiece();
  }
  
  updateChessUI();
  showMoveIndicator('♟️ Board Reset!');
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
      scene.add(gltf.scene);
      
      let chessPiecesToParent = [];
      
      gltf.scene.traverse((child) => {
        if (child.isMesh) {
          
          // FIX CORRUPTED MATERIALS FROM COMPRESSION
          if (child.material) {
            if (child.material.transmission !== undefined && child.material.transmission > 0) {
              console.warn('⚠️ Fixing transmission material:', child.name);
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
              console.log('🖼️ Fixed fantasy frame material:', child.name);
            }
            
            child.material = child.material.clone();
            // FIX WINDOWS - Make Object_58 and Object_60 transparent
            if (child.name === "Object_58" || child.name === "Object_60") {
              console.log('🪟 Making window transparent:', child.name);
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
            console.log('💻 Laptop body found');
          }

          if (child.name === "screen_laptopScreen_0") {
            laptopParts.push(child);
            deskParts.push(child);
            screenMesh = child;
            
            child.position.y += 0.002;
            child.position.z -= 0;
            child.rotation.x -= 0.055;
            console.log('Original UV data:', child.geometry.attributes.uv?.array.slice(0, 8));
            console.log('Original rotation:', child.rotation);
            console.log('Original position:', child.position);
            
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
            
            console.log('🔥 REPLACING corrupted screen geometry...');
            
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
            
            console.log('✅ Screen geometry REPLACED');
          }
          
          if (child.name === "chess_board") {
            chessBoard = child;
          }

          // SOFA MODE OBJECTS
          if (child.name === "Bean_Bag_m_chair_0" || child.name === "Bean_Bag_m_chair_0_1") {
            beanBags.push(child);
            sofaParts.push(child);
            console.log('🛋️ Bean bag found:', child.name);
          }
          
          if (child.name === "fam_frame" || child.name === "fam_frame2") {
            familyFrameParts.push(child);
            sofaParts.push(child);
            console.log(`🖼️ Family frame found: ${child.name}`);
          }
          
          
          if (child.name === "table") {
            tableObj = child;
            sofaParts.push(child);
            child.position.x += 0.02; 
            console.log('🪑 Table found and moved back');
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
            console.log('Desk object found:', child.name);
          }
          
          // FRAME MODE OBJECTS
          if (child.name === 'game_frame1' || child.name === 'game_frame2' || 
              child.name === 'fantasy_frame_1' || child.name === 'fantasy_frame_2') {
            if (child.name === 'game_frame1' || child.name === 'game_frame2') {
              child.position.z += 0.01; // Move slightly back to align with frame
            }
            
            // SIMPLIFIED FIX: Just ensure proper material settings
            if (child.name === 'fantasy_frame_1' || child.name === 'fantasy_frame_2') {
              // Make sure material is proper without render order issues
              if (child.material) {
                child.material.side = THREE.DoubleSide;
                child.material.transparent = false;
                child.material.depthTest = true;
                child.material.depthWrite = true;
              }
              console.log('🖼️ Fixed fantasy frame material:', child.name);
            }
            
            frameParts.push(child);
            deskParts.push(child); // Also add to desk parts for initial hover
            console.log('Frame found:', child.name);
          }
          // BOARD MODE OBJECTS - Include all board objects
if (child.name && (child.name.startsWith('board') || child.name.startsWith('block-'))) {
  boardParts.push(child);
  
  // Store original rotation for blocks that need animation
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
  
console.log('📋 Board object found:', child.name);
}

// TV MODE OBJECTS
const tvObjectNames = ['tv_screen', 'seat', 'mat', 'con_1', 'con_2'];
if (tvObjectNames.includes(child.name)) {
  tvParts.push(child);
  
// Store TV screen mesh for texture replacement
if (child.name === 'tv_screen') {
  tvScreenMesh = child;
  
  // 🔧 CRITICAL: Fix TV screen geometry WITHOUT changing rotation
  child.geometry.computeBoundingBox();
  const bbox = child.geometry.boundingBox;
  const width = bbox.max.x - bbox.min.x;
  const height = bbox.max.y - bbox.min.y;
  
  console.log('📺 TV screen size:', width, 'x', height);
  
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
  
  console.log('📺 TV screen geometry replaced');
  console.log('  - Material type:', child.material.type);
  console.log('  - New geometry:', child.geometry.type);
}
  
  console.log('📺 TV object found:', child.name);
}

          if (chessPieceNames.includes(child.name)) {
            chessPiecesToParent.push(child);
            pieceObjects[child.name] = child;
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
          piece.position.copy(chessBoard.worldToLocal(worldPos));
          piece.userData.originalScale = piece.scale.clone();
        });
        
        chessPieces.push(chessBoard);
        chessBoard.userData.originalScale = chessBoard.scale.clone();
      }

      // Ensure screen has original scale saved
      if (screenMesh && !screenMesh.userData.originalScale) {
        screenMesh.userData.originalScale = screenMesh.scale.clone();
        console.log('✅ Screen original scale saved:', screenMesh.userData.originalScale);
      }

      // Create outlines for laptop parts (IMPROVED - smoother, brighter, thicker)
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
    polygonOffset: true,      // ← ADD THIS
    polygonOffsetFactor: -1,  // ← ADD THIS
    polygonOffsetUnits: -1    // ← ADD THIS
});
  const outlineMesh = new THREE.Mesh(outlineGeo, outlineMat);
  outlineMesh.scale.multiplyScalar(1.04); // THICKER outline
  outlineMesh.renderOrder = 999; // Render on top
  part.add(outlineMesh);
  outlineMeshes.push(outlineMesh);
  outlineMesh.visible = false;
  outlineMesh.userData.targetOpacity = 0;
  outlineMesh.userData.currentOpacity = 0;
});

      // Create outlines for sofa mode objects (IMPROVED - bright and thick)
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
    polygonOffset: true,      // ← ADD THIS
    polygonOffsetFactor: -1,  // ← ADD THIS
    polygonOffsetUnits: -1    // ← ADD THIS
});
  const outlineMesh = new THREE.Mesh(outlineGeo, outlineMat);
  outlineMesh.scale.multiplyScalar(1.05); // THICKER outline
  outlineMesh.renderOrder = 999;
  part.add(outlineMesh);
  sofaOutlineMeshes.push({ mesh: outlineMesh, parent: part });
  outlineMesh.visible = false;
  outlineMesh.userData.targetOpacity = 0;
  outlineMesh.userData.currentOpacity = 0;
});

      // Create outlines for desk mode objects (IMPROVED)
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
    polygonOffset: true,      // ← ADD THIS
    polygonOffsetFactor: -1,  // ← ADD THIS
    polygonOffsetUnits: -1    // ← ADD THIS
});
  const outlineMesh = new THREE.Mesh(outlineGeo, outlineMat);
  outlineMesh.scale.multiplyScalar(1.05); // THICKER
  outlineMesh.renderOrder = 999;
  part.add(outlineMesh);
  deskOutlineMeshes.push({ mesh: outlineMesh, parent: part });
  outlineMesh.visible = false;
  outlineMesh.userData.targetOpacity = 0;
  outlineMesh.userData.currentOpacity = 0;
});

// Create outlines for frame mode objects (IMPROVED BRIGHT CYAN)
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
    polygonOffset: true,      // ← ADD THIS
    polygonOffsetFactor: -1,  // ← ADD THIS
    polygonOffsetUnits: -1    // ← ADD THIS
});
  const outlineMesh = new THREE.Mesh(outlineGeo, outlineMat);
  outlineMesh.scale.multiplyScalar(1.06); // THICKER
  outlineMesh.renderOrder = 999;
  part.add(outlineMesh);
  frameOutlineMeshes.push({ mesh: outlineMesh, parent: part });
  outlineMesh.visible = false;
  outlineMesh.userData.targetOpacity = 0;
  outlineMesh.userData.currentOpacity = 0;
});

// Create outlines for board mode objects (only board1 and board2)
boardParts.forEach((part) => {
  // Only create outlines for board1 and board2
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
    outlineMesh.renderOrder = 998; // Render before screen
    
    part.add(outlineMesh);
    tvOutlineMeshes.push({ mesh: outlineMesh, parent: part });
    outlineMesh.visible = false;
    outlineMesh.userData.targetOpacity = 0;
    outlineMesh.userData.currentOpacity = 0;
    
    console.log('📺 TV screen outline created - 15% larger, DoubleSide, behind screen');
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

// Create outlines for family frames (IMPROVED)
familyFrameParts.forEach((part) => {
  const outlineGeo = part.geometry.clone();
  const outlineMat = new THREE.MeshBasicMaterial({
    color: 0x00ffff,
    side: THREE.BackSide,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    depthTest: true,
    polygonOffset: true,      // ← ADD THIS
    polygonOffsetFactor: -1,  // ← ADD THIS
    polygonOffsetUnits: -1    // ← ADD THIS
});
  const outlineMesh = new THREE.Mesh(outlineGeo, outlineMat);
  outlineMesh.scale.multiplyScalar(1.05); // THICKER
  outlineMesh.renderOrder = 999;
  part.add(outlineMesh);
  familyOutlineMeshes.push({ mesh: outlineMesh, parent: part });
  outlineMesh.visible = false;
  outlineMesh.userData.targetOpacity = 0;
  outlineMesh.userData.currentOpacity = 0;
});

// Create outline for chess board (FIXED - FULL BOARD SIZE)
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
  
  // CRITICAL FIX: Don't multiply by board scale, use direct multiplier only
  // Chess board scale is already applied to geometry, so we just make it slightly bigger
  outlineMesh.scale.set(1.08, 1.08, 1.08); // Simple uniform scale
  
  outlineMesh.position.y += 0.008; // RAISE HIGHER
  outlineMesh.renderOrder = 1000; // Render ABOVE everything
  chessBoard.add(outlineMesh);
  chessOutlineMeshes.push(outlineMesh);
  outlineMesh.visible = false;
  outlineMesh.userData.targetOpacity = 0;
  outlineMesh.userData.currentOpacity = 0;
  
  console.log('♟️ Chess outline created - full board size');
  console.log('Chess board scale:', chessBoard.scale);
  console.log('Outline mesh scale:', outlineMesh.scale);
}
      document.getElementById("loading").style.display = "none";
      
      // Show intro dialogue ONLY after loading is complete
      setTimeout(() => {
        if (!hasSeenIntroDialogue) {
          showIntroDialogue();
        }
      }, 800);
      
      if (screenMesh && typeof LaptopScreen !== 'undefined') {
        screenMesh.visible = true;
        screenMesh.material.transparent = false;
        screenMesh.material.opacity = 1.0;
        
        laptopScreen = new LaptopScreen(screenMesh, THREE, renderer);
        laptopScreen.setCamera(camera);
        console.log("💻 Laptop screen initialized");
      }

      if (typeof ChessGame !== 'undefined') {
        chessGame = new ChessGame();
        window.chessGame = chessGame;
        console.log("♟️ Chess game initialized");
      }
      
      if (typeof ChessInteractions !== 'undefined') {
        chessInteractions = new ChessInteractions(
          scene, camera, raycaster, mouse, pieceObjects, squareMarkers, chessBoard, chessPieceNames
        );
        console.log("♟️ Chess interactions initialized");
      }
      
      if (typeof ChessAnimations !== 'undefined') {
        chessAnimations = new ChessAnimations(chessBoard, pieceObjects, squareMarkers, THREE);
        console.log("♟️ Chess animations initialized");
      }
      
      // Initialize TV screen
if (tvScreenMesh && typeof TVScreen !== 'undefined') {
  tvScreen = new TVScreen(tvScreenMesh, THREE, renderer);
  console.log("📺 TV screen initialized");
  console.log("TV screen mesh:", tvScreenMesh.name);
  console.log("TV screen material:", tvScreenMesh.material);
} else {
  if (!tvScreenMesh) console.error("❌ TV screen mesh not found in scene!");
  if (typeof TVScreen === 'undefined') console.error("❌ TVScreen class not loaded!");
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
  
// Normal mode - hover over laptop, sofa, desk, and board objects (WITH SMOOTH ANIMATION)
if (currentMode === 'normal') {
  if (!hoverEnabled) return;
  
  const hits = raycaster.intersectObjects(selectable, true);
  
  const hoveringLaptop = hits.some(h => laptopParts.includes(h.object));
  const hoveringSofa = hits.some(h => sofaParts.includes(h.object));
  const hoveringDesk = hits.some(h => deskParts.includes(h.object));
  const hoveringBoard = hits.some(h => boardParts.includes(h.object));
  const hoveringTV = hits.some(h => tvParts.includes(h.object));
  
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
}
  
  // Sofa mode - hover over chess board and family frames (WITH SMOOTH ANIMATION)
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
  
// Desk mode - hover over laptop and frames (WITH SMOOTH ANIMATION)
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
  if (isCameraAnimating || normalModeInteractionBlocked) return;
  
  updateCameraDebug();
  console.log('Camera Position:', camera.position);
  console.log('Camera Target:', controls.target);
  
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  
  raycaster.setFromCamera(mouse, camera);
  
  // Block all scene interaction in laptop, family, frame modes
  if (currentMode === 'laptop' || currentMode === 'family' || currentMode === 'frame') {
    return;
  }
  
  // Chess mode - handle chess interactions
  if (currentMode === 'chess' && gameStarted && chessInteractions) {
    chessInteractions.handleClick(chessGame, makePlayerMove);
    return;
  }
  
  const hits = raycaster.intersectObjects(selectable, true);
  
  if (hits.length > 0) {
    console.log('CLICKED OBJECT:', hits[0].object.name);
  }
  
// Normal mode - can click sofa, desk, or board objects
if (currentMode === 'normal') {
  const clickedSofa = hits.find(h => sofaParts.includes(h.object));
  const clickedDesk = hits.find(h => deskParts.includes(h.object));
  const clickedBoard = hits.find(h => boardParts.includes(h.object));
  const clickedTV = hits.find(h => tvParts.includes(h.object));
  
  if (clickedSofa) {
    console.log('Entering SOFA mode');
    enterSofaMode();
  } else if (clickedDesk) {
    console.log('Entering DESK mode');
    enterDeskMode();
  } else if (clickedBoard) {
    console.log('Entering BOARD mode');
    enterBoardMode();
  } else if (clickedTV) {
    console.log('Entering TV mode');
    enterTVMode();
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
      console.log('Entering CHESS mode from sofa');
      enterChessMode();
    } else if (clickedFamily) {
      console.log('Entering FAMILY mode from sofa');
      enterFamilyMode();
    }
  }
  
  // Desk mode - can click laptop or frames
  else if (currentMode === 'desk') {
    const clickedLaptop = hits.find(h => laptopParts.includes(h.object));
    const clickedFrame = hits.find(h => frameParts.includes(h.object));
    
    if (clickedLaptop) {
      console.log('Entering LAPTOP mode from desk');
      enterLaptopMode();
    } else if (clickedFrame) {
      console.log('Entering FRAME mode from desk');
      enterFrameMode();
    }
  }
}

function enterLaptopMode() {
  // Determine which mode we're coming from
  const fromDesk = (currentMode === 'desk');
  
  currentMode = 'laptop';
  previousMode = fromDesk ? 'desk' : 'normal';
  hoverEnabled = false;
  outlineMeshes.forEach(o => (o.visible = false));
  
  // Lock camera completely
  controls.enabled = false;
  
  if (laptopScreen) {
    laptopScreen.activate();
  }
  
  const laptopExitBtn = document.getElementById('laptopExitBtn');
  const laptopModeIndicator = document.getElementById('laptopModeIndicator');
  const laptopHint = document.getElementById('laptopHint');
  
  if (laptopModeIndicator) laptopModeIndicator.style.display = 'none';
if (laptopHint) laptopHint.style.display = 'none';

  if (laptopExitBtn) laptopExitBtn.classList.add('active');
  if (laptopModeIndicator) laptopModeIndicator.classList.add('active');
  
  showExitButton();
  
  setTimeout(() => {
    if (laptopHint) laptopHint.classList.add('active');
  }, 1000);
  
  animateCameraTo(
    -4.0128, 1.1213, 1.0702,
    -4.8249, 1.0837, 0.6311
  );
  
  // Show dialogue after animation
  setTimeout(() => {
    showModeDialogue('laptop');
  }, 2500);
  
  console.log("Entered laptop mode");
}

function enterSofaMode() {
  currentMode = 'sofa';
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
  
  // Show dialogue after camera animation
  setTimeout(() => {
    showModeDialogue('sofa');
  }, 2500);
  
  console.log("🛋️ Entered sofa mode");
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
  
  // Show dialogue after camera animation
  setTimeout(() => {
    showModeDialogue('chess');
  }, 2500);
  
  console.log("♟️ Entered chess mode");
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
  
  // Show dialogue after camera animation
  setTimeout(() => {
    showModeDialogue('family');
  }, 2500);
  
  console.log("🖼️ Entered family mode");
}

function enterDeskMode() {
  currentMode = 'desk';
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
  
  // Show dialogue after camera animation
  setTimeout(() => {
    showModeDialogue('desk');
  }, 2500);
  
  console.log("Entered desk mode");
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
  
  // Show dialogue after camera animation
  setTimeout(() => {
    showModeDialogue('frame');
  }, 2500);
  console.log("Entered frame mode");
}

function enterBoardMode() {
  currentMode = 'board';
  previousMode = 'normal';
  hoverEnabled = false;
  boardOutlineMeshes.forEach(item => (item.mesh.visible = false));
  
  // Lock camera
  controls.enabled = false;
  controls.enablePan = false;
  controls.enableZoom = false;
  
  showExitButton();
  
  // DON'T start block animation yet - wait for camera to finish
  
  animateCameraTo(
    -4.274350092309905, 1.5743882076196263, 2.711131867410986,
    -7.130103486312447, 1.5894207255690969, 2.7379573381311144
  );
  
   setTimeout(() => {
    showCertificateBoard();
  }, 3500); // Wait for camera (2.2s) + block animation (~1.3s)
  
  console.log("📋 Entered board mode");
}

function enterTVMode() {
  currentMode = 'tv';
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
  
  // Show dialogue after camera animation
  setTimeout(() => {
    showModeDialogue('tv');
  }, 2500);
  
  // CRITICAL: Log TV screen state for debugging
  console.log("📺 Entered TV mode");
  if (tvScreenMesh) {
    console.log("TV screen mesh found:", tvScreenMesh.name);
    console.log("TV screen visible:", tvScreenMesh.visible);
    console.log("TV screen material:", tvScreenMesh.material?.type);
  } else {
    console.error("❌ TV screen mesh is NULL!");
  }
}

function makePlayerMove(from, to) {
  const moveData = chessGame.makeMove(from, to);
  moveCount++;
  
  const selected = chessInteractions.getSelectedPiece();
  const pieceObj = selected.obj;
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
          if (moveData.needsPromotion) {
            pendingPromotionMove = { from, to, isAI: false };
            showPromotionUI('white');
          } else {
            updateChessUI();
            chessInteractions.resetSelection();
            chessInteractions.clearHighlights();
            setTimeout(() => makeAIMove(), 800);
          }
        });
      });
    }
  }, captureDelay);
}

async function makeAIMove() {
  if (!chessGame || !chessAI || chessGame.gameOver) return;
  
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
            } else {
              chessGame.aiThinking = false;
              updateChessUI();
            }
          });
        }
      }, captureDelay);
    }
  } catch (error) {
    console.error('❌ AI move error:', error);
    chessGame.aiThinking = false;
    updateChessUI();
  }
}

function animate() {
  requestAnimationFrame(animate);
  
  // Handle camera animation first (before controls update)
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
    console.log("💻 Laptop mode activated - camera locked at:", lockedCameraPos);
  } else if (currentMode === 'desk') {
    controls.enabled = false;
    lockedCameraPos.copy(camera.position);
    lockedCameraTarget.copy(controls.target);
    hoverEnabled = true;
    console.log("🖥️ Desk mode activated - camera locked at:", lockedCameraPos);
  } else if (currentMode === 'frame') {
    controls.enabled = false;
    lockedCameraPos.copy(camera.position);
    lockedCameraTarget.copy(controls.target);
    console.log("🖼️ Frame mode activated - camera locked at:", lockedCameraPos);
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
      console.log("♟️ Chess mode resumed at:", lockedCameraPos);
    } else {
      const welcomeScreen = document.getElementById('chessWelcome');
      welcomeScreen.style.display = 'block';
      welcomeScreen.classList.add('active');
      console.log("♟️ Chess mode activated at:", lockedCameraPos);
    }
      } else if (currentMode === 'sofa') {
        controls.enabled = false;
        lockedCameraPos.copy(camera.position);
        lockedCameraTarget.copy(controls.target);
        hoverEnabled = true;
        console.log("🛋️ Sofa mode activated - camera locked at:", lockedCameraPos);
      } else if (currentMode === 'family') {
        controls.enabled = false;
        lockedCameraPos.copy(camera.position);
        lockedCameraTarget.copy(controls.target);
        console.log("🖼️ Family mode activated - camera locked at:", lockedCameraPos);
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
        
       console.log("📋 Board mode activated - camera locked, starting block rotation with audio"); 
      } else if (currentMode === 'tv') {
        controls.enabled = false;
        lockedCameraPos.copy(camera.position);
        lockedCameraTarget.copy(controls.target);
        hoverEnabled = false;
        
        // Activate TV screen
        if (tvScreen) {
          tvScreen.activate();
        }
        
        console.log("📺 TV mode activated - camera locked, console OS ready");
      }
      else if (currentMode === 'normal') {
        controls.enabled = true;
        hoverEnabled = true;
        console.log("🔄 Returned to normal mode");
      }
    }
  }
  // Only update controls if in normal mode and not animating
  else if (currentMode === 'normal') {
    controls.update();
  }
  // Lock camera in all non-normal modes (prevent any drift)
  else if (currentMode !== 'normal') {
    // Gently lock camera to prevent jitter (same as original chess mode)
    camera.position.lerp(lockedCameraPos, 0.05);
    controls.target.lerp(lockedCameraTarget, 0.05);
    controls.update();
  }
  
  // Handle chess board scale (only in normal mode for hover effect)
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
    // Reset scale in other modes
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
      const speed = block.exitAnimationSpeed || 0.045; // Slower for enter (0.045), faster for exit (0.15)
      
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
  
  if (laptopScreen && currentMode === 'laptop') {
    laptopScreen.update();
  }
  
  renderer.render(scene, camera);
}
