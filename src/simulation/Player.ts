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
  
  // Footprint tracking for navigation aid
  private footprints: Map<string, { position: Vector2, timestamp: number, intensity: number }> = new Map();
  private readonly FOOTPRINT_FADE_TIME = 15000; // Reduced from 30s to 15s - fade faster
  private readonly FOOTPRINT_MAX_INTENSITY = 0.12; // Slightly dimmer starting intensity

  constructor(startPosition: Vector2) {
    this.position = startPosition.copy();
    this.facing = new Vector2(0, -1); // Start facing up
    this.flashlightDirection = this.facing.copy();
    this.flashlightRange = 4; // How far the flashlight reaches
    this.flashlightAngle = Math.PI / 3; // 60 degrees cone
    
    // Add initial footprint at starting position
    this.addFootprint(startPosition);
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
    
    // Add footprint at new position
    this.addFootprint(this.position);
  }

  /**
   * Add a footprint at the given position
   */
  private addFootprint(position: Vector2): void {
    const key = `${position.x},${position.y}`;
    const now = performance.now();
    
    // Add or refresh footprint at this position
    this.footprints.set(key, {
      position: position.copy(),
      timestamp: now,
      intensity: this.FOOTPRINT_MAX_INTENSITY
    });
  }

  /**
   * Update footprints - fade them over time and remove old ones
   */
  updateFootprints(deltaTime: number): void {
    const now = performance.now();
    const toRemove: string[] = [];
    
    for (const [key, footprint] of this.footprints.entries()) {
      const age = now - footprint.timestamp;
      
      if (age >= this.FOOTPRINT_FADE_TIME) {
        // Remove completely faded footprints
        toRemove.push(key);
      } else {
        // Smooth cosine fade - very gradual from full brightness to zero
        const fadeProgress = age / this.FOOTPRINT_FADE_TIME;
        
        // Cosine fade: starts at 1, smoothly goes to 0
        const fadeMultiplier = (Math.cos(fadeProgress * Math.PI) + 1) / 2;
        footprint.intensity = this.FOOTPRINT_MAX_INTENSITY * fadeMultiplier;
      }
    }
    
    // Remove old footprints
    for (const key of toRemove) {
      this.footprints.delete(key);
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
   * Combines directional flashlight, ambient light, and footprint light
   */
  getLightIntensity(position: Vector2): number {
    // Get directional flashlight intensity
    const flashlightIntensity = this.getFlashlightIntensity(position);
    
    // Get ambient light around player
    const ambientIntensity = this.getAmbientLightIntensity(position);
    
    // Get footprint light intensity
    const footprintIntensity = this.getFootprintLightIntensity(position);
    
    // Combine all light sources (take the maximum)
    return Math.max(flashlightIntensity, ambientIntensity, footprintIntensity);
  }

  /**
   * Get light intensity from footprints at a position
   */
  private getFootprintLightIntensity(position: Vector2): number {
    const key = `${position.x},${position.y}`;
    const footprint = this.footprints.get(key);
    
    if (!footprint) {
      return 0;
    }
    
    // Return the current intensity of the footprint
    return footprint.intensity;
  }

  /**
   * Get all current footprints for rendering
   */
  getFootprints(): Array<{ position: Vector2, intensity: number }> {
    return Array.from(this.footprints.values()).map(fp => ({
      position: fp.position.copy(),
      intensity: fp.intensity
    }));
  }

  /**
   * Clear all footprints (for game reset)
   */
  clearFootprints(): void {
    this.footprints.clear();
    // Add initial footprint at current position
    this.addFootprint(this.position);
  }

  /**
   * Get directional flashlight intensity (original logic)
   */
  private getFlashlightIntensity(position: Vector2): number {
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

  /**
   * Get ambient light intensity around the player (like flashlight bleedoff/reflection)
   */
  private getAmbientLightIntensity(position: Vector2): number {
    const distance = this.position.distanceTo(position);
    const ambientRange = 1.5; // Smaller radius than flashlight
    const maxAmbientIntensity = 0.25; // Dimmer than flashlight
    
    // Only provide ambient light if within range
    if (distance > ambientRange) {
      return 0;
    }
    
    // Check line of sight for ambient light too (light doesn't go through walls)
    if (!this.hasLineOfSight(this.position, position)) {
      return 0;
    }
    
    // Smooth falloff for ambient light
    const falloff = 1 - (distance / ambientRange);
    return maxAmbientIntensity * falloff * falloff; // Quadratic falloff for softer effect
  }
}
