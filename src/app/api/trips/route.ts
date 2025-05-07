import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    // Verify auth
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Only vendors can create trips
    if (session?.user?.role !== 'VENDOR' && session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { busId, departureTime, arrivalTime, status } = body;

    if (!busId || !departureTime || !arrivalTime) {
      return NextResponse.json(
        { error: 'Bus ID, departure time, and arrival time are required' },
        { status: 400 }
      );
    }

    // Get the bus to know how many seats to create
    const bus = await prisma.bus.findUnique({
      where: { id: busId }
    });

    if (!bus) {
      return NextResponse.json(
        { error: 'Bus not found' },
        { status: 404 }
      );
    }

    // Create new trip with seats
    const trip = await prisma.trip.create({
      data: {
        busId,
        departureTime: new Date(departureTime),
        arrivalTime: new Date(arrivalTime),
        status: status || 'SCHEDULED',
        availableSeats: bus.totalSeats,
      }
    });

    // Create seats for the trip
    const seatPromises = [];
    for (let i = 1; i <= bus.totalSeats; i++) {
      seatPromises.push(
        prisma.seat.create({
          data: {
            tripId: trip.id,
            seatNumber: i,
            status: 'AVAILABLE',
          }
        })
      );
    }

    await Promise.all(seatPromises);

    return NextResponse.json(trip, { status: 201 });
  } catch (error) {
    console.error('Error creating trip:', error);
    return NextResponse.json(
      { error: 'Failed to create trip' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    // Verify auth
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const tripId = searchParams.get('id');
    const busId = searchParams.get('busId');

    if (tripId) {
      // Get single trip
      const trip = await prisma.trip.findUnique({
        where: {
          id: tripId
        },
        include: {
          bus: {
            include: {
              route: true
            }
          },
          seats: {
            orderBy: {
              seatNumber: 'asc'
            }
          }
        }
      });

      if (!trip) {
        return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
      }

      return NextResponse.json(trip);
    } else if (busId) {
      // Get trips by bus
      const trips = await prisma.trip.findMany({
        where: {
          busId: busId,
          departureTime: {
            gte: new Date()
          }
        },
        orderBy: {
          departureTime: 'asc'
        },
        include: {
          bus: {
            include: {
              route: true
            }
          }
        }
      });

      return NextResponse.json(trips);
    } else {
      // Get all trips
      const trips = await prisma.trip.findMany({
        orderBy: {
          departureTime: 'asc'
        },
        include: {
          bus: {
            include: {
              route: true
            }
          }
        }
      });

      return NextResponse.json(trips);
    }
  } catch (error) {
    console.error('Error fetching trips:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trips' },
      { status: 500 }
    );
  }
} 