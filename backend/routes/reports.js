const express = require('express');
const Trainee = require('../models/Trainee');
const Room = require('../models/Room');
const Inventory = require('../models/Inventory');
const moment = require('moment');

const router = express.Router();

// Get occupancy report
router.get('/occupancy', async (req, res) => {
  try {
    const { startDate, endDate, block } = req.query;

    // Build date filter
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        $and: [
          { checkInDate: { $lte: new Date(endDate) } },
          {
            $or: [
              { checkOutDate: { $gte: new Date(startDate) } },
              { checkOutDate: null }
            ]
          }
        ]
      };
    }

    // Build block filter
    let blockFilter = {};
    if (block && block !== 'ALL') {
      blockFilter.block = block;
    }

    const filter = { ...dateFilter, ...blockFilter };

    // Get occupancy statistics
    const occupancyStats = await Room.aggregate([
      { $match: blockFilter },
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
          blockedRooms: {
            $sum: { $cond: [{ $in: ['$status', ['blocked', 'store', 'maintenance']] }, 1, 0] }
          },
          occupiedBeds: { $sum: { $size: '$occupants' } }
        }
      },
      {
        $addFields: {
          roomOccupancyPercentage: {
            $round: [{ $multiply: [{ $divide: ['$occupiedRooms', '$totalRooms'] }, 100] }, 2]
          },
          bedOccupancyPercentage: {
            $round: [{ $multiply: [{ $divide: ['$occupiedBeds', '$totalBeds'] }, 100] }, 2]
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get trainee statistics
    const traineeStats = await Trainee.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$block',
          totalTrainees: { $sum: 1 },
          stayingTrainees: {
            $sum: { $cond: [{ $eq: ['$status', 'staying'] }, 1, 0] }
          },
          checkedOutTrainees: {
            $sum: { $cond: [{ $eq: ['$status', 'checked_out'] }, 1, 0] }
          },
          extendedTrainees: {
            $sum: { $cond: [{ $eq: ['$status', 'extended'] }, 1, 0] }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get overall statistics if no block specified
    let overallStats = {};
    if (!block || block === 'ALL') {
      const overallOccupancy = await Room.aggregate([
        {
          $group: {
            _id: null,
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
            roomOccupancyPercentage: {
              $round: [{ $multiply: [{ $divide: ['$occupiedRooms', '$totalRooms'] }, 100] }, 2]
            },
            bedOccupancyPercentage: {
              $round: [{ $multiply: [{ $divide: ['$occupiedBeds', '$totalBeds'] }, 100] }, 2]
            }
          }
        }
      ]);

      const overallTrainees = await Trainee.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: null,
            totalTrainees: { $sum: 1 },
            stayingTrainees: {
              $sum: { $cond: [{ $eq: ['$status', 'staying'] }, 1, 0] }
            },
            checkedOutTrainees: {
              $sum: { $cond: [{ $eq: ['$status', 'checked_out'] }, 1, 0] }
            },
            extendedTrainees: {
              $sum: { $cond: [{ $eq: ['$status', 'extended'] }, 1, 0] }
            }
          }
        }
      ]);

      overallStats = {
        occupancy: overallOccupancy[0] || {},
        trainees: overallTrainees[0] || {}
      };
    }

    res.json({
      success: true,
      data: {
        occupancyByBlock: occupancyStats,
        traineesByBlock: traineeStats,
        overall: overallStats,
        dateRange: startDate && endDate ? { startDate, endDate } : null
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to generate occupancy report',
      error: error.message
    });
  }
});

// Get inventory report
router.get('/inventory', async (req, res) => {
  try {
    const { category } = req.query;

    let filter = {};
    if (category) filter.category = category;

    // Get inventory summary
    const inventorySummary = await Inventory.aggregate([
      { $match: filter },
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
              $cond: [{ $lte: ['$availableQuantity', '$minimumThreshold'] }, 1, 0]
            }
          },
          totalValue: { $sum: { $multiply: ['$totalQuantity', '$costPerUnit'] } }
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

    // Get detailed inventory items
    const inventoryItems = await Inventory.find(filter)
      .select('name category totalQuantity availableQuantity inUseQuantity usedQuantity damagedQuantity minimumThreshold costPerUnit')
      .sort({ category: 1, name: 1 });

    // Get low stock alerts
    const lowStockItems = await Inventory.find({
      ...filter,
      $expr: { $lte: ['$availableQuantity', '$minimumThreshold'] }
    }).select('name category availableQuantity minimumThreshold');

    // Get recent transactions
    const recentTransactions = await Inventory.aggregate([
      { $match: filter },
      { $unwind: '$transactions' },
      { $sort: { 'transactions.date': -1 } },
      { $limit: 50 },
      {
        $project: {
          itemName: '$name',
          category: '$category',
          transaction: '$transactions'
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        summary: inventorySummary,
        items: inventoryItems,
        lowStockAlerts: lowStockItems,
        recentTransactions: recentTransactions
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to generate inventory report',
      error: error.message
    });
  }
});

// Get trainee report
router.get('/trainees', async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      block,
      designation,
      status
    } = req.query;

    // Build filter
    let filter = {};
    
    if (block && block !== 'ALL') filter.block = block;
    if (designation) filter.designation = designation;
    if (status) filter.status = status;

    if (startDate && endDate) {
      filter.checkInDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Get trainee statistics
    const traineeStats = await Trainee.aggregate([
      { $match: filter },
      {
        $group: {
          _id: {
            block: '$block',
            designation: '$designation'
          },
          count: { $sum: 1 },
          avgStayDuration: {
            $avg: {
              $divide: [
                {
                  $subtract: [
                    { $ifNull: ['$checkOutDate', new Date()] },
                    '$checkInDate'
                  ]
                },
                1000 * 60 * 60 * 24 // Convert to days
              ]
            }
          }
        }
      },
      {
        $group: {
          _id: '$_id.block',
          designations: {
            $push: {
              designation: '$_id.designation',
              count: '$count',
              avgStayDuration: { $round: ['$avgStayDuration', 1] }
            }
          },
          totalTrainees: { $sum: '$count' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get detailed trainee list
    const trainees = await Trainee.find(filter)
      .select('traineeId name designation division mobile roomNumber block checkInDate checkOutDate expectedCheckOutDate status')
      .sort({ block: 1, roomNumber: 1 });

    // Get check-in/check-out trends
    const trends = await Trainee.aggregate([
      { $match: filter },
      {
        $group: {
          _id: {
            year: { $year: '$checkInDate' },
            month: { $month: '$checkInDate' }
          },
          checkIns: { $sum: 1 },
          checkOuts: {
            $sum: {
              $cond: [
                { $ne: ['$checkOutDate', null] },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $addFields: {
          date: {
            $dateFromParts: {
              year: '$_id.year',
              month: '$_id.month'
            }
          }
        }
      },
      { $sort: { date: 1 } }
    ]);

    res.json({
      success: true,
      data: {
        statistics: traineeStats,
        trainees: trainees,
        trends: trends,
        totalCount: trainees.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to generate trainee report',
      error: error.message
    });
  }
});

// Get financial report
router.get('/financial', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        'transactions.date': {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
    }

    // Get inventory costs
    const inventoryCosts = await Inventory.aggregate([
      { $unwind: '$transactions' },
      { $match: { ...dateFilter, 'transactions.type': 'purchase' } },
      {
        $group: {
          _id: '$category',
          totalPurchases: { $sum: '$transactions.quantity' },
          totalCost: {
            $sum: { $multiply: ['$transactions.quantity', '$costPerUnit'] }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get room maintenance costs
    const maintenanceCosts = await Room.aggregate([
      { $unwind: '$maintenanceHistory' },
      {
        $match: {
          ...dateFilter.transactions ? 
            { 'maintenanceHistory.date': dateFilter.transactions.date } : 
            {}
        }
      },
      {
        $group: {
          _id: {
            block: '$block',
            type: '$maintenanceHistory.type'
          },
          totalCost: { $sum: '$maintenanceHistory.cost' },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.block',
          maintenanceTypes: {
            $push: {
              type: '$_id.type',
              cost: '$totalCost',
              count: '$count'
            }
          },
          totalBlockCost: { $sum: '$totalCost' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Calculate overall totals
    const totalInventoryCost = inventoryCosts.reduce((sum, item) => sum + (item.totalCost || 0), 0);
    const totalMaintenanceCost = maintenanceCosts.reduce((sum, block) => sum + (block.totalBlockCost || 0), 0);

    res.json({
      success: true,
      data: {
        inventory: {
          byCategory: inventoryCosts,
          total: totalInventoryCost
        },
        maintenance: {
          byBlock: maintenanceCosts,
          total: totalMaintenanceCost
        },
        summary: {
          totalInventoryCost,
          totalMaintenanceCost,
          grandTotal: totalInventoryCost + totalMaintenanceCost
        },
        dateRange: startDate && endDate ? { startDate, endDate } : null
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to generate financial report',
      error: error.message
    });
  }
});

// Get dashboard summary
router.get('/dashboard', async (req, res) => {
  try {
    // Get current occupancy
    const occupancyStats = await Room.aggregate([
      {
        $group: {
          _id: null,
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
          },
          bedOccupancyPercentage: {
            $round: [{ $multiply: [{ $divide: ['$occupiedBeds', '$totalBeds'] }, 100] }, 2]
          }
        }
      }
    ]);

    // Get trainee statistics
    const traineeStats = await Trainee.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get inventory alerts
    const inventoryAlerts = await Inventory.countDocuments({
      $expr: { $lte: ['$availableQuantity', '$minimumThreshold'] }
    });

    // Get recent activities (last 7 days)
    const recentActivities = await Trainee.find({
      $or: [
        { checkInDate: { $gte: moment().subtract(7, 'days').toDate() } },
        { checkOutDate: { $gte: moment().subtract(7, 'days').toDate() } }
      ]
    })
    .select('traineeId name checkInDate checkOutDate status')
    .sort({ updatedAt: -1 })
    .limit(10);

    // Get upcoming check-outs (next 7 days)
    const upcomingCheckouts = await Trainee.find({
      status: { $in: ['staying', 'extended'] },
      expectedCheckOutDate: {
        $gte: new Date(),
        $lte: moment().add(7, 'days').toDate()
      }
    })
    .select('traineeId name expectedCheckOutDate roomNumber block')
    .sort({ expectedCheckOutDate: 1 });

    res.json({
      success: true,
      data: {
        occupancy: occupancyStats[0] || {},
        trainees: traineeStats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {}),
        inventoryAlerts,
        recentActivities,
        upcomingCheckouts
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to generate dashboard summary',
      error: error.message
    });
  }
});

// Export report data
router.get('/export/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const { format = 'json', ...filters } = req.query;

    let data = {};

    switch (type) {
      case 'occupancy':
        // Reuse occupancy report logic
        const occupancyResponse = await generateOccupancyReport(filters);
        data = occupancyResponse;
        break;
      
      case 'inventory':
        // Reuse inventory report logic
        const inventoryResponse = await generateInventoryReport(filters);
        data = inventoryResponse;
        break;
      
      case 'trainees':
        // Reuse trainee report logic
        const traineeResponse = await generateTraineeReport(filters);
        data = traineeResponse;
        break;
      
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid report type'
        });
    }

    // Set appropriate headers for download
    const filename = `${type}_report_${moment().format('YYYY-MM-DD')}.${format}`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.json({
        success: true,
        data,
        exportedAt: new Date().toISOString(),
        filters
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Only JSON format is currently supported'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to export report',
      error: error.message
    });
  }
});

module.exports = router;