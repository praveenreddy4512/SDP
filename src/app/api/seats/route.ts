import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Define a local interface that matches the Prisma Seat model
interface SeatModel {
  id: string;
  tripId: string;
  seatNumber: number;
  status: 'AVAILABLE' | 'BOOKED' | 'RESERVED' | 'UNAVAILABLE';
  ticketId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export async function GET(request: NextRequest) {
  try {
    console.log("Seats API called with URL:", request.url);
    const searchParams = request.nextUrl.searchParams;
    const tripId = searchParams.get("tripId");
    
    if (!tripId) {
      console.warn("API called without tripId parameter");
      return NextResponse.json(
        { error: "Trip ID is required" },
        { status: 400 }
      );
    }

    console.log("Fetching seats for trip ID:", tripId);

    // First verify the trip exists
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: { bus: true }
    });

    if (!trip) {
      console.error("Trip not found:", tripId);
      return NextResponse.json(
        { error: "Trip not found" },
        { status: 404 }
      );
    }

    // Get seats for the trip
    const seats = await prisma.seat.findMany({
      where: {
        tripId: tripId
      },
      orderBy: {
        seatNumber: 'asc'
      }
    });

    console.log(`Found ${seats.length} seats for trip ${tripId}`);

    // If no seats are found, we might need to create them
    if (seats.length === 0) {
      console.warn(`No seats found for trip ${tripId}. Creating default seats.`);
      
      // Create default seats for this trip
      const totalSeats = trip.bus.totalSeats || 40; // Fallback to 40 if not specified
      const defaultSeats = [];
      
      for (let i = 1; i <= totalSeats; i++) {
        defaultSeats.push({
          tripId,
          seatNumber: i,
          status: 'AVAILABLE'
        });
      }
      
      // Create seats in bulk
      await prisma.seat.createMany({
        data: defaultSeats,
        skipDuplicates: true
      });
      
      // Fetch the newly created seats
      const createdSeats = await prisma.seat.findMany({
        where: { tripId },
        orderBy: { seatNumber: 'asc' }
      });
      
      console.log(`Created ${createdSeats.length} default seats for trip ${tripId}`);
      
      const formattedCreatedSeats = createdSeats.map((seat: SeatModel) => ({
        id: seat.id,
        seatNumber: seat.seatNumber.toString(),
        status: seat.status
      }));
      
      return NextResponse.json(formattedCreatedSeats);
    }

    // Format seat data for response
    const formattedSeats = seats.map((seat: SeatModel) => ({
      id: seat.id,
      seatNumber: seat.seatNumber.toString(),
      status: seat.status
    }));

    return NextResponse.json(formattedSeats);
  } catch (error) {
    console.error("Error fetching seats:", error);
    return NextResponse.json(
      { error: "Failed to fetch seats", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
} 