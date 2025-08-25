// Comprehensive trainee data extracted from the PDF with bed information
export const traineeData = {
  A: [],
  B: [],
  C: []
}

// Room data based on the OCR information with bed counts
export const roomData = {
  A: Array.from({ length: 43 }, (_, i) => {
    const roomNumber = i + 1

    // Special rooms based on OCR data
    if (roomNumber === 2) {
      return { number: roomNumber, status: "store", type: "Store", beds: 0, block: "A" }
    }
    if (roomNumber === 3) {
      return { number: roomNumber, status: "blocked", type: "Caretaker Room", beds: 0, block: "A" }
    }
    if (roomNumber === 9) {
      return { number: roomNumber, status: "blocked", type: "Damage", beds: 0, block: "A" }
    }
    if (roomNumber === 10) {
      return { number: roomNumber, status: "blocked", type: "Contractor Room", beds: 0, block: "A" }
    }
    if (roomNumber === 20) {
      return { number: roomNumber, status: "blocked", type: "Office", beds: 0, block: "A" }
    }
    if ([29, 31, 32].includes(roomNumber)) {
      return { number: roomNumber, status: "blocked", type: "Condemn", beds: 0, block: "A" }
    }
    if ([36, 43].includes(roomNumber)) {
      return { number: roomNumber, status: "vacant", type: "Single", beds: 1, block: "A" }
    }

    return { number: roomNumber, status: "vacant", type: "Single", beds: 1, block: "A" }
  }),

  B: Array.from({ length: 43 }, (_, i) => {
    const roomNumber = i + 44

    // Special rooms based on OCR data
    if (roomNumber === 49) {
      return { number: roomNumber, status: "store", type: "Store Room for New Material", beds: 0, block: "B" }
    }
    if ([53, 54, 62, 63, 64, 74, 86].includes(roomNumber)) {
      return { number: roomNumber, status: "blocked", type: "Condemn Room", beds: 0, block: "B" }
    }
    if (roomNumber === 56) {
      return { number: roomNumber, status: "blocked", type: "GYM ROOM", beds: 0, block: "B" }
    }
    if (roomNumber === 67) {
      return { number: roomNumber, status: "blocked", type: "Occupied by Electrical Staff", beds: 0, block: "B" }
    }
    if (roomNumber === 85) {
      return { number: roomNumber, status: "blocked", type: "Emergency", beds: 0, block: "B" }
    }

    // Determine bed count based on OCR data
    let bedCount = 3 // Default for B block
    if ([45, 46, 50, 57, 59, 61, 73, 75, 82].includes(roomNumber)) {
      bedCount = [45, 50, 57, 59, 73, 75].includes(roomNumber) ? 3 : 4
      if (roomNumber === 46) bedCount = 3
      if (roomNumber === 47) bedCount = 4
      if (roomNumber === 48) bedCount = 4
      if (roomNumber === 51) bedCount = 2
      if (roomNumber === 52) bedCount = 2
      if (roomNumber === 55) bedCount = 4
      if (roomNumber === 60) bedCount = 3
      if (roomNumber === 61) bedCount = 4
      if (roomNumber === 66) bedCount = 3
      if (roomNumber === 68) bedCount = 3
      if (roomNumber === 69) bedCount = 3
      if (roomNumber === 71) bedCount = 2
      if (roomNumber === 73) bedCount = 4
      if (roomNumber === 75) bedCount = 3
      if (roomNumber === 78) bedCount = 3
      if (roomNumber === 81) bedCount = 2
      if (roomNumber === 82) bedCount = 4
      if (roomNumber === 84) bedCount = 4
    }

    // Vacant rooms
    if ([58, 65, 70, 72, 76, 77, 79, 80, 83].includes(roomNumber)) {
      return { number: roomNumber, status: "vacant", type: "Multi", beds: bedCount, block: "B" }
    }

    return { number: roomNumber, status: "vacant", type: "Multi", beds: bedCount, block: "B" }
  }),

  C: Array.from({ length: 28 }, (_, i) => {
    const roomNumber = i + 87

    // Special rooms based on OCR data
    if ([93, 94, 98, 99, 100, 102, 106, 107, 113, 114].includes(roomNumber)) {
      let type = "Store"
      if (roomNumber === 93) type = "Condemn Room"
      if (roomNumber === 94) type = "New Furniture Placed in it"
      if (roomNumber === 98) type = "New Furniture Placed in it"
      if ([99, 100].includes(roomNumber)) type = "Officer's room"
      if (roomNumber === 102) type = "NO FURNITURE"
      if (roomNumber === 106) type = "Prohibited"
      if (roomNumber === 107) type = "Condemn"
      if ([113, 114].includes(roomNumber)) type = "NO Furniture"

      return { number: roomNumber, status: "blocked", type, beds: 0, block: "C" }
    }

    // Determine bed count based on OCR data
    let bedCount = 2 // Default for C block
    if (roomNumber === 88) bedCount = 4
    if (roomNumber === 89) bedCount = 3
    if (roomNumber === 90) bedCount = 3
    if (roomNumber === 91) bedCount = 3
    if (roomNumber === 92) bedCount = 3
    if (roomNumber === 95) bedCount = 4
    if ([96, 97].includes(roomNumber)) bedCount = 3
    if (roomNumber === 101) bedCount = 2
    if (roomNumber === 103) bedCount = 4
    if (roomNumber === 104) bedCount = 1
    if (roomNumber === 105) bedCount = 2
    if (roomNumber === 108) bedCount = 2
    if (roomNumber === 109) bedCount = 2
    if (roomNumber === 110) bedCount = 4
    if (roomNumber === 111) bedCount = 3
    if (roomNumber === 112) bedCount = 3

    // Vacant rooms
    if ([96, 97, 103].includes(roomNumber)) {
      return { number: roomNumber, status: "vacant", type: "Multi", beds: bedCount, block: "C" }
    }

    return { number: roomNumber, status: "vacant", type: "Multi", beds: bedCount, block: "C" }
  }),
}

// Get all trainees across all blocks
export const getAllTrainees = () => {
  return [...traineeData.A, ...traineeData.B, ...traineeData.C]
}

// Get trainee by ID
export const getTraineeById = (id) => {
  const allTrainees = getAllTrainees()
  return allTrainees.find((trainee) => trainee.id === id)
}

// Get trainees by block
export const getTraineesByBlock = (block) => {
  return traineeData[block] || []
}

// Get all rooms
export const getAllRooms = () => {
  return [...roomData.A, ...roomData.B, ...roomData.C]
}

// Get rooms by block
export const getRoomsByBlock = (block) => {
  return roomData[block] || []
}