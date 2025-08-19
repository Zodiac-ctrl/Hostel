const Joi = require('joi');

// User validation schemas
const registerSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  fullName: Joi.string().min(2).max(100).required(),
  role: Joi.string().valid('admin', 'manager', 'staff').default('staff')
});

const loginSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required()
});

// Trainee validation schemas
const traineeSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  designation: Joi.string().valid('SSE', 'JE', 'Tech-I', 'Tech-II', 'AJE').required(),
  division: Joi.string().min(1).max(50).required(),
  mobile: Joi.string().pattern(/^[0-9]{10}$/).required(),
  roomNumber: Joi.number().integer().min(1).max(200),
  bedNumber: Joi.number().integer().min(1).max(4).default(1),
  checkInDate: Joi.date().required(),
  expectedCheckOutDate: Joi.date().greater(Joi.ref('checkInDate')).required(),
  trainingUnder: Joi.string().max(100),
  emergencyContact: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    contact: Joi.string().pattern(/^[0-9]{10}$/).required(),
    relation: Joi.string().min(2).max(50).required(),
    place: Joi.string().min(2).max(100).required()
  }).required(),
  amenities: Joi.array().items(Joi.object({
    name: Joi.string().required(),
    quantity: Joi.number().integer().min(1).default(1)
  }))
});

// Room validation schemas
const roomSchema = Joi.object({
  number: Joi.number().integer().min(1).max(200).required(),
  block: Joi.string().valid('A', 'B', 'C').required(),
  type: Joi.string().valid('Single', 'Double', 'Triple', 'Quad', 'Store', 'Office', 'Caretaker Room', 'Contractor Room', 'Damage', 'Condemn', 'GYM ROOM', 'Emergency', 'NO FURNITURE', 'Prohibited').required(),
  status: Joi.string().valid('vacant', 'occupied', 'blocked', 'store', 'maintenance').default('vacant'),
  beds: Joi.number().integer().min(0).max(4).required()
});

// Inventory validation schemas
const inventorySchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  category: Joi.string().valid('linen', 'blanket', 'furniture', 'electrical', 'cleaning', 'other').required(),
  totalQuantity: Joi.number().integer().min(0).required(),
  availableQuantity: Joi.number().integer().min(0).required(),
  unit: Joi.string().valid('piece', 'set', 'pair', 'meter', 'kg', 'liter').required(),
  minimumThreshold: Joi.number().integer().min(0).default(10),
  costPerUnit: Joi.number().min(0)
});

// Validation middleware
const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        details: error.details.map(detail => detail.message)
      });
    }
    next();
  };
};

module.exports = {
  validate,
  registerSchema,
  loginSchema,
  traineeSchema,
  roomSchema,
  inventorySchema
};