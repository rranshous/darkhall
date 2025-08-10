import { Vector2 } from '../core/Vector2.js';
import { Maze } from './Maze.js';

/**
 * Player character with position and flashlight
 */
export class Player {
  public position: Vector2;
  public facing: Vector2; // Direction the player is facing
  public flashlightDirection: Vector2; // Direction flashlight is pointing
  public flashlightRange: number;
  public flashlightAngle: number; // Cone angle in radians
  private maze: Maze | null = null; // Reference to maze for line-of-sight

  constructor(startPosition: Vector2) {
    this.position = startPosition.copy();
    this.facing = new Vector2(0, -1); // Start facing up
    this.flashlightDirection = this.facing.copy();
    this.flashlightRange = 4; // How far the flashlight reaches
    this.flashlightAngle = Math.PI / 3; // 60 degrees cone
  }

  /**
   * Set maze reference for line-of-sight calculations
   */
  setMaze(maze: Maze): void {
    this.maze = maze;
  }

  /**
   * Move player by a delta vector
   */
  move(delta: Vector2): void {
    this.position = this.position.add(delta);
    
    // Update facing direction if moving
    if (delta.magnitude() > 0) {
      this.facing = delta.normalize();
    }
  }

  /**
   * Set player position directly
   */
  setPosition(position: Vector2): void {
    this.position = position.copy();
  }

  /**
   * Rotate flashlight direction
   */
  rotateFlashlight(angle: number): void {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    
    const newX = this.flashlightDirection.x * cos - this.flashlightDirection.y * sin;
    const newY = this.flashlightDirection.x * sin + this.flashlightDirection.y * cos;
    
    this.flashlightDirection = new Vector2(newX, newY).normalize();
  }

  /**
   * Set flashlight direction to face a specific direction
   */
  setFlashlightDirection(direction: Vector2): void {
    this.flashlightDirection = direction.normalize();
  }

  /**
   * Check if a position is illuminated by the flashlight
   */
  isPositionIlluminated(position: Vector2): boolean {
    const toPosition = position.subtract(this.position);
    const distance = toPosition.magnitude();
    
    // Check if within range
    if (distance > this.flashlightRange || distance === 0) {
      return false;
    }

    // Check if within cone angle
    const directionToPosition = toPosition.normalize();
    const dotProduct = this.flashlightDirection.x * directionToPosition.x + 
                      this.flashlightDirection.y * directionToPosition.y;
    
    const angle = Math.acos(Math.max(-1, Math.min(1, dotProduct)));
    
    if (angle > this.flashlightAngle / 2) {
      return false;
    }

    // Check line of sight - light blocked by walls
    return this.hasLineOfSight(this.position, position);
  }

  /**
   * Check if there's an unobstructed line of sight between two positions
   */
  private hasLineOfSight(from: Vector2, to: Vector2): boolean {
    if (!this.maze) {
      return true; // No maze reference, assume clear
    }

    // Use DDA (Digital Differential Analyzer) algorithm for line traversal
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Number of steps to check (higher = more accurate)
    const steps = Math.ceil(distance * 2);
    
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const checkX = Math.floor(from.x + dx * t);
      const checkY = Math.floor(from.y + dy * t);
      const checkPos = new Vector2(checkX, checkY);
      
      // If we hit a wall, line of sight is blocked
      if (!this.maze.isWalkable(checkPos)) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Get the light intensity at a position (0 to 1)
   */
  getLightIntensity(position: Vector2): number {
    if (!this.isPositionIlluminated(position)) {
      return 0;
    }

    const toPosition = position.subtract(this.position);
    const distance = toPosition.magnitude();
    
    // Linear falloff with distance
    const distanceIntensity = Math.max(0, 1 - (distance / this.flashlightRange));
    
    // Angular falloff
    const directionToPosition = toPosition.normalize();
    const dotProduct = this.flashlightDirection.x * directionToPosition.x + 
                      this.flashlightDirection.y * directionToPosition.y;
    const angle = Math.acos(Math.max(-1, Math.min(1, dotProduct)));
    const maxAngle = this.flashlightAngle / 2;
    const angleIntensity = Math.max(0, 1 - (angle / maxAngle));
    
    return distanceIntensity * angleIntensity;
  }
}
