const express = require('express');
const Room = require('../models/Room');
const Trainee = require('../models/Trainee');
const { validate, roomSchema } = require('../middleware/validation');

const router = express.Router();

// Get all rooms with filtering and pagination
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      block,
      status,
      type,
      floor
    } = req.query;

    // Build filter object
    const filter = {};
    if (block) filter.block = block;
    if (status) filter.status = status;
    if (type) filter.type = type;
    if (floor) filter.floor = floor;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { block: 1, number: 1 }
    };

    const rooms = await Room.find(filter)
      .populate('occupants.traineeId', 'name designation')
      .sort(options.sort)
      .limit(options.limit * 1)
      .skip((options.page - 1) * options.limit);

    const total = await Room.countDocuments(filter);

    res.json({
      success: true,
      data: {
        rooms,
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
      message: 'Failed to fetch rooms',
      error: error.message
    });
  }
});

// Get rooms by block
router.get('/block/:block', async (req, res) => {
  try {
    const { block } = req.params;

    if (!['A', 'B', 'C'].includes(block)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid block. Must be A, B, or C'
      });
    }

    const rooms = await Room.find({ block })
      .populate('occupants.traineeId', 'name designation mobile')
      .sort({ number: 1 });

    res.json({
      success: true,
      data: { rooms }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch rooms by block',
      error: error.message
    });
  }
});

// Get room by number and block
router.get('/:block/:number', async (req, res) => {
  try {
    const { block, number } = req.params;

    const room = await Room.findOne({ block, number: parseInt(number) })
      .populate('occupants.traineeId', 'name designation mobile division checkInDate expectedCheckOutDate');

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    res.json({
      success: true,
      data: { room }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch room',
      error: error.message
    });
  }
});

// Create new room
router.post('/', validate(roomSchema), async (req, res) => {
  try {
    const roomData = req.body;

    // Check if room already exists
    const existingRoom = await Room.findOne({
      number: roomData.number,
      block: roomData.block
    });

    if (existingRoom) {
      return res.status(400).json({
        success: false,
        message: 'Room already exists in this block'
      });
    }

    const room = new Room(roomData);
    await room.save();

    res.status(201).json({
      success: true,
      message: 'Room created successfully',
      data: { room }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create room',
      error: error.message
    });
  }
});

// Update room
router.put('/:block/:number', async (req, res) => {
  try {
    const { block, number } = req.params;
    const updateData = req.body;

    const room = await Room.findOne({ block, number: parseInt(number) });

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    // Prevent changing room number or block if room is occupied
    if (room.occupants.length > 0 && (updateData.number || updateData.block)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot change room number or block while room is occupied'
      });
    }

    Object.assign(room, updateData);
    await room.save();

    res.json({
      success: true,
      message: 'Room updated successfully',
      data: { room }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update room',
      error: error.message
    });
  }
});

// Delete room
router.delete('/:block/:number', async (req, res) => {
  try {
    const { block, number } = req.params;

    const room = await Room.findOne({ block, number: parseInt(number) });

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    // Check if room is occupied
    if (room.occupants.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete occupied room. Please checkout all trainees first.'
      });
    }

    await room.deleteOne();

    res.json({
      success: true,
      message: 'Room deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete room',
      error: error.message
    });
  }
});

// Get room occupancy statistics
router.get('/stats/occupancy', async (req, res) => {
  try {
    const { block } = req.query;

    const matchStage = block ? { block } : {};

    const stats = await Room.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$block',
          totalRooms: { $sum: 1 },
          occupiedRooms: {
            $sum: {
              $cond: [{ $eq: ['$status', 'occupied'] }, 1, 0]
            }
          },
          vacantRooms: {
            $sum: {
              $cond: [{ $eq: ['$status', 'vacant'] }, 1, 0]
            }
          },
          blockedRooms: {
            $sum: {
              $cond: [{ $in: ['$status', ['blocked', 'store', 'maintenance']] }, 1, 0]
            }
          },
          totalBeds: { $sum: '$beds' },
          occupiedBeds: { $sum: { $size: '$occupants' } }
        }
      },
      {
        $addFields: {
          occupancyPercentage: {
            $round: [
              {
                $multiply: [
                  { $divide: ['$occupiedRooms', '$totalRooms'] },
                  100
                ]
              },
              2
            ]
          },
          bedOccupancyPercentage: {
            $round: [
              {
                $multiply: [
                  { $divide: ['$occupiedBeds', '$totalBeds'] },
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

    // If no block specified, also get overall stats
    if (!block) {
      const overallStats = await Room.aggregate([
        {
          $group: {
            _id: null,
            totalRooms: { $sum: 1 },
            occupiedRooms: {
              $sum: {
                $cond: [{ $eq: ['$status', 'occupied'] }, 1, 0]
              }
            },
            vacantRooms: {
              $sum: {
                $cond: [{ $eq: ['$status', 'vacant'] }, 1, 0]
              }
            },
            blockedRooms: {
              $sum: {
                $cond: [{ $in: ['$status', ['blocked', 'store', 'maintenance']] }, 1, 0]
              }
            },
            totalBeds: { $sum: '$beds' },
            occupiedBeds: { $sum: { $size: '$occupants' } }
          }
        },
        {
          $addFields: {
            occupancyPercentage: {
              $round: [
                {
                  $multiply: [
                    { $divide: ['$occupiedRooms', '$totalRooms'] },
                    100
                  ]
                },
                2
              ]
            },
            bedOccupancyPercentage: {
              $round: [
                {
                  $multiply: [
                    { $divide: ['$occupiedBeds', '$totalBeds'] },
                    100
                  ]
                },
                2
              ]
            }
          }
        }
      ]);

      return res.json({
        success: true,
        data: {
          byBlock: stats,
          overall: overallStats[0] || {}
        }
      });
    }

    res.json({
      success: true,
      data: { stats }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch occupancy statistics',
      error: error.message
    });
  }
});

// Get available rooms
router.get('/available/:block?', async (req, res) => {
  try {
    const { block } = req.params;
    const { bedCount } = req.query;

    const filter = {
      status: 'vacant',
      $expr: { $lt: [{ $size: '$occupants' }, '$beds'] }
    };

    if (block) filter.block = block;
    if (bedCount) filter.beds = { $gte: parseInt(bedCount) };

    const availableRooms = await Room.find(filter)
      .sort({ block: 1, number: 1 })
      .select('number block type beds occupants status');

    res.json({
      success: true,
      data: { availableRooms }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available rooms',
      error: error.message
    });
  }
});

// Add maintenance record
router.post('/:block/:number/maintenance', async (req, res) => {
  try {
    const { block, number } = req.params;
    const { description, type, cost } = req.body;

    const room = await Room.findOne({ block, number: parseInt(number) });

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    room.maintenanceHistory.push({
      description,
      type,
      cost,
      performedBy: req.user.fullName
    });

    await room.save();

    res.json({
      success: true,
      message: 'Maintenance record added successfully',
      data: { room }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to add maintenance record',
      error: error.message
    });
  }
});

module.exports = router;