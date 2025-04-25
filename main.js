import * as THREE from 'three';
import { createControls } from './src/controls.js';
import { World } from './src/world.js';
import { loadTextures, getTextureAtlas, getUVMap, blocks } from './src/blockRegistry.js';

let scene, camera, renderer, controlsManager, world;
let lastTime = performance.now();
let textureAtlas, uvMap;
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2(0, 0); // Center of the screen
const interactionDistance = 5; // Max distance player can interact with blocks

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

    // World - Assign to the module-global variable AFTER creating controls
    console.log("Creating world...");
    world = new World(scene, textureAtlas, uvMap); // Now getWorld() can return this
    world.generate(); // Generate initial world with textures
    console.log("World created.");

    // Add Interaction Listener
    renderer.domElement.addEventListener('mousedown', onMouseDown);

    // Handle window resize
    window.addEventListener('resize', onWindowResize);

    // Start the animation loop
    console.log("Starting animation loop...");
    animate();
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

        const blockToPlace = blocks.COBBLESTONE;
        currentWorld.addBlock(placePos.x, placePos.y, placePos.z, blockToPlace);
    }
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