# Dark Hall 👹

A horror maze game built with TypeScript and HTML5 Canvas. Navigate through dark corridors with only your flashlight while avoiding a menacing monster with glowing red eyes.

![Game Screenshot](docs/screenshot.png) <!-- Add screenshot when available -->

## 🎮 Play the Game

**[Play Dark Hall on itch.io →](https://codeflaw.itch.io/darkhall)**

## 🎯 Game Features

- **🗿 Large Procedural Mazes**: Each playthrough features a unique 31x31 maze with multiple paths
- **💡 Advanced Lighting System**: Triple-layer lighting with flashlight, ambient glow, and footprint trails
- **👣 Footprint Navigation**: Leave fading light trails to track your exploration history
- **🚫 Anti-Frustration Design**: Smart monster placement prevents guaranteed loss scenarios
- **🎯 Line-of-Sight Rendering**: Light doesn't bleed through walls - realistic flashlight behavior
- **👹 Intelligent Monster AI**: A blue monster with glowing red eyes hunts you through the darkness
- **📱 Cross-Platform**: Works on desktop (WASD + mouse) and mobile (touch controls)
- **🎮 God Mode**: Toggle full visibility for debugging and exploration
- **🏃‍♂️ Strategic Gameplay**: Balance speed, stealth, and flashlight usage

## 🕹️ Controls

### Desktop
- **WASD** or **Arrow Keys** - Move through the maze
- **Mouse** - Aim your flashlight
- **G** - Toggle God Mode (see all walls and enemies)

### Mobile
- **Drag** - Move through the maze
- **Tap** - Aim your flashlight
- **Buttons** - Reset, pause, toggle god mode

## 🎭 Gameplay

Your goal is simple but terrifying: **find the yellow prize room** while **avoiding the blue monster**. 

- **Triple Lighting System**: Directional flashlight, ambient player glow, and fading footprint trails
- **Footprint Navigation**: See where you've been with light trails that fade over 15 seconds
- **Realistic Line-of-Sight**: Light is blocked by walls - no cheating through solid barriers
- The monster's **glowing red eyes are always visible**, even in darkness
- Your flashlight slows the monster when it's caught in the beam
- **Fair Challenge**: Large mazes with multiple paths prevent unavoidable encounters
- Each maze is procedurally generated with guaranteed escape routes

## 🛠️ Development

### Prerequisites
- Node.js (v16 or higher)
- npm

### Setup
```bash
# Clone the repository
git clone https://github.com/rranshous/darkhall.git
cd darkhall

# Install dependencies
npm install

# Build the project
npm run build

# Start development server
npm start
```

### Development Scripts
```bash
npm run build      # Compile TypeScript
npm run dev        # Watch mode compilation
npm run serve      # Start HTTP server
npm start          # Build and serve
npm run itch       # Build for itch.io deployment
```

## 🏗️ Architecture

The game follows a clean separation between simulation and presentation:

```
src/
├── core/              # Shared utilities
│   ├── Vector2.ts     # 2D vector math
│   └── StateMachine.ts # Game state management
├── simulation/        # Game logic (headless)
│   ├── GameSimulation.ts # Main game controller
│   ├── Maze.ts        # Maze generation and pathfinding
│   ├── Player.ts      # Player character with flashlight
│   └── Monster.ts     # AI monster behavior
├── presentation/      # Rendering and input
│   ├── GameRenderer.ts # Canvas-based renderer
│   └── InputHandler.ts # Keyboard, mouse, and touch input
└── Game.ts           # Main game coordinator
```

### Key Design Principles
- **Simulation/Presentation Separation**: Core game logic can run headlessly
- **Modular Architecture**: Short, focused files with clear responsibilities
- **Cross-Platform Input**: Unified handling for desktop and mobile
- **Type Safety**: Full TypeScript implementation with strict mode

## 🚀 Deployment

### Building for itch.io
```bash
# Create deployment package
./build.sh

# This creates:
# - build/ directory with game files
# - darkhall-game.zip ready for itch.io upload
```

### Itch.io Setup
1. Upload `darkhall-game.zip` as an HTML project
2. Set `index.html` as the main file
3. Enable "This file will be played in the browser"
4. Recommended viewport: 800x600

## 🎨 Technical Details

### Maze Generation
- Uses **recursive backtracking** algorithm for base structure
- **Strategic connections** added to ensure multiple paths and prevent choke points
- **Smart monster placement** avoids blocking critical routes
- **31x31 large mazes** provide ample exploration space
- **Pathfinding verification** ensures fair, solvable challenges

### Lighting System
- **Directional Flashlight**: 4-unit range cone with realistic line-of-sight blocking
- **Ambient Player Glow**: 1.5-unit radius for immediate spatial awareness
- **Footprint Trails**: 15-second fading navigation aid with smooth cosine fade curve
- **Two-tier Rendering**: Different intensity models for main lighting vs. fading effects
- **Performance Optimized**: Efficient Map-based footprint storage with automatic cleanup

### Monster AI
- **BFS pathfinding** to hunt the player efficiently
- **Fear of light** - slows down in flashlight beam
- **Always-visible eyes** for atmospheric horror
- **Safe spawn system** - won't start in positions that guarantee player loss
- **Intersection preference** - spawns in open areas rather than narrow corridors

## 🤝 Contributing

Contributions are welcome! Areas for improvement:

- **Audio system** (footsteps, monster sounds, ambient horror)
- **Enhanced graphics** (particle effects, better textures)
- **New mechanics** (battery system, multiple monsters, power-ups)
- **Performance optimization** for larger mazes
- **Additional monster types** with different behaviors

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🎭 Credits

Built with:
- **TypeScript** for type-safe game logic
- **HTML5 Canvas** for rendering
- **Recursive backtracking** maze generation
- **BFS pathfinding** for monster AI

---

*Navigate the darkness, avoid the eyes, find the prize.* 👁️‍🗨️
