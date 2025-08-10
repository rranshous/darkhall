import { Vector2 } from '../core/Vector2.js';
import { GameSimulation } from '../simulation/GameSimulation.js';
import { CellType } from '../simulation/Maze.js';
import { GameState } from '../core/StateMachine.js';

/**
 * Canvas-based renderer for the game
 */
export class GameRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private cellSize: number = 20; // Size of each maze cell in pixels
  
  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Could not get 2D rendering context');
    }
    this.ctx = context;
    
    // Set canvas size
    this.canvas.width = 800;
    this.canvas.height = 600;
    
    console.log('Renderer initialized');
  }

  /**
   * Render the entire game
   */
  render(simulation: GameSimulation): void {
    this.clearCanvas();
    
    const gameState = simulation.getGameState();
    
    // Calculate offset to center the maze on screen
    const offsetX = (this.canvas.width - gameState.mazeSize.width * this.cellSize) / 2;
    const offsetY = (this.canvas.height - gameState.mazeSize.height * this.cellSize) / 2;
    
    // Save context for transformations
    this.ctx.save();
    this.ctx.translate(offsetX, offsetY);
    
    // Render visible cells (those illuminated by flashlight)
    this.renderVisibleCells(simulation);
    
    // Render monster body (if visible)
    this.renderMonster(simulation);
    
    // Always render monster eyes on top (even in darkness)
    this.renderMonsterEyes(simulation);
    
    // Render player
    this.renderPlayer(gameState.playerPosition, gameState.flashlightDirection);
    
    // Restore context
    this.ctx.restore();
    
    // Render UI
    this.renderUI(simulation);
  }

  /**
   * Clear the canvas
   */
  private clearCanvas(): void {
    this.ctx.fillStyle = '#000000'; // Complete darkness
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * Render only the cells that are illuminated
   */
  private renderVisibleCells(simulation: GameSimulation): void {
    const visibleCells = simulation.getVisibleCells();
    
    for (const { cell, intensity } of visibleCells) {
      const x = cell.position.x * this.cellSize;
      const y = cell.position.y * this.cellSize;
      
      // Base color depends on cell type
      let baseColor: string;
      switch (cell.type) {
        case CellType.WALL:
          baseColor = '#444444';
          break;
        case CellType.FLOOR:
          baseColor = '#888888';
          break;
        case CellType.START:
          baseColor = '#44AA44';
          break;
        case CellType.PRIZE:
          baseColor = '#FFDD44';
          break;
        default:
          baseColor = '#666666';
      }
      
      // Apply light intensity to the color
      const color = this.applyLightIntensity(baseColor, intensity);
      
      this.ctx.fillStyle = color;
      this.ctx.fillRect(x, y, this.cellSize, this.cellSize);
      
      // Add some border for walls
      if (cell.type === CellType.WALL) {
        this.ctx.strokeStyle = this.applyLightIntensity('#666666', intensity);
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x, y, this.cellSize, this.cellSize);
      }
    }
  }

  /**
   * Render the player character
   */
  private renderPlayer(position: Vector2, flashlightDirection: Vector2): void {
    const x = position.x * this.cellSize + this.cellSize / 2;
    const y = position.y * this.cellSize + this.cellSize / 2;
    
    // Player body (circle)
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.beginPath();
    this.ctx.arc(x, y, this.cellSize / 3, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Flashlight direction indicator (line)
    this.ctx.strokeStyle = '#FFFF44';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(x, y);
    this.ctx.lineTo(
      x + flashlightDirection.x * this.cellSize / 2,
      y + flashlightDirection.y * this.cellSize / 2
    );
    this.ctx.stroke();
  }

  /**
   * Always render the monster's glowing red eyes (even in complete darkness)
   */
  private renderMonsterEyes(simulation: GameSimulation): void {
    const gameState = simulation.getGameState();
    const monsterPos = gameState.monsterPosition;
    
    const x = monsterPos.x * this.cellSize + this.cellSize / 2;
    const y = monsterPos.y * this.cellSize + this.cellSize / 2;
    
    // Always render the glowing red eyes, even in darkness
    this.ctx.fillStyle = '#FF0000'; // Bright red, always visible
    // Left eye
    this.ctx.beginPath();
    this.ctx.arc(x - this.cellSize / 8, y - this.cellSize / 8, 3, 0, Math.PI * 2);
    this.ctx.fill();
    // Right eye  
    this.ctx.beginPath();
    this.ctx.arc(x + this.cellSize / 8, y - this.cellSize / 8, 3, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Add a subtle glow effect around the eyes
    this.ctx.shadowColor = '#FF0000';
    this.ctx.shadowBlur = 8;
    this.ctx.fillStyle = '#FF4444';
    // Left eye glow
    this.ctx.beginPath();
    this.ctx.arc(x - this.cellSize / 8, y - this.cellSize / 8, 2, 0, Math.PI * 2);
    this.ctx.fill();
    // Right eye glow
    this.ctx.beginPath();
    this.ctx.arc(x + this.cellSize / 8, y - this.cellSize / 8, 2, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Reset shadow
    this.ctx.shadowBlur = 0;
  }

  /**
   * Render the monster body (only when illuminated or in god mode)
   */
  private renderMonster(simulation: GameSimulation): void {
    const gameState = simulation.getGameState();
    const monsterPos = gameState.monsterPosition;
    
    // Check if monster body is visible (in light or god mode)
    const lightIntensity = simulation.player.getLightIntensity(monsterPos);
    const isBodyVisible = lightIntensity > 0.1 || gameState.godMode;
    
    if (!isBodyVisible) return;
    
    const x = monsterPos.x * this.cellSize + this.cellSize / 2;
    const y = monsterPos.y * this.cellSize + this.cellSize / 2;
    
    // Calculate visibility intensity
    const intensity = gameState.godMode ? (lightIntensity > 0 ? lightIntensity : 0.3) : lightIntensity;
    
    // Monster body (larger circle, menacing blue)
    const blue = Math.floor(255 * intensity);
    const red = Math.floor(100 * intensity);
    this.ctx.fillStyle = `rgb(${red}, 0, ${blue})`;
    this.ctx.beginPath();
    this.ctx.arc(x, y, this.cellSize / 2.5, 0, Math.PI * 2);
    this.ctx.fill();
  }

  /**
   * Render UI elements
   */
  private renderUI(simulation: GameSimulation): void {
    const gameState = simulation.getGameState();
    
    // Game state text
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = '20px Arial';
    this.ctx.textAlign = 'left';
    
    let statusText = '';
    switch (gameState.gameState) {
      case GameState.EXPLORING:
        statusText = 'Exploring the dark halls... Beware the monster!';
        break;
      case GameState.PAUSED:
        statusText = 'PAUSED';
        break;
      case GameState.VICTORY:
        statusText = 'VICTORY! You found the prize and escaped!';
        break;
      case GameState.GAME_OVER:
        statusText = 'GAME OVER - The monster caught you!';
        break;
    }
    
    this.ctx.fillText(statusText, 10, 30);
    
    // God mode indicator
    if (gameState.godMode) {
      this.ctx.fillStyle = '#FFFF00';
      this.ctx.font = '16px Arial';
      this.ctx.fillText('GOD MODE (G to toggle)', 10, 55);
    }
    
    // Monster proximity warning
    const playerPos = gameState.playerPosition;
    const monsterPos = gameState.monsterPosition;
    const distanceToMonster = playerPos.distanceTo(monsterPos);
    
    if (distanceToMonster <= 4 && gameState.gameState === GameState.EXPLORING) {
      this.ctx.fillStyle = '#FF4444';
      this.ctx.font = '16px Arial';
      const warningY = gameState.godMode ? 75 : 55;
      if (distanceToMonster <= 2) {
        this.ctx.fillText('⚠️ MONSTER VERY CLOSE!', 10, warningY);
      } else {
        this.ctx.fillText('⚠️ MONSTER NEARBY!', 10, warningY);
      }
    }
    
    // Position info
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = '14px Arial';
    this.ctx.fillText(
      `Position: (${gameState.playerPosition.x}, ${gameState.playerPosition.y})`,
      10,
      this.canvas.height - 60
    );
    
    // Controls
    this.ctx.fillText('WASD: Move | Mouse: Aim flashlight | G: God mode', 10, this.canvas.height - 40);
    this.ctx.fillText('Avoid the blue monster! Find the yellow prize room!', 10, this.canvas.height - 20);
  }

  /**
   * Apply light intensity to a color
   */
  private applyLightIntensity(baseColor: string, intensity: number): string {
    // Simple implementation: multiply RGB values by intensity
    const hex = baseColor.replace('#', '');
    const r = Math.floor(parseInt(hex.substr(0, 2), 16) * intensity);
    const g = Math.floor(parseInt(hex.substr(2, 2), 16) * intensity);
    const b = Math.floor(parseInt(hex.substr(4, 2), 16) * intensity);
    
    return `rgb(${r}, ${g}, ${b})`;
  }

  /**
   * Convert screen coordinates to world coordinates
   */
  screenToWorld(screenPos: Vector2, mazeSize: { width: number, height: number }): Vector2 {
    const offsetX = (this.canvas.width - mazeSize.width * this.cellSize) / 2;
    const offsetY = (this.canvas.height - mazeSize.height * this.cellSize) / 2;
    
    const worldX = (screenPos.x - offsetX) / this.cellSize;
    const worldY = (screenPos.y - offsetY) / this.cellSize;
    
    return new Vector2(worldX, worldY);
  }
}
