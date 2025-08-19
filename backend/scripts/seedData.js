const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('../models/User');
const Room = require('../models/Room');
const Trainee = require('../models/Trainee');
const Inventory = require('../models/Inventory');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hostel_management', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Sample data
const sampleUsers = [
  {
    username: 'admin',
    email: 'admin@hostel.com',
    password: 'admin123',
    fullName: 'System Administrator',
    role: 'admin'
  },
  {
    username: 'manager',
    email: 'manager@hostel.com',
    password: 'manager123',
    fullName: 'Hostel Manager',
    role: 'manager'
  }
];

const sampleRooms = [
  // Block A rooms (1-43)
  ...Array.from({ length: 43 }, (_, i) => {
    const roomNumber = i + 1;
    let type = 'Single';
    let beds = 1;
    let status = 'vacant';
    
    // Special rooms based on your data
    if (roomNumber === 2) {
      type = 'Store';
      beds = 0;
      status = 'store';
    } else if (roomNumber === 3) {
      type = 'Caretaker Room';
      beds = 0;
      status = 'blocked';
    } else if (roomNumber === 9) {
      type = 'Damage';
      beds = 0;
      status = 'blocked';
    } else if (roomNumber === 10) {
      type = 'Contractor Room';
      beds = 0;
      status = 'blocked';
    } else if (roomNumber === 20) {
      type = 'Office';
      beds = 0;
      status = 'blocked';
    } else if ([29, 31, 32].includes(roomNumber)) {
      type = 'Condemn';
      beds = 0;
      status = 'blocked';
    }

    return {
      number: roomNumber,
      block: 'A',
      type,
      status,
      beds,
      floor: roomNumber <= 21 ? 'Ground' : 'First',
      amenities: {
        furniture: { beds, tables: beds > 0 ? 1 : 0, chairs: beds > 0 ? 1 : 0 },
        electrical: { lights: 2, fans: 1, switches: 2, sockets: 2 },
        other: { windows: 1, doors: 1 }
      }
    };
  }),

  // Block B rooms (44-86)
  ...Array.from({ length: 43 }, (_, i) => {
    const roomNumber = i + 44;
    let type = 'Triple';
    let beds = 3;
    let status = 'vacant';
    
    // Special rooms
    if (roomNumber === 49) {
      type = 'Store Room for New Material';
      beds = 0;
      status = 'store';
    } else if ([53, 54, 62, 63, 64, 74, 86].includes(roomNumber)) {
      type = 'Condemn Room';
      beds = 0;
      status = 'blocked';
    } else if (roomNumber === 56) {
      type = 'GYM ROOM';
      beds = 0;
      status = 'blocked';
    } else if (roomNumber === 67) {
      type = 'Occupied by Electrical Staff';
      beds = 0;
      status = 'blocked';
    } else if (roomNumber === 85) {
      type = 'Emergency';
      beds = 0;
      status = 'blocked';
    }

    // Adjust bed counts for specific rooms
    if ([46, 51, 52, 71, 81].includes(roomNumber)) beds = 2;
    if ([47, 55, 61, 73, 82, 84].includes(roomNumber)) beds = 4;

    return {
      number: roomNumber,
      block: 'B',
      type: beds === 0 ? type : beds === 2 ? 'Double' : beds === 3 ? 'Triple' : 'Quad',
      status,
      beds,
      floor: roomNumber <= 64 ? 'Ground' : 'First',
      amenities: {
        furniture: { beds, tables: beds > 0 ? Math.ceil(beds/2) : 0, chairs: beds },
        electrical: { lights: 2, fans: Math.ceil(beds/2), switches: 2, sockets: 2 },
        other: { windows: 1, doors: 1 }
      }
    };
  }),

  // Block C rooms (87-114)
  ...Array.from({ length: 28 }, (_, i) => {
    const roomNumber = i + 87;
    let type = 'Double';
    let beds = 2;
    let status = 'vacant';
    
    // Special rooms
    if ([93, 94, 98, 99, 100, 102, 106, 107, 113, 114].includes(roomNumber)) {
      beds = 0;
      status = 'blocked';
      if (roomNumber === 93) type = 'Condemn Room';
      else if ([94, 98].includes(roomNumber)) type = 'New Furniture Placed in it';
      else if ([99, 100].includes(roomNumber)) type = 'Officer\'s room';
      else if (roomNumber === 102) type = 'NO FURNITURE';
      else if (roomNumber === 106) type = 'Prohibited';
      else if (roomNumber === 107) type = 'Condemn';
      else if ([113, 114].includes(roomNumber)) type = 'NO Furniture';
    }

    // Adjust bed counts
    if ([88, 95, 103, 110].includes(roomNumber)) beds = 4;
    if ([89, 90, 91, 92, 111, 112].includes(roomNumber)) beds = 3;
    if (roomNumber === 104) beds = 1;

    return {
      number: roomNumber,
      block: 'C',
      type: beds === 0 ? type : beds === 1 ? 'Single' : beds === 2 ? 'Double' : beds === 3 ? 'Triple' : 'Quad',
      status,
      beds,
      floor: roomNumber <= 100 ? 'Ground' : 'First',
      amenities: {
        furniture: { beds, tables: beds > 0 ? Math.ceil(beds/2) : 0, chairs: beds },
        electrical: { lights: 2, fans: Math.ceil(beds/2), switches: 2, sockets: 2 },
        other: { windows: 1, doors: 1 }
      }
    };
  })
];

const sampleInventory = [
  {
    name: 'Bedsheet',
    category: 'linen',
    totalQuantity: 150,
    availableQuantity: 60,
    inUseQuantity: 40,
    usedQuantity: 50,
    unit: 'piece',
    minimumThreshold: 20,
    costPerUnit: 500,
    supplier: {
      name: 'Textile Suppliers Ltd',
      contact: '9876543210',
      email: 'supplier@textile.com'
    }
  },
  {
    name: 'Pillow Cover',
    category: 'linen',
    totalQuantity: 150,
    availableQuantity: 60,
    inUseQuantity: 40,
    usedQuantity: 50,
    unit: 'piece',
    minimumThreshold: 20,
    costPerUnit: 200,
    supplier: {
      name: 'Textile Suppliers Ltd',
      contact: '9876543210',
      email: 'supplier@textile.com'
    }
  },
  {
    name: 'Blanket',
    category: 'blanket',
    totalQuantity: 120,
    availableQuantity: 45,
    inUseQuantity: 35,
    usedQuantity: 40,
    unit: 'piece',
    minimumThreshold: 15,
    costPerUnit: 1200,
    supplier: {
      name: 'Blanket Manufacturing Co',
      contact: '9876543211',
      email: 'supplier@blanket.com'
    }
  },
  {
    name: 'Mosquito Repellant',
    category: 'other',
    totalQuantity: 100,
    availableQuantity: 80,
    inUseQuantity: 15,
    usedQuantity: 5,
    unit: 'piece',
    minimumThreshold: 25,
    costPerUnit: 150
  },
  {
    name: 'Electric Kettle',
    category: 'electrical',
    totalQuantity: 50,
    availableQuantity: 30,
    inUseQuantity: 15,
    usedQuantity: 5,
    unit: 'piece',
    minimumThreshold: 10,
    costPerUnit: 2000
  },
  {
    name: 'Key Ring',
    category: 'other',
    totalQuantity: 200,
    availableQuantity: 150,
    inUseQuantity: 40,
    usedQuantity: 10,
    unit: 'piece',
    minimumThreshold: 50,
    costPerUnit: 50
  }
];

// Seed function
async function seedDatabase() {
  try {
    console.log('Starting database seeding...');

    // Clear existing data
    await User.deleteMany({});
    await Room.deleteMany({});
    await Trainee.deleteMany({});
    await Inventory.deleteMany({});

    console.log('Cleared existing data');

    // Create users
    const users = await User.create(sampleUsers);
    console.log(`Created ${users.length} users`);

    // Create rooms
    const rooms = await Room.create(sampleRooms);
    console.log(`Created ${rooms.length} rooms`);

    // Create inventory items
    const inventory = await Inventory.create(sampleInventory);
    console.log(`Created ${inventory.length} inventory items`);

    console.log('Database seeding completed successfully!');
    console.log('\nDefault login credentials:');
    console.log('Admin: username=admin, password=admin123');
    console.log('Manager: username=manager, password=manager123');

  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run seeding
seedDatabase();