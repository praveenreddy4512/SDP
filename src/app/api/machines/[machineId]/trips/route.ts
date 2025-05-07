import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  const { machineId } = context.params;
  console.log('GET /api/machines/[machineId]/trips - Request received', { machineId });
  
  try {
    const searchParams = request.nextUrl.searchParams;
    const timeSlot = searchParams.get('timeSlot');
    const busType = searchParams.get('busType');
    
    console.log('Request parameters:', { machineId, timeSlot, busType });

    // Get the machine to get its route
    const machine = await prisma.machine.findUnique({
      where: { id: machineId },
      include: { route: true }
    });

    if (!machine) {
      console.error('Machine not found:', { machineId });
      return NextResponse.json({ error: 'Machine not found' }, { status: 404 });
    }
    
    console.log('Found machine:', { 
      machineId: machine.id, 
      name: machine.name,
      routeId: machine.routeId 
    });

    // Build where conditions for trips query
    const whereConditions: Record<string, any> = {
      bus: {
        routeId: machine.routeId
      },
      departureTime: {
        gte: new Date() // Only future trips
      },
      status: 'SCHEDULED'
    };
    
    console.log('Query conditions:', JSON.stringify(whereConditions, null, 2));

    // Add time slot filtering
    if (timeSlot) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      if (timeSlot === 'MORNING') {
        whereConditions.departureTime = {
          gte: new Date(),
          lt: new Date(new Date().setHours(12, 0, 0, 0))
        };
      } else if (timeSlot === 'AFTERNOON') {
        whereConditions.departureTime = {
          gte: new Date(Math.max(new Date().getTime(), new Date().setHours(12, 0, 0, 0))),
          lt: new Date(new Date().setHours(17, 0, 0, 0))
        };
      } else if (timeSlot === 'EVENING') {
        whereConditions.departureTime = {
          gte: new Date(Math.max(new Date().getTime(), new Date().setHours(17, 0, 0, 0))),
          lt: tomorrow
        };
      }
    }

    // Add bus type filtering
    if (busType) {
      whereConditions.bus.busType = busType;
    }

    // Get all trips for the machine's route with applied filters
    console.log('Executing Prisma query with conditions:', JSON.stringify(whereConditions, null, 2));
    
    const trips = await prisma.trip.findMany({
      where: whereConditions,
      include: {
        bus: {
          include: {
            vendor: true,
            route: true
          }
        }
      },
      orderBy: {
        departureTime: 'asc'
      }
    });
    
    console.log(`Found ${trips.length} trips for route ${machine.routeId}`);
    
    if (trips.length === 0) {
      // Let's check if there are any trips at all for this route
      const allTrips = await prisma.trip.findMany({
        where: {
          bus: {
            routeId: machine.routeId
          }
        },
        take: 5
      });
      
      console.log(`Debug: found ${allTrips.length} total trips for this route (without date/status filters)`);
      
      if (allTrips.length > 0) {
        // Check trip dates
        console.log('Sample trip dates:', allTrips.map((t: any) => ({ 
          id: t.id, 
          departure: t.departureTime,
          status: t.status,
          isPast: t.departureTime < new Date()
        })));
      }
    }

    // Format the trips with available seats
    const formattedTrips = trips.map((trip: any) => ({
      id: trip.id,
      departureTime: trip.departureTime,
      arrivalTime: trip.arrivalTime,
      availableSeats: trip.availableSeats,
      bus: {
        id: trip.bus.id,
        busNumber: trip.bus.busNumber,
        busType: trip.bus.busType,
        totalSeats: trip.bus.totalSeats,
        vendor: {
          name: trip.bus.vendor.name
        },
        route: {
          source: trip.bus.route?.source || machine.route.source,
          destination: trip.bus.route?.destination || machine.route.destination
        }
      },
      fare: machine.route.basePrice
    }));
    
    console.log(`Returning ${formattedTrips.length} formatted trips`);

    return NextResponse.json(formattedTrips);
  } catch (error) {
    console.error('Error fetching trips:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trips' },
      { status: 500 }
    );
  }
} 