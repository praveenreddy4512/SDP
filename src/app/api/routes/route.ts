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
    const routeId = searchParams.get("id");
    
    if (routeId) {
      // Get a specific route
      const route = await prisma.route.findUnique({
        where: {
          id: routeId,
        },
        include: {
          buses: true,
          machines: true,
        },
      });
      
      if (!route) {
        return NextResponse.json(
          { error: "Route not found" },
          { status: 404 }
        );
      }
      
      return NextResponse.json(route);
    } else {
      // Get all routes
      const routes = await prisma.route.findMany({
        orderBy: {
          name: 'asc'
        },
        select: {
          id: true,
          name: true,
          source: true,
          destination: true
        }
      });
      
      return NextResponse.json(routes);
    }
  } catch (error) {
    console.error("Error fetching routes:", error);
    return NextResponse.json(
      { error: "Failed to fetch routes" },
      { status: 500 }
    );
  }
} 