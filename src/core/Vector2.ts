/**
 * Simple 2D vector class for positions and directions
 */
export class Vector2 {
  constructor(public x: number = 0, public y: number = 0) {}

  static from(x: number, y: number): Vector2 {
    return new Vector2(x, y);
  }

  add(other: Vector2): Vector2 {
    return new Vector2(this.x + other.x, this.y + other.y);
  }

  subtract(other: Vector2): Vector2 {
    return new Vector2(this.x - other.x, this.y - other.y);
  }

  multiply(scalar: number): Vector2 {
    return new Vector2(this.x * scalar, this.y * scalar);
  }

  magnitude(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  normalize(): Vector2 {
    const mag = this.magnitude();
    if (mag === 0) return new Vector2(0, 0);
    return new Vector2(this.x / mag, this.y / mag);
  }

  distanceTo(other: Vector2): number {
    return this.subtract(other).magnitude();
  }

  equals(other: Vector2): boolean {
    return this.x === other.x && this.y === other.y;
  }

  copy(): Vector2 {
    return new Vector2(this.x, this.y);
  }
}
