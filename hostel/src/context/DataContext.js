"use client"

import { createContext, useContext, useState } from "react"
import { traineeData as initialTraineeData, roomData as initialRoomData } from "../data/traineeData"

const DataContext = createContext()

export const DataProvider = ({ children }) => {
  const [trainees, setTrainees] = useState(initialTraineeData)
  const [rooms, setRooms] = useState(initialRoomData)
  const [linenInventory, setLinenInventory] = useState({
    totalLinen: 150,
    availableLinen: 60,
    inUseLinen: 40,
    usedLinen: 50,
  })

  const [blanketInventory, setBlanketInventory] = useState({
    totalBlanket: 120,
    availableBlanket: 45,
    inUseBlanket: 35,
    usedBlanket: 40,
  })

  // Get all trainees from current state (not static data)
  const getAllTrainees = () => {
    return [...trainees.A, ...trainees.B, ...trainees.C]
  }

  // Calculate occupancy statistics
  const getOccupancyStats = () => {
    const allRooms = [...rooms.A, ...rooms.B, ...rooms.C]
    const totalRooms = allRooms.length
    const occupiedRooms = allRooms.filter((room) => room.status === "occupied").length
    const vacantRooms = allRooms.filter((room) => room.status === "vacant").length

    return {
      total: totalRooms,
      occupied: occupiedRooms,
      vacant: vacantRooms,
      occupancyPercentage: totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0,
      vacancyPercentage: totalRooms > 0 ? Math.round((vacantRooms / totalRooms) * 100) : 0,
    }
  }

  // Find which block a trainee belongs to based on their ID
  const findTraineeBlock = (traineeId) => {
    if (trainees.A.find((t) => t.id === traineeId)) return "A"
    if (trainees.B.find((t) => t.id === traineeId)) return "B"
    if (trainees.C.find((t) => t.id === traineeId)) return "C"
    return null
  }

  // Find which block a room belongs to based on room number
  const findRoomBlock = (roomNumber) => {
    const num = Number.parseInt(roomNumber)
    if (num >= 1 && num <= 43) return "A"
    if (num >= 44 && num <= 86) return "B"
    if (num >= 87 && num <= 114) return "C"
    return "A" // default
  }

  // Allocate room to trainee
  const allocateRoom = (traineeData, roomNumber, block) => {
    console.log("Allocating room:", roomNumber, "in block:", block, "to trainee:", traineeData.name)
    console.log("Trainee amenities:", traineeData.amenities)

    const roomNum = Number.parseInt(roomNumber)

    // Check if room exists and is vacant
    const room = rooms[block].find((r) => r.number === roomNum)
    if (!room) {
      throw new Error("Room does not exist")
    }
    if (room.status !== "vacant") {
      throw new Error("Room is not available")
    }

    const newTrainee = {
      ...traineeData,
      id: `ID${Date.now()}`,
      roomNumber: roomNum,
      status: "staying",
    }

    // Add trainee to the appropriate block
    setTrainees((prev) => {
      const updated = {
        ...prev,
        [block]: [...prev[block], newTrainee],
      }
      console.log("Updated trainees:", updated)
      return updated
    })

    // Update room status
    setRooms((prev) => {
      const updated = {
        ...prev,
        [block]: prev[block].map((room) =>
          room.number === roomNum ? { ...room, status: "occupied", trainee: newTrainee.name, id: newTrainee.id } : room,
        ),
      }
      console.log("Updated rooms:", updated)
      return updated
    })

    // Update linen inventory if linen is allocated
    if (traineeData.amenities?.linen) {
      console.log("Allocating linen - updating inventory")
      setLinenInventory((prev) => {
        const updated = {
          ...prev,
          availableLinen: Math.max(0, prev.availableLinen - 1),
          inUseLinen: prev.inUseLinen + 1,
        }
        console.log("Updated linen inventory:", updated)
        return updated
      })
    }

    // Update blanket inventory if blanket is allocated
    if (traineeData.amenities?.blanket) {
      console.log("Allocating blanket - updating inventory")
      setBlanketInventory((prev) => {
        const updated = {
          ...prev,
          availableBlanket: Math.max(0, prev.availableBlanket - 1),
          inUseBlanket: prev.inUseBlanket + 1,
        }
        console.log("Updated blanket inventory:", updated)
        return updated
      })
    }

    return newTrainee
  }

  // Deallocate room (completely remove trainee)
  const deallocateRoom = (traineeId, block) => {
    console.log("Deallocating room for trainee:", traineeId, "in block:", block)

    const trainee = trainees[block].find((t) => t.id === traineeId)
    if (!trainee) {
      console.error("Trainee not found:", traineeId)
      return false
    }

    // Check if trainee had amenities to update inventory
    const hadLinen = trainee.amenities?.linen
    const hadBlanket = trainee.amenities?.blanket

    // Remove trainee
    setTrainees((prev) => ({
      ...prev,
      [block]: prev[block].filter((t) => t.id !== traineeId),
    }))

    // Update room status
    if (trainee.roomNumber) {
      setRooms((prev) => ({
        ...prev,
        [block]: prev[block].map((room) =>
          room.number === trainee.roomNumber ? { ...room, status: "vacant", trainee: null, id: null } : room,
        ),
      }))
    }

    // Update linen inventory if trainee had linen
    if (hadLinen) {
      setLinenInventory((prev) => ({
        ...prev,
        availableLinen: prev.availableLinen + 1,
        inUseLinen: Math.max(0, prev.inUseLinen - 1),
      }))
    }

    // Update blanket inventory if trainee had blanket
    if (hadBlanket) {
      setBlanketInventory((prev) => ({
        ...prev,
        availableBlanket: prev.availableBlanket + 1,
        inUseBlanket: Math.max(0, prev.inUseBlanket - 1),
      }))
    }

    return true
  }

  // Checkout trainee (keep trainee data but free room and move amenities to used)
  const checkoutTrainee = (traineeId) => {
    console.log("Checking out trainee:", traineeId)

    // Find which block the trainee is in
    const block = findTraineeBlock(traineeId)
    if (!block) {
      console.error("Trainee not found:", traineeId)
      return false
    }

    const trainee = trainees[block].find((t) => t.id === traineeId)
    if (!trainee) {
      console.error("Trainee not found in block:", traineeId, block)
      return false
    }

    if (trainee.status !== "staying") {
      console.error("Trainee is not currently staying:", traineeId)
      return false
    }

    console.log("Found trainee:", trainee, "in block:", block)

    // Check if trainee had amenities
    const hadLinen = trainee.amenities?.linen
    const hadBlanket = trainee.amenities?.blanket

    // Update trainee status to checked_out and remove room number
    setTrainees((prev) => {
      const updated = {
        ...prev,
        [block]: prev[block].map((t) => (t.id === traineeId ? { 
          ...t, 
          status: "checked_out", 
          roomNumber: null,
          bedNumber: null,
          checkOutDate: new Date().toLocaleDateString('en-GB').split('/').join('.')
        } : t)),
      }
      console.log("Updated trainees after checkout:", updated)
      return updated
    })

    // Update room status to vacant if trainee had a room
    if (trainee.roomNumber) {
      setRooms((prev) => {
        const updated = {
          ...prev,
          [block]: prev[block].map((room) =>
            room.number === trainee.roomNumber ? { ...room, status: "vacant", trainee: null, id: null } : room,
          ),
        }
        console.log("Updated rooms after checkout:", updated)
        return updated
      })
    }

    // Update linen inventory - move from in-use to used
    if (hadLinen) {
      console.log("Moving linen from in-use to used")
      setLinenInventory((prev) => {
        const updated = {
          ...prev,
          inUseLinen: Math.max(0, prev.inUseLinen - 1),
          usedLinen: prev.usedLinen + 1,
        }
        console.log("Updated linen inventory after checkout:", updated)
        return updated
      })
    }

    // Update blanket inventory - move from in-use to used
    if (hadBlanket) {
      console.log("Moving blanket from in-use to used")
      setBlanketInventory((prev) => {
        const updated = {
          ...prev,
          inUseBlanket: Math.max(0, prev.inUseBlanket - 1),
          usedBlanket: prev.usedBlanket + 1,
        }
        console.log("Updated blanket inventory after checkout:", updated)
        return updated
      })
    }

    return true
  }

  // Update trainee information
  const updateTrainee = (traineeId, updatedData) => {
    const block = findTraineeBlock(traineeId)
    if (!block) return false

    const oldTrainee = trainees[block].find((t) => t.id === traineeId)
    if (!oldTrainee) return false

    // Update trainee data
    setTrainees((prev) => ({
      ...prev,
      [block]: prev[block].map((t) => (t.id === traineeId ? { ...t, ...updatedData } : t)),
    }))

    // If room number changed and trainee is staying, update room data
    if (updatedData.roomNumber && oldTrainee.roomNumber !== updatedData.roomNumber && oldTrainee.status === "staying") {
      // Free old room
      if (oldTrainee.roomNumber) {
        setRooms((prev) => ({
          ...prev,
          [block]: prev[block].map((room) =>
            room.number === oldTrainee.roomNumber ? { ...room, status: "vacant", trainee: null, id: null } : room,
          ),
        }))
      }

      // Occupy new room
      const newBlock = findRoomBlock(updatedData.roomNumber)
      setRooms((prev) => ({
        ...prev,
        [newBlock]: prev[newBlock].map((room) =>
          room.number === updatedData.roomNumber
            ? { ...room, status: "occupied", trainee: updatedData.name || oldTrainee.name, id: traineeId }
            : room,
        ),
      }))
    } else if (updatedData.name && oldTrainee.status === "staying" && oldTrainee.roomNumber) {
      // Update trainee name in room data
      setRooms((prev) => ({
        ...prev,
        [block]: prev[block].map((room) => (room.id === traineeId ? { ...room, trainee: updatedData.name } : room)),
      }))
    }

    return true
  }

  // Add new room
  const addRoom = (roomData, block) => {
    console.log("Adding room:", roomData, "to block:", block)

    const newRoom = {
      ...roomData,
      block: block,
      trainee: null,
      id: null,
    }

    setRooms((prev) => {
      const updatedRooms = {
        ...prev,
        [block]: [...prev[block], newRoom].sort((a, b) => a.number - b.number),
      }
      console.log("Updated rooms after adding:", updatedRooms)
      return updatedRooms
    })

    return true
  }

  // Update room information
  const updateRoom = (roomNumber, block, updatedData) => {
    console.log("Updating room:", roomNumber, "in block:", block, "with data:", updatedData)

    setRooms((prev) => ({
      ...prev,
      [block]: prev[block].map((room) => (room.number === roomNumber ? { ...room, ...updatedData } : room)),
    }))

    return true
  }

  // Delete room
  const deleteRoom = (roomNumber, block) => {
    console.log("Deleting room:", roomNumber, "from block:", block)

    const room = rooms[block].find((r) => r.number === roomNumber)
    if (!room) {
      console.error("Room not found:", roomNumber)
      return false
    }

    // If room is occupied, checkout the trainee first
    if (room.status === "occupied" && room.id) {
      console.log("Room is occupied, checking out trainee first:", room.id)
      checkoutTrainee(room.id)
    }

    // Remove room
    setRooms((prev) => {
      const updated = {
        ...prev,
        [block]: prev[block].filter((room) => room.number !== roomNumber),
      }
      console.log("Updated rooms after deletion:", updated)
      return updated
    })

    return true
  }

  // Update linen inventory
  const updateLinenInventory = (updates) => {
    setLinenInventory((prev) => ({ ...prev, ...updates }))
  }

  const updateBlanketInventory = (updates) => {
    setBlanketInventory((prev) => ({ ...prev, ...updates }))
  }

  const value = {
    trainees,
    rooms,
    linenInventory,
    blanketInventory,
    setTrainees,
    setRooms,
    getAllTrainees,
    getOccupancyStats,
    allocateRoom,
    deallocateRoom,
    checkoutTrainee,
    updateTrainee,
    addRoom,
    updateRoom,
    deleteRoom,
    updateLinenInventory,
    updateBlanketInventory,
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export const useData = () => {
  const context = useContext(DataContext)
  if (!context) {
    throw new Error("useData must be used within a DataProvider")
  }
  return context
}
