# Minecraft Clone Specification (Alpha 1.0.0 Era)

This document outlines the core features for a Minecraft clone based on the state of the game around Alpha version 1.0.0 (specifically Secret Friday Update 8, July 2010).

## 1. World Generation

*   **Infinite Terrain:** The world should generate procedurally and appear infinite in the horizontal plane (X and Z axes). Vertical height is limited.
*   **Biomes (Simplified):** Primarily temperate forests, grassy plains, deserts, and potentially snowy areas. Biome transitions should be relatively smooth.
*   **Terrain Features:** Hills, mountains, valleys, lakes, rivers (water source blocks flowing downwards), lava pools (surface and underground), caves, and overhangs.
*   **Chunk-Based:** The world is divided into chunks (e.g., 16x16 blocks wide, 128 blocks high). Chunks load/unload dynamically around the player.
*   **Ore Generation:** Ores (Coal, Iron, Gold, Diamond, Redstone, Lapis Lazuli - though Lapis wasn't mineable yet) spawn naturally underground at specific height ranges. Gravel and Dirt also spawn underground.
*   **Structures:** Minimal structures. Primarily dungeons - small cobblestone rooms with a monster spawner (Zombie, Skeleton, or Spider) and potentially one or two chests.

## 2. Player

*   **Representation:** First-person perspective. A simple player model is needed for potential third-person views or multiplayer later, but not strictly required for Alpha 1.0.0 single-player gameplay feel. Player collision bounding box should be approximately 0.6 blocks wide/deep and 1.8 blocks tall. Eye height is around 1.6 blocks from the base.
*   **Controls:**
    *   Movement: Forward, backward, strafe left/right (WASD).
    *   Jumping: Spacebar.
    *   Sneaking: Shift (slower movement, prevents falling off edges). Not present in *exactly* Alpha 1.0.0, but a very early and core mechanic. Let's include it.
    *   Mouse Look: Control camera orientation.
    *   Mining/Breaking Blocks: Left-click (hold).
    *   Placing Blocks/Using Items: Right-click.
*   **Health:** Represented by hearts (typically 10). Regenerates slowly over time if hunger is full (Hunger wasn't in Alpha 1.0.0, so health regeneration was simpler - perhaps tied to difficulty or just slow passive regen). Let's stick to slow passive regen. Damage taken from mobs, falling, fire, lava, drowning.
*   **Air Meter:** Bubbles appear when underwater, depleting over time. Drowning occurs when the meter is empty.
*   **Inventory:** A grid-based inventory screen accessed by a key (e.g., 'E'). Includes a hotbar (e.g., 9 slots) visible during gameplay, craftable slots (2x2 grid), and main storage (e.g., 3x9 grid). Armor slots were present but maybe simplified for this scope.

## 3. Blocks & Items

*   **Block Dimensions:** All standard blocks occupy a 1x1x1 meter space in the game world.
*   **Texture Mapping:**
    *   Textures should be sourced from the `/assets/textures/block/` directory.
    *   Each block type will need a mapping defining which texture file corresponds to which face (top, bottom, front, back, left, right).
    *   For simple blocks (e.g., `stone.png`, `dirt.png`, `cobblestone.png`), the same texture can often be applied to all faces.
    *   For blocks with distinct faces (e.g., `grass_block_top.png`, `grass_block_side.png`, `grass_block_bottom.png` which combine to make a grass block, `furnace_front_off.png`, `furnace_front_on.png`, `furnace_side.png`, `furnace_top.png`), specific textures must be assigned to the correct faces.
    *   Animated textures (water, lava) will require cycling through frames or using shader techniques. Textures like `water_still.png`, `water_flow.png`, `lava_still.png`, `lava_flow.png` provide the basis.
    *   Texture Atlasing is recommended: Combine individual block textures into a single larger texture sheet to optimize rendering performance. Map UV coordinates of block faces to the appropriate regions on the atlas.
*   **Basic Blocks:** Grass, Dirt, Stone, Cobblestone, Wooden Planks (Oak), Sand, Gravel, Bedrock (indestructible boundary at world bottom), Water (source & flowing), Lava (source & flowing), Leaves (Oak), Wood (Oak Log).
*   **Ores:** Coal Ore, Iron Ore, Gold Ore, Diamond Ore. (Redstone Ore and Lapis Lazuli Ore existed but may not have had drops/uses yet).
*   **Crafted Blocks:** Furnace, Crafting Table, Chest, Wooden Door, Stone Bricks (may have been later, stick to core alpha), Glass, TNT.
*   **Resources:** Coal, Iron Ingot, Gold Ingot, Diamond, Stick, Flint, Feather, Gunpowder, String.
*   **Tools:** Crafted from Wood, Stone, Iron, Gold, Diamond.
    *   Pickaxe: Mines stone-based blocks faster. Required for mining ores.
    *   Axe: Chops wood-based blocks faster.
    *   Shovel: Digs dirt/sand/gravel faster.
    *   Sword: Deals more damage to mobs. Can block (right-click).
    *   Hoe: Tills dirt into farmland. (Seeds/farming were very basic or non-existent in 1.0.0). Let's exclude farming for now.
*   **Tool/Weapon Durability:** Tools and weapons have limited uses and break when durability runs out.
*   **Food:** Cooked Porkchop (from Pigs). Eating restores health (as hunger wasn't implemented). Raw Porkchop drops from pigs.
*   **Other Items:** Arrow (dropped by Skeletons, used by Bow), Bow (craftable), Bucket (craftable, can hold water or lava).

## 4. Block Interaction

*   **Mining:** Holding left-click on a block initiates breaking. Time depends on the block and the tool used (or bare hands). Correct tool speeds up mining significantly (e.g., pickaxe for stone, axe for wood). Some blocks require specific tool tiers (e.g., Stone Pickaxe for Iron Ore, Iron Pickaxe for Diamond Ore). Broken blocks drop item versions of themselves (or resources like Coal from Coal Ore).
*   **Placing:** Right-clicking with a block selected in the hotbar places it in the world, adjacent to the block face being looked at.
*   **Interaction:** Right-clicking specific blocks triggers actions:
    *   Crafting Table: Opens 3x3 crafting grid UI.
    *   Furnace: Opens smelting UI (input, fuel, output).
    *   Chest: Opens chest inventory UI (similar size to player inventory).
    *   Wooden Door: Opens/closes the door.
    *   TNT: Primes TNT with Flint & Steel (or Redstone interaction, though Redstone was very basic).

## 5. Crafting & Smelting

*   **Inventory Crafting:** 2x2 grid available in the inventory screen for basic recipes (Planks, Sticks, Crafting Table, Torches).
*   **Crafting Table:** 3x3 grid accessed by right-clicking the block. Used for most recipes (Tools, Weapons, Furnace, Chest, Doors, Buckets, etc.). Recipes are shape-based.
*   **Smelting:** Furnace UI requires fuel (Coal, Wood, Planks) in the bottom slot and smeltable item (Iron Ore, Gold Ore, Sand, Raw Porkchop, Wood Log -> Charcoal) in the top slot. Produces output (Iron Ingot, Gold Ingot, Glass, Cooked Porkchop, Charcoal) over time.

## 6. Mobs (Mobile Entities)

*   **Passive Mobs:**
    *   **Pig:** Wanders aimlessly. Drops Raw Porkchops when killed.
    *   **Chicken:** Wanders aimlessly. Drops Feathers when killed. (Eggs might have existed but were perhaps less functional).
    *   **Cow:** (Added shortly after 1.0.0, let's include) Wanders aimlessly. Drops Leather.
    *   **Sheep:** (Also early) Wanders aimlessly. Drops Wool (used for Beds, though beds might be post 1.0.0). Can be sheared. Let's include Wool drops.
*   **Hostile Mobs:** Spawn in low light levels (underground or at night).
    *   **Zombie:** Walks slowly towards the player. Attacks with melee. Burns in sunlight. Drops Feathers (placeholder drop).
    *   **Skeleton:** Shoots arrows at the player. Strafes. Burns in sunlight. Drops Arrows and Bones.
    *   **Spider:** Can climb walls. Jumps at the player. Neutral in sufficient daylight. Drops String.
    *   **Creeper:** Silently approaches the player. Hisses and explodes after a short delay, destroying blocks and dealing damage. Does not burn in sunlight. Drops Gunpowder.
*   **Spawning:** Mobs spawn based on light levels and player proximity (within a certain range, but not too close). Passive mobs spawn more often on grass blocks in well-lit areas during the day. Hostile mobs spawn in areas with low light levels.
*   **AI (Simple):** Basic pathfinding (move towards player if hostile, wander if passive). Avoid walking off high cliffs (mostly).

## 7. Environment

*   **Day/Night Cycle:** Sun and Moon traverse the sky. Affects ambient light levels. Hostile mobs spawn at night or in dark areas.
*   **Lighting:** Light sources (Sun, Torches, Lava, Furnace) illuminate areas. Light propagates outwards, decreasing in intensity. Crucial for preventing hostile mob spawns. Minimum light level prevents spawning.
*   **Water Physics:** Source blocks create flowing water. Water flows downwards and spreads horizontally up to a certain distance. Destroys non-solid blocks like Torches. Player can swim in it. Creates currents.
*   **Lava Physics:** Similar to water but flows slower, spreads less far horizontally, destroys most items that fall in it, sets flammable blocks nearby on fire, and damages entities on contact. Emits light.

## 8. Sound

*   Basic sound effects for: Block breaking/placing (distinct sounds per material type), player footsteps (distinct sounds per surface), mob idle sounds, mob hurt sounds, mob death sounds, player hurt sound, tool usage, bow firing, explosions, door open/close, chest open/close.
*   Minimal ambient sounds or music.

## 9. Implementation Notes (Pseudocode Examples)

### 9.1 World Generation (Chunk-Based)

```pseudocode
// Function called when a chunk needs generating (player approaches)
function generateChunk(chunkX, chunkZ):
  initialize chunkData[16][128][16] // Local chunk coordinates x, y, z

  // 1. Base Terrain Heightmap (using Perlin/Simplex Noise)
  heightMap = generateHeightmap(chunkX, chunkZ, worldSeed, scale, octaves, persistence, lacunarity)

  // 2. Populate Base Blocks
  for x = 0 to 15:
    for z = 0 to 15:
      worldX = chunkX * 16 + x
      worldZ = chunkZ * 16 + z
      terrainHeight = heightMap[x][z] // Typically between Y=60 and Y=70 for base level

      for y = 0 to 127:
        if y == 0:
          chunkData[x][y][z] = BLOCK_BEDROCK
        else if y < terrainHeight - 3:
          chunkData[x][y][z] = BLOCK_STONE
        else if y < terrainHeight:
          chunkData[x][y][z] = BLOCK_DIRT
        else if y == terrainHeight:
          chunkData[x][y][z] = BLOCK_GRASS // Or BLOCK_SAND based on biome/noise
        else:
          chunkData[x][y][z] = BLOCK_AIR // Above ground

  // 3. Cave Generation (using 3D Perlin/Simplex Noise)
  caveNoise = generate3DNoise(chunkX, chunkZ, worldSeed, caveScale, threshold)
  for x = 0 to 15:
    for z = 0 to 15:
      for y = 1 to 126: // Avoid bedrock/surface
        if chunkData[x][y][z] != BLOCK_AIR and caveNoise[x][y][z] > threshold:
          chunkData[x][y][z] = BLOCK_AIR // Carve out cave

  // 4. Ore Generation (using 3D Noise or Feature Placement)
  for each oreType in [Coal, Iron, Gold, Diamond]:
    oreNoise = generate3DNoise(chunkX, chunkZ, worldSeed + oreType.seedOffset, oreType.scale, oreType.threshold)
    for x = 0 to 15:
      for z = 0 to 15:
        for y = oreType.minHeight to oreType.maxHeight:
          // Only replace stone
          if chunkData[x][y][z] == BLOCK_STONE and oreNoise[x][y][z] > oreType.threshold:
            // Simple placement, often veins are done differently (e.g., random walks)
            chunkData[x][y][z] = oreType.blockID

  // 5. Water/Lava Pools (check terrain height, fill depressions below sea level)
  seaLevel = 62
  for x = 0 to 15:
    for z = 0 to 15:
      terrainHeight = heightMap[x][z]
      if terrainHeight < seaLevel:
        for y = terrainHeight + 1 to seaLevel:
          if chunkData[x][y][z] == BLOCK_AIR: // Fill air below sea level in depressions
            chunkData[x][y][z] = BLOCK_WATER_SOURCE
      // Similar logic for lava pools, typically underground or in specific biomes

  // 6. Tree Generation (surface placement based on noise/biome)
  // ... simplified: Check if block is grass, random chance, place log trunk + leaves ...

  // 7. Dungeon Generation (rare feature placement)
  // ... simplified: check random chance per chunk, if yes, find cave/flat area, place cobblestone room, spawner, chests ...

  return chunkData

// Helper: generateHeightmap(...) uses 2D noise
// Helper: generate3DNoise(...) uses 3D noise
```

### 9.2 Mining Logic

```pseudocode
// Constants mapping tool types and material types to speeds/tiers
TOOL_TYPES = { HAND, WOOD_PICK, STONE_PICK, IRON_PICK, DIAMOND_PICK, ... }
BLOCK_HARDNESS = { DIRT: 0.5, STONE: 1.5, IRON_ORE: 3.0, DIAMOND_ORE: 3.0, ... } // Time in seconds with hand
BLOCK_TOOL_REQUIRED = { IRON_ORE: STONE_PICK, DIAMOND_ORE: IRON_PICK, ... } // Minimum tool tier
TOOL_SPEED_MULTIPLIER = { WOOD_PICK: 2, STONE_PICK: 4, IRON_PICK: 6, DIAMOND_PICK: 8, ... } // Against preferred material
CORRECT_TOOL_BONUS = 1.5 // Additional multiplier if tool is correct type (pick for stone, axe for wood)

// Called continuously when left-click is held on a block
function processMining(player, targetBlock, deltaTime):
  heldItem = player.inventory.hotbar[player.selectedSlot]
  toolType = getToolType(heldItem) // Returns HAND if not a tool
  toolTier = getToolTier(toolType) // e.g., WOOD=1, STONE=2, IRON=3, DIAMOND=4

  // 1. Check if block is mineable
  if targetBlock.type == BLOCK_BEDROCK:
    resetMiningProgress(targetBlock)
    return

  // 2. Check tool tier requirement
  requiredTier = BLOCK_TOOL_REQUIRED.get(targetBlock.type, 0) // Default 0 (no requirement)
  if toolTier < requiredTier:
    // Player can swing but it won't drop anything and progress is extremely slow or zero
    // Maybe show different breaking particles? For Alpha, just prevent drop.
    resetMiningProgress(targetBlock) // Or maybe allow breaking animation but no drop
    return // Or calculate extremely slow break time for feedback

  // 3. Calculate Base Break Time
  baseTime = BLOCK_HARDNESS.get(targetBlock.type, 1.0) // Default hardness

  // 4. Calculate Speed Modifiers
  speedMultiplier = 1.0
  isCorrectTool = checkCorrectTool(toolType, targetBlock.type) // e.g., isPickaxe(toolType) and isStoneMaterial(targetBlock.type)

  if toolType != HAND:
    if isCorrectTool:
      speedMultiplier = TOOL_SPEED_MULTIPLIER.get(toolType, 1.0) * CORRECT_TOOL_BONUS
    else:
      // Using wrong tool (e.g., pickaxe on dirt) is often same speed as hand or slightly faster,
      // but slower than the *correct* tool. Simplification: use 1x speed if wrong tool.
      speedMultiplier = 1.0 // Or maybe a small fixed value like 1.5

  // Add haste/efficiency effects here if implemented later
  // Add mining fatigue effects here if implemented later

  // 5. Calculate Final Break Time
  breakTime = baseTime / speedMultiplier

  // 6. Accumulate Progress
  targetBlock.miningProgress += deltaTime
  updateBlockBreakAnimation(targetBlock, targetBlock.miningProgress / breakTime) // Show visual cracks (0.0 to 1.0)

  // 7. Check for Completion
  if targetBlock.miningProgress >= breakTime:
    destroyBlock(targetBlock.position)
    dropBlockItem(targetBlock.type, targetBlock.position, toolType, toolTier) // Drop depends on block & tool
    applyToolDurability(heldItem) // Reduce durability if it was a tool
    resetMiningProgress(targetBlock) // Reset just in case

// Called when player stops mining or looks away
function resetMiningProgress(targetBlock):
  targetBlock.miningProgress = 0.0
  updateBlockBreakAnimation(targetBlock, 0.0) // Remove cracks

// Determines the item drop based on block and tool used
function dropBlockItem(blockType, position, toolType, toolTier):
  if blockType == IRON_ORE and toolTier >= TOOL_TIERS.STONE:
    spawnItemEntity(position, ITEM_IRON_ORE) // Drops the ore block itself
  else if blockType == STONE and toolTier >= TOOL_TIERS.WOOD:
    spawnItemEntity(position, ITEM_COBBLESTONE)
  else if blockType == COAL_ORE and toolTier >= TOOL_TIERS.WOOD:
    spawnItemEntity(position, ITEM_COAL)
  // ... other rules ...
  // If wrong tool tier was used (but allowed breaking), drop nothing.
```

## Excluded (Likely Post Alpha 1.0.0)

*   Hunger system
*   Experience points
*   Enchanting
*   Potions
*   The Nether / End dimensions
*   Villages / Villagers
*   Most farming mechanics (beyond maybe basic wheat)
*   Advanced Redstone mechanics (Pistons, Repeaters etc.)
*   Weather (Rain, Snow, Thunder)
*   Beds acting as spawn points (Might have been added slightly later)
*   Biomes like Jungle, Swamp, Extreme Hills
*   Strongholds, Mineshafts
*   Most complex mobs (Endermen, Ghasts, Slimes maybe, etc.) 