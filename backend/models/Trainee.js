const mongoose = require('mongoose');

const emergencyContactSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Emergency contact name is required'],
    trim: true
  },
  contact: {
    type: String,
    required: [true, 'Emergency contact number is required'],
    match: [/^[0-9]{10}$/, 'Emergency contact must be a 10-digit number']
  },
  relation: {
    type: String,
    required: [true, 'Relation is required'],
    trim: true
  },
  place: {
    type: String,
    required: [true, 'Place is required'],
    trim: true
  }
});

const amenitySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    default: 1,
    min: 1
  },
  allocated: {
    type: Boolean,
    default: true
  },
  allocatedDate: {
    type: Date,
    default: Date.now
  }
});

const traineeSchema = new mongoose.Schema({
  traineeId: {
    type: String,
    unique: true,
    required: true
  },
  name: {
    type: String,
    required: [true, 'Trainee name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  designation: {
    type: String,
    required: [true, 'Designation is required'],
    enum: ['SSE', 'JE', 'Tech-I', 'Tech-II', 'AJE']
  },
  division: {
    type: String,
    required: [true, 'Division is required'],
    trim: true
  },
  mobile: {
    type: String,
    required: [true, 'Mobile number is required'],
    match: [/^[0-9]{10}$/, 'Mobile number must be a 10-digit number']
  },
  roomNumber: {
    type: Number,
    min: 1,
    max: 200
  },
  bedNumber: {
    type: Number,
    min: 1,
    max: 4,
    default: 1
  },
  block: {
    type: String,
    enum: ['A', 'B', 'C']
  },
  checkInDate: {
    type: Date,
    required: [true, 'Check-in date is required']
  },
  checkOutDate: {
    type: Date
  },
  expectedCheckOutDate: {
    type: Date,
    required: [true, 'Expected check-out date is required']
  },
  status: {
    type: String,
    enum: ['staying', 'checked_out', 'extended'],
    default: 'staying'
  },
  trainingUnder: {
    type: String,
    trim: true
  },
  emergencyContact: emergencyContactSchema,
  amenities: [amenitySchema],
  // Legacy amenity fields for backward compatibility
  linen: {
    type: Boolean,
    default: false
  },
  blanket: {
    type: Boolean,
    default: false
  },
  bed: {
    type: Boolean,
    default: true
  },
  table: {
    type: Boolean,
    default: false
  },
  chair: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Auto-generate trainee ID
traineeSchema.pre('save', async function(next) {
  if (!this.traineeId) {
    const count = await mongoose.model('Trainee').countDocuments();
    this.traineeId = `ID${String(count + 1).padStart(3, '0')}`;
  }
  
  // Determine block based on room number
  if (this.roomNumber && !this.block) {
    if (this.roomNumber >= 1 && this.roomNumber <= 43) {
      this.block = 'A';
    } else if (this.roomNumber >= 44 && this.roomNumber <= 86) {
      this.block = 'B';
    } else if (this.roomNumber >= 87 && this.roomNumber <= 114) {
      this.block = 'C';
    }
  }
  
  this.updatedAt = Date.now();
  next();
});

// Index for efficient queries
traineeSchema.index({ traineeId: 1 });
traineeSchema.index({ roomNumber: 1, block: 1 });
traineeSchema.index({ status: 1 });
traineeSchema.index({ checkInDate: 1, checkOutDate: 1 });

module.exports = mongoose.model('Trainee', traineeSchema);