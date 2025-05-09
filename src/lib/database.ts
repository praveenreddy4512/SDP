import { PrismaClient } from '@prisma/client';
import { prisma } from "@/lib/prisma";

/**
 * Initialize the database connection.
 * This function performs an initial connection test.
 */
export const initDatabase = async () => {
  try {
    // Test the connection by running a simple query
    await prisma.$connect();
    console.log('Database connection established successfully.');
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
};

/**
 * Get a list of routes from the database.
 */
export const getRoutes = async () => {
  try {
    const routes = await prisma.route.findMany({
      include: {
        buses: true,
      },
    });
    return routes;
  } catch (error) {
    console.error('Failed to get routes:', error);
    return [];
  }
};

/**
 * Get a specific route by ID.
 */
export const getRouteById = async (routeId: string) => {
  try {
    const route = await prisma.route.findUnique({
      where: { id: routeId },
      include: {
        buses: true,
        machines: true,
      },
    });
    return route;
  } catch (error) {
    console.error(`Failed to get route with ID ${routeId}:`, error);
    return null;
  }
};

/**
 * Get machine information by ID.
 */
export const getMachineById = async (machineId: string) => {
  try {
    const machine = await prisma.machine.findUnique({
      where: { id: machineId },
      include: {
        route: true,
      },
    });
    return machine;
  } catch (error) {
    console.error(`Failed to get machine with ID ${machineId}:`, error);
    return null;
  }
};

/**
 * Get trips for a specific route, filtered by time of day if specified.
 */
export const getTripsForRoute = async (
  routeId: string,
  timeSlot?: 'MORNING' | 'AFTERNOON' | 'EVENING',
  busType?: string
) => {
  try {
    // Define time ranges for different time slots
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let startTime = today;
    let endTime = new Date(tomorrow);
    endTime.setHours(23, 59, 59);

    if (timeSlot) {
      if (timeSlot === 'MORNING') {
        startTime = new Date(today);
        startTime.setHours(5, 0, 0);
        endTime = new Date(today);
        endTime.setHours(11, 59, 59);
      } else if (timeSlot === 'AFTERNOON') {
        startTime = new Date(today);
        startTime.setHours(12, 0, 0);
        endTime = new Date(today);
        endTime.setHours(17, 59, 59);
      } else if (timeSlot === 'EVENING') {
        startTime = new Date(today);
        startTime.setHours(18, 0, 0);
        endTime = new Date(tomorrow);
        endTime.setHours(4, 59, 59);
      }
    }

    const buses = await prisma.bus.findMany({
      where: {
        routeId,
        ...(busType && { busType: busType as any }),
      },
      include: {
        vendor: true,
      },
    });

    const busIds = buses.map((bus) => bus.id);

    let trips = await prisma.trip.findMany({
      where: {
        busId: { in: busIds },
        departureTime: {
          gte: startTime,
          lte: endTime,
        },
      },
      include: {
        bus: {
          include: {
            route: true,
            vendor: true,
          },
        },
      },
      orderBy: {
        departureTime: 'asc',
      },
    });

    return trips;
  } catch (error) {
    console.error(`Failed to get trips for route ${routeId}:`, error);
    return [];
  }
};

/**
 * Get seat information for a specific trip.
 */
export const getSeatsForTrip = async (tripId: string) => {
  try {
    const seats = await prisma.seat.findMany({
      where: { tripId },
      orderBy: { seatNumber: 'asc' },
    });
    return seats;
  } catch (error) {
    console.error(`Failed to get seats for trip ${tripId}:`, error);
    return [];
  }
};

/**
 * Book a ticket for a trip.
 */
export const bookTicket = async (
  tripId: string,
  seatNumber: number,
  passengerName: string,
  passengerPhone: string,
  paymentType: 'CASH' | 'QR',
  price: number,
  machineId?: string
) => {
  try {
    // Generate a unique QR code
    const qrCode = `TICKET-${tripId}-${seatNumber}-${Date.now()}`;

    // Create the ticket and update the seat in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Find the seat and check if it's available
      const seat = await tx.seat.findFirst({
        where: {
          tripId,
          seatNumber,
          status: 'AVAILABLE',
        },
      });

      if (!seat) {
        throw new Error('Seat is not available');
      }

      // Create a new ticket
      const ticket = await tx.ticket.create({
        data: {
          tripId,
          price,
          passengerName,
          passengerPhone,
          paymentType,
          paymentStatus: 'COMPLETED',
          qrCode,
          machineId,
        },
      });

      // Update the seat to link it to the ticket
      await tx.seat.update({
        where: { id: seat.id },
        data: {
          status: 'BOOKED',
          ticketId: ticket.id,
        },
      });

      // Update the available seats count in the trip
      await tx.trip.update({
        where: { id: tripId },
        data: {
          availableSeats: {
            decrement: 1,
          },
        },
      });

      // Create a transaction record
      await tx.transaction.create({
        data: {
          amount: price,
          type: 'PAYMENT',
          status: 'COMPLETED',
          ticketId: ticket.id,
          paymentMethod: paymentType,
          referenceId: qrCode,
        },
      });

      return ticket;
    });

    return result;
  } catch (error) {
    console.error('Failed to book ticket:', error);
    throw error;
  }
};

/**
 * Cancel a ticket and issue a refund.
 */
export const cancelTicket = async (ticketId: string) => {
  try {
    const result = await prisma.$transaction(async (tx) => {
      // Find the ticket
      const ticket = await tx.ticket.findUnique({
        where: { id: ticketId },
        include: {
          seat: true,
        },
      });

      if (!ticket) {
        throw new Error('Ticket not found');
      }

      if (ticket.status !== 'BOOKED') {
        throw new Error('Ticket is already cancelled or refunded');
      }

      // Update the ticket status
      const updatedTicket = await tx.ticket.update({
        where: { id: ticketId },
        data: {
          status: 'CANCELLED',
          paymentStatus: 'REFUNDED',
        },
      });

      // Update the seat status
      if (ticket.seat) {
        await tx.seat.update({
          where: { id: ticket.seat.id },
          data: {
            status: 'AVAILABLE',
            ticketId: null,
          },
        });
      }

      // Update the available seats count in the trip
      await tx.trip.update({
        where: { id: ticket.tripId },
        data: {
          availableSeats: {
            increment: 1,
          },
        },
      });

      // Create a refund transaction
      await tx.transaction.create({
        data: {
          amount: ticket.price,
          type: 'REFUND',
          status: 'COMPLETED',
          ticketId: ticket.id,
          paymentMethod: ticket.paymentType,
          referenceId: `REFUND-${ticket.qrCode}`,
        },
      });

      return updatedTicket;
    });

    return result;
  } catch (error) {
    console.error('Failed to cancel ticket:', error);
    throw error;
  }
}; 