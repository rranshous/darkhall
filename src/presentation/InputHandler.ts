import { Vector2 } from '../core/Vector2.js';

/**
 * Input handler for keyboard and mouse events
 */
export class InputHandler {
  private keysPressed: Set<string> = new Set();
  private mousePosition: Vector2 = new Vector2();
  private canvas: HTMLCanvasElement;
  
  // Callbacks
  public onMove: ((direction: Vector2) => void) | null = null;
  public onMouseMove: ((position: Vector2) => void) | null = null;
  public onGodModeToggle: (() => void) | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.setupEventListeners();
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
    });

    // Prevent context menu on right click
    this.canvas.addEventListener('contextmenu', (event) => {
      event.preventDefault();
    });
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
   * Clean up event listeners
   */
  dispose(): void {
    // Remove event listeners if needed
    // For now, we'll leave them as they're on document/canvas
  }
}
