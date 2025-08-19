const express = require('express');
const Trainee = require('../models/Trainee');
const Room = require('../models/Room');
const Inventory = require('../models/Inventory');
const moment = require('moment');

const router = express.Router();

// Get dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    const { block } = req.query;

    // Build filter for block-specific queries
    const blockFilter = block && block !== 'ALL' ? { block } : {};

    // Get room statistics
    const roomStats = await Room.aggregate([
      { $match: blockFilter },
      {
        $group: {
          _id: block ? '$block' : null,
          totalRooms: { $sum: 1 },
          totalBeds: { $sum: '$beds' },
          occupiedRooms: {
            $sum: { $cond: [{ $eq: ['$status', 'occupied'] }, 1, 0] }
          },
          vacantRooms: {
            $sum: { $cond: [{ $eq: ['$status', 'vacant'] }, 1, 0] }
          },
          blockedRooms: {
            $sum: { $cond: [{ $in: ['$status', ['blocked', 'store', 'maintenance']] }, 1, 0] }
          },
          occupiedBeds: { $sum: { $size: '$occupants' } }
        }
      },
      {
        $addFields: {
          occupancyPercentage: {
            $round: [{ $multiply: [{ $divide: ['$occupiedRooms', '$totalRooms'] }, 100] }, 2]
          },
          vacancyPercentage: {
            $round: [{ $multiply: [{ $divide: ['$vacantRooms', '$totalRooms'] }, 100] }, 2]
          },
          bedOccupancyPercentage: {
            $round: [{ $multiply: [{ $divide: ['$occupiedBeds', '$totalBeds'] }, 100] }, 2]
          }
        }
      }
    ]);

    // Get trainee statistics
    const traineeStats = await Trainee.aggregate([
      { $match: blockFilter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get block-wise statistics if no specific block is requested
    let blockWiseStats = [];
    if (!block || block === 'ALL') {
      blockWiseStats = await Room.aggregate([
        {
          $group: {
            _id: '$block',
            totalRooms: { $sum: 1 },
            totalBeds: { $sum: '$beds' },
            occupiedRooms: {
              $sum: { $cond: [{ $eq: ['$status', 'occupied'] }, 1, 0] }
            },
            vacantRooms: {
              $sum: { $cond: [{ $eq: ['$status', 'vacant'] }, 1, 0] }
            },
            occupiedBeds: { $sum: { $size: '$occupants' } }
          }
        },
        {
          $addFields: {
            occupancyPercentage: {
              $round: [{ $multiply: [{ $divide: ['$occupiedRooms', '$totalRooms'] }, 100] }, 2]
            }
          }
        },
        { $sort: { _id: 1 } }
      ]);
    }

    res.json({
      success: true,
      data: {
        rooms: roomStats[0] || {
          totalRooms: 0,
          totalBeds: 0,
          occupiedRooms: 0,
          vacantRooms: 0,
          blockedRooms: 0,
          occupiedBeds: 0,
          occupancyPercentage: 0,
          vacancyPercentage: 0,
          bedOccupancyPercentage: 0
        },
        trainees: traineeStats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, { staying: 0, checked_out: 0, extended: 0 }),
        blockWise: blockWiseStats
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics',
      error: error.message
    });
  }
});

// Get room layout data for dashboard
router.get('/room-layout/:block', async (req, res) => {
  try {
    const { block } = req.params;

    if (!['A', 'B', 'C'].includes(block)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid block. Must be A, B, or C'
      });
    }

    const rooms = await Room.find({ block })
      .populate({
        path: 'occupants.traineeId',
        select: 'name designation mobile',
        model: 'Trainee',
        localField: 'occupants.traineeId',
        foreignField: 'traineeId'
      })
      .sort({ number: 1 });

    // Group rooms by floor
    const groundFloorRooms = [];
    const firstFloorRooms = [];

    rooms.forEach(room => {
      const roomData = {
        number: room.number,
        type: room.type,
        status: room.status,
        beds: room.beds,
        occupants: room.occupants.map(occupant => ({
          traineeId: occupant.traineeId,
          bedNumber: occupant.bedNumber,
          name: occupant.traineeId?.name || 'Unknown',
          designation: occupant.traineeId?.designation || 'Unknown'
        }))
      };

      if (room.floor === 'Ground') {
        groundFloorRooms.push(roomData);
      } else {
        firstFloorRooms.push(roomData);
      }
    });

    res.json({
      success: true,
      data: {
        block,
        floors: [
          {
            name: 'Ground Floor',
            rooms: groundFloorRooms
          },
          {
            name: 'First Floor',
            rooms: firstFloorRooms
          }
        ]
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch room layout',
      error: error.message
    });
  }
});

// Get recent activities
router.get('/activities', async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    // Get recent check-ins and check-outs
    const recentActivities = await Trainee.find({
      $or: [
        { checkInDate: { $gte: moment().subtract(30, 'days').toDate() } },
        { checkOutDate: { $gte: moment().subtract(30, 'days').toDate() } }
      ]
    })
    .select('traineeId name designation roomNumber block checkInDate checkOutDate status')
    .sort({ updatedAt: -1 })
    .limit(parseInt(limit));

    // Format activities for display
    const formattedActivities = recentActivities.map(trainee => {
      const activities = [];
      
      if (trainee.checkInDate && moment(trainee.checkInDate).isAfter(moment().subtract(30, 'days'))) {
        activities.push({
          type: 'check_in',
          traineeId: trainee.traineeId,
          traineeName: trainee.name,
          designation: trainee.designation,
          roomNumber: trainee.roomNumber,
          block: trainee.block,
          date: trainee.checkInDate,
          description: `${trainee.name} checked into Room ${trainee.roomNumber} (Block ${trainee.block})`
        });
      }
      
      if (trainee.checkOutDate && moment(trainee.checkOutDate).isAfter(moment().subtract(30, 'days'))) {
        activities.push({
          type: 'check_out',
          traineeId: trainee.traineeId,
          traineeName: trainee.name,
          designation: trainee.designation,
          roomNumber: trainee.roomNumber,
          block: trainee.block,
          date: trainee.checkOutDate,
          description: `${trainee.name} checked out from Room ${trainee.roomNumber} (Block ${trainee.block})`
        });
      }
      
      return activities;
    }).flat().sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, parseInt(limit));

    res.json({
      success: true,
      data: { activities: formattedActivities }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recent activities',
      error: error.message
    });
  }
});

// Get upcoming events (check-outs, extensions, etc.)
router.get('/upcoming', async (req, res) => {
  try {
    const { days = 7 } = req.query;

    // Get upcoming check-outs
    const upcomingCheckouts = await Trainee.find({
      status: { $in: ['staying', 'extended'] },
      expectedCheckOutDate: {
        $gte: new Date(),
        $lte: moment().add(parseInt(days), 'days').toDate()
      }
    })
    .select('traineeId name designation division mobile roomNumber block expectedCheckOutDate')
    .sort({ expectedCheckOutDate: 1 });

    // Get overdue check-outs
    const overdueCheckouts = await Trainee.find({
      status: { $in: ['staying', 'extended'] },
      expectedCheckOutDate: { $lt: new Date() }
    })
    .select('traineeId name designation division mobile roomNumber block expectedCheckOutDate')
    .sort({ expectedCheckOutDate: 1 });

    res.json({
      success: true,
      data: {
        upcomingCheckouts,
        overdueCheckouts,
        summary: {
          upcomingCount: upcomingCheckouts.length,
          overdueCount: overdueCheckouts.length
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch upcoming events',
      error: error.message
    });
  }
});

// Get inventory alerts
router.get('/inventory-alerts', async (req, res) => {
  try {
    // Get low stock items
    const lowStockItems = await Inventory.find({
      $expr: { $lte: ['$availableQuantity', '$minimumThreshold'] }
    })
    .select('name category availableQuantity minimumThreshold')
    .sort({ availableQuantity: 1 });

    // Get out of stock items
    const outOfStockItems = await Inventory.find({
      availableQuantity: 0
    })
    .select('name category totalQuantity inUseQuantity')
    .sort({ name: 1 });

    res.json({
      success: true,
      data: {
        lowStock: lowStockItems,
        outOfStock: outOfStockItems,
        summary: {
          lowStockCount: lowStockItems.length,
          outOfStockCount: outOfStockItems.length
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch inventory alerts',
      error: error.message
    });
  }
});

// Get occupancy trends
router.get('/trends/occupancy', async (req, res) => {
  try {
    const { period = '30', block } = req.query;
    const days = parseInt(period);

    const blockFilter = block && block !== 'ALL' ? { block } : {};

    // Generate date range
    const dateRange = [];
    for (let i = days - 1; i >= 0; i--) {
      dateRange.push(moment().subtract(i, 'days').startOf('day').toDate());
    }

    // Get occupancy data for each day
    const occupancyTrends = await Promise.all(
      dateRange.map(async (date) => {
        const nextDay = moment(date).add(1, 'day').toDate();
        
        const occupiedCount = await Trainee.countDocuments({
          ...blockFilter,
          checkInDate: { $lte: date },
          $or: [
            { checkOutDate: { $gte: nextDay } },
            { checkOutDate: null }
          ],
          status: { $in: ['staying', 'extended'] }
        });

        const totalRooms = await Room.countDocuments({
          ...blockFilter,
          status: { $in: ['vacant', 'occupied'] }
        });

        return {
          date: date,
          occupiedRooms: occupiedCount,
          totalRooms: totalRooms,
          occupancyPercentage: totalRooms > 0 ? Math.round((occupiedCount / totalRooms) * 100) : 0
        };
      })
    );

    res.json({
      success: true,
      data: {
        trends: occupancyTrends,
        period: `${days} days`,
        block: block || 'ALL'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch occupancy trends',
      error: error.message
    });
  }
});

module.exports = router;