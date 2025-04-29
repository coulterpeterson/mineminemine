// instruction: Create a new file `src/worldWorker.js` with the provided content.
// target_file: src/worldWorker.js
// code:
import { createNoise2D, createNoise3D } from 'https://cdn.skypack.dev/simplex-noise';
// We need the block definitions here. Assuming 'blocks' enum can be passed.
// If `./blockRegistry.js` could be imported directly, that would be cleaner,
// but passing the necessary data is safer across different module setups.

// Constants (will be received via message or defined if static)
let CHUNK_SIZE = 16;
let WORLD_HEIGHT = 128;
let SEA_LEVEL = 62;
let GROUND_LEVEL = 64;

// Noise generators and world seed
let terrainNoise, caveNoise, biomeNoise, worldSeed;
// Block definitions received from main thread
let blocks;

function initNoiseGenerators(seed) {
    // Note: The default simplex-noise implementation doesn't directly use the seed
    // in createNoise2D/3D. If seeding is critical, a seeded PRNG driving the noise
    // function parameters or a different noise library might be needed.
    // For now, we just store the seed conceptually.
    terrainNoise = createNoise2D();
    caveNoise = createNoise3D();
    biomeNoise = createNoise2D();
    worldSeed = seed;
    console.log(`Worker noise initialized (conceptual seed: ${seed})`);
}

// --- Generation Functions (Copied and adapted from world.js) ---

function generateHeightmap(chunkX, chunkZ) {
    const heightMap = Array(CHUNK_SIZE).fill().map(() => Array(CHUNK_SIZE).fill(0));
    const scale = 0.02; // Simplified scale

    for (let x = 0; x < CHUNK_SIZE; x++) {
        for (let z = 0; z < CHUNK_SIZE; z++) {
            const worldX = chunkX * CHUNK_SIZE + x;
            const worldZ = chunkZ * CHUNK_SIZE + z;
            const noise = terrainNoise(worldX * scale, worldZ * scale) * 0.5 + 0.5; // Normalize to 0-1
            const height = Math.floor(GROUND_LEVEL + noise * 16 - 8); // Vary +/- 8 blocks
            heightMap[x][z] = Math.max(1, Math.min(WORLD_HEIGHT - 1, height)); // Clamp height
        }
    }
    return heightMap;
}

function generateBiomeMap(chunkX, chunkZ) {
    const biomeMap = Array(CHUNK_SIZE).fill().map(() => Array(CHUNK_SIZE).fill('plains'));
    const scale = 0.01;
    const chunkBiomeValue = biomeNoise(chunkX * scale, chunkZ * scale);

    let primaryBiome;
    if (chunkBiomeValue < -0.3) primaryBiome = 'desert';
    else if (chunkBiomeValue < 0.3) primaryBiome = 'plains';
    else primaryBiome = 'forest';

    for (let x = 0; x < CHUNK_SIZE; x++) {
        for (let z = 0; z < CHUNK_SIZE; z++) {
            biomeMap[x][z] = primaryBiome;
        }
    }
    return biomeMap;
}

function generateSimplifiedCaves(chunkData, chunkX, chunkZ) {
     // Use a deterministic seed based on chunk coords and world seed for cave chance
    const caveRand = Math.sin(worldSeed + chunkX * 13 + chunkZ * 31) * 10000;
    if ((caveRand - Math.floor(caveRand)) < 0.3) { // ~30% chance to skip caves
        return;
    }

    const scale = 0.03;
    const threshold = 0.2; // Lower threshold = more caves

    // Reduced cave processing - sample fewer points
    for (let x = 0; x < CHUNK_SIZE; x += 2) { // Process every other block
        for (let z = 0; z < CHUNK_SIZE; z += 2) {
            const worldX = chunkX * CHUNK_SIZE + x;
            const worldZ = chunkZ * CHUNK_SIZE + z;

            for (let y = 10; y < 60; y += 2) { // Focus Y range
                if (y >= WORLD_HEIGHT -1 || chunkData[x][y][z] === blocks.AIR || chunkData[x][y][z] === blocks.BEDROCK) {
                    continue;
                }

                const caveValue = caveNoise(worldX * scale, y * scale * 1.5, worldZ * scale); // Stretch Y noise

                if (caveValue > threshold) {
                    // Carve a 2x2x2 area
                    for (let dx = 0; dx < 2; dx++) {
                        for (let dy = 0; dy < 2; dy++) {
                            for (let dz = 0; dz < 2; dz++) {
                                const nx = x + dx, ny = y + dy, nz = z + dz;
                                if (nx < CHUNK_SIZE && ny < WORLD_HEIGHT && nz < CHUNK_SIZE && chunkData[nx][ny][nz] !== blocks.BEDROCK) {
                                    chunkData[nx][ny][nz] = blocks.AIR;
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

function generateSimplifiedOres(chunkData, chunkX, chunkZ) {
    const oreConfigs = [
        { type: blocks.COAL_ORE, minY: 5, maxY: 80, threshold: 0.8, chance: 0.6, scale: 0.1 },
        { type: blocks.IRON_ORE, minY: 5, maxY: 60, threshold: 0.85, chance: 0.4, scale: 0.1 },
        { type: blocks.GOLD_ORE, minY: 5, maxY: 30, threshold: 0.9, chance: 0.2, scale: 0.12 }, // Slightly different scale
        { type: blocks.DIAMOND_ORE, minY: 5, maxY: 15, threshold: 0.95, chance: 0.1, scale: 0.15 } // More sparse
    ];

    // Seeded random function for ore placement chance
    const seededRandom = (x, y, z, salt) => {
        const sinVal = Math.sin(worldSeed + x * 13 + y * 17 + z * 19 + salt * 23);
        return sinVal * sinVal; // Square to get value between 0 and 1
    };

    for (let x = 0; x < CHUNK_SIZE; x++) { // Check every block for potential ores
        for (let z = 0; z < CHUNK_SIZE; z++) {
            const worldX = chunkX * CHUNK_SIZE + x;
            const worldZ = chunkZ * CHUNK_SIZE + z;

            for (const ore of oreConfigs) {
                for (let y = ore.minY; y <= ore.maxY; y++) {
                    if (y <= 0 || y >= WORLD_HEIGHT || chunkData[x][y][z] !== blocks.STONE) {
                        continue; // Only replace stone within valid height
                    }

                    // Use 3D noise for vein clustering
                    const noiseValue = caveNoise(worldX * ore.scale, y * ore.scale, worldZ * ore.scale); // Reuse cave noise

                    if (noiseValue > ore.threshold) {
                         // Use seeded random for final placement chance within the vein noise area
                        if (seededRandom(worldX, y, worldZ, ore.type) < ore.chance) {
                            chunkData[x][y][z] = ore.type;
                        }
                    }
                }
            }
        }
    }
}


function generateChunk(chunkX, chunkZ) {
    console.log(`Worker generating (${chunkX}, ${chunkZ})...`); // Worker specific log
    const chunkData = Array(CHUNK_SIZE).fill(0).map(() =>
        Array(WORLD_HEIGHT).fill(0).map(() =>
            Array(CHUNK_SIZE).fill(blocks.AIR)
        )
    );

    const heightMap = generateHeightmap(chunkX, chunkZ);
    const biomeMap = generateBiomeMap(chunkX, chunkZ);

    for (let x = 0; x < CHUNK_SIZE; x++) {
        for (let z = 0; z < CHUNK_SIZE; z++) {
            const terrainHeight = heightMap[x][z];
            const biome = biomeMap[x][z];

            chunkData[x][0][z] = blocks.BEDROCK;

            for (let y = 1; y < terrainHeight - 4; y++) {
                if(y < WORLD_HEIGHT) chunkData[x][y][z] = blocks.STONE;
            }

            const surfaceDepth = biome === 'desert' ? 4 : 3; // Deeper sand for deserts
            for (let y = Math.max(1, terrainHeight - surfaceDepth); y < terrainHeight; y++) {
                 if(y < WORLD_HEIGHT) chunkData[x][y][z] = biome === 'desert' ? blocks.SAND : blocks.DIRT;
            }

            if (terrainHeight >= 1 && terrainHeight < WORLD_HEIGHT) {
                if (biome === 'desert') {
                    chunkData[x][terrainHeight][z] = blocks.SAND;
                } else if (terrainHeight <= SEA_LEVEL + 1) { // Place sand near water level
                    chunkData[x][terrainHeight][z] = blocks.SAND;
                } else {
                    chunkData[x][terrainHeight][z] = blocks.GRASS;
                }
            }

            // Water fill
            if (terrainHeight < SEA_LEVEL) {
                for (let y = terrainHeight + 1; y <= SEA_LEVEL; y++) {
                     if (y >= 0 && y < WORLD_HEIGHT && chunkData[x][y][z] === blocks.AIR) {
                        chunkData[x][y][z] = blocks.WATER_STILL;
                    }
                }
            }
        }
    }

    generateSimplifiedCaves(chunkData, chunkX, chunkZ);
    generateSimplifiedOres(chunkData, chunkX, chunkZ);

    console.log(`Worker finished generating (${chunkX}, ${chunkZ})`);
    return chunkData;
}

// --- Worker Message Handler ---
self.onmessage = function(event) {
    const { type, payload } = event.data;

    if (type === 'init') {
        // Store constants and block definitions, initialize noise
        CHUNK_SIZE = payload.CHUNK_SIZE;
        WORLD_HEIGHT = payload.WORLD_HEIGHT;
        SEA_LEVEL = payload.SEA_LEVEL;
        GROUND_LEVEL = payload.GROUND_LEVEL;
        blocks = payload.blocks; // Get block enum values
        initNoiseGenerators(payload.worldSeed);
        console.log('Worker Initialized.');

    } else if (type === 'generate') {
        const { chunkX, chunkZ } = payload;

        // Make sure noise is initialized (in case init message was missed or worker restarted)
        if (!terrainNoise) {
            console.warn('Worker not initialized, attempting re-init...');
            // Assuming payload might contain necessary init data if this happens
             if(payload.initData) {
                CHUNK_SIZE = payload.initData.CHUNK_SIZE;
                WORLD_HEIGHT = payload.initData.WORLD_HEIGHT;
                SEA_LEVEL = payload.initData.SEA_LEVEL;
                GROUND_LEVEL = payload.initData.GROUND_LEVEL;
                blocks = payload.initData.blocks;
                initNoiseGenerators(payload.initData.worldSeed);
             } else {
                 console.error("Worker cannot generate chunk: Missing initialization data.");
                 return; // Cannot proceed
             }
        }

        try {
            const chunkData = generateChunk(chunkX, chunkZ);

            // Send the result back to the main thread
            self.postMessage({
                type: 'result',
                payload: {
                    chunkKey: `${chunkX},${chunkZ}`,
                    chunkData: chunkData
                }
            });
        } catch (error) {
             console.error(`Worker error generating chunk (${chunkX}, ${chunkZ}):`, error);
             // Optionally notify main thread of failure
             self.postMessage({
                 type: 'error',
                 payload: {
                     chunkKey: `${chunkX},${chunkZ}`,
                     message: error.message
                 }
             });
        }
    }
};