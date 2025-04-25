import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

const PLAYER_HEIGHT = 1.6; // Player eye height (from spec)
const PLAYER_BODY_HEIGHT = 1.8; // Collision height (from spec)
const PLAYER_WIDTH = 0.3; // Half width for collision checks (0.6 / 2)
const PLAYER_SPEED = 1.0;
const GRAVITY = 20.0; // A bit stronger gravity
const JUMP_VELOCITY = 8.0; // A bit higher jump

// Helper function to check for collision at a specific point
// function checkCollision(world, x, y, z) { // MOVE THIS FUNCTION
//     const block = world.getBlock(x, y, z);
//     // Treat undefined blocks (outside generated area) as solid for collision initially
//     // Also consider non-transparent blocks as solid
//     return block && block.def && !block.def.transparent;
// }

export function createControls(camera, domElement, getWorld) {

    // Define checkCollision INSIDE createControls
    function checkCollision(x, y, z) {
        const currentWorld = getWorld(); // Get world instance when needed
        if (!currentWorld) return false; // If world doesn't exist yet, treat as non-colliding

        const block = currentWorld.getBlock(x, y, z);
        // Treat undefined blocks (outside generated area) as solid for collision initially
        // Also consider non-transparent blocks as solid
        // Add a check for fluid blocks later if needed
        return block && block.def && !block.def.transparent; //&& !block.def.fluid; //<- Add this later
    }

    const controls = new PointerLockControls(camera, domElement);
    const velocity = new THREE.Vector3();
    const direction = new THREE.Vector3();
    let moveForward = false;
    let moveBackward = false;
    let moveLeft = false;
    let moveRight = false;
    let onGround = true; // Assume starting on ground

    const onKeyDown = (event) => {
        switch (event.code) {
            case 'ArrowUp':
            case 'KeyW':
                moveForward = true;
                break;
            case 'ArrowLeft':
            case 'KeyA':
                moveLeft = true;
                break;
            case 'ArrowDown':
            case 'KeyS':
                moveBackward = true;
                break;
            case 'ArrowRight':
            case 'KeyD':
                moveRight = true;
                break;
            case 'Space':
                if (onGround) { // Use onGround instead of canJump
                    velocity.y = JUMP_VELOCITY; // Set velocity directly
                    onGround = false;
                }
                break;
        }
    };

    const onKeyUp = (event) => {
        switch (event.code) {
            case 'ArrowUp':
            case 'KeyW':
                moveForward = false;
                break;
            case 'ArrowLeft':
            case 'KeyA':
                moveLeft = false;
                break;
            case 'ArrowDown':
            case 'KeyS':
                moveBackward = false;
                break;
            case 'ArrowRight':
            case 'KeyD':
                moveRight = false;
                break;
        }
    };

    domElement.addEventListener('click', () => {
        controls.lock();
    });

    controls.addEventListener('lock', () => {
        document.getElementById('instructions').style.display = 'none';
        document.getElementById('crosshair').style.display = 'block';
    });

    controls.addEventListener('unlock', () => {
        document.getElementById('instructions').style.display = '';
        document.getElementById('crosshair').style.display = 'none';
        // Reset movement keys on unlock to prevent unwanted sliding
        moveForward = false;
        moveBackward = false;
        moveLeft = false;
        moveRight = false;
    });

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);

    function update(delta) {
        const currentWorld = getWorld(); // Get current world instance
        // Guard clause: Ensure world is loaded before doing physics/collision
        if (!currentWorld) {
            // console.warn("Controls update called before world was ready."); // No longer needed? Check logs.
            return;
        }
        
        if (!controls.isLocked) {
            velocity.x = 0;
            velocity.z = 0;
            return;
        }

        const playerPos = controls.getObject().position;

        // --- Horizontal Movement & Collision --- 

        // Reset X/Z velocity damping (more responsive controls)
        velocity.x -= velocity.x * 15.0 * delta;
        velocity.z -= velocity.z * 15.0 * delta;

        // Calculate movement direction
        direction.z = Number(moveForward) - Number(moveBackward);
        direction.x = Number(moveLeft) - Number(moveRight);
        direction.normalize(); // Ensure consistent speed diagonally

        // Apply movement intention to velocity
        if (moveForward || moveBackward) velocity.z -= direction.z * PLAYER_SPEED * delta * 100; // Use higher multiplier for snappier feel
        if (moveLeft || moveRight) velocity.x -= direction.x * PLAYER_SPEED * delta * 100;

        // Calculate potential next position for collision checking
        const forwardVector = new THREE.Vector3();
        camera.getWorldDirection(forwardVector);
        forwardVector.y = 0;
        forwardVector.normalize();

        const rightVector = new THREE.Vector3();
        rightVector.crossVectors(camera.up, forwardVector).normalize();

        const deltaX = (-velocity.x * delta * rightVector.x - velocity.z * delta * forwardVector.x);
        const deltaZ = (-velocity.x * delta * rightVector.z - velocity.z * delta * forwardVector.z);

        // Check X collision
        const nextX = playerPos.x + deltaX;
        if (!checkCollision(nextX - PLAYER_WIDTH, playerPos.y - PLAYER_BODY_HEIGHT + 0.1, playerPos.z - PLAYER_WIDTH) &&
            !checkCollision(nextX - PLAYER_WIDTH, playerPos.y - PLAYER_BODY_HEIGHT + 0.1, playerPos.z + PLAYER_WIDTH) &&
            !checkCollision(nextX + PLAYER_WIDTH, playerPos.y - PLAYER_BODY_HEIGHT + 0.1, playerPos.z + PLAYER_WIDTH) &&
            !checkCollision(nextX + PLAYER_WIDTH, playerPos.y - PLAYER_BODY_HEIGHT + 0.1, playerPos.z - PLAYER_WIDTH) &&
            !checkCollision(nextX - PLAYER_WIDTH, playerPos.y - 0.1, playerPos.z - PLAYER_WIDTH) && // Check near head height too
            !checkCollision(nextX - PLAYER_WIDTH, playerPos.y - 0.1, playerPos.z + PLAYER_WIDTH) &&
            !checkCollision(nextX + PLAYER_WIDTH, playerPos.y - 0.1, playerPos.z + PLAYER_WIDTH) &&
            !checkCollision(nextX + PLAYER_WIDTH, playerPos.y - 0.1, playerPos.z - PLAYER_WIDTH)) {
                playerPos.x = nextX; 
        } else {
             velocity.x = 0; // Stop horizontal movement if collision
        }
       
        // Check Z collision
        const nextZ = playerPos.z + deltaZ;
         if (!checkCollision(playerPos.x - PLAYER_WIDTH, playerPos.y - PLAYER_BODY_HEIGHT + 0.1, nextZ - PLAYER_WIDTH) &&
            !checkCollision(playerPos.x - PLAYER_WIDTH, playerPos.y - PLAYER_BODY_HEIGHT + 0.1, nextZ + PLAYER_WIDTH) &&
            !checkCollision(playerPos.x + PLAYER_WIDTH, playerPos.y - PLAYER_BODY_HEIGHT + 0.1, nextZ + PLAYER_WIDTH) &&
            !checkCollision(playerPos.x + PLAYER_WIDTH, playerPos.y - PLAYER_BODY_HEIGHT + 0.1, nextZ - PLAYER_WIDTH) &&
            !checkCollision(playerPos.x - PLAYER_WIDTH, playerPos.y - 0.1, nextZ - PLAYER_WIDTH) &&
            !checkCollision(playerPos.x - PLAYER_WIDTH, playerPos.y - 0.1, nextZ + PLAYER_WIDTH) &&
            !checkCollision(playerPos.x + PLAYER_WIDTH, playerPos.y - 0.1, nextZ + PLAYER_WIDTH) &&
            !checkCollision(playerPos.x + PLAYER_WIDTH, playerPos.y - 0.1, nextZ - PLAYER_WIDTH)) {
                playerPos.z = nextZ; 
        } else {
             velocity.z = 0; // Stop horizontal movement if collision
        }

        // --- Vertical Movement & Collision --- 

        // Apply gravity
        velocity.y -= GRAVITY * delta;

        // Calculate potential next Y position
        const nextY = playerPos.y + velocity.y * delta;

        // Check collision below (feet)
        const feetY = nextY - PLAYER_BODY_HEIGHT;
        const headY = nextY;

        if (velocity.y <= 0) { // Check ground collision only when falling or landed
             if ((checkCollision(playerPos.x - PLAYER_WIDTH, feetY, playerPos.z - PLAYER_WIDTH)) ||
                (checkCollision(playerPos.x + PLAYER_WIDTH, feetY, playerPos.z - PLAYER_WIDTH)) ||
                (checkCollision(playerPos.x - PLAYER_WIDTH, feetY, playerPos.z + PLAYER_WIDTH)) ||
                (checkCollision(playerPos.x + PLAYER_WIDTH, feetY, playerPos.z + PLAYER_WIDTH))) {
                
                velocity.y = 0;
                // Calculate the top surface of the block below feet and place player there
                playerPos.y = Math.ceil(feetY) + PLAYER_BODY_HEIGHT; 
                onGround = true;
             } else {
                playerPos.y = nextY; // No collision below, apply gravity movement
                onGround = false;
             }
        } else { // Check ceiling collision only when moving up (jumping)
             if ((checkCollision(playerPos.x - PLAYER_WIDTH, headY, playerPos.z - PLAYER_WIDTH)) ||
                (checkCollision(playerPos.x + PLAYER_WIDTH, headY, playerPos.z - PLAYER_WIDTH)) ||
                (checkCollision(playerPos.x - PLAYER_WIDTH, headY, playerPos.z + PLAYER_WIDTH)) ||
                (checkCollision(playerPos.x + PLAYER_WIDTH, headY, playerPos.z + PLAYER_WIDTH))) {
                
                velocity.y = 0; // Hit head, stop upward movement
                onGround = false; // Force falling state even if momentarily stopped
             }
             playerPos.y = nextY; // Apply gravity/jump movement (even if head hit, gravity needs to take over)
             onGround = false;
        }
    }

    // Initialize crosshair state
    document.getElementById('crosshair').style.display = 'none';

    // Return the controls object and the update function
    return {
        controls: controls,
        update: update,
        getObject: () => controls.getObject(),
        getVelocity: () => velocity,
        isOnGround: () => onGround // Changed from isJumping
    };
} 