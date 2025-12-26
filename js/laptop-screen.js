// laptop-screen.js - OPTIMIZED with bigger UI and better performance
class LaptopScreen {
  constructor(screenMesh, THREE, renderer) {
    this.screenMesh = screenMesh;
    this.THREE = THREE;
    this.renderer = renderer;
    this.texture = null;
    this.isActive = false;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.camera = null;
    this.isHoveringScreen = false;
    this.clickSound = new Audio('assets/audio/mouse.mp3');
    this.clickSound.volume = 0.3;
    
    // Optimized canvas for performance
    this.canvasWidth = 1920;
    this.canvasHeight = 1200;
    
    // Render optimization
    this.needsRedraw = true;
    this.staticElementsCache = null;
    
    // UI State with scrolling support
    this.windows = {
      fileManager: { 
        open: false, x: 200, y: 150, w: 1500, h: 900, 
        title: 'File Manager', zIndex: 1, maximized: false, minimized: false,
        scrollY: 0, maxScrollY: 0
      },
      about: { 
        open: false, x: 220, y: 160, w: 1480, h: 880, 
        title: 'About', zIndex: 1, maximized: false, minimized: false,
        scrollY: 0, maxScrollY: 0
      },
      projects: { 
        open: false, x: 210, y: 155, w: 1490, h: 890, 
        title: 'Projects', zIndex: 1, maximized: false, minimized: false,
        scrollY: 0, maxScrollY: 0
      },
      skills: { 
        open: false, x: 230, y: 170, w: 1460, h: 860, 
        title: 'Skills', zIndex: 1, maximized: false, minimized: false,
        scrollY: 0, maxScrollY: 0
      },
      contact: { 
        open: false, x: 240, y: 180, w: 1440, h: 840, 
        title: 'Contact', zIndex: 1, maximized: false, minimized: false,
        scrollY: 0, maxScrollY: 0
      }
    };

    this.originalWindowSizes = {};
    this.tooltip = {
      visible: false,
      text: '',
      x: 0,
      y: 0
    };
    this.showPermissionMessage = false;
    this.permissionMessageTimer = 0;
    this.permissionMessageText = '🔒 Access Denied';
    this.permissionMessageSubtext = 'You don\'t have permission to access this folder';
    
    Object.entries(this.windows).forEach(([name, win]) => {
      this.originalWindowSizes[name] = { x: win.x, y: win.y, w: win.w, h: win.h };
    });
    
    // Animation state
    this.animations = {};
    this.hoveredIcon = null;
    this.hoveredCloseBtn = null;
    this.hoveredMaximizeBtn = null;
    this.hoveredMinimizeBtn = null;
    this.hoveredFileItem = null;
    this.hoveredProjectItem = null;
    this.hoveredContactItem = null;
    this.hoveredScrollBar = null;
    this.iconScales = [1, 1, 1, 1, 1];
    this.iconTargetScales = [1, 1, 1, 1, 1];
    
    // Dragging
    this.dragging = null;
    this.dragOffsetX = 0;
    this.dragOffsetY = 0;
    
    // Scroll bar dragging
    this.draggingScrollBar = null;
    this.scrollBarDragOffset = 0;

    // Background animation
    this.bgOffset = 0;
    this.lastClockUpdate = 0;
    
    this.setupTexture();
    this.setupInteraction();
    this.createCustomCursor();
    this.cacheStaticElements();
    this.startAnimationLoop();
  }
  
  createCustomCursor() {
    this.customCursor = document.createElement('div');
    this.customCursor.id = 'laptopCustomCursor';
    this.customCursor.style.cssText = `
      position: fixed;
      width: 28px;
      height: 28px;
      pointer-events: none;
      z-index: 10000;
      display: none;
      transform: translate(0, 0);
      filter: drop-shadow(0 3px 6px rgba(0, 0, 0, 0.6));
      will-change: transform;
    `;
    
    this.customCursor.innerHTML = `
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 3L10.07 19.97L12.58 12.58L19.97 10.07L3 3Z" fill="white" stroke="black" stroke-width="2" stroke-linejoin="round"/>
      </svg>
    `;
    
    document.body.appendChild(this.customCursor);
  }
  
  setupTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = this.canvasWidth;
    canvas.height = this.canvasHeight;
    
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { 
      alpha: false,
      desynchronized: true,
      willReadFrequently: false
    });
    
    this.texture = new this.THREE.CanvasTexture(canvas);
    this.texture.minFilter = this.THREE.LinearFilter;
    this.texture.magFilter = this.THREE.LinearFilter;
    this.texture.colorSpace = this.THREE.SRGBColorSpace;
    
    if (this.screenMesh.material) {
      this.screenMesh.material = new this.THREE.MeshBasicMaterial({
        map: this.texture,
        side: this.THREE.DoubleSide,
        toneMapped: false
      });
    }
  }
  
  cacheStaticElements() {
    const bgCanvas = document.createElement('canvas');
    bgCanvas.width = this.canvasWidth;
    bgCanvas.height = this.canvasHeight;
    const bgCtx = bgCanvas.getContext('2d');
    
    const grad = bgCtx.createLinearGradient(0, 0, this.canvasWidth, this.canvasHeight);
    grad.addColorStop(0, '#e63946');
    grad.addColorStop(0.4, '#c1121f');
    grad.addColorStop(0.7, '#780000');
    grad.addColorStop(1, '#1a0a0a');
    bgCtx.fillStyle = grad;
    bgCtx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
    
    bgCtx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
    bgCtx.lineWidth = 1;
    for (let i = 0; i < this.canvasWidth; i += 60) {
      bgCtx.beginPath();
      bgCtx.moveTo(i, 0);
      bgCtx.lineTo(i, this.canvasHeight);
      bgCtx.stroke();
    }
    for (let i = 0; i < this.canvasHeight; i += 60) {
      bgCtx.beginPath();
      bgCtx.moveTo(0, i);
      bgCtx.lineTo(this.canvasWidth, i);
      bgCtx.stroke();
    }
    
    bgCtx.fillStyle = 'rgba(255, 75, 92, 0.04)';
    bgCtx.beginPath();
    bgCtx.arc(this.canvasWidth * 0.2, this.canvasHeight * 0.3, 350, 0, Math.PI * 2);
    bgCtx.fill();
    
    bgCtx.fillStyle = 'rgba(120, 0, 0, 0.06)';
    bgCtx.beginPath();
    bgCtx.arc(this.canvasWidth * 0.8, this.canvasHeight * 0.7, 450, 0, Math.PI * 2);
    bgCtx.fill();
    
    this.staticElementsCache = bgCanvas;
  }
  
  setupInteraction() {
    this.lastMouseX = 0;
    this.lastMouseY = 0;
    
    this.onMouseMove = (event) => {
      if (!this.isActive || !this.camera) return;
      
      // CHECK: If mouse is over dialogue box, don't interact with screen
      const dialogueBox = document.getElementById('dialogueBox');
      if (dialogueBox && dialogueBox.style.display !== 'none') {
        const rect = dialogueBox.getBoundingClientRect();
        if (event.clientX >= rect.left && event.clientX <= rect.right &&
            event.clientY >= rect.top && event.clientY <= rect.bottom) {
          // Mouse is over dialogue - stop screen interaction
          if (this.isHoveringScreen) {
            this.isHoveringScreen = false;
            document.body.style.cursor = '';
            this.customCursor.style.display = 'none';
          }
          return;
        }
      }
      
      this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
      
      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersects = this.raycaster.intersectObject(this.screenMesh, false);
      
      if (intersects.length > 0) {
        if (!this.isHoveringScreen) {
          this.isHoveringScreen = true;
          document.body.style.cursor = 'none';
          this.customCursor.style.display = 'block';
        }
        
        this.customCursor.style.left = event.clientX + 'px';
        this.customCursor.style.top = event.clientY + 'px';
        
        const uv = intersects[0].uv;
        if (uv) {
          const clampedU = Math.max(0, Math.min(1, uv.x));
          const clampedV = Math.max(0, Math.min(1, uv.y));
          
          this.lastMouseX = clampedU * this.canvasWidth;
          this.lastMouseY = (1 - clampedV) * this.canvasHeight;
          
          if (this.dragging) {
            const win = this.windows[this.dragging];
            if (!win.maximized && !win.minimized) {
              win.x = this.lastMouseX - this.dragOffsetX;
              win.y = this.lastMouseY - this.dragOffsetY;
              win.x = Math.max(0, Math.min(this.canvasWidth - 100, win.x));
              win.y = Math.max(0, Math.min(this.canvasHeight - 100, win.y));
              this.needsRedraw = true;
            }
          } else if (this.draggingScrollBar) {
            const win = this.windows[this.draggingScrollBar];
            const scrollBarY = win.y + 100;
            const scrollBarHeight = win.h - 110;
            const contentHeight = scrollBarHeight;
            const scrollableHeight = win.maxScrollY + contentHeight;
            const thumbHeight = Math.max(30, (contentHeight / scrollableHeight) * scrollBarHeight);
            
            const targetThumbY = this.lastMouseY - this.scrollBarDragOffset;
            const relativeY = targetThumbY - scrollBarY;
            const scrollRatio = relativeY / (scrollBarHeight - thumbHeight);
            
            win.scrollY = Math.max(0, Math.min(win.maxScrollY, scrollRatio * win.maxScrollY));
            this.needsRedraw = true;
          } else {
            this.updateHoverState(this.lastMouseX, this.lastMouseY);
          }
        }
      } else {
        if (this.isHoveringScreen) {
          this.isHoveringScreen = false;
          document.body.style.cursor = '';
          this.customCursor.style.display = 'none';
          this.hoveredIcon = null;
          this.hoveredCloseBtn = null;
          this.hoveredMaximizeBtn = null;
          this.hoveredMinimizeBtn = null;
          this.hoveredFileItem = null;
          this.hoveredProjectItem = null;
          this.hoveredContactItem = null;
          this.hoveredScrollBar = null;
          this.iconTargetScales = [1, 1, 1, 1, 1];
          this.needsRedraw = true;
        }
      }
    };
    
    this.onMouseDown = (event) => {
      if (!this.isActive || !this.camera) return;
      
      const dialogueBox = document.getElementById('dialogueBox');
      if (dialogueBox && dialogueBox.style.display !== 'none') {
        const rect = dialogueBox.getBoundingClientRect();
        if (event.clientX >= rect.left && event.clientX <= rect.right &&
            event.clientY >= rect.top && event.clientY <= rect.bottom) {
          return; // Let dialogue handle the click
        }
      }
      
      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersects = this.raycaster.intersectObject(this.screenMesh, false);
      
      if (intersects.length > 0) {
        event.preventDefault();
        event.stopPropagation();
        
        const uv = intersects[0].uv;
        if (uv) {
          const clampedU = Math.max(0, Math.min(1, uv.x));
          const clampedV = Math.max(0, Math.min(1, uv.y));
          
          const x = clampedU * this.canvasWidth;
          const y = (1 - clampedV) * this.canvasHeight;
          this.handleMouseDown(x, y);
        }
      }
    };
    
    this.onMouseUp = (event) => {
      if (this.dragging) {
        this.dragging = null;
        this.needsRedraw = true;
      }
      if (this.draggingScrollBar) {
        this.draggingScrollBar = null;
        this.needsRedraw = true;
      }
    };
    
    this.onWheel = (event) => {
      if (!this.isActive || !this.camera) return;
      
      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersects = this.raycaster.intersectObject(this.screenMesh, false);
      
      if (intersects.length > 0) {
        event.preventDefault();
        
        // Find topmost window being scrolled
        const sortedWindows = Object.entries(this.windows)
          .filter(([name, win]) => win.open && !win.minimized)
          .sort(([, a], [, b]) => b.zIndex - a.zIndex);
        
        for (let [name, win] of sortedWindows) {
          if (this.lastMouseX >= win.x && this.lastMouseX <= win.x + win.w && 
              this.lastMouseY >= win.y && this.lastMouseY <= win.y + win.h) {
            
            if (win.maxScrollY > 0) {
              win.scrollY += event.deltaY * 0.5;
              win.scrollY = Math.max(0, Math.min(win.maxScrollY, win.scrollY));
              this.needsRedraw = true;
            }
            break;
          }
        }
      }
    };
    
    this.onClick = (event) => {
      if (!this.isActive || !this.camera) return;
      
      const dialogueBox = document.getElementById('dialogueBox');
      if (dialogueBox && dialogueBox.style.display !== 'none') {
        const rect = dialogueBox.getBoundingClientRect();
        if (event.clientX >= rect.left && event.clientX <= rect.right &&
            event.clientY >= rect.top && event.clientY <= rect.bottom) {
          return;
        }
      }
      
      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersects = this.raycaster.intersectObject(this.screenMesh, false);
      
      if (intersects.length > 0) {
        event.preventDefault();
        event.stopPropagation();
        
        if (this.clickSound) {
          this.clickSound.currentTime = 0;
          this.clickSound.play().catch(e => console.log('Audio play blocked:', e));
        }
        
        const uv = intersects[0].uv;
        if (uv) {
          const clampedU = Math.max(0, Math.min(1, uv.x));
          const clampedV = Math.max(0, Math.min(1, uv.y));
          
          const x = clampedU * this.canvasWidth;
          const y = (1 - clampedV) * this.canvasHeight;
          this.handleClick(x, y);
        }
      }
    };
  }
  
  updateHoverState(x, y) {
    let changed = false;
    
    const oldHoveredIcon = this.hoveredIcon;
    const oldHoveredClose = this.hoveredCloseBtn;
    const oldHoveredMax = this.hoveredMaximizeBtn;
    const oldHoveredMin = this.hoveredMinimizeBtn;
    const oldHoveredFile = this.hoveredFileItem;
    const oldHoveredProject = this.hoveredProjectItem;
    const oldHoveredContact = this.hoveredContactItem;
    const oldHoveredScrollBar = this.hoveredScrollBar;
    
    this.hoveredIcon = null;
    this.hoveredCloseBtn = null;
    this.hoveredMaximizeBtn = null;
    this.hoveredMinimizeBtn = null;
    this.hoveredFileItem = null;
    this.hoveredProjectItem = null;
    this.hoveredContactItem = null;
    this.hoveredScrollBar = null;
    this.tooltip.visible = false;
    
    // Check topmost window first for interactions
    const sortedWindows = Object.entries(this.windows)
      .filter(([name, win]) => win.open && !win.minimized)
      .sort(([, a], [, b]) => b.zIndex - a.zIndex);
    
    let foundWindowButton = false;
    for (let [name, win] of sortedWindows) {
      if (x >= win.x && x <= win.x + win.w && y >= win.y && y <= win.y + win.h) {
        // Check close button
        const closeX = win.x + win.w - 80;
        const closeY = win.y + 15;
        if (x >= closeX && x <= closeX + 60 && y >= closeY && y <= closeY + 60) {
          this.hoveredCloseBtn = name;
          foundWindowButton = true;
          break;
        }
        
        // Check maximize button
        const maxX = win.x + win.w - 155;
        const maxY = win.y + 15;
        if (x >= maxX && x <= maxX + 60 && y >= maxY && y <= maxY + 60) {
          this.hoveredMaximizeBtn = name;
          foundWindowButton = true;
          break;
        }
        
        // Check minimize button
        const minX = win.x + win.w - 230;
        const minY = win.y + 15;
        if (x >= minX && x <= minX + 60 && y >= minY && y <= minY + 60) {
          this.hoveredMinimizeBtn = name;
          foundWindowButton = true;
          break;
        }
        
        // Check scroll bar
        if (win.maxScrollY > 0) {
          const scrollBarX = win.x + win.w - 30;
          const scrollBarY = win.y + 100;
          const scrollBarHeight = win.h - 110;
          
          if (x >= scrollBarX && x <= scrollBarX + 20 && 
              y >= scrollBarY && y <= scrollBarY + scrollBarHeight) {
            this.hoveredScrollBar = name;
            foundWindowButton = true;
            break;
          }
        }
        
        // Check window-specific content
        if (y > win.y + 90) {
          this.checkWindowContentHover(name, win, x, y);
          foundWindowButton = true;
        }
        
        break; // Only check topmost window
      }
    }
    
    if (!foundWindowButton && y < 100) {
      // Check minimized windows in taskbar
      for (let [name, win] of Object.entries(this.windows)) {
        if (win.minimized) {
          const minIconX = 700 + Object.keys(this.windows).filter(k => this.windows[k].minimized && k < name).length * 200;
          if (x >= minIconX && x <= minIconX + 190 && y >= 15 && y <= 85) {
            this.hoveredMinimizeBtn = name;
            foundWindowButton = true;
            break;
          }
        }
      }
      
      // Check taskbar icons
      if (!foundWindowButton) {
        const icons = ['fileManager', 'about', 'skills', 'projects', 'contact'];
        const labels = ['File Manager', 'About', 'Skills', 'Projects', 'Contact'];
        const iconIndex = Math.floor((x - 110) / 100);
        
        if (iconIndex >= 0 && iconIndex < 5 && x >= 110 && x <= 110 + 5 * 100 - 10) {
          const iconX = 110 + iconIndex * 100;
          if (x >= iconX && x <= iconX + 90) {
            this.hoveredIcon = iconIndex;
            this.tooltip.visible = true;
            this.tooltip.text = labels[iconIndex];
            this.tooltip.x = iconX + 45;
            this.tooltip.y = 100;
            
            for (let i = 0; i < 5; i++) {
              this.iconTargetScales[i] = (i === iconIndex) ? 1.12 : 1;
            }
          }
        } else {
          this.iconTargetScales = [1, 1, 1, 1, 1];
        }
      }
    } else if (y >= 100) {
      this.iconTargetScales = [1, 1, 1, 1, 1];
    }
    
    if (oldHoveredIcon !== this.hoveredIcon || 
        oldHoveredClose !== this.hoveredCloseBtn || 
        oldHoveredMax !== this.hoveredMaximizeBtn || 
        oldHoveredMin !== this.hoveredMinimizeBtn ||
        oldHoveredFile !== this.hoveredFileItem ||
        oldHoveredProject !== this.hoveredProjectItem ||
        oldHoveredContact !== this.hoveredContactItem ||
        oldHoveredScrollBar !== this.hoveredScrollBar) {
      changed = true;
    }
    
    if (changed) {
      this.needsRedraw = true;
    }
  }
  
  checkWindowContentHover(name, win, x, y) {
    const contentY = win.y + 140 - win.scrollY;
    const contentX = win.x + 50;
    const maxWidth = win.w - 100;
    
    if (name === 'fileManager') {
      const folders = [
        { icon: '📁', name: 'Documents', size: '245 items' },
        { icon: '📁', name: 'Downloads', size: '127 items' },
        { icon: '📁', name: 'Pictures', size: '1,453 items' },
        { icon: '📁', name: 'Music', size: '892 items' },
        { icon: '📁', name: 'Videos', size: '64 items' },
        { icon: '📄', name: 'Resume(click-me).pdf', size: '245 KB' }
      ];
      
      folders.forEach((item, i) => {
        const itemY = contentY + i * 100;
        if (x >= contentX && x <= contentX + win.w - 100 && 
            y >= itemY && y <= itemY + 90) {
          this.hoveredFileItem = i;
        }
      });
    } else if (name === 'projects') {
    const projects = [
      { title: '3D Interactive Portfolio' },
      { title: 'Voice Assistant with AI Support' },
      { title: 'Resume Evaluator with Microsoft Azure' },
      { title: 'Webots Trash Collection Robot' },
      { title: 'STM32 Smart Irrigation' },
      { title: 'Loan Approval Prediction' }
    ];
    
    projects.forEach((proj, i) => {
      const itemY = contentY + i * 260;
      if (x >= contentX && x <= contentX + maxWidth && 
          y >= itemY && y <= itemY + 240) {
        this.hoveredProjectItem = i;
      }
    });
    } else if (name === 'contact') {
      const contacts = [
        { label: 'Email' },
        { label: 'GitHub' },
        { label: 'LinkedIn' },
        { label: 'Location' },
        { label: 'Website' }
      ];
      
      contacts.forEach((contact, i) => {
        const itemY = contentY + i * 140;
        if (x >= contentX && x <= contentX + maxWidth && 
            y >= itemY && y <= itemY + 120) {
          // Skip location (index 3)
          if (i !== 3) {
            this.hoveredContactItem = i;
          }
        }
      });
    }
  }
  
  handleMouseDown(x, y) {
    // Check if clicking minimized window in taskbar
    for (let [name, win] of Object.entries(this.windows)) {
      if (win.minimized && y < 100) {
        const minIconX = 700 + Object.keys(this.windows).filter(k => this.windows[k].minimized && k < name).length * 200;
        if (x > minIconX && x < minIconX + 190 && y > 15 && y < 85) {
          return;
        }
      }
    }
    
    // Get topmost window
    const sortedWindows = Object.entries(this.windows)
      .filter(([name, win]) => win.open && !win.minimized)
      .sort(([, a], [, b]) => b.zIndex - a.zIndex);
    
    // Check if clicking on a scroll bar (topmost window only)
    for (let [name, win] of sortedWindows) {
      if (x >= win.x && x <= win.x + win.w && y >= win.y && y <= win.y + win.h) {
        if (win.maxScrollY > 0) {
          const scrollBarX = win.x + win.w - 30;
          const scrollBarY = win.y + 100;
          const scrollBarHeight = win.h - 110;
          
          if (x >= scrollBarX && x <= scrollBarX + 20 && 
              y >= scrollBarY && y <= scrollBarY + scrollBarHeight) {
            // Start dragging scroll bar
            this.draggingScrollBar = name;
            const thumbHeight = Math.max(30, (scrollBarHeight / (win.maxScrollY + scrollBarHeight)) * scrollBarHeight);
            const thumbY = scrollBarY + (win.scrollY / win.maxScrollY) * (scrollBarHeight - thumbHeight);
            this.scrollBarDragOffset = y - thumbY;
            this.bringToFront(name);
            return;
          }
        }
        break;
      }
    }
    
    // Check window title bar for dragging (topmost window only)
    for (let [name, win] of sortedWindows) {
      if (x > win.x && x < win.x + win.w && y > win.y && y < win.y + 90) {
        const closeX = win.x + win.w - 80;
        const maxX = win.x + win.w - 155;
        const minX = win.x + win.w - 230;
        
        if ((x < minX || x > closeX + 60 || y < win.y + 15 || y > win.y + 75) && !win.maximized) {
          this.dragging = name;
          this.dragOffsetX = x - win.x;
          this.dragOffsetY = y - win.y;
          this.bringToFront(name);
          return;
        }
        break;
      }
    }
  }
  
  handleClick(x, y) {
    // Find topmost window under click
    const sortedWindows = Object.entries(this.windows)
      .filter(([name, win]) => win.open && !win.minimized)
      .sort(([, a], [, b]) => b.zIndex - a.zIndex);
    
    let clickedWindow = null;
    for (let [name, win] of sortedWindows) {
      if (x >= win.x && x <= win.x + win.w && 
          y >= win.y && y <= win.y + win.h) {
        clickedWindow = name;
        break;
      }
    }
    
    if (clickedWindow) {
      this.bringToFront(clickedWindow);
      const win = this.windows[clickedWindow];
      
      // Check window buttons
      const closeX = win.x + win.w - 80;
      const closeY = win.y + 15;
      if (x >= closeX && x <= closeX + 60 && y >= closeY && y <= closeY + 60) {
        this.closeWindow(clickedWindow);
        return;
      }
      
      const maxX = win.x + win.w - 155;
      const maxY = win.y + 15;
      if (x >= maxX && x <= maxX + 60 && y >= maxY && y <= maxY + 60) {
        this.toggleMaximize(clickedWindow);
        return;
      }
      
      const minX = win.x + win.w - 230;
      const minY = win.y + 15;
      if (x >= minX && x <= minX + 60 && y >= minY && y <= minY + 60) {
this.minimizeWindow(clickedWindow);
return;
}
  // Check window content clicks
  if (y > win.y + 90) {
    this.handleWindowContentClick(clickedWindow, win, x, y);
  }
  return;
}

// Check taskbar
if (y < 100) {
  for (let [name, win] of Object.entries(this.windows)) {
    if (win.minimized) {
      const minIconX = 700 + Object.keys(this.windows).filter(k => this.windows[k].minimized && k < name).length * 200;
      if (x >= minIconX && x <= minIconX + 190 && y >= 15 && y <= 85) {
        this.restoreWindow(name);
        return;
      }
    }
  }
  
  const iconIndex = Math.floor((x - 110) / 100);
  if (iconIndex >= 0 && iconIndex < 5) {
    const iconX = 110 + iconIndex * 100;
    if (x >= iconX && x <= iconX + 90) {
      const icons = ['fileManager', 'about', 'skills', 'projects', 'contact'];
      this.toggleWindow(icons[iconIndex]);
    }
  }
  return;
}
}
copyToClipboard(text) {
  // Try using the modern clipboard API
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      console.log('Copied to clipboard:', text);
    }).catch(err => {
      console.error('Failed to copy:', err);
      this.fallbackCopyToClipboard(text);
    });
  } else {
    this.fallbackCopyToClipboard(text);
  }
}

fallbackCopyToClipboard(text) {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.left = '-999999px';
  document.body.appendChild(textArea);
  textArea.select();
  try {
    document.execCommand('copy');
    console.log('Copied to clipboard (fallback):', text);
  } catch (err) {
    console.error('Fallback copy failed:', err);
  }
  document.body.removeChild(textArea);
}

handleWindowContentClick(name, win, x, y) {
const contentY = win.y + 140 - win.scrollY;
const contentX = win.x + 50;
if (name === 'fileManager') {
  const folders = [
    { icon: '📁', name: 'Documents', size: '245 items' },
    { icon: '📁', name: 'Downloads', size: '127 items' },
    { icon: '📁', name: 'Pictures', size: '1,453 items' },
    { icon: '📁', name: 'Music', size: '892 items' },
    { icon: '📁', name: 'Videos', size: '64 items' },
    { icon: '📄', name: 'Resume(click-me).pdf', size: '245 KB' }
  ];
  
  folders.forEach((item, i) => {
    const itemY = contentY + i * 100;
    if (x >= contentX && x <= contentX + win.w - 100 && 
        y >= itemY && y <= itemY + 90) {
      if (item.icon === '📄') {
        window.open('assets/documents/resume.pdf', '_blank');
      } else {
        this.showPermissionMessage = true;
        this.permissionMessageTimer = Date.now();
        this.permissionMessageText = '🔒 Access Denied';
        this.permissionMessageSubtext = 'You don\'t have permission to access this folder';
        this.needsRedraw = true;
      }
    }
  });
}  else if (name === 'projects') {
  const projects = [
    { title: '3D Interactive Portfolio', url: 'https://github.com/AdityaSuresh27/My-3d-portfolio' },
    { title: 'Voice Assistant with AI Support', url: 'https://github.com/AdityaSuresh27/voice-assistant' },
    { title: 'Resume Evaluator with Microsoft Azure', url: 'https://github.com/AdityaSuresh27/azure-gpt-resume-evaluator' },
    { title: 'Webots Trash Collection Robot', url: 'https://github.com/AdityaSuresh27/trash-sorter-bot' },
    { title: 'STM32 Smart Irrigation', url: 'https://github.com/AdityaSuresh27/Soil-Irrigation-Project' },
    { title: 'Loan Approval Prediction', url: 'https://github.com/AdityaSuresh27/loan-approval-prediction-ml-streamlit' }
  ];
  
  projects.forEach((proj, i) => {
    const itemY = contentY + i * 260;
    if (x >= contentX && x <= contentX + win.w - 100 && 
        y >= itemY && y <= itemY + 240) {
      window.open(proj.url, '_blank');
    }
  });
} else if (name === 'contact') {
  const contacts = [
    { label: 'Email', url: 'aditya8756354@gmail.com', isEmail: true },
    { label: 'GitHub', url: 'https://github.com/AdityaSuresh27', isEmail: false },
    { label: 'LinkedIn', url: 'https://www.linkedin.com/in/aditya-suresh-26b457298/', isEmail: false },
    { label: 'Location', url: null, isEmail: false },
    { label: 'Website', url: 'https://adityasuresh27.github.io/My-3d-portfolio/', isEmail: false }
  ];
  
  contacts.forEach((contact, i) => {
    const itemY = contentY + i * 140;
    if (x >= contentX && x <= contentX + win.w - 100 && 
        y >= itemY && y <= itemY + 120 && contact.url) {
      if (contact.isEmail) {
        // Copy email to clipboard
        this.copyToClipboard(contact.url);
        // Show a brief message (optional)
        this.showPermissionMessage = true;
        this.permissionMessageTimer = Date.now();
        this.permissionMessageText = '📋 Email Copied!';
        this.needsRedraw = true;
      } else {
        window.open(contact.url, '_blank');
      }
    }
  });
} else if (name === 'about') {
  // About page has no clickable elements
  return;
}
}
toggleWindow(name) {
const win = this.windows[name];
if (!win.open) {
win.open = true;
win.minimized = false;
win.scrollY = 0;
this.bringToFront(name);
this.animations[name] = {
scale: 0.9,
opacity: 0,
targetScale: 1,
targetOpacity: 1
};
this.needsRedraw = true;
} else if (win.minimized) {
this.restoreWindow(name);
} else {
this.bringToFront(name);
}
}
closeWindow(name) {
const win = this.windows[name];
this.animations[name] = {
scale: 1,
opacity: 1,
targetScale: 0.9,
targetOpacity: 0,
closing: true
};
this.needsRedraw = true;
setTimeout(() => {
  win.open = false;
  win.minimized = false;
  win.scrollY = 0;
  if (win.maximized) {
    const orig = this.originalWindowSizes[name];
    win.x = orig.x;
    win.y = orig.y;
    win.w = orig.w;
    win.h = orig.h;
    win.maximized = false;
  }
  delete this.animations[name];
  this.needsRedraw = true;
}, 250);
}
minimizeWindow(name) {
const win = this.windows[name];
win.minimized = true;
this.animations[name] = {
scale: 1,
opacity: 1,
targetScale: 0.8,
targetOpacity: 0,
minimizing: true
};
this.needsRedraw = true;
setTimeout(() => {
  delete this.animations[name];
  this.needsRedraw = true;
}, 250);
}
restoreWindow(name) {
const win = this.windows[name];
win.minimized = false;
this.bringToFront(name);
this.animations[name] = {
scale: 0.8,
opacity: 0,
targetScale: 1,
targetOpacity: 1
};
this.needsRedraw = true;
}
toggleMaximize(name) {
const win = this.windows[name];
win.maximized = !win.maximized;
if (win.maximized) {
  this.originalWindowSizes[name] = { x: win.x, y: win.y, w: win.w, h: win.h };
  win.x = 0;
  win.y = 100;
  win.w = this.canvasWidth;
  win.h = this.canvasHeight - 100;
} else {
  const orig = this.originalWindowSizes[name];
  win.x = orig.x;
  win.y = orig.y;
  win.w = orig.w;
  win.h = orig.h;
}

this.bringToFront(name);
this.needsRedraw = true;
}
bringToFront(name) {
const maxZ = Math.max(...Object.values(this.windows).map(w => w.zIndex));
this.windows[name].zIndex = maxZ + 1;
this.needsRedraw = true;
}
startAnimationLoop() {
let lastTime = performance.now();
const animate = (currentTime) => {
  if (this.isActive) {
    const deltaTime = currentTime - lastTime;
    lastTime = currentTime;
    
    let hasActiveAnimations = false;
    for (let [name, anim] of Object.entries(this.animations)) {
      anim.scale += (anim.targetScale - anim.scale) * 0.2;
      anim.opacity += (anim.targetOpacity - anim.opacity) * 0.2;
      
      if (Math.abs(anim.scale - anim.targetScale) > 0.005 || 
          Math.abs(anim.opacity - anim.targetOpacity) > 0.005) {
        hasActiveAnimations = true;
      } else if (!anim.closing && !anim.minimizing) {
        delete this.animations[name];
      }
    }
    
    let iconsAnimating = false;
    for (let i = 0; i < 5; i++) {
      this.iconScales[i] += (this.iconTargetScales[i] - this.iconScales[i]) * 0.25;
      if (Math.abs(this.iconScales[i] - this.iconTargetScales[i]) > 0.001) {
        iconsAnimating = true;
      }
    }
    
    const now = Date.now();
    if (now - this.lastClockUpdate > 1000) {
      this.lastClockUpdate = now;
      this.needsRedraw = true;
    }

    if (this.showPermissionMessage) {
      this.needsRedraw = true;
    }
    
    if (this.needsRedraw || hasActiveAnimations || iconsAnimating || this.dragging) {
      this.render();
      this.needsRedraw = false;
    }
  }
  
  requestAnimationFrame(animate);
};

requestAnimationFrame(animate);
}
render() {
const ctx = this.ctx;
const w = this.canvasWidth;
const h = this.canvasHeight;
ctx.drawImage(this.staticElementsCache, 0, 0);

ctx.fillStyle = 'rgba(10, 5, 15, 0.97)';
ctx.fillRect(0, 0, w, 100);

const accentGrad = ctx.createLinearGradient(0, 0, w, 0);
accentGrad.addColorStop(0, 'rgba(230, 57, 70, 0)');
accentGrad.addColorStop(0.3, 'rgba(230, 57, 70, 0.7)');
accentGrad.addColorStop(0.5, 'rgba(230, 57, 70, 0.9)');
accentGrad.addColorStop(0.7, 'rgba(230, 57, 70, 0.7)');
accentGrad.addColorStop(1, 'rgba(230, 57, 70, 0)');
ctx.fillStyle = accentGrad;
ctx.fillRect(0, 0, w, 4);

const startGrad = ctx.createLinearGradient(20, 10, 100, 90);
startGrad.addColorStop(0, '#e63946');
startGrad.addColorStop(0.5, '#c1121f');
startGrad.addColorStop(1, '#780000');
ctx.fillStyle = startGrad;
ctx.beginPath();
ctx.roundRect(20, 10, 80, 80, 16);
ctx.fill();

ctx.fillStyle = '#fff';
ctx.font = '42px Arial';
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';
ctx.fillText('⌂', 60, 50);

const icons = [
  { emoji: '📁', label: 'Files' },
  { emoji: '👤', label: 'About' },
  { emoji: '⚡', label: 'Skills' },
  { emoji: '🚀', label: 'Projects' },
  { emoji: '✉', label: 'Contact' }
];

icons.forEach((icon, i) => {
  const x = 110 + i * 100;
  const scale = this.iconScales[i];
  const isHovered = this.hoveredIcon === i;
  
  ctx.save();
  ctx.translate(x + 45, 50);
  ctx.scale(scale, scale);
  ctx.translate(-(x + 45), -50);
  
  if (isHovered) {
    const hoverGrad = ctx.createRadialGradient(x + 45, 50, 0, x + 45, 50, 50);
    hoverGrad.addColorStop(0, 'rgba(230, 57, 70, 0.4)');
    hoverGrad.addColorStop(1, 'rgba(230, 57, 70, 0.1)');
    ctx.fillStyle = hoverGrad;
  } else {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
  }
  
  ctx.beginPath();
  ctx.roundRect(x, 10, 90, 80, 16);
  ctx.fill();
  
  if (isHovered) {
    ctx.strokeStyle = 'rgba(230, 57, 70, 0.6)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  
  ctx.fillStyle = '#fff';
  ctx.font = '38px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(icon.emoji, x + 45, 50);
  
  ctx.restore();
});

let minIconX = 700;
for (let [name, win] of Object.entries(this.windows)) {
  if (win.minimized) {
    const isHovered = this.hoveredMinimizeBtn === name;
    
    if (isHovered) {
      ctx.fillStyle = 'rgba(230, 57, 70, 0.3)';
    } else {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    }
    
    ctx.beginPath();
    ctx.roundRect(minIconX, 15, 190, 70, 12);
    ctx.fill();
    
    if (isHovered) {
      ctx.strokeStyle = 'rgba(230, 57, 70, 0.6)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    
    ctx.fillStyle = '#fff';
    ctx.font = '26px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(win.title, minIconX + 15, 55);
    
    minIconX += 200;
  }
}

ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
ctx.font = '32px Arial';
ctx.textAlign = 'center';
ctx.fillText('🔊', w - 275, 52);
ctx.fillText('📶', w - 225, 52);
ctx.fillText('🔋', w - 175, 52);

// BIGGER CLOCK
ctx.fillStyle = '#fff';
ctx.font = 'bold 26px Arial';
ctx.textAlign = 'right';
const now = new Date();
const time = now.toLocaleTimeString('en-US', { 
  hour: 'numeric', 
  minute: '2-digit',
  hour12: true 
});
const date = now.toLocaleDateString('en-US', { 
  month: 'short', 
  day: 'numeric' 
});
ctx.fillText(time, w - 30, 42);
ctx.font = '18px Arial';
ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
ctx.fillText(date, w - 30, 68);

ctx.textAlign = 'left';
ctx.textBaseline = 'alphabetic';

// Windows
const sortedWindows = Object.entries(this.windows)
  .filter(([name, win]) => (win.open && !win.minimized) || this.animations[name])
  .sort(([, a], [, b]) => a.zIndex - b.zIndex);

for (let [name, win] of sortedWindows) {
  this.drawWindow(ctx, name, win);
}

// Draw tooltip
if (this.tooltip.visible) {
  const tooltipWidth = ctx.measureText(this.tooltip.text).width + 30;
  const tooltipX = this.tooltip.x - tooltipWidth / 2;
  const tooltipY = this.tooltip.y + 10;
  
  ctx.fillStyle = 'rgba(10, 5, 15, 0.95)';
  ctx.beginPath();
  ctx.roundRect(tooltipX, tooltipY, tooltipWidth, 45, 8);
  ctx.fill();
  
  ctx.strokeStyle = 'rgba(230, 57, 70, 0.6)';
  ctx.lineWidth = 2;
  ctx.stroke();
  
  ctx.fillStyle = '#fff';
  ctx.font = '22px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(this.tooltip.text, this.tooltip.x, tooltipY + 29);
  ctx.textAlign = 'left';
}

// Draw permission denied message
if (this.showPermissionMessage) {
  const elapsed = Date.now() - this.permissionMessageTimer;
  if (elapsed > 2000) {
    this.showPermissionMessage = false;
  } else {
    const opacity = elapsed < 1800 ? 1 : (2000 - elapsed) / 200;
    ctx.save();
    ctx.globalAlpha = opacity;
    
    const msgX = w / 2 - 300;
    const msgY = 200;
    
   // Different color for success vs error
  const isSuccess = this.permissionMessageText && this.permissionMessageText.includes('Copied');
  if (isSuccess) {
    ctx.fillStyle = 'rgba(76, 175, 80, 0.95)';
  } else {
    ctx.fillStyle = 'rgba(193, 18, 31, 0.95)';
  }
  ctx.beginPath();
  ctx.roundRect(msgX, msgY, 600, 100, 16);
  ctx.fill();

  ctx.strokeStyle = isSuccess ? 'rgba(76, 175, 80, 0.8)' : 'rgba(230, 57, 70, 0.8)';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 38px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(this.permissionMessageText || '🔒 Access Denied', w / 2, msgY + 42);
    ctx.font = '28px Arial';
    ctx.fillText(this.permissionMessageSubtext || 'Action completed', w / 2, msgY + 75);
    ctx.textAlign = 'left';
    
    ctx.restore();
    this.needsRedraw = true;
  }
}

this.texture.needsUpdate = true;
}
drawWindow(ctx, name, win) {
const anim = this.animations[name];
const scale = anim ? anim.scale : 1;
const opacity = anim ? anim.opacity : 1;
if (opacity < 0.01) return;

ctx.save();
ctx.globalAlpha = opacity;

const centerX = win.x + win.w / 2;
const centerY = win.y + win.h / 2;

ctx.translate(centerX, centerY);
ctx.scale(scale, scale);
ctx.translate(-centerX, -centerY);

ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
ctx.shadowBlur = 35;
ctx.shadowOffsetY = 18;

ctx.fillStyle = 'rgba(18, 12, 25, 0.97)';
ctx.beginPath();
ctx.roundRect(win.x, win.y, win.w, win.h, 18);
ctx.fill();

ctx.shadowColor = 'transparent';

ctx.strokeStyle = 'rgba(230, 57, 70, 0.4)';
ctx.lineWidth = 2;
ctx.stroke();

// BIGGER TITLE BAR
const titleGrad = ctx.createLinearGradient(win.x, win.y, win.x + win.w, win.y + 90);
titleGrad.addColorStop(0, '#e63946');
titleGrad.addColorStop(0.5, '#c1121f');
titleGrad.addColorStop(1, '#780000');
ctx.fillStyle = titleGrad;
ctx.beginPath();
ctx.roundRect(win.x, win.y, win.w, 90, [18, 18, 0, 0]);
ctx.fill();

const shineGrad = ctx.createLinearGradient(win.x, win.y, win.x, win.y + 45);
shineGrad.addColorStop(0, 'rgba(255, 255, 255, 0.18)');
shineGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
ctx.fillStyle = shineGrad;
ctx.fillRect(win.x, win.y, win.w, 45);

// BIGGER TITLE TEXT
ctx.fillStyle = '#fff';
ctx.font = 'bold 30px Arial';
ctx.fillText(win.title, win.x + 30, win.y + 55);

const isMinHovered = this.hoveredMinimizeBtn === name;
const minX = win.x + win.w - 230;
const minY = win.y + 15;

if (isMinHovered) {
  ctx.fillStyle = 'rgba(255, 193, 7, 0.4)';
} else {
  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
}

ctx.beginPath();
ctx.roundRect(minX, minY, 60, 60, 12);
ctx.fill();

ctx.fillStyle = '#fff';
ctx.font = 'bold 32px Arial';
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';
ctx.fillText('−', minX + 30, minY + 30);

// BIGGER MAXIMIZE BUTTON
const isMaxHovered = this.hoveredMaximizeBtn === name;
const maxX = win.x + win.w - 155;
const maxY = win.y + 15;

if (isMaxHovered) {
  ctx.fillStyle = 'rgba(76, 175, 80, 0.4)';
} else {
  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
}

ctx.beginPath();
ctx.roundRect(maxX, maxY, 60, 60, 12);
ctx.fill();

ctx.fillStyle = '#fff';
ctx.font = 'bold 30px Arial';
ctx.fillText(win.maximized ? '⊡' : '□', maxX + 30, maxY + 30);

// BIGGER CLOSE BUTTON
const isCloseHovered = this.hoveredCloseBtn === name;
const closeX = win.x + win.w - 80;
const closeY = win.y + 15;

if (isCloseHovered) {
  const hoverGrad = ctx.createRadialGradient(closeX + 30, closeY + 30, 0, closeX + 30, closeY + 30, 35);
  hoverGrad.addColorStop(0, 'rgba(244, 67, 54, 0.9)');
  hoverGrad.addColorStop(1, 'rgba(211, 47, 47, 0.7)');
  ctx.fillStyle = hoverGrad;
} else {
  ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
}

ctx.beginPath();
ctx.roundRect(closeX, closeY, 60, 60, 12);
ctx.fill();

ctx.fillStyle = '#fff';
ctx.font = 'bold 32px Arial';
ctx.fillText('×', closeX + 30, closeY + 30);
ctx.textAlign = 'left';
ctx.textBaseline = 'alphabetic';

// Content background
ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
ctx.beginPath();
ctx.roundRect(win.x + 2, win.y + 91, win.w - 4, win.h - 92, [0, 0, 16, 16]);
ctx.fill();

// CLIP CONTENT AREA FOR SCROLLING
ctx.save();
ctx.beginPath();
ctx.rect(win.x + 2, win.y + 91, win.w - 4, win.h - 92);
ctx.clip();

this.drawWindowContent(ctx, name, win);

ctx.restore();

// Draw scroll bar AFTER content clipping is restored
if (win.maxScrollY > 0) {
  const scrollBarX = win.x + win.w - 30;
  const scrollBarY = win.y + 100;
  const scrollBarHeight = win.h - 110;
  const isScrollHovered = this.hoveredScrollBar === name;
  const isScrollDragging = this.draggingScrollBar === name;
  
  // Scroll track
  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.beginPath();
  ctx.roundRect(scrollBarX, scrollBarY, 20, scrollBarHeight, 10);
  ctx.fill();
  
  // Scroll thumb
  const contentHeight = scrollBarHeight;
  const scrollableHeight = win.maxScrollY + contentHeight;
  const thumbHeight = Math.max(30, (contentHeight / scrollableHeight) * scrollBarHeight);
  const thumbY = scrollBarY + (win.scrollY / win.maxScrollY) * (scrollBarHeight - thumbHeight);
  
  if (isScrollDragging) {
    ctx.fillStyle = 'rgba(230, 57, 70, 0.95)';
  } else if (isScrollHovered) {
    ctx.fillStyle = 'rgba(230, 57, 70, 0.85)';
  } else {
    ctx.fillStyle = 'rgba(230, 57, 70, 0.7)';
  }
  
  ctx.beginPath();
  ctx.roundRect(scrollBarX, thumbY, 20, thumbHeight, 10);
  ctx.fill();
}

ctx.restore();
}
drawWindowContent(ctx, name, win) {
const contentY = win.y + 140 - win.scrollY;
const contentX = win.x + 50;
const maxWidth = win.w - 100;
if (name === 'fileManager') {
  const folders = [
    { icon: '📁', name: 'Documents', size: '245 items' },
    { icon: '📁', name: 'Downloads', size: '127 items' },
    { icon: '📁', name: 'Pictures', size: '1,453 items' },
    { icon: '📁', name: 'Music', size: '892 items' },
    { icon: '📁', name: 'Videos', size: '64 items' },
    { icon: '📄', name: 'Resume(click-me).pdf', size: '245 KB' }
  ];
  
  const totalHeight = folders.length * 100;
  const visibleHeight = win.h - 140;
  win.maxScrollY = Math.max(0, totalHeight - visibleHeight);
  
  folders.forEach((item, i) => {
    const y = contentY + i * 100;
    const isHovered = this.hoveredFileItem === i;
    
    if (isHovered) {
      ctx.fillStyle = 'rgba(230, 57, 70, 0.15)';
      ctx.beginPath();
      ctx.roundRect(contentX - 10, y - 10, win.w - 80, 100, 12);
      ctx.fill();
    }
    
    ctx.font = '60px Arial';
    ctx.fillStyle = '#fff';
    ctx.fillText(item.icon, contentX, y + 50);
    ctx.font = 'bold 36px Arial';
    ctx.fillText(item.name, contentX + 90, y + 35);
    ctx.font = '28px Arial';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fillText(item.size, contentX + 90, y + 70);
    ctx.fillStyle = '#fff';
  });
  
} else if (name === 'about') {
// Calculate total content height for scrolling
  const profileCardHeight = 240;
  const aboutSectionHeight = 60 + 25 * 50;
  const totalHeight = 290 + profileCardHeight + aboutSectionHeight + 100; 
  const visibleHeight = win.h - 140;
  win.maxScrollY = Math.max(0, totalHeight - visibleHeight);

  // BIGGER PROFILE CARD
  ctx.fillStyle = 'rgba(230, 57, 70, 0.12)';
  ctx.beginPath();
  ctx.roundRect(contentX, contentY, maxWidth, 240, 20);
  ctx.fill();
  
  // BIGGER AVATAR
  const iconGrad = ctx.createLinearGradient(contentX + 40, contentY + 40, contentX + 160, contentY + 160);
  iconGrad.addColorStop(0, '#e63946');
  iconGrad.addColorStop(1, '#780000');
  ctx.fillStyle = iconGrad;
  ctx.beginPath();
ctx.arc(contentX + 100, contentY + 100, 60, 0, Math.PI * 2);
ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = '66px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('👨‍💻', contentX + 100, contentY + 122);
  ctx.textAlign = 'left';
  
  ctx.font = 'bold 56px Arial';
  ctx.fillText('Aditya Suresh', contentX + 200, contentY + 68);
  ctx.font = '36px Arial';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.fillText('Frontend, ML & Robotics Specialist', contentX + 200, contentY + 118);
  ctx.font = '32px Arial';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.fillText('📍 Kerala, India', contentX + 200, contentY + 165);
  
  // BIGGER ABOUT SECTION
  const aboutY = contentY + 290;
  ctx.font = 'bold 34px Arial';
  ctx.fillStyle = '#e63946';
  ctx.fillText('About Me', contentX, aboutY);
  ctx.font = '34px Arial';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
const lines = [
    'Developer who enjoys building things and figuring them out along the way.',
    'I spend a lot of time experimenting, breaking things, and learning from it.',
    'I enjoy creative works, stemming from my love of stories and games.',
    'In fact, I believe this complete 3D website that took more than a month to build,',
    'stemmed from my passion for it.',
    '',
    'Background:',
    '  • Currently pursuing B.Tech in Computer Science',
    '  • Also taking a minor in Robotics and Automation',
    '  • Passionate about blending creativity with technical innovation',
    '',
    'What I Do:',
    '  • Build interactive 3D experiences with Three.js & WebGL',
    '  • Develop AI/ML applications and intelligent systems',
    '  • Design and experiment with game mechanics and simulations',
    '  • Work with robotics, embedded systems and simulators',
    '  • Implement computer vision and neural network solutions',
    '',
    'Technical Interests:',
    '  • WebGL & 3D Graphics Programming',
    '  • Machine Learning & Neural Networks',
    '  • Robotics & Autonomous Systems',
    '  • Game Development & Interactive Experiences',
    '  • Real-time Systems & Performance Optimization',
    '',
    'Beyond Code:',
    '  • Avid reader of sci-fi and fantasy literature',
    '  • Gaming enthusiast with interest in game design theory',
    '  • Enjoy exploring the intersection of art and technology'
  ];
  lines.forEach((line, i) => {
    const lineY = aboutY + 60 + i * 50;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillText(line, contentX, lineY);
  });
  
  
} else if (name === 'skills') {
  const skills = [
    { icon: '🟨', name: 'JavaScript' },
    { icon: '🐍', name: 'Python' },
    { icon: '🎨', name: 'Three.js' },
    { icon: '🤖', name: 'AI/ML' },
    { icon: '🔷', name: 'C++' },
    { icon: '⚙️', name: 'C' },
    { icon: '🦾', name: 'Robotics' },
    { icon: '🔧', name: 'Embedded' },
    { icon: '🌐', name: 'HTML' },
    { icon: '🎭', name: 'CSS' },
    { icon: '🔮', name: 'Webots' },
    { icon: '🧮', name: 'Haskell' }
  ];
  
  const totalHeight = Math.ceil(skills.length / 2) * 140;
  const visibleHeight = win.h - 140;
  win.maxScrollY = Math.max(0, totalHeight - visibleHeight);
  
  const colWidth = maxWidth / 2 - 30;
  
  skills.forEach((skill, i) => {
    const row = Math.floor(i / 2);
    const col = i % 2;
    const x = contentX + col * (colWidth + 60);
    const y = contentY + row * 140;
    
    ctx.font = '80px Arial';
    ctx.fillStyle = '#fff';
    ctx.fillText(skill.icon, x, y + 60);
    ctx.font = 'bold 40px Arial';
    ctx.fillText(skill.name, x + 110, y + 50);
  });
  
} else if (name === 'projects') {
  const projects = [
    { 
      title: '3D Interactive Portfolio', 
      desc: 'Immersive portfolio with chess AI and functional laptop OS', 
      tech: ['Three.js', 'WebGL', 'AI'],
      status: '✓ Live',
      url: 'https://github.com/AdityaSuresh27/My-3d-portfolio'
    },
    { 
      title: 'Voice Assistant with AI Support', 
      desc: 'Intelligent voice assistant with natural language processing', 
      tech: ['Python', 'NLP', 'AI'],
      status: '✓ Complete',
      url: 'https://github.com/AdityaSuresh27/voice-assistant'
    },
    { 
      title: 'Resume Evaluator with Microsoft Azure', 
      desc: 'AI-powered resume analysis using Azure OpenAI Services', 
      tech: ['Azure', 'Python', 'ML'],
      status: '✓ Complete',
      url: 'https://github.com/AdityaSuresh27/azure-gpt-resume-evaluator'
    },
    { 
      title: 'Webots Trash Collection Robot', 
      desc: 'Autonomous trash sorting robot with computer vision', 
      tech: ['Webots', 'Python', 'CV'],
      status: '✓ Complete',
      url: 'https://github.com/AdityaSuresh27/trash-sorter-bot'
    },
    { 
      title: 'STM32 Smart Irrigation',
      desc: 'Monitors soil, temperature, and humidity with automatic watering and OLED display',
      tech: ['STM32F4', 'C', 'DHT11', 'Soil Sensor'],
      status: '✓ Complete',
      url: 'https://github.com/AdityaSuresh27/Soil-Irrigation-Project'
    },
    { 
      title: 'Loan Approval Prediction',
      desc: 'Predicts loan approval using a simple ML web app',
      tech: ['Python', 'TensorFlow', 'Streamlit', 'ML'],
      status: '✓ Complete',
      url: 'https://github.com/AdityaSuresh27/loan-approval-prediction-ml-streamlit'
    }
  ];
  
  const totalHeight = projects.length * 260;
  const visibleHeight = win.h - 140;
  win.maxScrollY = Math.max(0, totalHeight - visibleHeight);
  
  projects.forEach((proj, i) => {
    const y = contentY + i * 260;
    const isHovered = this.hoveredProjectItem === i;
    
    if (isHovered) {
      ctx.fillStyle = 'rgba(230, 57, 70, 0.15)';
    } else {
      ctx.fillStyle = 'rgba(230, 57, 70, 0.06)';
    }
    
    ctx.strokeStyle = isHovered ? 'rgba(230, 57, 70, 0.4)' : 'rgba(230, 57, 70, 0.2)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(contentX, y, maxWidth, 240, 18);
    ctx.fill();
    ctx.stroke();
    
    ctx.font = 'bold 42px Arial';
    ctx.fillStyle = '#e63946';
    ctx.fillText(proj.title, contentX + 35, y + 50);
    ctx.font = '32px Arial';
    ctx.fillStyle = '#fff';
    ctx.fillText(proj.status, contentX + 35, y + 95);
    ctx.font = '36px Arial';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.87)';
    ctx.fillText(proj.desc, contentX + 35, y + 145);
    
    let tagX = contentX + 35;
    proj.tech.forEach(tech => {
      ctx.font = '30px Arial';
      const tagWidth = ctx.measureText(tech).width + 34;
      ctx.fillStyle = 'rgba(230, 57, 70, 0.25)';
      ctx.beginPath();
      ctx.roundRect(tagX, y + 180, tagWidth, 42, 21);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.fillText(tech, tagX + 17, y + 208);
      tagX += tagWidth + 16;
    });
  });
  
} else if (name === 'contact') {
  const contacts = [
    { icon: '✉', label: 'Email', value: 'aditya8756354@gmail.com' },
    { icon: '💻', label: 'GitHub', value: 'https://github.com/AdityaSuresh27' },
    { icon: '💼', label: 'LinkedIn', value: 'https://www.linkedin.com/in/aditya-suresh-26b457298/' },
    { icon: '📍', label: 'Location', value: 'Kerala, India' },
    { icon: '🌐', label: 'Website', value: 'https://adityasuresh27.github.io/My-3d-portfolio/' }
  ];
  
  const totalHeight = contacts.length * 140;
  const visibleHeight = win.h - 140;
  win.maxScrollY = Math.max(0, totalHeight - visibleHeight);
  
  contacts.forEach((contact, i) => {
    const y = contentY + i * 140;
    const isHovered = this.hoveredContactItem === i && i !== 3; // Skip location hover
    
    if (isHovered) {
      ctx.fillStyle = 'rgba(230, 57, 70, 0.15)';
    } else {
      ctx.fillStyle = 'rgba(230, 57, 70, 0.06)';
    }
    
    ctx.strokeStyle = isHovered ? 'rgba(230, 57, 70, 0.3)' : 'rgba(230, 57, 70, 0.15)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(contentX, y, maxWidth, 120, 18);
    ctx.fill();
    ctx.stroke();
    
    const iconGrad = ctx.createLinearGradient(contentX + 40, y + 25, contentX + 120, y + 105);
    iconGrad.addColorStop(0, '#e63946');
    iconGrad.addColorStop(1, '#780000');
    ctx.fillStyle = iconGrad;
    ctx.beginPath();
    ctx.arc(contentX + 80, y + 60, 48, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#fff';
    ctx.font = '68px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(contact.icon, contentX + 80, y + 80);
    ctx.textAlign = 'left';
    
    ctx.font = 'bold 36px Arial';
    ctx.fillStyle = '#e63946';
    ctx.fillText(contact.label, contentX + 160, y + 45);
    ctx.font = '33px Arial';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.82)';
    ctx.fillText(contact.value, contentX + 160, y + 88);
  });
}
}
activate() {
this.isActive = true;
this.needsRedraw = true;
console.log('Laptop screen activated');
window.addEventListener('mousemove', this.onMouseMove, true);
window.addEventListener('mousedown', this.onMouseDown, true);
window.addEventListener('mouseup', this.onMouseUp, true);
window.addEventListener('click', this.onClick, true);
window.addEventListener('wheel', this.onWheel, { passive: false, capture: true });
}
deactivate() {
this.isActive = false;
this.isHoveringScreen = false;
this.dragging = null;
this.draggingScrollBar = null;
window.removeEventListener('mousemove', this.onMouseMove, true);
window.removeEventListener('mousedown', this.onMouseDown, true);
window.removeEventListener('mouseup', this.onMouseUp, true);
window.removeEventListener('click', this.onClick, true);
window.removeEventListener('wheel', this.onWheel, true);
document.body.style.cursor = '';
if (this.customCursor) {
  this.customCursor.style.display = 'none';
}
}
setCamera(camera) {
this.camera = camera;
}
update() {}
dispose() {
this.deactivate();
if (this.customCursor && this.customCursor.parentNode) {
document.body.removeChild(this.customCursor);
}
if (this.texture) {
this.texture.dispose();
}
}
}
window.LaptopScreen = LaptopScreen;