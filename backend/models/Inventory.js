const mongoose = require('mongoose');

const inventoryItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Item name is required'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['linen', 'blanket', 'furniture', 'electrical', 'cleaning', 'other']
  },
  totalQuantity: {
    type: Number,
    required: [true, 'Total quantity is required'],
    min: [0, 'Total quantity cannot be negative']
  },
  availableQuantity: {
    type: Number,
    required: [true, 'Available quantity is required'],
    min: [0, 'Available quantity cannot be negative']
  },
  inUseQuantity: {
    type: Number,
    default: 0,
    min: [0, 'In-use quantity cannot be negative']
  },
  usedQuantity: {
    type: Number,
    default: 0,
    min: [0, 'Used quantity cannot be negative']
  },
  damagedQuantity: {
    type: Number,
    default: 0,
    min: [0, 'Damaged quantity cannot be negative']
  },
  unit: {
    type: String,
    required: [true, 'Unit is required'],
    enum: ['piece', 'set', 'pair', 'meter', 'kg', 'liter']
  },
  minimumThreshold: {
    type: Number,
    default: 10,
    min: [0, 'Minimum threshold cannot be negative']
  },
  costPerUnit: {
    type: Number,
    min: [0, 'Cost per unit cannot be negative']
  },
  supplier: {
    name: String,
    contact: String,
    email: String
  },
  lastRestocked: {
    type: Date
  },
  expiryDate: {
    type: Date
  },
  location: {
    block: {
      type: String,
      enum: ['A', 'B', 'C', 'Store']
    },
    room: String,
    shelf: String
  },
  transactions: [{
    type: {
      type: String,
      enum: ['purchase', 'allocation', 'return', 'damage', 'disposal'],
      required: true
    },
    quantity: {
      type: Number,
      required: true
    },
    date: {
      type: Date,
      default: Date.now
    },
    traineeId: String,
    roomNumber: Number,
    notes: String,
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Validation to ensure quantities add up correctly
inventoryItemSchema.pre('save', function(next) {
  const totalUsed = this.inUseQuantity + this.usedQuantity + this.damagedQuantity;
  if (this.availableQuantity + totalUsed > this.totalQuantity) {
    return next(new Error('Sum of available, in-use, used, and damaged quantities cannot exceed total quantity'));
  }
  
  this.updatedAt = Date.now();
  next();
});

// Index for efficient queries
inventoryItemSchema.index({ name: 1, category: 1 });
inventoryItemSchema.index({ category: 1 });
inventoryItemSchema.index({ availableQuantity: 1 });

// Virtual for low stock alert
inventoryItemSchema.virtual('isLowStock').get(function() {
  return this.availableQuantity <= this.minimumThreshold;
});

// Method to allocate items
inventoryItemSchema.methods.allocate = function(quantity, traineeId, roomNumber, performedBy) {
  if (this.availableQuantity < quantity) {
    throw new Error('Insufficient quantity available');
  }
  
  this.availableQuantity -= quantity;
  this.inUseQuantity += quantity;
  
  this.transactions.push({
    type: 'allocation',
    quantity: quantity,
    traineeId: traineeId,
    roomNumber: roomNumber,
    performedBy: performedBy
  });
  
  return this.save();
};

// Method to return items
inventoryItemSchema.methods.returnItem = function(quantity, traineeId, condition = 'good', performedBy) {
  if (this.inUseQuantity < quantity) {
    throw new Error('Cannot return more items than are in use');
  }
  
  this.inUseQuantity -= quantity;
  
  if (condition === 'good') {
    this.availableQuantity += quantity;
  } else if (condition === 'used') {
    this.usedQuantity += quantity;
  } else if (condition === 'damaged') {
    this.damagedQuantity += quantity;
  }
  
  this.transactions.push({
    type: 'return',
    quantity: quantity,
    traineeId: traineeId,
    notes: `Returned in ${condition} condition`,
    performedBy: performedBy
  });
  
  return this.save();
};

module.exports = mongoose.model('Inventory', inventoryItemSchema);