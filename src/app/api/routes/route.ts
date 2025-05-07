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
        include: {
          buses: {
            select: {
              id: true,
              busNumber: true
            }
          },
          machines: {
            select: {
              id: true,
              name: true,
              location: true
            }
          }
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

export async function PUT(req: NextRequest) {
  try {
    // Verify auth
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { id, name, source, destination, basePrice, distance } = body;

    if (!id || !name || !source || !destination || basePrice === undefined || distance === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const updatedRoute = await prisma.route.update({
      where: { id },
      data: {
        name,
        source,
        destination,
        basePrice: Number(basePrice),
        distance: Number(distance)
      }
    });

    return NextResponse.json(updatedRoute);
  } catch (error) {
    console.error("Error updating route:", error);
    return NextResponse.json(
      { error: "Failed to update route" },
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
    const { name, source, destination, basePrice, distance } = body;

    if (!name || !source || !destination || basePrice === undefined || distance === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const newRoute = await prisma.route.create({
      data: {
        name,
        source,
        destination,
        basePrice: Number(basePrice),
        distance: Number(distance)
      }
    });

    return NextResponse.json(newRoute);
  } catch (error) {
    console.error("Error creating route:", error);
    return NextResponse.json(
      { error: "Failed to create route" },
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
    const routeId = searchParams.get("id");

    if (!routeId) {
      return NextResponse.json(
        { error: "Route ID is required" },
        { status: 400 }
      );
    }

    // First, check if the route exists and has any associated buses or machines
    const route = await prisma.route.findUnique({
      where: { id: routeId },
      include: {
        buses: true,
        machines: true
      }
    });

    if (!route) {
      return NextResponse.json(
        { error: "Route not found" },
        { status: 404 }
      );
    }

    // If there are associated buses or machines, return an error
    if (route.buses.length > 0 || route.machines.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete route with associated buses or machines. Please remove them first." },
        { status: 400 }
      );
    }

    // If no associations, proceed with deletion
    await prisma.route.delete({
      where: { id: routeId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting route:", error);
    return NextResponse.json(
      { error: "Failed to delete route" },
      { status: 500 }
    );
  }
} 