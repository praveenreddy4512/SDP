import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const routeId = searchParams.get('routeId');
    
    if (!routeId) {
      return NextResponse.json(
        { error: "Route ID is required" },
        { status: 400 }
      );
    }
    
    // First, get the route details
    const route = await prisma.route.findUnique({
      where: { id: routeId }
    });
    
    if (!route) {
      return NextResponse.json(
        { error: "Route not found" },
        { status: 404 }
      );
    }
    
    // Get all buses for the given route
    const buses = await prisma.bus.findMany({
      where: { 
        routeId: routeId,
        isActive: true
      }
    });
    
    // Get all trips for these buses
    const busIds = buses.map(bus => bus.id);
    
    // Get trips
    const trips = await prisma.trip.findMany({
      where: {
        busId: { in: busIds },
        status: 'SCHEDULED',
        departureTime: {
          gt: new Date() // Only future trips
        }
      },
      orderBy: {
        departureTime: 'asc'
      },
      include: {
        bus: true
      }
    });
    
    // Format the response to match the expected structure in the client
    const formattedTrips = trips.map(trip => {
      // Find the matching bus
      const bus = buses.find(b => b.id === trip.busId);
      
      return {
        id: trip.id,
        departureTime: trip.departureTime,
        availableSeats: trip.availableSeats,
        fare: calculateFare(route.basePrice, bus?.busType),
        bus: {
          id: trip.bus.id,
          name: trip.bus.busType || 'Bus', // Using busType as name
          busNumber: trip.bus.busNumber || 'N/A'
        },
        route: {
          id: route.id,
          name: route.name,
          source: route.source,
          destination: route.destination
        }
      };
    });
    
    return NextResponse.json(formattedTrips);
  } catch (error) {
    console.error("Error fetching trips:", error);
    return NextResponse.json(
      { error: "Failed to fetch trips" },
      { status: 500 }
    );
  }
}

// Helper function to calculate fare based on route base price and bus type
function calculateFare(basePrice: number, busType?: string): number {
  const multiplier = busType === 'AC' || busType === 'AC_SLEEPER' || busType === 'AC_SEATER' 
    ? 1.5 
    : busType === 'SLEEPER' 
      ? 1.3 
      : 1;
  
  return Math.round(basePrice * multiplier);
} 