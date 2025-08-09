import { Vector2 } from '../core/Vector2.js';
import { Maze } from './Maze.js';

/**
 * A menacing monster that chases the player through the maze
 */
export class Monster {
  public position: Vector2;
  public speed: number; // How often the monster moves (lower = faster)
  public lastMoveTime: number = 0;
  public isActive: boolean = true;
  public fearOfLight: boolean = true; // Monsters avoid bright flashlight areas
  
  private maze: Maze;
  private path: Vector2[] = []; // Current path to player
  private lastPlayerPosition: Vector2;
  private recalculatePathTimer: number = 0;

  constructor(startPosition: Vector2, maze: Maze, speed: number = 800) {
    this.position = startPosition.copy();
    this.maze = maze;
    this.speed = speed; // milliseconds between moves
    this.lastPlayerPosition = new Vector2(-1, -1);
  }

  /**
   * Update the monster's behavior
   */
  update(deltaTime: number, playerPosition: Vector2, playerLightIntensity: number): void {
    if (!this.isActive) return;

    this.lastMoveTime += deltaTime;
    this.recalculatePathTimer += deltaTime;

    // Check if monster is in bright light (makes it slower/hesitant)
    const lightIntensityAtMonster = this.getLightIntensityAtPosition(playerPosition);
    const speedModifier = this.fearOfLight && lightIntensityAtMonster > 0.5 ? 2 : 1;

    // Recalculate path periodically or if player moved significantly
    if (this.recalculatePathTimer > 1000 || // Every second
        this.lastPlayerPosition.distanceTo(playerPosition) > 2) {
      this.calculatePathToPlayer(playerPosition);
      this.lastPlayerPosition = playerPosition.copy();
      this.recalculatePathTimer = 0;
    }

    // Move towards player if enough time has passed
    if (this.lastMoveTime >= this.speed * speedModifier) {
      this.moveTowardsPlayer();
      this.lastMoveTime = 0;
    }
  }

  /**
   * Calculate pathfinding to player using A* algorithm (simplified)
   */
  private calculatePathToPlayer(playerPosition: Vector2): void {
    // Simple BFS pathfinding for now
    const visited = new Set<string>();
    const queue: Array<{ pos: Vector2, path: Vector2[] }> = [];
    
    queue.push({ pos: this.position, path: [] });
    visited.add(`${this.position.x},${this.position.y}`);

    while (queue.length > 0) {
      const { pos, path } = queue.shift()!;
      
      // Found player
      if (pos.equals(playerPosition)) {
        this.path = path;
        return;
      }

      // Don't search too far (performance optimization)
      if (path.length > 15) continue;

      // Check all adjacent walkable positions
      for (const neighbor of this.maze.getAdjacentPositions(pos)) {
        const key = `${neighbor.x},${neighbor.y}`;
        if (!visited.has(key) && this.maze.isWalkable(neighbor)) {
          visited.add(key);
          queue.push({ 
            pos: neighbor, 
            path: [...path, neighbor] 
          });
        }
      }
    }

    // No path found, clear current path
    this.path = [];
  }

  /**
   * Move one step towards the player
   */
  private moveTowardsPlayer(): void {
    if (this.path.length === 0) return;

    const nextPosition = this.path[0];
    
    // Check if next position is still walkable
    if (this.maze.isWalkable(nextPosition)) {
      this.position = nextPosition.copy();
      this.path.shift(); // Remove the position we just moved to
    } else {
      // Path is blocked, clear it to force recalculation
      this.path = [];
    }
  }

  /**
   * Get light intensity at monster's position (for fear of light behavior)
   */
  private getLightIntensityAtPosition(playerPosition: Vector2): number {
    const distance = this.position.distanceTo(playerPosition);
    const flashlightRange = 4; // Should match player's flashlight range
    
    if (distance > flashlightRange) return 0;
    
    // Simple distance-based intensity
    return Math.max(0, 1 - (distance / flashlightRange));
  }

  /**
   * Check if monster caught the player
   */
  hasCaughtPlayer(playerPosition: Vector2): boolean {
    return this.position.equals(playerPosition);
  }

  /**
   * Reset monster to a new position
   */
  resetPosition(newPosition: Vector2): void {
    this.position = newPosition.copy();
    this.path = [];
    this.lastMoveTime = 0;
    this.recalculatePathTimer = 0;
  }

  /**
   * Get monster state for debugging
   */
  getDebugInfo() {
    return {
      position: this.position,
      pathLength: this.path.length,
      isActive: this.isActive,
      speed: this.speed
    };
  }
}
