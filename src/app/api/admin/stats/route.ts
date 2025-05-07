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

    // Get all stats in parallel
    const [
      totalBuses,
      activeBuses,
      totalRoutes,
      totalTrips,
      totalUsers,
      totalBookings
    ] = await Promise.all([
      prisma.bus.count(),
      prisma.bus.count({ where: { isActive: true } }),
      prisma.route.count(),
      prisma.trip.count(),
      prisma.user.count(),
      prisma.ticket.count()
    ]);

    return NextResponse.json({
      totalBuses,
      activeBuses,
      totalRoutes,
      totalTrips,
      totalUsers,
      totalBookings
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
} 