// Block definitions based on Alpha 1.0.0 spec and standard texture names

export const blocks = {
    AIR: 0,
    STONE: 1,
    GRASS: 2,
    DIRT: 3,
    COBBLESTONE: 4,
    OAK_PLANKS: 5,
    OAK_SAPLING: 6, // Need texture, may not be placeable initially
    BEDROCK: 7,
    WATER_FLOWING: 8, // Animated
    WATER_STILL: 9,
    LAVA_FLOWING: 10, // Animated
    LAVA_STILL: 11,
    SAND: 12,
    GRAVEL: 13,
    GOLD_ORE: 14,
    IRON_ORE: 15,
    COAL_ORE: 16,
    OAK_LOG: 17,
    OAK_LEAVES: 18,
    // SPONGE: 19, // Existed, but maybe skip for now
    GLASS: 20,
    // LAPIS_ORE: 21, // Existed, but no use
    // LAPIS_BLOCK: 22,
    // DISPENSER: 23,
    SANDSTONE: 24,
    // NOTE_BLOCK: 25,
    // BED: 26, // Maybe exclude if spawn point excluded
    // POWERED_RAIL: 27,
    // DETECTOR_RAIL: 28,
    // STICKY_PISTON: 29,
    // COBWEB: 30,
    // TALL_GRASS: 31,
    // DEAD_BUSH: 32,
    // PISTON: 33,
    // PISTON_HEAD: 34,
    // WOOL: 35, // Different colors? Start with white
    // DANDELION: 37,
    // POPPY: 38, // Flower types
    // BROWN_MUSHROOM: 39,
    // RED_MUSHROOM: 40,
    GOLD_BLOCK: 41,
    IRON_BLOCK: 42,
    // DOUBLE_STONE_SLAB: 43,
    // STONE_SLAB: 44, // Single slab - MISSING TEXTURE
    // BRICK_BLOCK: 45, // MISSING TEXTURE
    TNT: 46,
    BOOKSHELF: 47,
    MOSSY_COBBLESTONE: 48,
    OBSIDIAN: 49,
    TORCH: 50, // Special handling needed (not full block)
    // FIRE: 51, // Special handling needed
    // MOB_SPAWNER: 52,
    OAK_STAIRS: 53,
    CHEST: 54, // Special handling needed (entity?)
    // REDSTONE_WIRE: 55,
    DIAMOND_ORE: 56,
    DIAMOND_BLOCK: 57,
    CRAFTING_TABLE: 58,
    // WHEAT: 59, // Crop block
    // FARMLAND: 60, // Tilled dirt - MISSING TEXTURE
    // FURNACE: 61, // Inactive state - MISSING TEXTURE
    // FURNACE_LIT: 62, // Active state - Uses furnace textures
    // SIGN_POST: 63, // Standing sign
    // WOODEN_DOOR: 64, // Block part - MISSING TEXTURE
    // LADDER: 65,
    // RAIL: 66,
    COBBLESTONE_STAIRS: 67,
    // WALL_SIGN: 68,
    // LEVER: 69,
    // STONE_PRESSURE_PLATE: 70,
    // IRON_DOOR: 71,
    // WOODEN_PRESSURE_PLATE: 72,
    // REDSTONE_ORE: 73,
    // REDSTONE_ORE_GLOWING: 74,
    // REDSTONE_TORCH_OFF: 75,
    // REDSTONE_TORCH_ON: 76,
    // STONE_BUTTON: 77,
    // SNOW: 78,
    // ICE: 79,
    // SNOW_BLOCK: 80,
    // CACTUS: 81,
    // CLAY: 82,
    // SUGAR_CANE: 83,
    // JUKEBOX: 84,
    // FENCE: 85,
    // PUMPKIN: 86,
    // NETHERRACK: 87,
    // SOUL_SAND: 88,
    // GLOWSTONE: 89,
    // PORTAL: 90, // Nether portal block
    // JACK_O_LANTERN: 91,
    // CAKE: 92,
    // REPEATER_OFF: 93,
    // REPEATER_ON: 94,
    // STAINED_GLASS: 95, // Later addition
    // TRAPDOOR: 96,
    // MONSTER_EGG: 97, // Stone variants
    // STONE_BRICKS: 98,
    // ... others added later ...
};

// Define textures needed. Assumes files exist in assets/textures/block/
// Mapping: key is block ID, value describes texture files or UV coords.
// For simple blocks, string = all sides use this texture.
// For complex blocks, object maps faces (top, bottom, side, front, back, etc.)
// UV coordinates will be added by the loadTextures function later.
export const blockDefs = {
    [blocks.STONE]: { name: 'Stone', texture: 'stone', hardness: 1.5, tool: 'pickaxe', requiredTier: 'wood', solid: true },
    [blocks.GRASS]: { name: 'Grass Block', texture: { top: 'grass_block_top', bottom: 'dirt', side: 'grass_block_side' }, hardness: 0.6, solid: true },
    [blocks.DIRT]: { name: 'Dirt', texture: 'dirt', hardness: 0.5, tool: 'shovel', solid: true },
    [blocks.COBBLESTONE]: { name: 'Cobblestone', texture: 'cobblestone', hardness: 2.0, tool: 'pickaxe', requiredTier: 'wood', solid: true },
    [blocks.OAK_PLANKS]: { name: 'Oak Planks', texture: 'oak_planks', hardness: 2.0, tool: 'axe', solid: true },
    [blocks.OAK_SAPLING]: { name: 'Oak Sapling', texture: 'oak_sapling', hardness: 0, transparent: true, solid: false }, // Non-solid
    [blocks.BEDROCK]: { name: 'Bedrock', texture: 'bedrock', hardness: -1, solid: true }, // Unbreakable but solid
    [blocks.WATER_STILL]: { name: 'Water', texture: 'water_still', hardness: 100, transparent: true, fluid: true, solid: false }, // Animated, essentially unbreakable by hand, not solid
    [blocks.LAVA_STILL]: { name: 'Lava', texture: 'lava_still', hardness: 100, transparent: true, light: 15, fluid: true, solid: false }, // Animated, emits light, not solid
    [blocks.SAND]: { name: 'Sand', texture: 'sand', hardness: 0.5, tool: 'shovel', gravity: true, solid: true }, // Falls
    [blocks.GRAVEL]: { name: 'Gravel', texture: 'gravel', hardness: 0.6, tool: 'shovel', gravity: true, solid: true }, // Falls
    [blocks.GOLD_ORE]: { name: 'Gold Ore', texture: 'gold_ore', hardness: 3.0, tool: 'pickaxe', requiredTier: 'iron', solid: true },
    [blocks.IRON_ORE]: { name: 'Iron Ore', texture: 'iron_ore', hardness: 3.0, tool: 'pickaxe', requiredTier: 'stone', solid: true },
    [blocks.COAL_ORE]: { name: 'Coal Ore', texture: 'coal_ore', hardness: 3.0, tool: 'pickaxe', requiredTier: 'wood', solid: true },
    [blocks.OAK_LOG]: { name: 'Oak Log', texture: { top: 'oak_log_top', bottom: 'oak_log_top', side: 'oak_log' }, hardness: 2.0, tool: 'axe', solid: true },
    [blocks.OAK_LEAVES]: { name: 'Oak Leaves', texture: 'oak_leaves', hardness: 0.2, tool: 'shears', transparent: true, solid: false }, // Needs transparency handling, not solid
    [blocks.GLASS]: { name: 'Glass', texture: 'glass', hardness: 0.3, transparent: true, solid: false }, // Not solid for collision? Or depends on game? Let's say false.
    [blocks.SANDSTONE]: { name: 'Sandstone', texture: { top: 'sandstone_top', bottom: 'sandstone_bottom', side: 'sandstone' }, hardness: 0.8, tool: 'pickaxe', requiredTier: 'wood', solid: true },
    [blocks.GOLD_BLOCK]: { name: 'Block of Gold', texture: 'gold_block', hardness: 3.0, tool: 'pickaxe', requiredTier: 'iron', solid: true },
    [blocks.IRON_BLOCK]: { name: 'Block of Iron', texture: 'iron_block', hardness: 5.0, tool: 'pickaxe', requiredTier: 'stone', solid: true },
    [blocks.TNT]: { name: 'TNT', texture: { top: 'tnt_top', bottom: 'tnt_bottom', side: 'tnt_side' }, hardness: 0, solid: true },
    [blocks.BOOKSHELF]: { name: 'Bookshelf', texture: { top: 'oak_planks', bottom: 'oak_planks', side: 'bookshelf' }, hardness: 1.5, tool: 'axe', solid: true },
    [blocks.MOSSY_COBBLESTONE]: { name: 'Mossy Cobblestone', texture: 'mossy_cobblestone', hardness: 2.0, tool: 'pickaxe', requiredTier: 'wood', solid: true },
    [blocks.OBSIDIAN]: { name: 'Obsidian', texture: 'obsidian', hardness: 50.0, tool: 'pickaxe', requiredTier: 'diamond', solid: true },
    [blocks.TORCH]: { name: 'Torch', texture: 'torch', hardness: 0, transparent: true, light: 14, model: 'torch', solid: false }, // Special model needed, not solid
    [blocks.OAK_STAIRS]: { name: 'Oak Stairs', texture: 'oak_planks', hardness: 2.0, tool: 'axe', transparent: true, model: 'stairs', solid: false }, // Special geometry, handle collision separately? Treat as non-solid for simple check.
    [blocks.CHEST]: { name: 'Chest', texture: 'oak_planks', hardness: 2.5, tool: 'axe', transparent: true, model: 'chest', solid: false }, // Placeholder texture, needs entity/model, treat as non-solid
    [blocks.DIAMOND_ORE]: { name: 'Diamond Ore', texture: 'diamond_ore', hardness: 3.0, tool: 'pickaxe', requiredTier: 'iron', solid: true },
    [blocks.DIAMOND_BLOCK]: { name: 'Block of Diamond', texture: 'diamond_block', hardness: 5.0, tool: 'pickaxe', requiredTier: 'iron', solid: true },
    [blocks.CRAFTING_TABLE]: { name: 'Crafting Table', texture: { top: 'crafting_table_top', bottom: 'oak_planks', side: 'crafting_table_side', front: 'crafting_table_front' }, hardness: 2.5, tool: 'axe', solid: true },
    [blocks.COBBLESTONE_STAIRS]: { name: 'Cobblestone Stairs', texture: 'cobblestone', hardness: 2.0, tool: 'pickaxe', requiredTier: 'wood', transparent: true, model: 'stairs', solid: false }, // Special geometry, treat as non-solid
    // ... Add definitions for water/lava flowing ...
};

// --- Helper Functions ---

// Stores loaded textures and UV maps
let textureAtlas = null;
let uvMap = {};

// Creates the texture atlas and UV map
// Needs THREE to be available or passed in
export async function loadTextures(THREE) {
    console.log("Loading textures...");
    const textureLoader = new THREE.TextureLoader();
    const texturePaths = {}; // Store paths for loading

    // 1. Collect unique texture names from blockDefs
    const uniqueTextures = new Set();
    for (const id in blockDefs) {
        const def = blockDefs[id];
        if (!def || !def.texture) continue; // Skip blocks without texture defs

        if (typeof def.texture === 'string') {
            uniqueTextures.add(def.texture);
        } else if (typeof def.texture === 'object') {
            Object.values(def.texture).forEach(texName => {
                if (texName) uniqueTextures.add(texName);
            });
        }
    }

    // Manually add textures not directly referenced by simple block models initially
    // (e.g., flowing water/lava if using animated textures)
    // uniqueTextures.add('water_flow');
    // uniqueTextures.add('lava_flow');

    // TODO: Check for missing textures in assets
    // You might need to manually check assets/textures/block/ or list files first
    // Example: Ensure 'grass_block_top.png', 'dirt.png', etc., exist.

    // Assume 16x16 textures for Alpha
    const textureSize = 16;
    const texturesPerRow = Math.ceil(Math.sqrt(uniqueTextures.size));
    const atlasSize = texturesPerRow * textureSize;

    const canvas = document.createElement('canvas');
    canvas.width = atlasSize;
    canvas.height = atlasSize;
    const context = canvas.getContext('2d');
    // Ensure transparent background for atlas if textures have transparency
    context.clearRect(0, 0, atlasSize, atlasSize);
    // Optional: Fill with debug color
    // context.fillStyle = 'rgba(128, 128, 128, 0.5)';
    // context.fillRect(0, 0, atlasSize, atlasSize);


    console.log(`Creating ${atlasSize}x${atlasSize} texture atlas for ${uniqueTextures.size} unique textures.`);

    let currentX = 0;
    let currentY = 0;
    const texturePromises = [];
    const loadedTextures = {}; // Keep track of loaded THREE textures

    // 2. Load each unique texture and draw it onto the atlas canvas
    for (const texName of uniqueTextures) {
        // Handle potential missing file extensions if necessary
        const fileName = texName.endsWith('.png') ? texName : `${texName}.png`;
        const path = `assets/textures/block/${fileName}`;
        texturePaths[texName] = path;

        texturePromises.push(
            textureLoader.loadAsync(path).then(texture => {
                const image = texture.image;
                if (!image) {
                    console.error(`Failed to load image for texture: ${texName} at path ${path}`);
                    // Draw a placeholder magenta square for missing textures
                    context.fillStyle = 'magenta';
                    context.fillRect(currentX, currentY, textureSize, textureSize);
                } else {
                    // Draw the image to the canvas
                    context.drawImage(image, currentX, currentY, textureSize, textureSize);
                    
                    // Apply green tint to grass_block_top texture
                    if (texName === 'grass_block_top') {
                        // Save context state before applying tint
                        context.save();
                        // Set blend mode to multiply for color tinting
                        context.globalCompositeOperation = 'multiply';
                        // Use a green color for tinting
                        context.fillStyle = 'rgb(94, 157, 52)'; // Adjust to match the side grass color
                        context.fillRect(currentX, currentY, textureSize, textureSize);
                        // Restore context state
                        context.restore();
                        console.log('Applied green tint to grass_block_top texture');
                    }
                    
                    // Apply blue tint to water textures
                    if (texName === 'water_still' || texName === 'water_flow') {
                        // Save context state before applying tint
                        context.save();
                        // Set blend mode to multiply for color tinting
                        context.globalCompositeOperation = 'multiply';
                        // Use a blue color for tinting
                        context.fillStyle = 'rgb(64, 128, 255)'; // Blue tint for water
                        context.fillRect(currentX, currentY, textureSize, textureSize);
                        // Restore context state
                        context.restore();
                        console.log(`Applied blue tint to ${texName} texture`);
                    }
                }
                loadedTextures[texName] = texture; // Store the loaded texture itself if needed

                // Calculate UV coordinates (relative to atlas size)
                const uvs = {
                    u0: currentX / atlasSize,
                    v0: 1 - (currentY + textureSize) / atlasSize, // V is flipped in THREE.js
                    u1: (currentX + textureSize) / atlasSize,
                    v1: 1 - currentY / atlasSize,
                };
                uvMap[texName] = uvs; // Store UVs globally

                // Move to next position
                currentX += textureSize;
                if (currentX >= atlasSize) {
                    currentX = 0;
                    currentY += textureSize;
                }
            }).catch(err => {
                 console.error(`Error loading texture ${texName} from ${path}:`, err);
                 // Draw a placeholder red square on error
                 context.fillStyle = 'red';
                 context.fillRect(currentX, currentY, textureSize, textureSize);
                 // Still calculate UVs for the placeholder
                 const uvs = { u0: currentX / atlasSize, v0: 1 - (currentY + textureSize) / atlasSize, u1: (currentX + textureSize) / atlasSize, v1: 1 - currentY / atlasSize };
                 uvMap[texName] = uvs;
                 // Move to next position logic duplicated here for error case
                 currentX += textureSize;
                 if (currentX >= atlasSize) { currentX = 0; currentY += textureSize; }
            })
        );
    }

    await Promise.all(texturePromises);
    console.log("All texture images processed for atlas canvas.");

    // 3. Create a single THREE.Texture from the canvas
    textureAtlas = new THREE.CanvasTexture(canvas);
    textureAtlas.magFilter = THREE.NearestFilter; // Pixelated look
    textureAtlas.minFilter = THREE.NearestFilter;
    textureAtlas.needsUpdate = true; // Important!

    console.log("Texture atlas created.");
    // Optional: Append canvas to body for debugging
    // document.body.appendChild(canvas);
    // canvas.style.position = 'fixed'; // Use fixed to scroll with page if needed
    // canvas.style.left = '10px';
    // canvas.style.top = '10px';
    // canvas.style.zIndex = '100';
    // canvas.style.width = '256px'; // Example size
    // canvas.style.height = '256px';
    // canvas.style.border = '1px solid red';
    // canvas.style.imageRendering = 'pixelated'; // CSS for pixelated rendering

    // Return the main atlas texture and the calculated UV map
    return { textureAtlas, uvMap };
}

// Function to get definition by ID
export function getBlockDef(id) {
    return blockDefs[id];
}

// Function to get ID by name (useful for commands/debugging)
export function getBlockId(name) {
    for (const id in blockDefs) {
        if (blockDefs[id].name.toLowerCase() === name.toLowerCase()) {
            return parseInt(id);
        }
    }
    return blocks.AIR; // Default to air if not found
}

// Helper function to get the UV coordinates for a specific face of a block
// NOTE: This will be used *after* loadTextures populates uvMap
export function getBlockFaceUVs(blockId, face) {
    const def = getBlockDef(blockId);
    if (!def) return null;

    let texName;
    if (typeof def.texture === 'string') {
        texName = def.texture;
    } else if (typeof def.texture === 'object' && def.texture[face]) {
        texName = def.texture[face];
    } else if (typeof def.texture === 'object' && def.texture.side) {
         // Fallback logic for different faces if specific isn't defined
        switch (face) {
            case 'top': texName = def.texture.top || def.texture.side; break;
            case 'bottom': texName = def.texture.bottom || def.texture.side; break;
            case 'front': texName = def.texture.front || def.texture.side; break;
            case 'back': texName = def.texture.back || def.texture.side; break;
            case 'left': texName = def.texture.left || def.texture.side; break;
            case 'right': texName = def.texture.right || def.texture.side; break;
            default: texName = def.texture.side; // Default to side
        }
    } else {
        console.warn(`Texture name not resolved for Block ID: ${blockId}, Face: ${face}`);
        return null; // No texture defined or resolvable
    }

    const uvs = uvMap[texName];
    if (!uvs) {
        // This warning is expected before textures are loaded
        // console.warn(`UV coordinates not found for texture: ${texName} (Block ID: ${blockId}, Face: ${face})`);
        return null; // Return null until textures are loaded
    }
    return uvs;
}

// Get the main texture atlas (call after loadTextures)
export function getTextureAtlas() {
    if (!textureAtlas) {
        // This error is expected before textures are loaded
        // console.error("Texture atlas requested before loading completed.");
        return null; // Return null until loaded
    }
    return textureAtlas;
}

// Function to get the UV map (call after loadTextures)
export function getUVMap() {
    return uvMap;
} 