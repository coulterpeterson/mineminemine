import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { GROUND_LEVEL, WORLD_HEIGHT } from './world.js'; // Import world constants
const PLAYER_HEIGHT = 1.8; // Collision height (from spec) - Use this for physics
const PLAYER_EYE_LEVEL = 1.6; // Player eye height (from spec) - Relative to feet
const PLAYER_RADIUS = 0.3; // Half width for collision checks (0.6 / 2)
const PLAYER_SPEED = 0.2; // Blocks per second
const PLAYER_SPRINT_MULTIPLIER = 1.0;
const GRAVITY = 20.0; // A bit stronger gravity
const JUMP_VELOCITY = 6.0;
const MAX_STEP_HEIGHT = 0.6; // How high the player can step up automatically
const GAMEPAD_LOOK_SENSITIVITY = 2.5; // Right stick sensitivity for camera rotation
const GAMEPAD_LOOK_DEADZONE = 0.25; // Deadzone for right stick to prevent drift

// Debug flag for logging camera issues
const DEBUG_CAMERA = false; // Disable excessive logging by default
let debugFrameCounter = 0;
const DEBUG_LOG_FREQUENCY = 60; // Log every 60 frames (approx 1 second at 60fps)

// --- Initial Fall Debugging ---
let initialFrames = 0; // Counter for initial frames after gravity enabled
const MAX_INITIAL_FRAMES_LOG = 10; // Log detailed collision for this many frames
let initialGroundDetected = false; // Flag to stop logging once ground is hit initially
// -----------------------------

export function createControls(camera, domElement, getWorld) {

    let currentWorld = null; // Initialize world reference

    // Define checkCollision INSIDE createControls
    // Simplified Collision Detection (AABB checks around the player)
    function checkCollision(playerPosition, playerVelocity, delta, isInitialCheck) {
        currentWorld = getWorld(); // Get world instance when needed
        if (!currentWorld) {
             if (isInitialCheck) console.log("Initial Check: World not ready.");
             return { x: false, y: false, z: false}; // No world, no collision
        }


        // Feet position is playerPosition.y - PLAYER_HEIGHT
        const feetY = playerPosition.y - PLAYER_HEIGHT;
        const headY = playerPosition.y; // Eyes are at top
        if (isInitialCheck) console.log(`Initial Check: Pos Y=${playerPosition.y.toFixed(3)}, Feet Y=${feetY.toFixed(3)}, Vel Y=${playerVelocity.y.toFixed(3)}`);


        // Bounding Box Check Points relative to player position (Eyes at origin)
        const checkOffsets = [
            // Feet level checks (slightly above base for ground checks)
            { x: 0, y: -PLAYER_HEIGHT + 0.1, z: 0 }, // Center feet
            { x: PLAYER_RADIUS, y: -PLAYER_HEIGHT + 0.1, z: 0 }, // Feet right
            { x: -PLAYER_RADIUS, y: -PLAYER_HEIGHT + 0.1, z: 0 }, // Feet left
            { x: 0, y: -PLAYER_HEIGHT + 0.1, z: PLAYER_RADIUS }, // Feet back
            { x: 0, y: -PLAYER_HEIGHT + 0.1, z: -PLAYER_RADIUS }, // Feet front
            // Corner feet checks (important for stability)
            { x: PLAYER_RADIUS, y: -PLAYER_HEIGHT + 0.1, z: PLAYER_RADIUS},
            { x: PLAYER_RADIUS, y: -PLAYER_HEIGHT + 0.1, z: -PLAYER_RADIUS},
            { x: -PLAYER_RADIUS, y: -PLAYER_HEIGHT + 0.1, z: PLAYER_RADIUS},
            { x: -PLAYER_RADIUS, y: -PLAYER_HEIGHT + 0.1, z: -PLAYER_RADIUS},

            // Head level checks (just below eye level)
            { x: 0, y: -0.1, z: 0 }, // Center head
            { x: PLAYER_RADIUS, y: -0.1, z: 0 }, // Head right
            { x: -PLAYER_RADIUS, y: -0.1, z: 0 }, // Head left
            { x: 0, y: -0.1, z: PLAYER_RADIUS }, // Head back
            { x: 0, y: -0.1, z: -PLAYER_RADIUS }, // Head front
        ];

        const collision = {
            x: false,
            y: false, // Specifically for hitting ground/ceiling
            z: false
        };

        // --- Check Ground Collision ---
        let groundDetected = false;
        let highestGroundY = -Infinity; // Find the highest ground block player is standing on

        // Check slightly below all feet points
        const groundCheckY = feetY - 0.01; // Check just below the feet base
        const groundCheckPoints = checkOffsets.filter(p => p.y < -PLAYER_HEIGHT / 2); // Filter for feet level points
        if (isInitialCheck) console.log(`Initial Check: Ground check Y=${groundCheckY.toFixed(3)}`);


        for (const offset of groundCheckPoints) {
            const checkX = Math.floor(playerPosition.x + offset.x);
            const checkBlockY = Math.floor(groundCheckY); // Integer Y coord of block below feet
            const checkZ = Math.floor(playerPosition.z + offset.z);

            // Use world's isSolidBlock method
             const isSolid = currentWorld.isSolidBlock(checkX, checkBlockY, checkZ);
             if (isInitialCheck) console.log(`  - Checking ground at (${checkX}, ${checkBlockY}, ${checkZ}): Solid = ${isSolid}`);

            if (isSolid) {
                groundDetected = true;
                highestGroundY = Math.max(highestGroundY, checkBlockY + 1); // Top surface of the ground block
                 if (isInitialCheck) console.log(`  - Ground detected! Highest ground Y = ${highestGroundY}`);
                break; // Found ground, no need to check further points for this specific detection
            }
        }

        // Update onGround state and adjust Y position/velocity
        if (playerVelocity.y <= 0 && groundDetected) {
            onGround = true; // Set internal state
            collision.y = true; // Report collision
            playerVelocity.y = 0; // Stop falling
            // Snap player's feet exactly onto the highest detected ground surface
            const snappedY = highestGroundY + PLAYER_HEIGHT;
             if (isInitialCheck) console.log(`Initial Check: Ground collision! Snapping Y to ${snappedY.toFixed(3)}`);
            playerPosition.y = snappedY;
            initialGroundDetected = true; // Stop detailed logging once ground is hit
        } else {
            onGround = false; // Not on ground if moving up or no ground detected
             if (isInitialCheck && playerVelocity.y <= 0) console.log(`Initial Check: No ground detected below while moving down/still.`);
        }

        // --- Check Horizontal and Ceiling Collisions ---
        // (No extra logging added here for now, focus is on initial ground collision)
        // Predict next position based on velocity for each axis independently
        const nextPosX = playerPosition.clone().addScaledVector(new THREE.Vector3(playerVelocity.x, 0, 0), delta);
        const nextPosY = playerPosition.clone().addScaledVector(new THREE.Vector3(0, playerVelocity.y, 0), delta);
        const nextPosZ = playerPosition.clone().addScaledVector(new THREE.Vector3(0, 0, playerVelocity.z), delta);

        // Check X collision
        for (const offset of checkOffsets) {
            const checkX = Math.floor(nextPosX.x + offset.x);
            const checkY = Math.floor(playerPosition.y + offset.y); // Use current Y for horizontal checks
            const checkZ = Math.floor(playerPosition.z + offset.z);
            if (currentWorld.isSolidBlock(checkX, checkY, checkZ)) {
                // Check if it's a step-up scenario
                if (offset.y < -PLAYER_HEIGHT / 2 && // Check feet level points
                    (checkY + 1) <= (playerPosition.y - 0.1) && // Ensure block top is below head
                    playerVelocity.y <= 0 && // Only step up if not jumping/moving up
                    !onGround) // Don't step if already perfectly grounded (prevents jitter)
                {
                    const stepHeight = (checkY + 1) - (playerPosition.y - PLAYER_HEIGHT);
                    if (stepHeight > 0 && stepHeight <= MAX_STEP_HEIGHT) {
                        // Check if space above step is clear
                        const spaceAboveY = checkY + 1; // Y coord of space directly above step
                        // Check points around head level but at the target XZ
                        const headClear1 = !currentWorld.isSolidBlock(checkX, spaceAboveY, checkZ);
                        const headClear2 = !currentWorld.isSolidBlock(checkX, spaceAboveY + 1, checkZ);

                        if (headClear1 && headClear2)
                        {
                            // Perform step up
                            playerPosition.y = checkY + 1 + PLAYER_HEIGHT; // Teleport up onto the step
                            playerVelocity.y = 0; // Stop vertical motion for the step
                            onGround = true; // Landed on step
                            collision.y = true; // Consider it a y-collision for this frame
                            // console.log("Stepped up X"); // Keep console logs minimal
                            // Stop x-movement after step
                            collision.x = true;
                            playerVelocity.x = 0;
                            break; // Stop checking X points after successful step
                        }
                    }
                }
                // If not a valid step, it's a wall collision
                if(!collision.x) { // Only set if not already set by step-up
                    collision.x = true;
                    playerVelocity.x = 0;
                    break; // Stop checking X points after collision
                }
            }
        }

        // Check Z collision
        if (!collision.x) { // Don't check Z step if already stepped/collided on X
            for (const offset of checkOffsets) {
                const checkX = Math.floor(playerPosition.x + offset.x);
                const checkY = Math.floor(playerPosition.y + offset.y);
                const checkZ = Math.floor(nextPosZ.z + offset.z);
                if (currentWorld.isSolidBlock(checkX, checkY, checkZ)) {
                     // Check for step-up
                    if (offset.y < -PLAYER_HEIGHT / 2 &&
                        (checkY + 1) <= (playerPosition.y - 0.1) &&
                        playerVelocity.y <= 0 &&
                        !onGround)
                    {
                        const stepHeight = (checkY + 1) - (playerPosition.y - PLAYER_HEIGHT);
                        if (stepHeight > 0 && stepHeight <= MAX_STEP_HEIGHT) {
                            const spaceAboveY = checkY + 1;
                            const headClear1 = !currentWorld.isSolidBlock(checkX, spaceAboveY, checkZ);
                            const headClear2 = !currentWorld.isSolidBlock(checkX, spaceAboveY + 1, checkZ);

                             if (headClear1 && headClear2)
                             {
                                 playerPosition.y = checkY + 1 + PLAYER_HEIGHT;
                                 playerVelocity.y = 0;
                                 onGround = true;
                                 collision.y = true;
                                 // console.log("Stepped up Z");
                                 // Stop z-movement after step
                                 collision.z = true;
                                 playerVelocity.z = 0;
                                 break; // Stop checking Z points after step
                             }
                        }
                    }
                    // Wall collision
                     if(!collision.z) { // Only set if not stepped
                        collision.z = true;
                        playerVelocity.z = 0;
                        break; // Stop checking Z points after collision
                     }
                }
            }
        }

        // Check Y (Ceiling) collision - only if moving upwards and haven't collided vertically yet
        if (playerVelocity.y > 0 && !collision.y) {
             // Use head level check points
             const headCheckPoints = checkOffsets.filter(p => p.y > -PLAYER_HEIGHT / 2);
             for (const offset of headCheckPoints) {
                 const checkX = Math.floor(playerPosition.x + offset.x);
                 // Check slightly above the predicted next head position
                 const checkBlockY = Math.floor(nextPosY.y + offset.y + 0.01); // Integer block coord to check
                 const checkZ = Math.floor(playerPosition.z + offset.z);
                  if (currentWorld.isSolidBlock(checkX, checkBlockY, checkZ)) {
                     collision.y = true;
                     playerVelocity.y = 0; // Stop upward movement
                     // Snap head slightly below ceiling
                     const snappedY = checkBlockY - Math.abs(offset.y) - 0.01;
                     if (isInitialCheck) console.log(`Initial Check: Ceiling collision! Snapping Y to ${snappedY.toFixed(3)}`);
                     playerPosition.y = snappedY;
                     break;
                 }
             }
        }

        if (isInitialCheck) console.log(`Initial Check: Collision result: x=${collision.x}, y=${collision.y}, z=${collision.z}. Final onGround=${onGround}`);
        return collision;
    }

    const controls = new PointerLockControls(camera, domElement);
    const velocity = new THREE.Vector3();
    const direction = new THREE.Vector3();
    let moveForward = false;
    let moveBackward = false;
    let moveLeft = false;
    let moveRight = false;
    let onGround = false; // Let the first collision check determine ground state
    let canJump = true; // Allow jumping initially

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
                if (canJump && onGround) { // Use internal onGround state
                    velocity.y = JUMP_VELOCITY; // Set velocity directly
                    onGround = false; // Player is now airborne
                }
                canJump = false; // Prevent holding jump key for continuous jumping
                break;
            case 'ShiftLeft':
            case 'ShiftRight':
                 // isSneaking = true; // Sneaking not implemented yet
                // isSprinting = false;
                break;
            case 'ControlLeft': // Use Left Ctrl for sprint (Example)
            case 'ControlRight':
                 // if (!isSneaking) isSprinting = true; // Sprinting not implemented yet
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
            case 'Space':
                 canJump = true; // Allow jumping again when key is released
                break;
             case 'ShiftLeft':
             case 'ShiftRight':
                 // isSneaking = false;
                 break;
             case 'ControlLeft':
             case 'ControlRight':
                 // isSprinting = false;
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
        // isSneaking = false;
        // isSprinting = false;
    });

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);

    // Helper function to apply deadzone to analog sticks
    function applyDeadzone(value, deadzone) {
        // Log the raw value before deadzone application
        if (DEBUG_CAMERA && debugFrameCounter % DEBUG_LOG_FREQUENCY === 0) {
            // console.log(`Raw stick value: ${value.toFixed(6)}, Deadzone: ${deadzone}`);
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
            // console.log(`Raw Right Stick: X=${rawRightStickX.toFixed(6)}, Y=${rawRightStickY.toFixed(6)}`);
            // console.log(`After Deadzone: X=${rightStickX.toFixed(6)}, Y=${rightStickY.toFixed(6)}`);
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
        if (gamepadState.buttons.jump && canJump && onGround) {
            velocity.y = JUMP_VELOCITY;
            onGround = false;
            canJump = false; // Prevent repeated jumps if button held
        }

        // Reset canJump when button released (needs logic in main loop polling gamepad)
        // For now, assume jump button press is momentary

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
            // console.log(`Before Rotation: Pitch=${euler.x.toFixed(6)}, Yaw=${euler.y.toFixed(6)}`);
        }

        // Calculate rotation delta - FIXING THE SIGNS HERE
        // Yaw (left/right) needs to be inverted from right stick X
        // Pitch (up/down) needs to be inverted from right stick Y
        const yawDelta = -gamepadState.rightStick.x * GAMEPAD_LOOK_SENSITIVITY * 0.02;
        const pitchDelta = -gamepadState.rightStick.y * GAMEPAD_LOOK_SENSITIVITY * 0.02;

        if (DEBUG_CAMERA && debugFrameCounter % DEBUG_LOG_FREQUENCY === 0) {
            // console.log(`Rotation Delta: Pitch=${pitchDelta.toFixed(6)}, Yaw=${yawDelta.toFixed(6)}`);
        }

        // Apply right stick input to camera rotation with proper direction
        euler.y += yawDelta;     // Left/Right rotation (yaw) - negative means turn left
        euler.x += pitchDelta;   // Up/Down rotation (pitch) - negative means look down

        // Clamp vertical look to prevent camera flipping
        euler.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, euler.x));

        // Log the final rotation values
        if (DEBUG_CAMERA && debugFrameCounter % DEBUG_LOG_FREQUENCY === 0) {
            // console.log(`After Rotation: Pitch=${euler.x.toFixed(6)}, Yaw=${euler.y.toFixed(6)}`);
            // console.log("-----------------");
        }

        // Apply the rotation
        camera.quaternion.setFromEuler(euler);
    }

    function update(delta) {
        debugFrameCounter++;
        currentWorld = getWorld(); // Ensure world reference is current

        if (!controls.isLocked || !currentWorld) {
            return; // Don't update if not locked or world missing
        }

        // Determine if we should do detailed initial logging
        const logInitial = !initialGroundDetected && initialFrames < MAX_INITIAL_FRAMES_LOG;

        // Only apply physics if world says it's safe (initial render complete)
        if (!currentWorld.isSafeToApplyGravity) {
             if (logInitial) console.log(`Initial Frame ${initialFrames}: Gravity not safe yet.`);
            // Keep player at starting height until gravity is safe
            camera.position.y = GROUND_LEVEL + PLAYER_HEIGHT + 0.1;
            velocity.set(0,0,0); // No movement until ready
            return;
        } else {
            // This is the first frame where gravity is enabled
            if (initialFrames === 0) {
                 console.log(`--- Gravity Enabled (Frame ${initialFrames}) ---`);
            }
        }


        // --- Physics Update ---
        delta = Math.min(delta, 0.1); // Clamp delta time

        const playerPos = controls.getObject().position; // Get camera position as player position
        if (logInitial) console.log(`Frame ${initialFrames}: Start Pos=(${playerPos.x.toFixed(3)}, ${playerPos.y.toFixed(3)}, ${playerPos.z.toFixed(3)}), Start Vel=(${velocity.x.toFixed(3)}, ${velocity.y.toFixed(3)}, ${velocity.z.toFixed(3)})`);


        // Apply damping (friction) based on ground state
        const damping = onGround ? 15.0 : 2.0; // Higher damping on ground
        velocity.x -= velocity.x * damping * delta;
        velocity.z -= velocity.z * damping * delta;

        // Calculate movement direction based on camera orientation
        const forward = new THREE.Vector3();
        camera.getWorldDirection(forward);
        forward.y = 0;
        forward.normalize();

        const right = new THREE.Vector3();
        right.crossVectors(forward, camera.up).normalize();

        // --- Input Processing (Gamepad or Keyboard) ---
        const usingGamepad = Math.abs(gamepadState.leftStick.x) > 0 || Math.abs(gamepadState.leftStick.y) > 0;
        let targetVelocityX = 0;
        let targetVelocityZ = 0;
        const currentSpeed = PLAYER_SPEED; // Add sprint/sneak multiplier later if needed

        if (usingGamepad) {
            const stickX = gamepadState.leftStick.x;
            const stickY = gamepadState.leftStick.y; // Y stick controls forward/backward

            // Calculate target velocity based on stick input and camera direction
            targetVelocityX = (forward.x * -stickY + right.x * stickX) * currentSpeed * 50;
            targetVelocityZ = (forward.z * -stickY + right.z * stickX) * currentSpeed * 50;

        } else { // Keyboard movement
            direction.z = Number(moveForward) - Number(moveBackward);
            direction.x = Number(moveRight) - Number(moveLeft);
            direction.normalize(); // Keep consistent speed

            if (direction.lengthSq() > 0) { // Only calculate if moving
                 targetVelocityX = (forward.x * direction.z + right.x * direction.x) * currentSpeed * 50;
                 targetVelocityZ = (forward.z * direction.z + right.z * direction.x) * currentSpeed * 50;
            }
        }

        // Apply acceleration towards target velocity
        const acceleration = onGround ? 20.0 : 10.0; // Accelerate faster on ground
        velocity.x += (targetVelocityX - velocity.x) * acceleration * delta;
        velocity.z += (targetVelocityZ - velocity.z) * acceleration * delta;


        // --- Apply Gravity ---
         if (logInitial) console.log(`Frame ${initialFrames}: Applying gravity. Vel Y before = ${velocity.y.toFixed(3)}`);
        velocity.y -= GRAVITY * delta;
         if (logInitial) console.log(`Frame ${initialFrames}: Vel Y after gravity = ${velocity.y.toFixed(3)}`);


        // --- Collision Detection & Resolution ---
         if (logInitial) console.log(`Frame ${initialFrames}: --- Calling checkCollision ---`);
        const collision = checkCollision(playerPos, velocity, delta, logInitial);
        // Note: checkCollision modifies playerPos.y and velocity.y directly if ground collision occurs

        // --- Update Player Position ---
        const deltaVelocity = velocity.clone().multiplyScalar(delta);
         if (logInitial) console.log(`Frame ${initialFrames}: Delta Vel = (${deltaVelocity.x.toFixed(3)}, ${deltaVelocity.y.toFixed(3)}, ${deltaVelocity.z.toFixed(3)}). Collision = x:${collision.x}, y:${collision.y}, z:${collision.z}`);


        if (!collision.x) {
            playerPos.x += deltaVelocity.x;
        }
        // Y position is handled by checkCollision snapping or by applying velocity if no collision
        if (!collision.y) {
             if (logInitial) console.log(`Frame ${initialFrames}: Applying Y velocity. Pos Y before = ${playerPos.y.toFixed(3)}`);
             playerPos.y += deltaVelocity.y;
             if (logInitial) console.log(`Frame ${initialFrames}: Pos Y after = ${playerPos.y.toFixed(3)}`);
        } else {
             if (logInitial) console.log(`Frame ${initialFrames}: Y Collision detected, Y velocity not applied (or snapping occurred).`);
        }
        if (!collision.z) {
            playerPos.z += deltaVelocity.z;
        }

         if (logInitial) console.log(`Frame ${initialFrames}: Final Pos=(${playerPos.x.toFixed(3)}, ${playerPos.y.toFixed(3)}, ${playerPos.z.toFixed(3)}), Final Vel=(${velocity.x.toFixed(3)}, ${velocity.y.toFixed(3)}, ${velocity.z.toFixed(3)}), onGround=${onGround}`);
         if (logInitial) console.log(`Frame ${initialFrames}: --- End Frame Logic ---`);


        // --- World Update Trigger ---
        const worldUpdateResult = currentWorld.updateChunks(playerPos);
        if (worldUpdateResult && worldUpdateResult.action === 'teleport') {
            console.log("Controls received teleport action.");
            playerPos.copy(worldUpdateResult.position);
            velocity.set(0, 0, 0); // Reset velocity after teleport
            onGround = false; // Re-evaluate ground state after teleport
            initialGroundDetected = false; // Reset initial ground flag after teleport
            initialFrames = 0; // Reset frame counter after teleport
        }

        // Increment initial frame counter if logging is still active
        if (!initialGroundDetected && initialFrames < MAX_INITIAL_FRAMES_LOG) {
             initialFrames++;
         }
    }

    // Initialize crosshair state
    document.getElementById('crosshair').style.display = 'none';

    // Set initial camera position slightly above ground level + player height
    camera.position.y = GROUND_LEVEL + PLAYER_HEIGHT + 0.1; // Start slightly higher
    camera.position.x = 0.5; // Center of the starting block
    camera.position.z = 0.5; // Center of the starting block
    velocity.set(0, 0, 0);
    onGround = false; // Assume starting slightly airborne

    // Return the controls object and the update function
    return {
        controls: controls,
        update: update,
        updateGamepadState: updateGamepadState,
        getObject: () => controls.getObject(),
        getVelocity: () => velocity,
        isOnGround: () => onGround
    };
} 