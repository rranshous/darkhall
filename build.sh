#!/bin/bash

# Dark Hall - Itch.io Build Script
echo "🎮 Building Dark Hall for itch.io deployment..."

# Clean previous build
rm -rf build/
mkdir -p build/

# Copy main files
echo "📁 Copying game files..."
cp index.html build/
cp -r dist/ build/

# Create a simple README for the build
cat > build/README.txt << EOF
Dark Hall - Horror Maze Game
===========================

This is a browser-based horror maze game built with TypeScript and Canvas.

DEPLOYMENT INSTRUCTIONS:
1. Upload all files in this folder to itch.io
2. Set the main file as "index.html"
3. Enable "This file will be played in the browser"

GAME DESCRIPTION:
Navigate through a dark maze using only your flashlight while avoiding a menacing monster with glowing red eyes. Find the yellow prize room to win!

CONTROLS:
- Desktop: WASD/Arrow keys to move, mouse to aim flashlight, G for god mode
- Mobile: Drag to move, tap to aim flashlight

Built $(date)
EOF

echo "✅ Build complete! Files ready in 'build/' directory"
echo ""
echo "📦 Files in build directory:"
ls -la build/
echo ""
echo "�️ Creating zip file for itch.io..."

# Create zip file
cd build
zip -r ../darkhall-game.zip . -x "*.DS_Store"
cd ..

echo "✅ Zip file created: darkhall-game.zip"
echo ""
echo "🚀 Ready for itch.io upload!"
echo "   1. Upload 'darkhall-game.zip' to itch.io as HTML5 game"
echo "   2. Extract the zip on itch.io"
echo "   3. Set index.html as the main file"
echo "   4. Enable 'This file will be played in the browser'"
