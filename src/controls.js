import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

const PLAYER_HEIGHT = 1.6; // Player eye height (from spec)
const PLAYER_BODY_HEIGHT = 1.8; // Collision height (from spec)
const PLAYER_WIDTH = 0.3; // Half width for collision checks (0.6 / 2)
const PLAYER_SPEED = 0.35;
const GAMEPAD_MOVE_SPEED = 1.2; // Slightly higher for analog controls for better feel
const GRAVITY = 20.0; // A bit stronger gravity
const JUMP_VELOCITY = 8.0; // A bit higher jump
const GAMEPAD_LOOK_SENSITIVITY = 2.5; // Right stick sensitivity for camera rotation
const GAMEPAD_LOOK_DEADZONE = 0.25; // Deadzone for right stick to prevent drift

// Debug flag for logging camera issues
const DEBUG_CAMERA = true;
let debugFrameCounter = 0;
const DEBUG_LOG_FREQUENCY = 60; // Log every 60 frames (approx 1 second at 60fps)

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
    
    // Gamepad state
    let gamepadState = {
        leftStick: { x: 0, y: 0 },
        rightStick: { x: 0, y: 0 },
        buttons: {
            jump: false,
            sprint: false,
            breakBlock: false,
            placeBlock: false
        }
    };
    
    // Store raw gamepad data for debugging
    let rawRightStickX = 0;
    let rawRightStickY = 0;

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
    
    // Helper function to apply deadzone to analog sticks
    function applyDeadzone(value, deadzone) {
        // Log the raw value before deadzone application
        if (DEBUG_CAMERA && debugFrameCounter % DEBUG_LOG_FREQUENCY === 0) {
            console.log(`Raw stick value: ${value.toFixed(6)}, Deadzone: ${deadzone}`);
        }
        
        // Calculate value to return
        if (Math.abs(value) < deadzone) {
            return 0;
        } else {
            // Normalize the value after removing the deadzone
            // This gives a smoother transition at the deadzone boundary
            const sign = value > 0 ? 1 : -1;
            return sign * (Math.abs(value) - deadzone) / (1 - deadzone);
        }
    }
    
    // Method to receive gamepad state from main.js
    function updateGamepadState(newState) {
        // Store raw values for debugging
        rawRightStickX = newState.rightStick.x;
        rawRightStickY = newState.rightStick.y;
        
        // Apply deadzone to the right stick input before storing it
        const rightStickX = applyDeadzone(newState.rightStick.x, GAMEPAD_LOOK_DEADZONE);
        const rightStickY = applyDeadzone(newState.rightStick.y, GAMEPAD_LOOK_DEADZONE);
        
        // Log the raw and processed values
        if (DEBUG_CAMERA && debugFrameCounter % DEBUG_LOG_FREQUENCY === 0) {
            console.log(`Raw Right Stick: X=${rawRightStickX.toFixed(6)}, Y=${rawRightStickY.toFixed(6)}`);
            console.log(`After Deadzone: X=${rightStickX.toFixed(6)}, Y=${rightStickY.toFixed(6)}`);
        }
        
        // Update state with deadzone-filtered values
        gamepadState = {
            ...newState,
            rightStick: { 
                x: rightStickX, 
                y: rightStickY 
            }
        };
        
        // Process gamepad jump button
        if (gamepadState.buttons.jump && onGround) {
            velocity.y = JUMP_VELOCITY;
            onGround = false;
        }
        
        // Handle right stick camera rotation when locked
        // Only rotate camera if stick is outside the deadzone
        if (controls.isLocked && 
            (Math.abs(gamepadState.rightStick.x) > 0 || Math.abs(gamepadState.rightStick.y) > 0)) {
            handleRightStickCameraRotation();
        }
    }
    
    // Handle right stick camera rotation
    function handleRightStickCameraRotation() {
        // Get current camera rotation values
        const euler = new THREE.Euler(0, 0, 0, 'YXZ');
        euler.setFromQuaternion(camera.quaternion);
        
        // Log current rotation before changes
        if (DEBUG_CAMERA && debugFrameCounter % DEBUG_LOG_FREQUENCY === 0) {
            console.log(`Before Rotation: Pitch=${euler.x.toFixed(6)}, Yaw=${euler.y.toFixed(6)}`);
        }
        
        // Calculate rotation delta - FIXING THE SIGNS HERE
        // Yaw (left/right) needs to be inverted from right stick X
        // Pitch (up/down) needs to be inverted from right stick Y
        const yawDelta = -gamepadState.rightStick.x * GAMEPAD_LOOK_SENSITIVITY * 0.02;
        const pitchDelta = -gamepadState.rightStick.y * GAMEPAD_LOOK_SENSITIVITY * 0.02;
        
        if (DEBUG_CAMERA && debugFrameCounter % DEBUG_LOG_FREQUENCY === 0) {
            console.log(`Rotation Delta: Pitch=${pitchDelta.toFixed(6)}, Yaw=${yawDelta.toFixed(6)}`);
        }
        
        // Apply right stick input to camera rotation with proper direction
        euler.y += yawDelta;     // Left/Right rotation (yaw) - negative means turn left
        euler.x += pitchDelta;   // Up/Down rotation (pitch) - negative means look down
        
        // Clamp vertical look to prevent camera flipping
        euler.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, euler.x));
        
        // Log the final rotation values
        if (DEBUG_CAMERA && debugFrameCounter % DEBUG_LOG_FREQUENCY === 0) {
            console.log(`After Rotation: Pitch=${euler.x.toFixed(6)}, Yaw=${euler.y.toFixed(6)}`);
            console.log("-----------------");
        }
        
        // Apply the rotation
        camera.quaternion.setFromEuler(euler);
    }

    function update(delta) {
        // Increment debug frame counter
        debugFrameCounter++;
        
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

        // Get camera orientation vectors for movement
        const forwardVector = new THREE.Vector3();
        camera.getWorldDirection(forwardVector);
        forwardVector.y = 0; // Project onto the xz plane (horizontal only)
        forwardVector.normalize();

        const rightVector = new THREE.Vector3();
        rightVector.crossVectors(camera.up, forwardVector).normalize();

        // Check if using gamepad
        const usingGamepad = Math.abs(gamepadState.leftStick.x) > 0 || Math.abs(gamepadState.leftStick.y) > 0;
        
        if (usingGamepad) {
            // GAMEPAD MOVEMENT - camera-relative
            // Reset the velocity (we'll set it directly from stick input)
            velocity.x = 0;
            velocity.z = 0;
            
            // Create movement vectors from stick input
            // Important: use X for side-to-side and Y for forward/back
            const stickX = gamepadState.leftStick.x;
            const stickY = gamepadState.leftStick.y;
            
            // Add movement in camera-relative directions
            // Forward direction uses negative Z in Three.js (out of screen)
            velocity.z -= forwardVector.z * stickY * GAMEPAD_MOVE_SPEED * 5;
            velocity.x -= forwardVector.x * stickY * GAMEPAD_MOVE_SPEED * 5;
            
            // Right direction is perpendicular to forward
            velocity.z += rightVector.z * stickX * GAMEPAD_MOVE_SPEED * 5;
            velocity.x += rightVector.x * stickX * GAMEPAD_MOVE_SPEED * 5;
            
            if (DEBUG_CAMERA && debugFrameCounter % DEBUG_LOG_FREQUENCY === 0) {
                console.log(`Stick input: X=${stickX.toFixed(3)}, Y=${stickY.toFixed(3)}`);
                console.log(`Movement velocity: X=${velocity.x.toFixed(3)}, Z=${velocity.z.toFixed(3)}`);
            }
        } else {
            // KEYBOARD MOVEMENT
            // Process keyboard input
            direction.z = Number(moveBackward) - Number(moveForward);
            direction.x = Number(moveLeft) - Number(moveRight);
            
            // Normalize direction to keep consistent speed when moving diagonally
            if (direction.x !== 0 || direction.z !== 0) {
                direction.normalize();
            }
            
            // Apply keyboard movement
            if (direction.z !== 0) {
                velocity.z -= forwardVector.z * direction.z * PLAYER_SPEED * 5;
                velocity.x -= forwardVector.x * direction.z * PLAYER_SPEED * 5;
            }
            
            if (direction.x !== 0) {
                velocity.z += rightVector.z * direction.x * PLAYER_SPEED * 5;
                velocity.x += rightVector.x * direction.x * PLAYER_SPEED * 5;
            }
        }

        // Calculate potential next position for collision checking
        const deltaX = velocity.x * delta;
        const deltaZ = velocity.z * delta;

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
        updateGamepadState: updateGamepadState,
        getObject: () => controls.getObject(),
        getVelocity: () => velocity,
        isOnGround: () => onGround // Changed from isJumping
    };
} 