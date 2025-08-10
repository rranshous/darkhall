import { Vector2 } from './core/Vector2.js';
import { GameSimulation } from './simulation/GameSimulation.js';
import { GameRenderer } from './presentation/GameRenderer.js';
import { InputHandler } from './presentation/InputHandler.js';

/**
 * Main game controller - coordinates simulation, rendering, and input
 */
export class Game {
  private simulation: GameSimulation;
  private renderer: GameRenderer;
  private inputHandler: InputHandler;
  private isRunning: boolean = false;
  private lastFrameTime: number = 0;
  private moveCooldown: number = 0;
  private readonly MOVE_DELAY = 200; // Milliseconds between moves

  constructor(canvas: HTMLCanvasElement) {
    // Initialize core systems
    this.simulation = new GameSimulation(21, 21); // 21x21 maze
    this.renderer = new GameRenderer(canvas);
    this.inputHandler = new InputHandler(canvas);
    
    // Set up input callbacks
    this.setupInputHandlers();
    
    console.log('Game initialized');
  }

  private setupInputHandlers(): void {
    // Movement input
    this.inputHandler.onMove = (direction: Vector2) => {
      // Add cooldown to prevent too rapid movement
      if (this.moveCooldown <= 0) {
        const moved = this.simulation.movePlayer(direction);
        if (moved) {
          this.moveCooldown = this.MOVE_DELAY;
        }
      }
    };

    // Flashlight direction input - now handled directly by InputHandler
    this.inputHandler.onFlashlightDirection = (direction: Vector2) => {
      this.simulation.setFlashlightDirection(direction);
    };

    // God mode toggle
    this.inputHandler.onGodModeToggle = () => {
      this.simulation.toggleGodMode();
    };
  }

  /**
   * Start the game loop
   */
  start(): void {
    if (this.isRunning) {
      return;
    }
    
    this.isRunning = true;
    this.lastFrameTime = performance.now();
    this.gameLoop();
    
    console.log('Game started');
  }

  /**
   * Stop the game loop
   */
  stop(): void {
    this.isRunning = false;
    console.log('Game stopped');
  }

  /**
   * Main game loop
   */
  private gameLoop(): void {
    if (!this.isRunning) {
      return;
    }

    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastFrameTime;
    this.lastFrameTime = currentTime;

    // Update cooldowns
    if (this.moveCooldown > 0) {
      this.moveCooldown -= deltaTime;
    }

    // Update systems
    this.inputHandler.update();
    this.simulation.update(deltaTime);
    
    // Update input handler with current viewport info for coordinate conversion
    const gameState = this.simulation.getGameState();
    this.inputHandler.updateViewport(20, gameState.mazeSize, gameState.playerPosition);
    
    this.renderer.render(this.simulation);

    // Continue the loop
    requestAnimationFrame(() => this.gameLoop());
  }

  /**
   * Reset the game
   */
  reset(): void {
    this.simulation.reset();
    console.log('Game reset');
  }

  /**
   * Toggle pause
   */
  togglePause(): void {
    this.simulation.togglePause();
  }

  /**
   * Get current game state for debugging
   */
  getDebugInfo() {
    return {
      simulation: this.simulation.getGameState(),
      isRunning: this.isRunning,
      moveCooldown: this.moveCooldown
    };
  }
}
