import { Vector2 } from '../core/Vector2.js';

/**
 * Represents different types of maze cells
 */
export enum CellType {
  WALL = 'wall',
  FLOOR = 'floor',
  START = 'start',
  PRIZE = 'prize'
}

/**
 * Individual maze cell
 */
export interface MazeCell {
  type: CellType;
  position: Vector2;
  visited: boolean;
}

/**
 * Simple grid-based maze implementation
 */
export class Maze {
  private grid: MazeCell[][];
  public readonly width: number;
  public readonly height: number;
  public readonly startPosition: Vector2;
  public readonly prizePosition: Vector2;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.grid = [];
    
    // Initialize grid with walls
    for (let y = 0; y < height; y++) {
      this.grid[y] = [];
      for (let x = 0; x < width; x++) {
        this.grid[y][x] = {
          type: CellType.WALL,
          position: new Vector2(x, y),
          visited: false
        };
      }
    }

    // Create a simple maze with corridors
    this.generateSimpleMaze();
    
    // Set start and prize positions
    this.startPosition = new Vector2(1, 1);
    this.prizePosition = new Vector2(width - 2, height - 2);
    
    this.setCellType(this.startPosition, CellType.START);
    this.setCellType(this.prizePosition, CellType.PRIZE);
  }

  /**
   * Generate a simple maze with corridors
   */
  private generateSimpleMaze(): void {
    // Create horizontal corridors
    for (let y = 1; y < this.height - 1; y += 2) {
      for (let x = 1; x < this.width - 1; x++) {
        this.setCellType(new Vector2(x, y), CellType.FLOOR);
      }
    }

    // Create vertical corridors
    for (let x = 1; x < this.width - 1; x += 2) {
      for (let y = 1; y < this.height - 1; y++) {
        this.setCellType(new Vector2(x, y), CellType.FLOOR);
      }
    }

    // Add some random connections
    for (let i = 0; i < Math.floor((this.width * this.height) / 20); i++) {
      const x = Math.floor(Math.random() * (this.width - 2)) + 1;
      const y = Math.floor(Math.random() * (this.height - 2)) + 1;
      this.setCellType(new Vector2(x, y), CellType.FLOOR);
    }
  }

  /**
   * Get cell at position
   */
  getCell(position: Vector2): MazeCell | null {
    if (!this.isValidPosition(position)) {
      return null;
    }
    return this.grid[position.y][position.x];
  }

  /**
   * Set cell type at position
   */
  setCellType(position: Vector2, type: CellType): void {
    const cell = this.getCell(position);
    if (cell) {
      cell.type = type;
    }
  }

  /**
   * Check if position is valid (within bounds)
   */
  isValidPosition(position: Vector2): boolean {
    return position.x >= 0 && position.x < this.width && 
           position.y >= 0 && position.y < this.height;
  }

  /**
   * Check if position is walkable (not a wall)
   */
  isWalkable(position: Vector2): boolean {
    const cell = this.getCell(position);
    return cell !== null && cell.type !== CellType.WALL;
  }

  /**
   * Get all adjacent positions (4-directional)
   */
  getAdjacentPositions(position: Vector2): Vector2[] {
    const directions = [
      new Vector2(0, -1), // Up
      new Vector2(1, 0),  // Right
      new Vector2(0, 1),  // Down
      new Vector2(-1, 0)  // Left
    ];

    return directions
      .map(dir => position.add(dir))
      .filter(pos => this.isValidPosition(pos));
  }

  /**
   * Get all cells in the maze
   */
  getAllCells(): MazeCell[] {
    const cells: MazeCell[] = [];
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        cells.push(this.grid[y][x]);
      }
    }
    return cells;
  }
}
