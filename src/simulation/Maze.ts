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
    this.prizePosition = this.findGoodPrizePosition();
    
    this.setCellType(this.startPosition, CellType.START);
    this.setCellType(this.prizePosition, CellType.PRIZE);
    
    // Verify there's a path from start to prize
    if (!this.hasPathFromStartToPrize()) {
      console.warn('No path from start to prize found, regenerating maze...');
      this.generateSimpleMaze();
      this.prizePosition = this.findGoodPrizePosition();
      this.setCellType(this.prizePosition, CellType.PRIZE);
    }
  }

  /**
   * Generate a proper maze using recursive backtracking algorithm
   * Guarantees a path from start to end and creates proper maze corridors
   */
  private generateSimpleMaze(): void {
    // Start with all walls
    // (already done in constructor)
    
    // Use recursive backtracking to generate maze
    const stack: Vector2[] = [];
    const visited: Set<string> = new Set();
    
    // Start from position (1,1) - ensure odd coordinates for proper maze generation
    const startPos = new Vector2(1, 1);
    this.setCellType(startPos, CellType.FLOOR);
    stack.push(startPos);
    visited.add(`${startPos.x},${startPos.y}`);
    
    while (stack.length > 0) {
      const current = stack[stack.length - 1];
      const neighbors = this.getUnvisitedNeighbors(current, visited);
      
      if (neighbors.length > 0) {
        // Choose random neighbor
        const next = neighbors[Math.floor(Math.random() * neighbors.length)];
        
        // Remove wall between current and next
        const wallBetween = new Vector2(
          (current.x + next.x) / 2,
          (current.y + next.y) / 2
        );
        
        this.setCellType(next, CellType.FLOOR);
        this.setCellType(wallBetween, CellType.FLOOR);
        
        visited.add(`${next.x},${next.y}`);
        stack.push(next);
      } else {
        // Backtrack
        stack.pop();
      }
    }
    
    // Ensure there are some additional connections for more interesting paths
    this.addRandomConnections();
  }

  /**
   * Get unvisited neighbors for maze generation (2 cells away to maintain wall structure)
   */
  private getUnvisitedNeighbors(pos: Vector2, visited: Set<string>): Vector2[] {
    const neighbors: Vector2[] = [];
    const directions = [
      new Vector2(0, -2), // Up
      new Vector2(2, 0),  // Right
      new Vector2(0, 2),  // Down
      new Vector2(-2, 0)  // Left
    ];
    
    for (const dir of directions) {
      const neighbor = pos.add(dir);
      if (this.isValidPosition(neighbor) && 
          neighbor.x > 0 && neighbor.x < this.width - 1 &&
          neighbor.y > 0 && neighbor.y < this.height - 1 &&
          !visited.has(`${neighbor.x},${neighbor.y}`)) {
        neighbors.push(neighbor);
      }
    }
    
    return neighbors;
  }

  /**
   * Add many more random connections to create multiple paths and reduce choke points
   */
  private addRandomConnections(): void {
    // Significantly increase connections - more paths means less likely to trap player
    const connectionCount = Math.floor((this.width * this.height) / 25); // Increased from /100 to /25
    
    for (let i = 0; i < connectionCount; i++) {
      const x = Math.floor(Math.random() * (this.width - 2)) + 1;
      const y = Math.floor(Math.random() * (this.height - 2)) + 1;
      
      // More liberal connection creation for better connectivity
      if (this.shouldCreateConnection(new Vector2(x, y))) {
        this.setCellType(new Vector2(x, y), CellType.FLOOR);
      }
    }
    
    // Add additional strategic connections to ensure path diversity
    this.addStrategicConnections();
  }

  /**
   * Add strategic connections to ensure multiple paths between key areas
   */
  private addStrategicConnections(): void {
    const attempts = Math.floor((this.width * this.height) / 40);
    
    for (let i = 0; i < attempts; i++) {
      const x = Math.floor(Math.random() * (this.width - 2)) + 1;
      const y = Math.floor(Math.random() * (this.height - 2)) + 1;
      const pos = new Vector2(x, y);
      
      // Create connections in walls that would bridge separate areas
      if (this.getCell(pos)?.type === CellType.WALL) {
        const adjacentFloors = this.getAdjacentPositions(pos)
          .filter(adjPos => {
            const cell = this.getCell(adjPos);
            return cell && cell.type === CellType.FLOOR;
          }).length;
        
        // If this wall has floors on opposite sides, it's a good candidate for connection
        if (adjacentFloors >= 2) {
          this.setCellType(pos, CellType.FLOOR);
        }
      }
    }
  }

  /**
   * Check if we should create a connection at this position
   */
  private shouldCreateConnection(pos: Vector2): boolean {
    // Don't create connections that would make large open areas
    const adjacentFloors = this.getAdjacentPositions(pos)
      .filter(adjPos => {
        const cell = this.getCell(adjPos);
        return cell && cell.type === CellType.FLOOR;
      }).length;
    
    // Only create connection if it connects two separate paths
    return adjacentFloors >= 2 && adjacentFloors <= 3;
  }

  /**
   * Find a good position for the prize (far from start, accessible)
   */
  private findGoodPrizePosition(): Vector2 {
    const floorCells = this.getAllCells().filter(cell => 
      cell.type === CellType.FLOOR && !cell.position.equals(this.startPosition)
    );
    
    if (floorCells.length === 0) {
      // Fallback to a reasonable position
      return new Vector2(this.width - 2, this.height - 2);
    }
    
    // Find the floor cell farthest from start
    let farthestCell = floorCells[0];
    let maxDistance = this.startPosition.distanceTo(farthestCell.position);
    
    for (const cell of floorCells) {
      const distance = this.startPosition.distanceTo(cell.position);
      if (distance > maxDistance) {
        maxDistance = distance;
        farthestCell = cell;
      }
    }
    
    return farthestCell.position;
  }

  /**
   * Check if there's a path from start to prize using BFS
   */
  private hasPathFromStartToPrize(): boolean {
    const visited = new Set<string>();
    const queue = [this.startPosition];
    visited.add(`${this.startPosition.x},${this.startPosition.y}`);
    
    while (queue.length > 0) {
      const current = queue.shift()!;
      
      if (current.equals(this.prizePosition)) {
        return true;
      }
      
      for (const neighbor of this.getAdjacentPositions(current)) {
        const key = `${neighbor.x},${neighbor.y}`;
        if (!visited.has(key) && this.isWalkable(neighbor)) {
          visited.add(key);
          queue.push(neighbor);
        }
      }
    }
    
    return false;
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
