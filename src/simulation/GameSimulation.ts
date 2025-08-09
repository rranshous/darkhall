import { Vector2 } from '../core/Vector2.js';
import { StateMachine, GameState } from '../core/StateMachine.js';
import { Maze, CellType } from './Maze.js';
import { Player } from './Player.js';

/**
 * Core game simulation - handles all game logic without presentation
 */
export class GameSimulation {
  public readonly maze: Maze;
  public readonly player: Player;
  public readonly stateMachine: StateMachine;
  
  private lastUpdateTime: number = 0;

  constructor(mazeWidth: number = 21, mazeHeight: number = 21) {
    // Create maze (odd dimensions work better for maze generation)
    this.maze = new Maze(mazeWidth, mazeHeight);
    
    // Create player at start position
    this.player = new Player(this.maze.startPosition);
    
    // Initialize state machine
    this.stateMachine = new StateMachine();
    
    console.log(`Game simulation initialized: ${mazeWidth}x${mazeHeight} maze`);
    console.log(`Player starting at: (${this.player.position.x}, ${this.player.position.y})`);
    console.log(`Prize at: (${this.maze.prizePosition.x}, ${this.maze.prizePosition.y})`);
  }

  /**
   * Update simulation - call this every frame
   */
  update(deltaTime: number): void {
    this.lastUpdateTime += deltaTime;

    // Only update if we're in an active state
    if (this.stateMachine.getCurrentState() !== GameState.EXPLORING) {
      return;
    }

    // Check win condition
    this.checkWinCondition();
  }

  /**
   * Attempt to move player in a direction
   */
  movePlayer(direction: Vector2): boolean {
    const newPosition = this.player.position.add(direction);
    
    // Check if the new position is walkable
    if (this.maze.isWalkable(newPosition)) {
      this.player.move(direction);
      console.log(`Player moved to: (${this.player.position.x}, ${this.player.position.y})`);
      return true;
    }
    
    return false;
  }

  /**
   * Rotate player's flashlight
   */
  rotateFlashlight(angle: number): void {
    this.player.rotateFlashlight(angle);
  }

  /**
   * Set flashlight direction directly
   */
  setFlashlightDirection(direction: Vector2): void {
    this.player.setFlashlightDirection(direction);
  }

  /**
   * Check if player has reached the prize
   */
  private checkWinCondition(): void {
    if (this.player.position.equals(this.maze.prizePosition)) {
      this.stateMachine.setState(GameState.VICTORY);
      console.log('Victory! Player reached the prize!');
    }
  }

  /**
   * Reset game to initial state
   */
  reset(): void {
    this.player.setPosition(this.maze.startPosition);
    this.player.setFlashlightDirection(new Vector2(0, -1)); // Face up
    this.stateMachine.setState(GameState.EXPLORING);
    console.log('Game reset');
  }

  /**
   * Pause/unpause the game
   */
  togglePause(): void {
    const currentState = this.stateMachine.getCurrentState();
    if (currentState === GameState.EXPLORING) {
      this.stateMachine.setState(GameState.PAUSED);
    } else if (currentState === GameState.PAUSED) {
      this.stateMachine.setState(GameState.EXPLORING);
    }
  }

  /**
   * Get all visible cells (illuminated by flashlight)
   */
  getVisibleCells(): Array<{ cell: any, intensity: number }> {
    const visibleCells: Array<{ cell: any, intensity: number }> = [];
    
    // Check each cell in the maze
    for (const cell of this.maze.getAllCells()) {
      const intensity = this.player.getLightIntensity(cell.position);
      if (intensity > 0) {
        visibleCells.push({ cell, intensity });
      }
    }
    
    return visibleCells;
  }

  /**
   * Get game state information for display
   */
  getGameState() {
    return {
      playerPosition: this.player.position.copy(),
      flashlightDirection: this.player.flashlightDirection.copy(),
      gameState: this.stateMachine.getCurrentState(),
      mazeSize: { width: this.maze.width, height: this.maze.height },
      prizePosition: this.maze.prizePosition.copy()
    };
  }
}
