# Hostel Management System - Backend API

A comprehensive Node.js backend API for managing hostel operations including room allocation, trainee management, inventory tracking, and reporting.

## Features

- **Authentication & Authorization**: JWT-based authentication with role-based access control
- **Trainee Management**: Complete CRUD operations for trainee records
- **Room Management**: Room allocation, occupancy tracking, and maintenance records
- **Inventory Management**: Track amenities, supplies, and equipment
- **Reporting**: Comprehensive reports for occupancy, inventory, and financial data
- **Dashboard**: Real-time statistics and analytics
- **Data Validation**: Robust input validation using Joi
- **Error Handling**: Centralized error handling with detailed logging

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Joi
- **Security**: Helmet, CORS, Rate Limiting
- **Logging**: Morgan
- **Date Handling**: Moment.js

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Configure environment variables in `.env`:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/hostel_management
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:3000
```

5. Start MongoDB service on your system

6. Seed the database with sample data:
```bash
node scripts/seedData.js
```

7. Start the development server:
```bash
npm run dev
```

The API will be available at `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/change-password` - Change password
- `POST /api/auth/logout` - Logout user

### Trainees
- `GET /api/trainees` - Get all trainees (with filtering)
- `GET /api/trainees/:id` - Get trainee by ID
- `POST /api/trainees` - Create new trainee
- `PUT /api/trainees/:id` - Update trainee
- `PUT /api/trainees/:id/checkout` - Checkout trainee
- `DELETE /api/trainees/:id` - Delete trainee
- `GET /api/trainees/block/:block` - Get trainees by block

### Rooms
- `GET /api/rooms` - Get all rooms (with filtering)
- `GET /api/rooms/block/:block` - Get rooms by block
- `GET /api/rooms/:block/:number` - Get specific room
- `POST /api/rooms` - Create new room
- `PUT /api/rooms/:block/:number` - Update room
- `DELETE /api/rooms/:block/:number` - Delete room
- `GET /api/rooms/stats/occupancy` - Get occupancy statistics
- `GET /api/rooms/available/:block?` - Get available rooms
- `POST /api/rooms/:block/:number/maintenance` - Add maintenance record

### Allotments
- `POST /api/allotments/allocate` - Allocate room to trainee
- `POST /api/allotments/deallocate` - Deallocate room
- `POST /api/allotments/transfer` - Transfer trainee to different room
- `GET /api/allotments/history` - Get allotment history
- `GET /api/allotments/current` - Get current allotments
- `POST /api/allotments/extend` - Extend trainee stay

### Amenities/Inventory
- `GET /api/amenities` - Get all inventory items
- `GET /api/amenities/:id` - Get inventory item by ID
- `POST /api/amenities` - Create new inventory item
- `PUT /api/amenities/:id` - Update inventory item
- `DELETE /api/amenities/:id` - Delete inventory item
- `POST /api/amenities/allocate` - Allocate amenity to trainee
- `POST /api/amenities/return` - Return amenity from trainee
- `GET /api/amenities/trainee/:traineeId` - Get trainee amenities
- `GET /api/amenities/trainees/all` - Get all trainee amenities
- `GET /api/amenities/summary/category` - Get inventory summary
- `GET /api/amenities/alerts/low-stock` - Get low stock alerts
- `POST /api/amenities/:id/restock` - Restock inventory item

### Reports
- `GET /api/reports/occupancy` - Get occupancy report
- `GET /api/reports/inventory` - Get inventory report
- `GET /api/reports/trainees` - Get trainee report
- `GET /api/reports/financial` - Get financial report
- `GET /api/reports/dashboard` - Get dashboard summary
- `GET /api/reports/export/:type` - Export report data

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/room-layout/:block` - Get room layout for block
- `GET /api/dashboard/activities` - Get recent activities
- `GET /api/dashboard/upcoming` - Get upcoming events
- `GET /api/dashboard/inventory-alerts` - Get inventory alerts
- `GET /api/dashboard/trends/occupancy` - Get occupancy trends

## Data Models

### User
- username, email, password, fullName, role, isActive
- Roles: admin, manager, staff

### Trainee
- traineeId, name, designation, division, mobile
- roomNumber, bedNumber, block
- checkInDate, checkOutDate, expectedCheckOutDate
- status (staying, checked_out, extended)
- emergencyContact, amenities

### Room
- number, block, type, status, beds, floor
- amenities (furniture, electrical, other)
- occupants, maintenanceHistory

### Inventory
- name, category, quantities (total, available, inUse, used, damaged)
- unit, minimumThreshold, costPerUnit
- supplier, transactions

## Authentication

All API endpoints (except auth routes) require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Default Users

After running the seed script, you can login with:

- **Admin**: username=`admin`, password=`admin123`
- **Manager**: username=`manager`, password=`manager123`

## Error Handling

The API uses standardized error responses:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error information"
}
```

## Security Features

- JWT authentication
- Password hashing with bcrypt
- Rate limiting
- CORS protection
- Helmet security headers
- Input validation and sanitization

## Development

### Scripts
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run tests (when implemented)

### Database Seeding
Run the seed script to populate the database with sample data:
```bash
node scripts/seedData.js
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.