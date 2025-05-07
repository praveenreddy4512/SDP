import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    // Verify auth
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const busId = searchParams.get('id');
    const routeId = searchParams.get('routeId');

    if (busId) {
      // Get single bus
      const bus = await prisma.bus.findUnique({
        where: {
          id: busId
        },
        include: {
          trips: {
            select: {
              id: true,
              departureTime: true,
              arrivalTime: true,
              status: true
            }
          }
        }
      });

      if (!bus) {
        return NextResponse.json({ error: 'Bus not found' }, { status: 404 });
      }

      return NextResponse.json(bus);
    } else if (routeId) {
      // Get buses by route
      const buses = await prisma.bus.findMany({
        where: {
          routeId: routeId,
          isActive: true
        },
        orderBy: {
          busNumber: 'asc'
        },
        include: {
          trips: {
            select: {
              id: true,
              departureTime: true,
              arrivalTime: true,
              status: true
            }
          }
        }
      });

      return NextResponse.json(buses);
    } else {
      // Get all buses
      const buses = await prisma.bus.findMany({
        where: {
          isActive: true
        },
        orderBy: {
          busNumber: 'asc'
        },
        include: {
          trips: {
            select: {
              id: true,
              departureTime: true,
              arrivalTime: true,
              status: true
            }
          }
        }
      });

      return NextResponse.json(buses);
    }
  } catch (error) {
    console.error('Error fetching buses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch buses' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    // Verify auth
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { id, busNumber, busType, totalSeats, routeId, vendorId, isActive, amenities } = body;

    if (!id || !busNumber || !busType || !totalSeats || !routeId || !vendorId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate bus type
    const validBusTypes = ['AC', 'NON_AC', 'SLEEPER', 'SEATER', 'AC_SLEEPER', 'AC_SEATER'];
    if (!validBusTypes.includes(busType)) {
      return NextResponse.json(
        { error: "Invalid bus type" },
        { status: 400 }
      );
    }

    // Process amenities
    let processedAmenities: string[] = [];
    if (amenities) {
      if (typeof amenities === 'string') {
        processedAmenities = amenities.split(',').map((a: string) => a.trim());
      } else if (Array.isArray(amenities)) {
        processedAmenities = amenities;
      }
    }

    const updatedBus = await prisma.bus.update({
      where: { id },
      data: {
        busNumber,
        busType,
        totalSeats: Number(totalSeats),
        routeId,
        vendorId,
        isActive: isActive ?? true,
        amenities: processedAmenities
      }
    });

    return NextResponse.json(updatedBus);
  } catch (error) {
    console.error("Error updating bus:", error);
    return NextResponse.json(
      { error: "Failed to update bus" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // Verify auth
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { busNumber, busType, totalSeats, routeId, vendorId, amenities } = body;

    if (!busNumber || !busType || !totalSeats || !routeId || !vendorId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const newBus = await prisma.bus.create({
      data: {
        busNumber,
        busType,
        totalSeats: Number(totalSeats),
        routeId,
        vendorId,
        isActive: true,
        amenities: amenities ? amenities.split(',').map((a: string) => a.trim()) : []
      }
    });

    return NextResponse.json(newBus);
  } catch (error) {
    console.error("Error creating bus:", error);
    return NextResponse.json(
      { error: "Failed to create bus" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    // Verify auth
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const busId = searchParams.get("id");

    if (!busId) {
      return NextResponse.json(
        { error: "Bus ID is required" },
        { status: 400 }
      );
    }

    // Check if bus exists
    const bus = await prisma.bus.findUnique({
      where: { id: busId },
      include: {
        trips: true
      }
    });

    if (!bus) {
      return NextResponse.json(
        { error: "Bus not found" },
        { status: 404 }
      );
    }

    // Check if bus has any associated trips
    if (bus.trips && bus.trips.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete bus with associated trips. Please delete or reassign the trips first." },
        { status: 400 }
      );
    }

    // Delete the bus
    await prisma.bus.delete({
      where: { id: busId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting bus:", error);
    return NextResponse.json(
      { error: "Failed to delete bus" },
      { status: 500 }
    );
  }
} 