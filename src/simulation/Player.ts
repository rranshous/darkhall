import { Vector2 } from '../core/Vector2.js';

/**
 * Player character with position and flashlight
 */
export class Player {
  public position: Vector2;
  public facing: Vector2; // Direction the player is facing
  public flashlightDirection: Vector2; // Direction flashlight is pointing
  public flashlightRange: number;
  public flashlightAngle: number; // Cone angle in radians

  constructor(startPosition: Vector2) {
    this.position = startPosition.copy();
    this.facing = new Vector2(0, -1); // Start facing up
    this.flashlightDirection = this.facing.copy();
    this.flashlightRange = 4; // How far the flashlight reaches
    this.flashlightAngle = Math.PI / 3; // 60 degrees cone
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
    
    return angle <= this.flashlightAngle / 2;
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
