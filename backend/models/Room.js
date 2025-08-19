const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  number: {
    type: Number,
    required: [true, 'Room number is required'],
    min: [1, 'Room number must be at least 1'],
    max: [200, 'Room number cannot exceed 200']
  },
  block: {
    type: String,
    required: [true, 'Block is required'],
    enum: ['A', 'B', 'C']
  },
  type: {
    type: String,
    required: [true, 'Room type is required'],
    enum: ['Single', 'Double', 'Triple', 'Quad', 'Store', 'Office', 'Caretaker Room', 'Contractor Room', 'Damage', 'Condemn', 'GYM ROOM', 'Emergency', 'NO FURNITURE', 'Prohibited']
  },
  status: {
    type: String,
    required: [true, 'Room status is required'],
    enum: ['vacant', 'occupied', 'blocked', 'store', 'maintenance'],
    default: 'vacant'
  },
  beds: {
    type: Number,
    required: [true, 'Number of beds is required'],
    min: [0, 'Number of beds cannot be negative'],
    max: [4, 'Maximum 4 beds per room']
  },
  floor: {
    type: String,
    enum: ['Ground', 'First'],
    required: true
  },
  amenities: {
    furniture: {
      beds: { type: Number, default: 0 },
      tables: { type: Number, default: 0 },
      chairs: { type: Number, default: 0 },
      wardrobes: { type: Number, default: 0 }
    },
    electrical: {
      lights: { type: Number, default: 0 },
      fans: { type: Number, default: 0 },
      switches: { type: Number, default: 0 },
      sockets: { type: Number, default: 0 }
    },
    other: {
      windows: { type: Number, default: 0 },
      doors: { type: Number, default: 1 }
    }
  },
  occupants: [{
    traineeId: {
      type: String,
      ref: 'Trainee'
    },
    bedNumber: {
      type: Number,
      min: 1,
      max: 4
    },
    allocatedDate: {
      type: Date,
      default: Date.now
    }
  }],
  maintenanceHistory: [{
    date: {
      type: Date,
      default: Date.now
    },
    description: String,
    type: {
      type: String,
      enum: ['repair', 'cleaning', 'inspection', 'upgrade']
    },
    cost: Number,
    performedBy: String
  }],
  notes: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index for room number and block (unique combination)
roomSchema.index({ number: 1, block: 1 }, { unique: true });

// Index for efficient queries
roomSchema.index({ status: 1 });
roomSchema.index({ type: 1 });
roomSchema.index({ block: 1 });

// Pre-save middleware to determine floor based on room number and block
roomSchema.pre('save', function(next) {
  if (!this.floor) {
    if (this.block === 'A') {
      this.floor = this.number <= 21 ? 'Ground' : 'First';
    } else if (this.block === 'B') {
      this.floor = this.number <= 64 ? 'Ground' : 'First';
    } else if (this.block === 'C') {
      this.floor = this.number <= 100 ? 'Ground' : 'First';
    }
  }
  
  // Set default bed count based on type
  if (!this.beds && this.type) {
    switch (this.type) {
      case 'Single':
        this.beds = 1;
        break;
      case 'Double':
        this.beds = 2;
        break;
      case 'Triple':
        this.beds = 3;
        break;
      case 'Quad':
        this.beds = 4;
        break;
      default:
        this.beds = 0;
    }
  }
  
  this.updatedAt = Date.now();
  next();
});

// Virtual for occupancy rate
roomSchema.virtual('occupancyRate').get(function() {
  if (this.beds === 0) return 0;
  return (this.occupants.length / this.beds) * 100;
});

// Method to check if room is available
roomSchema.methods.isAvailable = function() {
  return this.status === 'vacant' && this.occupants.length < this.beds;
};

// Method to get available beds
roomSchema.methods.getAvailableBeds = function() {
  return this.beds - this.occupants.length;
};

module.exports = mongoose.model('Room', roomSchema);