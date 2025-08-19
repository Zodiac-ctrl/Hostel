const express = require('express');
const Trainee = require('../models/Trainee');
const Room = require('../models/Room');
const Inventory = require('../models/Inventory');

const router = express.Router();

// Allocate room to trainee
router.post('/allocate', async (req, res) => {
  try {
    const {
      traineeData,
      roomNumber,
      block,
      bedNumber = 1
    } = req.body;

    // Validate required fields
    if (!traineeData || !roomNumber || !block) {
      return res.status(400).json({
        success: false,
        message: 'Trainee data, room number, and block are required'
      });
    }

    // Check if room exists and is available
    const room = await Room.findOne({ number: roomNumber, block });
    
    if (!room) {
      return res.status(404).json({
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

    // Check if specific bed is available
    const bedOccupied = room.occupants.some(occupant => occupant.bedNumber === bedNumber);
    if (bedOccupied) {
      return res.status(400).json({
        success: false,
        message: `Bed ${bedNumber} is already occupied`
      });
    }

    // Create new trainee
    const trainee = new Trainee({
      ...traineeData,
      roomNumber,
      block,
      bedNumber,
      checkInDate: new Date(traineeData.checkInDate),
      expectedCheckOutDate: new Date(traineeData.expectedCheckOutDate),
      status: 'staying'
    });

    await trainee.save();

    // Update room occupancy
    room.occupants.push({
      traineeId: trainee.traineeId,
      bedNumber: bedNumber
    });
    room.status = 'occupied';
    await room.save();

    // Handle amenity allocation
    if (traineeData.amenities && traineeData.amenities.length > 0) {
      for (const amenity of traineeData.amenities) {
        try {
          const inventoryItem = await Inventory.findOne({ 
            name: { $regex: new RegExp(amenity.name, 'i') }
          });
          
          if (inventoryItem) {
            await inventoryItem.allocate(
              amenity.quantity || 1,
              trainee.traineeId,
              roomNumber,
              req.user._id
            );
          }
        } catch (inventoryError) {
          console.warn(`Failed to allocate ${amenity.name}:`, inventoryError.message);
        }
      }
    }

    // Populate trainee data for response
    const populatedTrainee = await Trainee.findById(trainee._id);

    res.status(201).json({
      success: true,
      message: 'Room allocated successfully',
      data: {
        trainee: populatedTrainee,
        room: room
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to allocate room',
      error: error.message
    });
  }
});

// Deallocate room (remove trainee completely)
router.post('/deallocate', async (req, res) => {
  try {
    const { traineeId } = req.body;

    if (!traineeId) {
      return res.status(400).json({
        success: false,
        message: 'Trainee ID is required'
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

    // Remove from room if currently staying
    if (trainee.roomNumber && trainee.block) {
      const room = await Room.findOne({
        number: trainee.roomNumber,
        block: trainee.block
      });

      if (room) {
        room.occupants = room.occupants.filter(
          occupant => occupant.traineeId !== trainee.traineeId
        );
        
        // Update room status if no occupants left
        if (room.occupants.length === 0) {
          room.status = 'vacant';
        }
        
        await room.save();
      }
    }

    // Return amenities to inventory
    if (trainee.amenities && trainee.amenities.length > 0) {
      for (const amenity of trainee.amenities) {
        try {
          const inventoryItem = await Inventory.findOne({ 
            name: { $regex: new RegExp(amenity.name, 'i') }
          });
          
          if (inventoryItem) {
            await inventoryItem.returnItem(
              amenity.quantity || 1,
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

    // Delete trainee record
    await trainee.deleteOne();

    res.json({
      success: true,
      message: 'Room deallocated and trainee removed successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to deallocate room',
      error: error.message
    });
  }
});

// Transfer trainee to different room
router.post('/transfer', async (req, res) => {
  try {
    const {
      traineeId,
      newRoomNumber,
      newBlock,
      newBedNumber = 1,
      reason
    } = req.body;

    if (!traineeId || !newRoomNumber || !newBlock) {
      return res.status(400).json({
        success: false,
        message: 'Trainee ID, new room number, and new block are required'
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

    // Check if new room is available
    const newRoom = await Room.findOne({ number: newRoomNumber, block: newBlock });
    
    if (!newRoom) {
      return res.status(404).json({
        success: false,
        message: 'New room not found'
      });
    }

    if (!newRoom.isAvailable()) {
      return res.status(400).json({
        success: false,
        message: 'New room is not available'
      });
    }

    // Check if specific bed is available in new room
    const bedOccupied = newRoom.occupants.some(occupant => occupant.bedNumber === newBedNumber);
    if (bedOccupied) {
      return res.status(400).json({
        success: false,
        message: `Bed ${newBedNumber} is already occupied in the new room`
      });
    }

    const oldRoomNumber = trainee.roomNumber;
    const oldBlock = trainee.block;

    // Remove from old room
    if (oldRoomNumber && oldBlock) {
      const oldRoom = await Room.findOne({ number: oldRoomNumber, block: oldBlock });
      if (oldRoom) {
        oldRoom.occupants = oldRoom.occupants.filter(
          occupant => occupant.traineeId !== trainee.traineeId
        );
        
        // Update old room status if no occupants left
        if (oldRoom.occupants.length === 0) {
          oldRoom.status = 'vacant';
        }
        
        await oldRoom.save();
      }
    }

    // Add to new room
    newRoom.occupants.push({
      traineeId: trainee.traineeId,
      bedNumber: newBedNumber
    });
    newRoom.status = 'occupied';
    await newRoom.save();

    // Update trainee record
    trainee.roomNumber = newRoomNumber;
    trainee.block = newBlock;
    trainee.bedNumber = newBedNumber;
    await trainee.save();

    res.json({
      success: true,
      message: 'Trainee transferred successfully',
      data: {
        trainee,
        oldRoom: { number: oldRoomNumber, block: oldBlock },
        newRoom: { number: newRoomNumber, block: newBlock }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to transfer trainee',
      error: error.message
    });
  }
});

// Get allotment history
router.get('/history', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      traineeId,
      roomNumber,
      block,
      startDate,
      endDate
    } = req.query;

    // Build filter
    const filter = {};
    
    if (traineeId) {
      filter.$or = [
        { _id: traineeId },
        { traineeId: traineeId }
      ];
    }
    
    if (roomNumber) filter.roomNumber = parseInt(roomNumber);
    if (block) filter.block = block;
    
    if (startDate && endDate) {
      filter.checkInDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { checkInDate: -1 }
    };

    const allotments = await Trainee.find(filter)
      .sort(options.sort)
      .limit(options.limit * 1)
      .skip((options.page - 1) * options.limit)
      .select('traineeId name designation division roomNumber block bedNumber checkInDate checkOutDate status');

    const total = await Trainee.countDocuments(filter);

    res.json({
      success: true,
      data: {
        allotments,
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
      message: 'Failed to fetch allotment history',
      error: error.message
    });
  }
});

// Get current allotments
router.get('/current', async (req, res) => {
  try {
    const { block } = req.query;

    const filter = { status: 'staying' };
    if (block) filter.block = block;

    const currentAllotments = await Trainee.find(filter)
      .sort({ block: 1, roomNumber: 1, bedNumber: 1 })
      .select('traineeId name designation division mobile roomNumber block bedNumber checkInDate expectedCheckOutDate amenities');

    // Group by block
    const groupedAllotments = currentAllotments.reduce((acc, trainee) => {
      if (!acc[trainee.block]) {
        acc[trainee.block] = [];
      }
      acc[trainee.block].push(trainee);
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        allotments: groupedAllotments,
        total: currentAllotments.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch current allotments',
      error: error.message
    });
  }
});

// Extend stay
router.post('/extend', async (req, res) => {
  try {
    const { traineeId, newCheckOutDate, reason } = req.body;

    if (!traineeId || !newCheckOutDate) {
      return res.status(400).json({
        success: false,
        message: 'Trainee ID and new check-out date are required'
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

    if (trainee.status !== 'staying') {
      return res.status(400).json({
        success: false,
        message: 'Can only extend stay for currently staying trainees'
      });
    }

    const newDate = new Date(newCheckOutDate);
    if (newDate <= trainee.expectedCheckOutDate) {
      return res.status(400).json({
        success: false,
        message: 'New check-out date must be later than current expected check-out date'
      });
    }

    trainee.expectedCheckOutDate = newDate;
    trainee.status = 'extended';
    await trainee.save();

    res.json({
      success: true,
      message: 'Stay extended successfully',
      data: { trainee }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to extend stay',
      error: error.message
    });
  }
});

module.exports = router;