import { Vector2 } from '../core/Vector2.js';
import { StateMachine, GameState } from '../core/StateMachine.js';
import { Maze, CellType } from './Maze.js';
import { Player } from './Player.js';
import { Monster } from './Monster.js';

/**
 * Core game simulation - handles all game logic without presentation
 */
export class GameSimulation {
  public readonly maze: Maze;
  public readonly player: Player;
  public readonly monster: Monster;
  public readonly stateMachine: StateMachine;
  public godMode: boolean = false;
  
  private lastUpdateTime: number = 0;

  constructor(mazeWidth: number = 21, mazeHeight: number = 21) {
    // Create maze (odd dimensions work better for maze generation)
    this.maze = new Maze(mazeWidth, mazeHeight);
    
    // Create player at start position
    this.player = new Player(this.maze.startPosition);
    
    // Give player maze reference for line-of-sight calculations
    this.player.setMaze(this.maze);
    
    // Create monster at a position far from player
    const monsterStartPos = this.findMonsterStartPosition();
    this.monster = new Monster(monsterStartPos, this.maze, 1200); // Slow movement (1.2 seconds per move)
    
    // Initialize state machine
    this.stateMachine = new StateMachine();
    
    console.log(`Game simulation initialized: ${mazeWidth}x${mazeHeight} maze`);
    console.log(`Player starting at: (${this.player.position.x}, ${this.player.position.y})`);
    console.log(`Monster starting at: (${this.monster.position.x}, ${this.monster.position.y})`);
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

    // Update monster AI
    const playerLightIntensity = this.player.getLightIntensity(this.player.position);
    this.monster.update(deltaTime, this.player.position, playerLightIntensity);

    // Check if monster caught player
    if (this.monster.hasCaughtPlayer(this.player.position)) {
      this.stateMachine.setState(GameState.GAME_OVER);
      console.log('Game Over! The monster caught you!');
      return;
    }

    // Check win condition
    this.checkWinCondition();
  }

  /**
   * Find a good starting position for the monster (far from player, accessible, doesn't block critical paths)
   */
  private findMonsterStartPosition(): Vector2 {
    const floorCells = this.maze.getAllCells().filter(cell => 
      cell.type === CellType.FLOOR && 
      !cell.position.equals(this.maze.startPosition) &&
      !cell.position.equals(this.maze.prizePosition)
    );
    
    if (floorCells.length === 0) {
      // Fallback to a reasonable position
      return new Vector2(this.maze.width - 3, this.maze.height - 3);
    }
    
    // Find cells that are far from start and don't block critical paths
    const validCells = floorCells.filter(cell => {
      const distanceFromStart = this.maze.startPosition.distanceTo(cell.position);
      const distanceFromPrize = this.maze.prizePosition.distanceTo(cell.position);
      
      // Must be reasonably far from both start and prize
      return distanceFromStart >= 5 && distanceFromPrize >= 3;
    });
    
    // Additional filter: ensure monster placement doesn't create no-win scenarios
    const safeCells = validCells.filter(cell => {
      return this.isMonsterPositionSafe(cell.position);
    });
    
    // Use safe cells if available, otherwise fall back to valid cells
    const candidateCells = safeCells.length > 0 ? safeCells : validCells;
    
    if (candidateCells.length === 0) {
      return floorCells[Math.floor(Math.random() * floorCells.length)].position;
    }
    
    // Pick a random cell from the candidates
    return candidateCells[Math.floor(Math.random() * candidateCells.length)].position;
  }

  /**
   * Check if placing monster at this position would create a no-win scenario
   */
  private isMonsterPositionSafe(monsterPos: Vector2): boolean {
    // Temporarily place monster and check if multiple paths still exist
    // This is a simplified check - we ensure the monster isn't in a narrow corridor
    // that would force the player into a dead end
    
    const adjacentFloors = this.maze.getAdjacentPositions(monsterPos)
      .filter(pos => this.maze.isWalkable(pos)).length;
    
    // If monster is in a corridor with only 2 exits, it might block the player
    // Prefer positions with 3+ adjacent floors (intersections, open areas)
    if (adjacentFloors <= 2) {
      // Additional check: is this position on the main path?
      return !this.isOnMainPath(monsterPos);
    }
    
    return true; // Safe position
  }

  /**
   * Simple check if position is likely on a main path between start and prize
   */
  private isOnMainPath(position: Vector2): boolean {
    // Calculate if this position is roughly on the direct line between start and prize
    const startToPrize = this.maze.prizePosition.subtract(this.maze.startPosition);
    const startToPos = position.subtract(this.maze.startPosition);
    
    // If the position is roughly in the direction from start to prize, it might be on main path
    const dotProduct = startToPrize.normalize().x * startToPos.normalize().x + 
                      startToPrize.normalize().y * startToPos.normalize().y;
    
    // If dot product > 0.7, it's roughly in the same direction (likely main path)
    return dotProduct > 0.7;
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
    
    // Reset monster to a new random position
    const newMonsterPos = this.findMonsterStartPosition();
    this.monster.resetPosition(newMonsterPos);
    
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
   * Toggle god mode (see all walls and prize)
   */
  toggleGodMode(): void {
    this.godMode = !this.godMode;
    console.log(`God mode: ${this.godMode ? 'ON' : 'OFF'}`);
  }

  /**
   * Get all visible cells (illuminated by flashlight or in god mode)
   */
  getVisibleCells(): Array<{ cell: any, intensity: number }> {
    const visibleCells: Array<{ cell: any, intensity: number }> = [];
    
    // In god mode, show all cells with reduced intensity
    if (this.godMode) {
      for (const cell of this.maze.getAllCells()) {
        const flashlightIntensity = this.player.getLightIntensity(cell.position);
        const godModeIntensity = flashlightIntensity > 0 ? flashlightIntensity : 0.2; // Show everything dimly
        visibleCells.push({ cell, intensity: godModeIntensity });
      }
    } else {
      // Normal mode: only show illuminated cells
      for (const cell of this.maze.getAllCells()) {
        const intensity = this.player.getLightIntensity(cell.position);
        if (intensity > 0) {
          visibleCells.push({ cell, intensity });
        }
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
      monsterPosition: this.monster.position.copy(),
      gameState: this.stateMachine.getCurrentState(),
      mazeSize: { width: this.maze.width, height: this.maze.height },
      prizePosition: this.maze.prizePosition.copy(),
      godMode: this.godMode
    };
  }
}
