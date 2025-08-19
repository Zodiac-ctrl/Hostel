const express = require('express');
const Trainee = require('../models/Trainee');
const Room = require('../models/Room');
const Inventory = require('../models/Inventory');
const { validate, traineeSchema } = require('../middleware/validation');

const router = express.Router();

// Get all trainees with filtering and pagination
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      block,
      designation,
      search,
      startDate,
      endDate
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (status) filter.status = status;
    if (block) filter.block = block;
    if (designation) filter.designation = designation;
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { traineeId: { $regex: search, $options: 'i' } },
        { division: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } }
      ];
    }

    // Date range filter
    if (startDate && endDate) {
      filter.$and = [
        { checkInDate: { $lte: new Date(endDate) } },
        { $or: [
          { checkOutDate: { $gte: new Date(startDate) } },
          { checkOutDate: null }
        ]}
      ];
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 }
    };

    const trainees = await Trainee.find(filter)
      .sort(options.sort)
      .limit(options.limit * 1)
      .skip((options.page - 1) * options.limit);

    const total = await Trainee.countDocuments(filter);

    res.json({
      success: true,
      data: {
        trainees,
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
      message: 'Failed to fetch trainees',
      error: error.message
    });
  }
});

// Get trainee by ID
router.get('/:id', async (req, res) => {
  try {
    const trainee = await Trainee.findOne({
      $or: [
        { _id: req.params.id },
        { traineeId: req.params.id }
      ]
    });

    if (!trainee) {
      return res.status(404).json({
        success: false,
        message: 'Trainee not found'
      });
    }

    res.json({
      success: true,
      data: { trainee }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trainee',
      error: error.message
    });
  }
});

// Create new trainee
router.post('/', validate(traineeSchema), async (req, res) => {
  try {
    const traineeData = req.body;

    // Check if room is available if room number is provided
    if (traineeData.roomNumber) {
      const room = await Room.findOne({
        number: traineeData.roomNumber,
        block: traineeData.block || getBlockFromRoomNumber(traineeData.roomNumber)
      });

      if (!room) {
        return res.status(400).json({
          success: false,
          message: 'Room not found'
        });
      }

      if (!room.isAvailable()) {
        return res.status(400).json({
          success: false,
          message: 'Room is not available'
        });
      }
    }

    const trainee = new Trainee(traineeData);
    await trainee.save();

    // Update room occupancy if room is assigned
    if (trainee.roomNumber && trainee.block) {
      await Room.findOneAndUpdate(
        { number: trainee.roomNumber, block: trainee.block },
        {
          $push: {
            occupants: {
              traineeId: trainee.traineeId,
              bedNumber: trainee.bedNumber
            }
          },
          status: 'occupied'
        }
      );
    }

    // Handle amenity allocation
    if (trainee.amenities && trainee.amenities.length > 0) {
      for (const amenity of trainee.amenities) {
        try {
          const inventoryItem = await Inventory.findOne({ name: amenity.name });
          if (inventoryItem) {
            await inventoryItem.allocate(
              amenity.quantity,
              trainee.traineeId,
              trainee.roomNumber,
              req.user._id
            );
          }
        } catch (inventoryError) {
          console.warn(`Failed to allocate ${amenity.name}:`, inventoryError.message);
        }
      }
    }

    res.status(201).json({
      success: true,
      message: 'Trainee created successfully',
      data: { trainee }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create trainee',
      error: error.message
    });
  }
});

// Update trainee
router.put('/:id', async (req, res) => {
  try {
    const trainee = await Trainee.findOne({
      $or: [
        { _id: req.params.id },
        { traineeId: req.params.id }
      ]
    });

    if (!trainee) {
      return res.status(404).json({
        success: false,
        message: 'Trainee not found'
      });
    }

    const oldRoomNumber = trainee.roomNumber;
    const oldBlock = trainee.block;

    // Update trainee data
    Object.assign(trainee, req.body);
    await trainee.save();

    // Handle room change
    if (oldRoomNumber !== trainee.roomNumber || oldBlock !== trainee.block) {
      // Remove from old room
      if (oldRoomNumber && oldBlock) {
        await Room.findOneAndUpdate(
          { number: oldRoomNumber, block: oldBlock },
          {
            $pull: { occupants: { traineeId: trainee.traineeId } }
          }
        );

        // Update old room status if no occupants left
        const oldRoom = await Room.findOne({ number: oldRoomNumber, block: oldBlock });
        if (oldRoom && oldRoom.occupants.length === 0) {
          oldRoom.status = 'vacant';
          await oldRoom.save();
        }
      }

      // Add to new room
      if (trainee.roomNumber && trainee.block) {
        await Room.findOneAndUpdate(
          { number: trainee.roomNumber, block: trainee.block },
          {
            $push: {
              occupants: {
                traineeId: trainee.traineeId,
                bedNumber: trainee.bedNumber
              }
            },
            status: 'occupied'
          }
        );
      }
    }

    res.json({
      success: true,
      message: 'Trainee updated successfully',
      data: { trainee }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update trainee',
      error: error.message
    });
  }
});

// Checkout trainee
router.put('/:id/checkout', async (req, res) => {
  try {
    const trainee = await Trainee.findOne({
      $or: [
        { _id: req.params.id },
        { traineeId: req.params.id }
      ]
    });

    if (!trainee) {
      return res.status(404).json({
        success: false,
        message: 'Trainee not found'
      });
    }

    if (trainee.status === 'checked_out') {
      return res.status(400).json({
        success: false,
        message: 'Trainee is already checked out'
      });
    }

    // Update trainee status
    trainee.status = 'checked_out';
    trainee.checkOutDate = new Date();
    const oldRoomNumber = trainee.roomNumber;
    const oldBlock = trainee.block;
    trainee.roomNumber = null;
    trainee.block = null;
    trainee.bedNumber = null;

    await trainee.save();

    // Update room occupancy
    if (oldRoomNumber && oldBlock) {
      await Room.findOneAndUpdate(
        { number: oldRoomNumber, block: oldBlock },
        {
          $pull: { occupants: { traineeId: trainee.traineeId } }
        }
      );

      // Update room status if no occupants left
      const room = await Room.findOne({ number: oldRoomNumber, block: oldBlock });
      if (room && room.occupants.length === 0) {
        room.status = 'vacant';
        await room.save();
      }
    }

    // Return amenities to inventory
    if (trainee.amenities && trainee.amenities.length > 0) {
      for (const amenity of trainee.amenities) {
        try {
          const inventoryItem = await Inventory.findOne({ name: amenity.name });
          if (inventoryItem) {
            await inventoryItem.returnItem(
              amenity.quantity,
              trainee.traineeId,
              'used', // Assuming items are returned in used condition
              req.user._id
            );
          }
        } catch (inventoryError) {
          console.warn(`Failed to return ${amenity.name}:`, inventoryError.message);
        }
      }
    }

    res.json({
      success: true,
      message: 'Trainee checked out successfully',
      data: { trainee }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to checkout trainee',
      error: error.message
    });
  }
});

// Delete trainee
router.delete('/:id', async (req, res) => {
  try {
    const trainee = await Trainee.findOne({
      $or: [
        { _id: req.params.id },
        { traineeId: req.params.id }
      ]
    });

    if (!trainee) {
      return res.status(404).json({
        success: false,
        message: 'Trainee not found'
      });
    }

    // Remove from room if currently staying
    if (trainee.roomNumber && trainee.block && trainee.status === 'staying') {
      await Room.findOneAndUpdate(
        { number: trainee.roomNumber, block: trainee.block },
        {
          $pull: { occupants: { traineeId: trainee.traineeId } }
        }
      );

      // Update room status if no occupants left
      const room = await Room.findOne({ number: trainee.roomNumber, block: trainee.block });
      if (room && room.occupants.length === 0) {
        room.status = 'vacant';
        await room.save();
      }
    }

    // Return amenities to inventory
    if (trainee.amenities && trainee.amenities.length > 0) {
      for (const amenity of trainee.amenities) {
        try {
          const inventoryItem = await Inventory.findOne({ name: amenity.name });
          if (inventoryItem) {
            await inventoryItem.returnItem(
              amenity.quantity,
              trainee.traineeId,
              'good',
              req.user._id
            );
          }
        } catch (inventoryError) {
          console.warn(`Failed to return ${amenity.name}:`, inventoryError.message);
        }
      }
    }

    await trainee.deleteOne();

    res.json({
      success: true,
      message: 'Trainee deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete trainee',
      error: error.message
    });
  }
});

// Get trainees by block
router.get('/block/:block', async (req, res) => {
  try {
    const { block } = req.params;
    const { status = 'staying' } = req.query;

    if (!['A', 'B', 'C'].includes(block)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid block. Must be A, B, or C'
      });
    }

    const trainees = await Trainee.find({ block, status }).sort({ roomNumber: 1 });

    res.json({
      success: true,
      data: { trainees }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trainees by block',
      error: error.message
    });
  }
});

// Helper function to determine block from room number
function getBlockFromRoomNumber(roomNumber) {
  if (roomNumber >= 1 && roomNumber <= 43) return 'A';
  if (roomNumber >= 44 && roomNumber <= 86) return 'B';
  if (roomNumber >= 87 && roomNumber <= 114) return 'C';
  return 'A'; // default
}

module.exports = router;