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
        select: {
          id: true,
          busNumber: true,
          busType: true,
          totalSeats: true,
          isActive: true,
          routeId: true
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