import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tripId = searchParams.get("tripId");
    
    if (!tripId) {
      return NextResponse.json(
        { error: "Trip ID is required" },
        { status: 400 }
      );
    }

    const seats = await prisma.seat.findMany({
      where: {
        tripId: tripId
      },
      orderBy: {
        seatNumber: 'asc'
      }
    });

    const formattedSeats = seats.map(seat => ({
      id: seat.id,
      seatNumber: seat.seatNumber.toString(),
      status: seat.status
    }));

    return NextResponse.json(formattedSeats);
  } catch (error) {
    console.error("Error fetching seats:", error);
    return NextResponse.json(
      { error: "Failed to fetch seats" },
      { status: 500 }
    );
  }
} 