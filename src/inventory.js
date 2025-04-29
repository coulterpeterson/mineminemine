import { blocks, blockDefs, getBlockDef } from './blockRegistry.js';

// Constants
const HOTBAR_SIZE = 9;
const INVENTORY_ROWS = 3;
const INVENTORY_COLS = 9;
const CRAFTING_SIZE = 2; // 2x2 grid

export class Inventory {
    constructor() {
        // Initialize inventory slots
        this.hotbar = Array(HOTBAR_SIZE).fill(null);
        this.mainInventory = Array(INVENTORY_ROWS * INVENTORY_COLS).fill(null);
        this.craftingGrid = Array(CRAFTING_SIZE * CRAFTING_SIZE).fill(null);
        
        // Current selected hotbar slot (0-8)
        this.selectedSlot = 0;
        
        // UI state
        this.isInventoryOpen = false;
        
        // Add some starter blocks (for testing)
        this.hotbar[0] = { id: blocks.GRASS, count: 64 };
        this.hotbar[1] = { id: blocks.DIRT, count: 64 };
        this.hotbar[2] = { id: blocks.STONE, count: 64 };
        this.hotbar[3] = { id: blocks.COBBLESTONE, count: 64 };
        this.hotbar[4] = { id: blocks.OAK_PLANKS, count: 64 };
    }
    
    // Get the currently selected block
    getSelectedBlock() {
        return this.hotbar[this.selectedSlot];
    }
    
    // Select a specific hotbar slot
    selectHotbarSlot(slot) {
        // Validate slot index
        if (slot >= 0 && slot < HOTBAR_SIZE) {
            this.selectedSlot = slot;
            this.updateHotbarUI();
        }
    }
    
    // Add item to inventory (returns true if added successfully)
    addItem(blockId, count = 1) {
        // First try to add to existing stacks of the same type
        // Check hotbar first
        for (let i = 0; i < this.hotbar.length; i++) {
            if (this.hotbar[i] && this.hotbar[i].id === blockId) {
                this.hotbar[i].count += count;
                this.updateInventoryUI();
                return true;
            }
        }
        
        // Then check main inventory
        for (let i = 0; i < this.mainInventory.length; i++) {
            if (this.mainInventory[i] && this.mainInventory[i].id === blockId) {
                this.mainInventory[i].count += count;
                this.updateInventoryUI();
                return true;
            }
        }
        
        // If we couldn't add to an existing stack, try to find an empty slot
        // Check hotbar first
        for (let i = 0; i < this.hotbar.length; i++) {
            if (!this.hotbar[i]) {
                this.hotbar[i] = { id: blockId, count: count };
                this.updateInventoryUI();
                return true;
            }
        }
        
        // Then check main inventory
        for (let i = 0; i < this.mainInventory.length; i++) {
            if (!this.mainInventory[i]) {
                this.mainInventory[i] = { id: blockId, count: count };
                this.updateInventoryUI();
                return true;
            }
        }
        
        // If we get here, inventory is full
        console.log("Inventory full, couldn't add item");
        return false;
    }
    
    // Remove one from the selected item
    removeSelectedItem() {
        const item = this.hotbar[this.selectedSlot];
        if (item && item.count > 0) {
            item.count--;
            if (item.count <= 0) {
                this.hotbar[this.selectedSlot] = null;
            }
            this.updateInventoryUI();
            return true;
        }
        return false;
    }
    
    // Toggle inventory open/closed
    toggleInventory() {
        this.isInventoryOpen = !this.isInventoryOpen;
        
        // Toggle visibility of inventory UI
        const inventoryUI = document.getElementById('inventory');
        if (inventoryUI) {
            inventoryUI.style.display = this.isInventoryOpen ? 'flex' : 'none';
        }
        
        return this.isInventoryOpen;
    }
    
    // Initialize UI elements
    initUI() {
        this.createHotbarUI();
        this.createInventoryUI();
        this.updateHotbarUI();
    }
    
    // Create hotbar UI
    createHotbarUI() {
        // Create hotbar container if it doesn't exist
        let hotbarUI = document.getElementById('hotbar');
        if (!hotbarUI) {
            hotbarUI = document.createElement('div');
            hotbarUI.id = 'hotbar';
            document.body.appendChild(hotbarUI);
        }
        
        // Clear existing slots
        hotbarUI.innerHTML = '';
        
        // Create hotbar slots
        for (let i = 0; i < HOTBAR_SIZE; i++) {
            const slot = document.createElement('div');
            slot.className = 'hotbar-slot';
            slot.dataset.index = i;
            
            // Add click handler to select this slot
            slot.addEventListener('click', () => {
                this.selectHotbarSlot(i);
            });
            
            hotbarUI.appendChild(slot);
        }
    }
    
    // Create inventory UI
    createInventoryUI() {
        // Create inventory container if it doesn't exist
        let inventoryUI = document.getElementById('inventory');
        if (!inventoryUI) {
            inventoryUI = document.createElement('div');
            inventoryUI.id = 'inventory';
            inventoryUI.style.display = 'none'; // Hidden by default
            document.body.appendChild(inventoryUI);
            
            // Create crafting grid
            const craftingGrid = document.createElement('div');
            craftingGrid.className = 'crafting-grid';
            
            // Create crafting slots
            for (let i = 0; i < CRAFTING_SIZE * CRAFTING_SIZE; i++) {
                const slot = document.createElement('div');
                slot.className = 'crafting-slot';
                slot.dataset.index = i;
                craftingGrid.appendChild(slot);
            }
            
            // Create crafting output slot
            const outputSlot = document.createElement('div');
            outputSlot.className = 'crafting-output';
            craftingGrid.appendChild(outputSlot);
            
            inventoryUI.appendChild(craftingGrid);
            
            // Create main inventory grid
            const mainGrid = document.createElement('div');
            mainGrid.className = 'main-inventory';
            
            // Create inventory slots
            for (let i = 0; i < INVENTORY_ROWS * INVENTORY_COLS; i++) {
                const slot = document.createElement('div');
                slot.className = 'inventory-slot';
                slot.dataset.index = i;
                mainGrid.appendChild(slot);
            }
            
            inventoryUI.appendChild(mainGrid);
        }
    }
    
    // Helper method to get block texture path
    getBlockTexturePath(blockId) {
        const def = getBlockDef(blockId);
        if (!def || !def.texture) return null;
        
        let textureName;
        if (typeof def.texture === 'string') {
            textureName = def.texture;
        } else if (typeof def.texture === 'object') {
            // For blocks with multiple textures, use the side texture for inventory display
            textureName = def.texture.side || def.texture.top || Object.values(def.texture)[0];
        }
        
        if (textureName) {
            return `assets/textures/block/${textureName}.png`;
        }
        
        return null;
    }
    
    // Update hotbar UI to reflect current inventory state
    updateHotbarUI() {
        const hotbarUI = document.getElementById('hotbar');
        if (!hotbarUI) return;
        
        // Update each slot
        const slots = hotbarUI.querySelectorAll('.hotbar-slot');
        slots.forEach((slot, index) => {
            // Clear slot
            slot.innerHTML = '';
            slot.className = 'hotbar-slot';
            
            // Add selected class to current slot
            if (index === this.selectedSlot) {
                slot.classList.add('selected');
            }
            
            // Add item if slot is not empty
            const item = this.hotbar[index];
            if (item) {
                // Create item display
                const itemEl = document.createElement('div');
                itemEl.className = 'item';
                
                // Get block definition to get texture
                const texturePath = this.getBlockTexturePath(item.id);
                
                if (texturePath) {
                    // Set the background image to the block texture
                    itemEl.style.backgroundImage = `url('${texturePath}')`;
                    itemEl.style.backgroundSize = 'cover';
                    itemEl.style.backgroundPosition = 'center';
                    itemEl.style.backgroundColor = 'transparent';
                } else {
                    // Fallback to just showing block ID
                    itemEl.textContent = item.id;
                }
                
                // Add count if more than 1
                if (item.count > 1) {
                    const countEl = document.createElement('span');
                    countEl.className = 'item-count';
                    countEl.textContent = item.count;
                    itemEl.appendChild(countEl);
                }
                
                slot.appendChild(itemEl);
            }
        });
    }
    
    // Update entire inventory UI
    updateInventoryUI() {
        this.updateHotbarUI();
        
        // Only update main inventory if it's open
        if (!this.isInventoryOpen) return;
        
        const inventoryUI = document.getElementById('inventory');
        if (!inventoryUI) return;
        
        // Update main inventory slots
        const mainSlots = inventoryUI.querySelectorAll('.inventory-slot');
        mainSlots.forEach((slot, index) => {
            // Clear slot
            slot.innerHTML = '';
            
            // Add item if slot is not empty
            const item = this.mainInventory[index];
            if (item) {
                // Create item display
                const itemEl = document.createElement('div');
                itemEl.className = 'item';
                
                // Get block definition to get texture
                const texturePath = this.getBlockTexturePath(item.id);
                
                if (texturePath) {
                    // Set the background image to the block texture
                    itemEl.style.backgroundImage = `url('${texturePath}')`;
                    itemEl.style.backgroundSize = 'cover';
                    itemEl.style.backgroundPosition = 'center';
                    itemEl.style.backgroundColor = 'transparent';
                } else {
                    // Fallback to just showing block ID
                    itemEl.textContent = item.id;
                }
                
                // Add count if more than 1
                if (item.count > 1) {
                    const countEl = document.createElement('span');
                    countEl.className = 'item-count';
                    countEl.textContent = item.count;
                    itemEl.appendChild(countEl);
                }
                
                slot.appendChild(itemEl);
            }
        });
        
        // Update crafting grid (simplified for now)
        const craftingSlots = inventoryUI.querySelectorAll('.crafting-slot');
        craftingSlots.forEach((slot, index) => {
            // Clear slot
            slot.innerHTML = '';
            
            // Add item if slot is not empty
            const item = this.craftingGrid[index];
            if (item) {
                // Create item display
                const itemEl = document.createElement('div');
                itemEl.className = 'item';
                
                // Get block definition to get texture
                const texturePath = this.getBlockTexturePath(item.id);
                
                if (texturePath) {
                    // Set the background image to the block texture
                    itemEl.style.backgroundImage = `url('${texturePath}')`;
                    itemEl.style.backgroundSize = 'cover';
                    itemEl.style.backgroundPosition = 'center';
                    itemEl.style.backgroundColor = 'transparent';
                } else {
                    // Fallback to just showing block ID
                    itemEl.textContent = item.id;
                }
                
                // Add count if more than 1
                if (item.count > 1) {
                    const countEl = document.createElement('span');
                    countEl.className = 'item-count';
                    countEl.textContent = item.count;
                    itemEl.appendChild(countEl);
                }
                
                slot.appendChild(itemEl);
            }
        });
    }
} 