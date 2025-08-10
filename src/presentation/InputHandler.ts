import { Vector2 } from '../core/Vector2.js';

/**
 * Input handler for keyboard, mouse, and touch events
 */
export class InputHandler {
  private keysPressed: Set<string> = new Set();
  private mousePosition: Vector2 = new Vector2();
  private canvas: HTMLCanvasElement;
  
  // Touch state
  private isDragging: boolean = false;
  private lastTouchPosition: Vector2 = new Vector2();
  private dragStartPosition: Vector2 = new Vector2();
  private touchStartTime: number = 0;
  private readonly DRAG_THRESHOLD = 10; // pixels to start dragging
  private readonly TAP_TIME_THRESHOLD = 200; // ms for tap vs drag
  
  // Viewport info for coordinate conversion
  private cellSize: number = 20;
  private mazeSize: { width: number, height: number } = { width: 21, height: 21 };
  private playerPosition: Vector2 = new Vector2(1, 1); // Track player position for flashlight direction
  
  // Callbacks
  public onMove: ((direction: Vector2) => void) | null = null;
  public onMouseMove: ((position: Vector2) => void) | null = null;
  public onFlashlightDirection: ((direction: Vector2) => void) | null = null;
  public onGodModeToggle: (() => void) | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.setupEventListeners();
  }

  /**
   * Update viewport info for coordinate conversion
   */
  updateViewport(cellSize: number, mazeSize: { width: number, height: number }, playerPosition: Vector2): void {
    this.cellSize = cellSize;
    this.mazeSize = mazeSize;
    this.playerPosition = playerPosition;
  }

  private setupEventListeners(): void {
    // Keyboard events
    document.addEventListener('keydown', (event) => {
      // Handle special key combinations
      if (event.code === 'KeyG' && !this.keysPressed.has('KeyG')) {
        if (this.onGodModeToggle) {
          this.onGodModeToggle();
        }
      }
      
      this.keysPressed.add(event.code);
      event.preventDefault();
    });

    document.addEventListener('keyup', (event) => {
      this.keysPressed.delete(event.code);
      event.preventDefault();
    });

    // Mouse events
    this.canvas.addEventListener('mousemove', (event) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mousePosition = new Vector2(
        event.clientX - rect.left,
        event.clientY - rect.top
      );
      
      if (this.onMouseMove) {
        this.onMouseMove(this.mousePosition);
      }
      
      // Convert to flashlight direction if we have a callback
      if (this.onFlashlightDirection) {
        const direction = this.mouseToFlashlightDirection(this.mousePosition);
        if (direction.magnitude() > 0) {
          this.onFlashlightDirection(direction);
        }
      }
    });

    // Prevent context menu on right click
    this.canvas.addEventListener('contextmenu', (event) => {
      event.preventDefault();
    });

    // Touch events for mobile
    this.setupTouchEvents();
  }

  private setupTouchEvents(): void {
    // Touch start
    this.canvas.addEventListener('touchstart', (event) => {
      event.preventDefault();
      const touch = event.touches[0];
      const rect = this.canvas.getBoundingClientRect();
      
      this.lastTouchPosition = new Vector2(
        touch.clientX - rect.left,
        touch.clientY - rect.top
      );
      this.dragStartPosition = this.lastTouchPosition.copy();
      this.touchStartTime = performance.now();
      this.isDragging = false;
    });

    // Touch move
    this.canvas.addEventListener('touchmove', (event) => {
      event.preventDefault();
      const touch = event.touches[0];
      const rect = this.canvas.getBoundingClientRect();
      
      const currentPosition = new Vector2(
        touch.clientX - rect.left,
        touch.clientY - rect.top
      );

      // Check if we should start dragging
      const distanceFromStart = this.dragStartPosition.distanceTo(currentPosition);
      if (!this.isDragging && distanceFromStart > this.DRAG_THRESHOLD) {
        this.isDragging = true;
      }

      // Handle dragging for movement
      if (this.isDragging) {
        const dragDelta = currentPosition.subtract(this.lastTouchPosition);
        
        // Convert drag to discrete movement direction
        if (dragDelta.magnitude() > 5) { // Threshold for movement
          const normalizedDelta = dragDelta.normalize();
          let direction = new Vector2(0, 0);
          
          // Convert to discrete directions
          if (Math.abs(normalizedDelta.x) > Math.abs(normalizedDelta.y)) {
            direction.x = normalizedDelta.x > 0 ? 1 : -1;
          } else {
            direction.y = normalizedDelta.y > 0 ? 1 : -1;
          }
          
          if (this.onMove) {
            this.onMove(direction);
          }
        }
      }

      this.lastTouchPosition = currentPosition;
    });

    // Touch end
    this.canvas.addEventListener('touchend', (event) => {
      event.preventDefault();
      const touchDuration = performance.now() - this.touchStartTime;
      
      // If it was a quick tap (not a drag), use it for flashlight aiming
      if (!this.isDragging && touchDuration < this.TAP_TIME_THRESHOLD) {
        if (this.onMouseMove) {
          this.onMouseMove(this.lastTouchPosition);
        }
        
        // Convert to flashlight direction if we have a callback
        if (this.onFlashlightDirection) {
          const direction = this.mouseToFlashlightDirection(this.lastTouchPosition);
          if (direction.magnitude() > 0) {
            this.onFlashlightDirection(direction);
          }
        }
      }
      
      this.isDragging = false;
    });

    // Prevent scrolling and zooming on touch
    document.addEventListener('touchmove', (event) => {
      if (event.target === this.canvas) {
        event.preventDefault();
      }
    }, { passive: false });
  }

  /**
   * Process input and trigger callbacks
   */
  update(): void {
    this.handleMovement();
  }

  private handleMovement(): void {
    let direction = new Vector2(0, 0);

    // WASD movement
    if (this.keysPressed.has('KeyW') || this.keysPressed.has('ArrowUp')) {
      direction.y -= 1;
    }
    if (this.keysPressed.has('KeyS') || this.keysPressed.has('ArrowDown')) {
      direction.y += 1;
    }
    if (this.keysPressed.has('KeyA') || this.keysPressed.has('ArrowLeft')) {
      direction.x -= 1;
    }
    if (this.keysPressed.has('KeyD') || this.keysPressed.has('ArrowRight')) {
      direction.x += 1;
    }

    // Only trigger movement if there's a direction and we have a callback
    if ((direction.x !== 0 || direction.y !== 0) && this.onMove) {
      this.onMove(direction);
    }
  }

  /**
   * Check if a specific key is pressed
   */
  isKeyPressed(keyCode: string): boolean {
    return this.keysPressed.has(keyCode);
  }

  /**
   * Get current mouse position
   */
  getMousePosition(): Vector2 {
    return this.mousePosition.copy();
  }

  /**
   * Convert mouse position to flashlight direction relative to player
   */
  private mouseToFlashlightDirection(mousePos: Vector2): Vector2 {
    // Calculate offset to center the maze on screen (same logic as renderer)
    const offsetX = (this.canvas.width - this.mazeSize.width * this.cellSize) / 2;
    const offsetY = (this.canvas.height - this.mazeSize.height * this.cellSize) / 2;
    
    // Convert player position to screen coordinates
    const playerScreenX = this.playerPosition.x * this.cellSize + this.cellSize / 2 + offsetX;
    const playerScreenY = this.playerPosition.y * this.cellSize + this.cellSize / 2 + offsetY;
    
    // Calculate direction from player to mouse
    const direction = new Vector2(
      mousePos.x - playerScreenX,
      mousePos.y - playerScreenY
    );
    
    return direction.normalize();
  }

  /**
   * Clean up event listeners
   */
  dispose(): void {
    // Remove event listeners if needed
    // For now, we'll leave them as they're on document/canvas
  }
}
