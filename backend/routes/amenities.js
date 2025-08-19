const express = require('express');
const Inventory = require('../models/Inventory');
const Trainee = require('../models/Trainee');
const { validate, inventorySchema } = require('../middleware/validation');

const router = express.Router();

// Get all inventory items
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      lowStock,
      search
    } = req.query;

    // Build filter
    const filter = {};
    if (category) filter.category = category;
    if (lowStock === 'true') {
      filter.$expr = { $lte: ['$availableQuantity', '$minimumThreshold'] };
    }
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { category: 1, name: 1 }
    };

    const items = await Inventory.find(filter)
      .sort(options.sort)
      .limit(options.limit * 1)
      .skip((options.page - 1) * options.limit);

    const total = await Inventory.countDocuments(filter);

    res.json({
      success: true,
      data: {
        items,
        pagination: {
          currentPage: options.page,
          totalPages: Math.ceil(total / options.limit),
          totalItems: total,
          itemsPerPage: options.limit
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch inventory items',
      error: error.message
    });
  }
});

// Get inventory item by ID
router.get('/:id', async (req, res) => {
  try {
    const item = await Inventory.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }

    res.json({
      success: true,
      data: { item }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch inventory item',
      error: error.message
    });
  }
});

// Create new inventory item
router.post('/', validate(inventorySchema), async (req, res) => {
  try {
    const item = new Inventory(req.body);
    await item.save();

    res.status(201).json({
      success: true,
      message: 'Inventory item created successfully',
      data: { item }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create inventory item',
      error: error.message
    });
  }
});

// Update inventory item
router.put('/:id', async (req, res) => {
  try {
    const item = await Inventory.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }

    Object.assign(item, req.body);
    await item.save();

    res.json({
      success: true,
      message: 'Inventory item updated successfully',
      data: { item }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update inventory item',
      error: error.message
    });
  }
});

// Delete inventory item
router.delete('/:id', async (req, res) => {
  try {
    const item = await Inventory.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }

    if (item.inUseQuantity > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete item with items currently in use'
      });
    }

    await item.deleteOne();

    res.json({
      success: true,
      message: 'Inventory item deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete inventory item',
      error: error.message
    });
  }
});

// Allocate amenity to trainee
router.post('/allocate', async (req, res) => {
  try {
    const { itemId, traineeId, quantity, roomNumber } = req.body;

    if (!itemId || !traineeId || !quantity) {
      return res.status(400).json({
        success: false,
        message: 'Item ID, trainee ID, and quantity are required'
      });
    }

    const item = await Inventory.findById(itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }

    const trainee = await Trainee.findOne({
      $or: [
        { _id: traineeId },
        { traineeId: traineeId }
      ]
    });

    if (!trainee) {
      return res.status(404).json({
        success: false,
        message: 'Trainee not found'
      });
    }

    // Allocate item
    await item.allocate(quantity, trainee.traineeId, roomNumber || trainee.roomNumber, req.user._id);

    // Update trainee's amenities
    const existingAmenity = trainee.amenities.find(a => a.name === item.name);
    if (existingAmenity) {
      existingAmenity.quantity += quantity;
    } else {
      trainee.amenities.push({
        name: item.name,
        quantity: quantity
      });
    }
    await trainee.save();

    res.json({
      success: true,
      message: 'Amenity allocated successfully',
      data: { item, trainee }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to allocate amenity',
      error: error.message
    });
  }
});

// Return amenity from trainee
router.post('/return', async (req, res) => {
  try {
    const { itemId, traineeId, quantity, condition = 'good' } = req.body;

    if (!itemId || !traineeId || !quantity) {
      return res.status(400).json({
        success: false,
        message: 'Item ID, trainee ID, and quantity are required'
      });
    }

    const item = await Inventory.findById(itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }

    const trainee = await Trainee.findOne({
      $or: [
        { _id: traineeId },
        { traineeId: traineeId }
      ]
    });

    if (!trainee) {
      return res.status(404).json({
        success: false,
        message: 'Trainee not found'
      });
    }

    // Return item
    await item.returnItem(quantity, trainee.traineeId, condition, req.user._id);

    // Update trainee's amenities
    const amenityIndex = trainee.amenities.findIndex(a => a.name === item.name);
    if (amenityIndex !== -1) {
      trainee.amenities[amenityIndex].quantity -= quantity;
      if (trainee.amenities[amenityIndex].quantity <= 0) {
        trainee.amenities.splice(amenityIndex, 1);
      }
      await trainee.save();
    }

    res.json({
      success: true,
      message: 'Amenity returned successfully',
      data: { item, trainee }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to return amenity',
      error: error.message
    });
  }
});

// Get trainee amenities
router.get('/trainee/:traineeId', async (req, res) => {
  try {
    const { traineeId } = req.params;

    const trainee = await Trainee.findOne({
      $or: [
        { _id: traineeId },
        { traineeId: traineeId }
      ]
    }).select('traineeId name roomNumber block amenities');

    if (!trainee) {
      return res.status(404).json({
        success: false,
        message: 'Trainee not found'
      });
    }

    res.json({
      success: true,
      data: {
        trainee: {
          id: trainee.traineeId,
          name: trainee.name,
          roomNumber: trainee.roomNumber,
          block: trainee.block,
          amenities: trainee.amenities
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trainee amenities',
      error: error.message
    });
  }
});

// Get all trainee amenities (for amenities page)
router.get('/trainees/all', async (req, res) => {
  try {
    const { block, search } = req.query;

    // Build filter
    const filter = { status: 'staying' };
    if (block && block !== 'ALL') filter.block = block;
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { traineeId: { $regex: search, $options: 'i' } },
        { roomNumber: parseInt(search) || 0 }
      ];
    }

    const trainees = await Trainee.find(filter)
      .select('traineeId name roomNumber block bedNumber amenities')
      .sort({ block: 1, roomNumber: 1 });

    res.json({
      success: true,
      data: { trainees }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trainee amenities',
      error: error.message
    });
  }
});

// Get inventory summary by category
router.get('/summary/category', async (req, res) => {
  try {
    const summary = await Inventory.aggregate([
      {
        $group: {
          _id: '$category',
          totalItems: { $sum: 1 },
          totalQuantity: { $sum: '$totalQuantity' },
          availableQuantity: { $sum: '$availableQuantity' },
          inUseQuantity: { $sum: '$inUseQuantity' },
          usedQuantity: { $sum: '$usedQuantity' },
          damagedQuantity: { $sum: '$damagedQuantity' },
          lowStockItems: {
            $sum: {
              $cond: [
                { $lte: ['$availableQuantity', '$minimumThreshold'] },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $addFields: {
          utilizationPercentage: {
            $round: [
              {
                $multiply: [
                  {
                    $divide: [
                      '$inUseQuantity',
                      { $add: ['$availableQuantity', '$inUseQuantity'] }
                    ]
                  },
                  100
                ]
              },
              2
            ]
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      data: { summary }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch inventory summary',
      error: error.message
    });
  }
});

// Get low stock items
router.get('/alerts/low-stock', async (req, res) => {
  try {
    const lowStockItems = await Inventory.find({
      $expr: { $lte: ['$availableQuantity', '$minimumThreshold'] }
    }).sort({ availableQuantity: 1 });

    res.json({
      success: true,
      data: { lowStockItems }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch low stock items',
      error: error.message
    });
  }
});

// Restock inventory item
router.post('/:id/restock', async (req, res) => {
  try {
    const { quantity, cost, supplier } = req.body;

    if (!quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid quantity is required'
      });
    }

    const item = await Inventory.findById(req.params.id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }

    // Update quantities
    item.totalQuantity += quantity;
    item.availableQuantity += quantity;
    item.lastRestocked = new Date();

    // Update supplier info if provided
    if (supplier) {
      item.supplier = { ...item.supplier, ...supplier };
    }

    // Add transaction record
    item.transactions.push({
      type: 'purchase',
      quantity: quantity,
      notes: `Restocked ${quantity} ${item.unit}(s)`,
      performedBy: req.user._id
    });

    await item.save();

    res.json({
      success: true,
      message: 'Item restocked successfully',
      data: { item }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to restock item',
      error: error.message
    });
  }
});

module.exports = router;