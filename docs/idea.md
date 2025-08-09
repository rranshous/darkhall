# Idea

I was talking w/ my step-son about a game we might find interesting to make.

The idea is scary / horror game where you try and make it through a dark labyrinth..

# Visual

2D, top down

Dark, only can see around the character.

An unseen labyrinth constraints where the character can go.

The character has a flashlight which illuminates the maze corridors in the direction it is pointing.

# Gameplay

The entire screen is the maze. You pilot your character through it's halls attempting to find the prize room.

I'm not sure about game mechanics for now. I expect that there may be creepy crawlies who come for you, maybe afraid of the flashlight?

Perhaps we get low on food and have to find supplies.

Perhaps there is an RGP element? Who knows

Initial target is just to pilot the character through the dark maze.

The character moves around the screen (through the maze) the POV of the camera does not change. The maze fills the screen (though you can't see it b/c it's dark!)

# Technical guidelines

seperate the simulation from the presentation and inputs. I want to be able to test / run the simulation headless but have it be the core for the game

Typescript, Canvas, HTML5

Only a single back end server.

Client side, I want to be able to publish this to itch.io

Seperate concerns. Prioritize extensability.

Break things in to modules and keep files short

# Sprites and Textures

I can find or buy sprites and background textures from itch.io.

As possible, lets start by drawing things w/ Canvas. As we refine the game we can introduce textures and sprites.

# Context

This is fun, exploratory work. We do not need production quality implementation.