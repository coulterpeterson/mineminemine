import * as THREE from 'three';
import { createControls } from './src/controls.js';
import { World } from './src/world.js';
import { loadTextures, getTextureAtlas, getUVMap, blocks } from './src/blockRegistry.js';
import { Inventory } from './src/inventory.js';

let scene, camera, renderer, controlsManager, world, inventory;
let lastTime = performance.now();
let textureAtlas, uvMap;
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2(0, 0); // Center of the screen
const interactionDistance = 5; // Max distance player can interact with blocks

// Gamepad support
let gamepads = {};
let gamepadConnected = false;
const GAMEPAD_DEADZONE = 0.2; // Ignore small joystick movements
let gamepadHotbarIndex = 0; // Track current selection while using D-pad
let lastDpadPress = 0; // Timestamp for d-pad press to prevent too rapid selection

// Default controller mappings - these get dynamically updated when a controller is connected
let controllerMappings = {};

// Known controller mappings
const KNOWN_CONTROLLERS = {
    // Standard Xbox/common controller mapping
    "xbox": {
        leftStickX: 0,
        leftStickY: 1,
        rightStickX: 2,
        rightStickY: 3,
        invertLeftX: false,
        invertLeftY: false
    },
    // 8bitdo controller specific mapping
    "8bitdo": {
        leftStickX: 0,
        leftStickY: 1,
        rightStickX: 2,
        rightStickY: 5,  // 8bitdo uses axis 5 for right stick Y
        invertLeftX: true, // Invert left stick X axis
        invertLeftY: false  // Invert left stick Y axis
    }
};

// List of known controller IDs that use the 8bitdo mapping
const KNOWN_8BITDO_IDS = [
    "unknown gamepad (vendor: 2dc8 product: 301b)", // User's specific 8bitdo controller
    "2dc8",
    "8bitdo" // Generic check for 8bitdo in name
];

// Debug flag for logging gamepad issues
const DEBUG_GAMEPAD = true;
let gamepadFrameCounter = 0;
const DEBUG_LOG_FREQUENCY = 60; // Log every 60 frames (approximately 1 second at 60fps)

// Function to provide access to the world instance after it's created
function getWorld() {
    return world;
}

async function init() {
    console.log("Initializing game...");
    // Load Textures First
    try {
        console.log("Loading textures...");
        const textures = await loadTextures(THREE);
        textureAtlas = textures.textureAtlas;
        uvMap = textures.uvMap;
        console.log("Textures loaded successfully.");
    } catch (error) {
        console.error("Failed to load textures:", error);
        // Display error to user?
        document.body.innerHTML = `<h1>Error loading textures</h1><p>Check console for details. Make sure assets/textures/block contains the necessary .png files and the web server is running correctly.</p><pre>${error.stack}</pre>`;
        return; // Stop initialization
    }

    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // Sky blue background
    scene.fog = new THREE.Fog(0x87CEEB, 50, 150); // Start fog further away

    // Camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 1.8, 5); // Start slightly above "ground"

    // Renderer
    const canvas = document.getElementById('gameCanvas');
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true; // Enable shadows

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xcccccc, 0.6); // Slightly brighter ambient
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.9); // Slightly brighter sun
    directionalLight.position.set(50, 200, 100);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 500;
    directionalLight.shadow.camera.left = -100;
    directionalLight.shadow.camera.right = 100;
    directionalLight.shadow.camera.top = 100;
    directionalLight.shadow.camera.bottom = -100;
    scene.add(directionalLight);

    // Controls - Pass the getWorld function instead of the instance
    controlsManager = createControls(camera, renderer.domElement, getWorld);
    scene.add(controlsManager.controls.getObject());

    // Inventory System
    inventory = new Inventory();
    inventory.initUI();

    // World - Assign to the module-global variable AFTER creating controls
    console.log("Creating world...");
    world = new World(scene, textureAtlas, uvMap); // Now getWorld() can return this
    world.generate(); // Generate initial world with textures
    console.log("World created.");

    // Add Interaction Listeners
    renderer.domElement.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('wheel', onMouseWheel);

    // Setup Gamepad controller
    setupGamepadSupport();

    // Prevent context menu on right-click (used for block placement)
    document.addEventListener('contextmenu', (event) => {
        event.preventDefault();
    });

    // Handle window resize
    window.addEventListener('resize', onWindowResize);

    // Start the animation loop
    console.log("Starting animation loop...");
    animate();
}

function setupGamepadSupport() {
    // Listen for gamepad connections
    window.addEventListener("gamepadconnected", function(e) {
        console.log("Gamepad connected:", e.gamepad.id);
        gamepads[e.gamepad.index] = e.gamepad;
        gamepadConnected = true;
        
        // Auto-detect and configure controller axes
        detectControllerAxes(e.gamepad);
        
        // Display indicator that controller is connected
        const controllerIndicator = document.createElement('div');
        controllerIndicator.id = 'controller-indicator';
        controllerIndicator.textContent = '🎮 Controller Connected';
        controllerIndicator.style.position = 'fixed';
        controllerIndicator.style.top = '50px';
        controllerIndicator.style.left = '50%';
        controllerIndicator.style.transform = 'translateX(-50%)';
        controllerIndicator.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        controllerIndicator.style.color = 'white';
        controllerIndicator.style.padding = '5px 10px';
        controllerIndicator.style.borderRadius = '5px';
        controllerIndicator.style.fontFamily = 'sans-serif';
        controllerIndicator.style.zIndex = '100';
        controllerIndicator.style.transition = 'opacity 2s';
        document.body.appendChild(controllerIndicator);
        
        // Fade out the indicator after 3 seconds
        setTimeout(() => {
            controllerIndicator.style.opacity = '0';
            // Remove after fade out
            setTimeout(() => {
                if (controllerIndicator.parentNode) {
                    controllerIndicator.parentNode.removeChild(controllerIndicator);
                }
            }, 2000);
        }, 3000);
    });
    
    // Listen for gamepad disconnections
    window.addEventListener("gamepaddisconnected", function(e) {
        console.log("Gamepad disconnected:", e.gamepad.id);
        delete gamepads[e.gamepad.index];
        delete controllerMappings[e.gamepad.index];
        
        // Check if all gamepads are disconnected
        if (Object.keys(gamepads).length === 0) {
            gamepadConnected = false;
        }
        
        // Display indicator that controller is disconnected
        const disconnectIndicator = document.createElement('div');
        disconnectIndicator.textContent = '🎮 Controller Disconnected';
        disconnectIndicator.style.position = 'fixed';
        disconnectIndicator.style.top = '50px';
        disconnectIndicator.style.left = '50%';
        disconnectIndicator.style.transform = 'translateX(-50%)';
        disconnectIndicator.style.backgroundColor = 'rgba(255, 0, 0, 0.5)';
        disconnectIndicator.style.color = 'white';
        disconnectIndicator.style.padding = '5px 10px';
        disconnectIndicator.style.borderRadius = '5px';
        disconnectIndicator.style.fontFamily = 'sans-serif';
        disconnectIndicator.style.zIndex = '100';
        disconnectIndicator.style.transition = 'opacity 2s';
        document.body.appendChild(disconnectIndicator);
        
        // Fade out the indicator after 3 seconds
        setTimeout(() => {
            disconnectIndicator.style.opacity = '0';
            // Remove after fade out
            setTimeout(() => {
                if (disconnectIndicator.parentNode) {
                    disconnectIndicator.parentNode.removeChild(disconnectIndicator);
                }
            }, 2000);
        }, 3000);
    });
    
    // Browsers that support the Gamepad API in a different way (like Firefox)
    // need to manually scan for gamepads regularly
    if (navigator.getGamepads) {
        console.log("Browser supports getGamepads API");
    } else {
        console.warn("Browser doesn't support standardized gamepad API");
    }
}

// Auto-detect controller axes at connection time
function detectControllerAxes(gamepad) {
    console.log(`Detecting axes for controller: ${gamepad.id} (${gamepad.index})`);
    
    // First, check if this is a known controller type
    let mapping = null;
    const gamepadIdLower = gamepad.id.toLowerCase();
    
    // Check if this is a known 8bitdo controller
    const is8BitdoController = KNOWN_8BITDO_IDS.some(id => gamepadIdLower.includes(id));
    if (is8BitdoController) {
        console.log('Detected 8bitdo controller, using predefined mapping');
        mapping = { ...KNOWN_CONTROLLERS['8bitdo'] };
    }
    // Check for Xbox controller
    else if (gamepadIdLower.includes('xbox') || 
             gamepadIdLower.includes('xinput')) {
        console.log('Detected Xbox-compatible controller, using standard mapping');
        mapping = { ...KNOWN_CONTROLLERS['xbox'] };
    }
    
    // If we found a known mapping, use it
    if (mapping) {
        controllerMappings[gamepad.index] = mapping;
        console.log(`Using known mapping for ${gamepad.id}:`, JSON.stringify(mapping));
        return;
    }
    
    // Otherwise, proceed with auto-detection
    console.log('No predefined mapping found, performing auto-detection');
    
    const THRESHOLD = 0.75; // Consider any axis with abs value > 0.75 to be a trigger at rest
    
    // Log all axes
    if (gamepad.axes.length) {
        console.log(`Controller has ${gamepad.axes.length} axes with values:`, 
            gamepad.axes.map((val, idx) => `${idx}: ${val.toFixed(3)}`).join(', '));
    }
    
    // Identify axes that are at extreme values (likely analog triggers)
    const extremeAxes = [];
    for (let i = 0; i < gamepad.axes.length; i++) {
        if (Math.abs(gamepad.axes[i]) > THRESHOLD) {
            extremeAxes.push(i);
            console.log(`Axis ${i} is at extreme value ${gamepad.axes[i].toFixed(3)}, likely an analog trigger`);
        }
    }
    
    // Create a mapping for this controller
    // Standard configuration starts with:
    // 0: Left Stick X, 1: Left Stick Y, 2: Right Stick X, 3: Right Stick Y
    mapping = {
        leftStickX: 0,
        leftStickY: 1,
        rightStickX: 2,
        rightStickY: 3
    };
    
    // If axis 2 or 3 is extreme, attempt to find alternative axes for right stick
    if (extremeAxes.includes(2) || extremeAxes.includes(3)) {
        console.log("Standard right stick axes (2,3) include extreme values, searching for alternatives...");
        
        // Find the first two non-extreme axes after the left stick
        const availableAxes = [];
        for (let i = 2; i < gamepad.axes.length; i++) {
            if (!extremeAxes.includes(i)) {
                availableAxes.push(i);
                if (availableAxes.length >= 2) break;
            }
        }
        
        // Assign the first available axis to right stick X if needed
        if (extremeAxes.includes(2) && availableAxes.length > 0) {
            mapping.rightStickX = availableAxes.shift();
            console.log(`Assigned right stick X to axis ${mapping.rightStickX}`);
        }
        
        // Assign the next available axis to right stick Y if needed
        if (extremeAxes.includes(3) && availableAxes.length > 0) {
            mapping.rightStickY = availableAxes.shift();
            console.log(`Assigned right stick Y to axis ${mapping.rightStickY}`);
        }
    }
    
    // Store the mapping for this controller
    controllerMappings[gamepad.index] = mapping;
    console.log(`Final controller mapping:`, JSON.stringify(mapping));
}

function pollGamepads() {
    if (!gamepadConnected) return;
    
    // Increment frame counter for debug logging
    gamepadFrameCounter++;
    
    // Get the latest gamepad state
    const gamepadsArray = navigator.getGamepads ? navigator.getGamepads() : [];
    
    // Update our gamepad objects
    for (let i = 0; i < gamepadsArray.length; i++) {
        if (gamepadsArray[i]) {
            gamepads[gamepadsArray[i].index] = gamepadsArray[i];
            
            // Make sure we have a mapping for this controller
            if (!controllerMappings[gamepadsArray[i].index]) {
                detectControllerAxes(gamepadsArray[i]);
            }
        }
    }
    
    // Process each active gamepad
    Object.values(gamepads).forEach(gamepad => {
        if (!gamepad) return;
        
        // Get the mapping for this controller
        const mapping = controllerMappings[gamepad.index];
        if (!mapping) {
            console.warn(`No mapping found for gamepad ${gamepad.index}, skipping input processing`);
            return;
        }
        
        // Log raw gamepad data
        if (DEBUG_GAMEPAD && gamepadFrameCounter % DEBUG_LOG_FREQUENCY === 0) {
            console.log(`==== GAMEPAD RAW DATA (${gamepad.id}) ====`);
            console.log(`Left stick: X=${gamepad.axes[mapping.leftStickX].toFixed(6)}, Y=${gamepad.axes[mapping.leftStickY].toFixed(6)}`);
            console.log(`Right stick: X=${gamepad.axes[mapping.rightStickX].toFixed(6)}, Y=${gamepad.axes[mapping.rightStickY].toFixed(6)}`);
            console.log(`Axis mapping: ${JSON.stringify(mapping)}`);
            console.log(`All axes: ${gamepad.axes.map((val, idx) => `${idx}:${val.toFixed(3)}`).join(', ')}`);
            console.log("==============================");
        }
        
        // Only handle inventory when controls aren't locked (not in "playing" mode)
        if (!controlsManager.controls.isLocked) {
            // Handle DPad/Face buttons for menu navigation
            handleGamepadMenuControls(gamepad);
            return;
        }
        
        // Handle inputs for gameplay mode
        
        // Left Analog Stick - Movement (handled in controls.js)
        const leftAxisX = applyDeadzone(gamepad.axes[mapping.leftStickX]);
        const leftAxisY = applyDeadzone(gamepad.axes[mapping.leftStickY]);
        
        // Apply inversion if needed based on controller mapping
        const adjustedLeftX = mapping.invertLeftX ? -leftAxisX : leftAxisX;
        const adjustedLeftY = mapping.invertLeftY ? -leftAxisY : leftAxisY;
        
        // Right Analog Stick - Camera 
        // Use the dynamically determined mapping for right stick
        const rightAxisX = applyDeadzone(gamepad.axes[mapping.rightStickX]);
        const rightAxisY = applyDeadzone(gamepad.axes[mapping.rightStickY]);
        
        // Debug log the values after applying deadzone
        if (DEBUG_GAMEPAD && gamepadFrameCounter % DEBUG_LOG_FREQUENCY === 0) {
            console.log(`After initial deadzone: Left(${leftAxisX.toFixed(6)}, ${leftAxisY.toFixed(6)})`);
            console.log(`After inversion: Left(${adjustedLeftX.toFixed(6)}, ${adjustedLeftY.toFixed(6)}), Right(${rightAxisX.toFixed(6)}, ${rightAxisY.toFixed(6)})`);
        }
        
        // Update controls with gamepad state
        controlsManager.updateGamepadState({
            leftStick: { x: adjustedLeftX, y: adjustedLeftY },
            rightStick: { x: rightAxisX, y: rightAxisY },
            buttons: {
                // Standard gamepad layout - may vary by controller
                // We use common mappings for XInput-compatible controllers
                jump: gamepad.buttons[0].pressed,   // A button / Cross
                interact: gamepad.buttons[1].pressed, // B button / Circle
                inventory: gamepad.buttons[3].pressed, // Y button / Triangle
                sprint: gamepad.buttons[10].pressed,   // Right stick press
                
                // Break block (left trigger/L2)
                breakBlock: gamepad.buttons[6].pressed || gamepad.buttons[6].value > 0.5,
                
                // Place block (right trigger/R2)
                placeBlock: gamepad.buttons[7].pressed || gamepad.buttons[7].value > 0.5
            }
        });
        
        // Handle gamepad inventory hotbar selection (D-pad)
        if (gamepad.buttons[14] && gamepad.buttons[14].pressed) { // D-pad left
            handleDpadHotbarSelection(-1);
        } else if (gamepad.buttons[15] && gamepad.buttons[15].pressed) { // D-pad right
            handleDpadHotbarSelection(1);
        }
        
        // Toggle inventory with Y button (or Triangle on PlayStation)
        if (buttonJustPressed(gamepad.buttons[3])) { // Y button
            toggleInventoryGamepad();
        }
        
        // Break/place blocks with triggers
        if (gamepad.buttons[6].pressed || gamepad.buttons[6].value > 0.5) { // Left trigger/L2
            tryBreakBlockWithGamepad();
        }
        
        if (gamepad.buttons[7].pressed || gamepad.buttons[7].value > 0.5) { // Right trigger/R2
            tryPlaceBlockWithGamepad();
        }
    });
}

function handleGamepadMenuControls(gamepad) {
    // TODO: Add menu navigation with gamepad when inventory is open
    // For now, just handle closing the inventory
    if (buttonJustPressed(gamepad.buttons[1])) { // B button to close inventory/menu
        if (inventory.isInventoryOpen) {
            inventory.toggleInventory();
            controlsManager.controls.lock();
        }
    }
}

function buttonJustPressed(button) {
    // For a proper implementation, we would need to track the previous state of each button
    // This is a simplified version that just checks the current state
    // In a full implementation, you'd store the previous state and compare
    return button.pressed;
}

function handleDpadHotbarSelection(direction) {
    // Prevent too rapid selection changes
    const now = performance.now();
    if (now - lastDpadPress < 200) return; // 200ms cooldown
    
    lastDpadPress = now;
    
    // Update hotbar selection
    gamepadHotbarIndex = (gamepadHotbarIndex + direction + 9) % 9; // Ensure it wraps 0-8
    inventory.selectHotbarSlot(gamepadHotbarIndex);
}

function toggleInventoryGamepad() {
    if (inventory.toggleInventory()) {
        // If inventory was opened, unlock controls
        controlsManager.controls.unlock();
    } else {
        // If inventory was closed, lock controls again
        controlsManager.controls.lock();
    }
}

function tryBreakBlockWithGamepad() {
    // Only allow block breaking if crosshair is locked (in gameplay mode)
    if (!controlsManager.controls.isLocked || inventory.isInventoryOpen) return;
    
    const intersection = getIntersectedBlock();
    if (!intersection) return;
    
    const blockPos = intersection.object.userData;
    
    if (blockPos.blockId !== blocks.BEDROCK) {
        // Add the block to inventory before removing it
        inventory.addItem(blockPos.blockId);
        world.removeBlock(blockPos.x, blockPos.y, blockPos.z);
    }
}

function tryPlaceBlockWithGamepad() {
    // Only allow block placing if crosshair is locked (in gameplay mode)
    if (!controlsManager.controls.isLocked || inventory.isInventoryOpen) return;
    
    const intersection = getIntersectedBlock();
    if (!intersection) return;
    
    const blockPos = intersection.object.userData;
    const normal = intersection.face.normal;
    
    const placePos = {
        x: blockPos.x + normal.x,
        y: blockPos.y + normal.y,
        z: blockPos.z + normal.z
    };
    
    // Get block from the current selected hotbar slot
    const selectedItem = inventory.getSelectedBlock();
    if (selectedItem && selectedItem.count > 0) {
        // Place the block and remove it from inventory if successful
        world.addBlock(placePos.x, placePos.y, placePos.z, selectedItem.id);
        inventory.removeSelectedItem();
    }
}

// Helper function to apply deadzone to analog sticks
function applyDeadzone(value) {
    return Math.abs(value) < GAMEPAD_DEADZONE ? 0 : value;
}

function getIntersectedBlock() {
    const currentWorld = getWorld();
    if (!currentWorld) return null; // World not ready yet

    raycaster.setFromCamera(pointer, camera);
    const meshes = Object.values(currentWorld.meshes);
    const intersects = raycaster.intersectObjects(meshes);

    if (intersects.length > 0) {
        const intersection = intersects[0];
        if (intersection.distance < interactionDistance) {
            return intersection;
        }
    }
    return null;
}

function onMouseDown(event) {
    const currentWorld = getWorld();
    // If pointer isn't locked yet, only try to lock it, don't interact.
    if (!controlsManager.controls.isLocked) {
        controlsManager.controls.lock();
        return;
    }

    // If inventory is open, don't interact with blocks
    if (inventory.isInventoryOpen) {
        return;
    }

    // If world isn't ready, or pointer somehow isn't locked, bail.
    if (!currentWorld) {
        return;
    }

    // If we get here, pointer is locked AND world is ready.
    const intersection = getIntersectedBlock();
    if (!intersection) return;

    const intersectedMesh = intersection.object;
    const blockPos = intersectedMesh.userData;
    const normal = intersection.face.normal;

    if (event.button === 0) { // Left click - Break block
        console.log(`Left click on: ${blockPos.x}, ${blockPos.y}, ${blockPos.z}`);
        if (blockPos.blockId !== blocks.BEDROCK) {
            // Add the block to inventory before removing it
            inventory.addItem(blockPos.blockId);
            currentWorld.removeBlock(blockPos.x, blockPos.y, blockPos.z);
        } else {
            console.log("Cannot break bedrock!");
        }
    } else if (event.button === 2) { // Right click - Place block
        const placePos = {
            x: blockPos.x + normal.x,
            y: blockPos.y + normal.y,
            z: blockPos.z + normal.z
        };
        console.log(`Right click face normal: ${normal.x}, ${normal.y}, ${normal.z}`);
        console.log(`Placing block at: ${placePos.x}, ${placePos.y}, ${placePos.z}`);

        // Get block from the current selected hotbar slot
        const selectedItem = inventory.getSelectedBlock();
        if (selectedItem && selectedItem.count > 0) {
            // Place the block and remove it from inventory if successful
            currentWorld.addBlock(placePos.x, placePos.y, placePos.z, selectedItem.id);
            inventory.removeSelectedItem();
        } else {
            console.log("No block selected in hotbar!");
        }
    }
}

function onKeyDown(event) {
    // Toggle inventory with 'E' key
    if (event.code === 'KeyE') {
        if (inventory.toggleInventory()) {
            // If inventory was opened, unlock controls
            controlsManager.controls.unlock();
        }
    }
    
    // Hotbar selection with number keys 1-9
    if (event.code.startsWith('Digit')) {
        const digit = parseInt(event.code.replace('Digit', ''));
        if (digit >= 1 && digit <= 9) {
            inventory.selectHotbarSlot(digit - 1); // Convert 1-9 to 0-8
            gamepadHotbarIndex = digit - 1; // Keep gamepad selection in sync
        }
    }
}

function onMouseWheel(event) {
    // Scroll through hotbar slots
    const direction = Math.sign(event.deltaY);
    let newSlot = inventory.selectedSlot + direction;
    
    // Wrap around
    if (newSlot < 0) newSlot = 8;
    if (newSlot > 8) newSlot = 0;
    
    inventory.selectHotbarSlot(newSlot);
    gamepadHotbarIndex = newSlot; // Keep gamepad selection in sync
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);

    const time = performance.now();
    const delta = (time - lastTime) / 1000;

    // Poll gamepads to update their state
    pollGamepads();

    controlsManager.update(delta);

    // TODO: Add world update logic (e.g., chunk loading/unloading)

    renderer.render(scene, camera);

    lastTime = time;
}

// Start the initialization process
init().catch(err => {
    console.error("Initialization failed:", err);
    // Display a user-friendly error if init itself fails
    document.body.innerHTML = `<h1>Initialization Error</h1><p>Something went wrong during setup. Check console for details.</p><pre>${err.stack}</pre>`;
}); 