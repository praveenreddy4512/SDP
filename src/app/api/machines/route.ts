import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get('id');
  const isPublic = searchParams.get('public') === 'true';
  
  try {
    // For public machine access (like from machine booking page)
    if (isPublic) {
      if (id) {
        // Get specific machine with route information
        const machine = await prisma.machine.findUnique({
          where: {
            id: id,
            isActive: true
          },
          include: {
            route: true
          }
        });
        
        if (!machine) {
          return NextResponse.json({ error: 'Machine not found' }, { status: 404 });
        }
        
        return NextResponse.json(machine);
      } else {
        // Get all active machines with route information
        const machines = await prisma.machine.findMany({
          where: {
            isActive: true
          },
          include: {
            route: true
          }
        });
        
        return NextResponse.json(machines);
      }
    }
    
    // For authenticated admin access
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    if (id) {
      // Get specific machine
      const machine = await prisma.machine.findUnique({
        where: {
          id: id
        },
        include: {
          route: true
        }
      });
      
      if (!machine) {
        return NextResponse.json({ error: 'Machine not found' }, { status: 404 });
      }
      
      return NextResponse.json(machine);
    } else {
      // Get all machines
      const machines = await prisma.machine.findMany({
        include: {
          route: true
        },
        orderBy: {
          name: 'asc'
        }
      });
      return NextResponse.json(machines);
    }
  } catch (error) {
    console.error('Error fetching machines:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // Verify auth
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Only admins can manage machines
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { name, location, routeId } = body;
    
    if (!name || !location || !routeId) {
      return NextResponse.json(
        { error: 'Name, location, and route ID are required' },
        { status: 400 }
      );
    }
    
    // Check if route exists
    const route = await prisma.route.findUnique({
      where: { id: routeId }
    });
    
    if (!route) {
      return NextResponse.json(
        { error: 'Route not found' },
        { status: 404 }
      );
    }
    
    // Create machine
    const machine = await prisma.machine.create({
      data: {
        name,
        location,
        routeId,
        isActive: true
      }
    });
    
    return NextResponse.json(machine, { status: 201 });
  } catch (error) {
    console.error('Error creating machine:', error);
    return NextResponse.json(
      { error: 'Failed to create machine' },
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
    
    // Only admins can manage machines
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { id, name, location, routeId, isActive } = body;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Machine ID is required' },
        { status: 400 }
      );
    }
    
    // Check if machine exists
    const existingMachine = await prisma.machine.findUnique({
      where: { id }
    });
    
    if (!existingMachine) {
      return NextResponse.json(
        { error: 'Machine not found' },
        { status: 404 }
      );
    }
    
    // Update machine
    const updatedMachine = await prisma.machine.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(location && { location }),
        ...(routeId && { routeId }),
        ...(isActive !== undefined && { isActive })
      }
    });
    
    return NextResponse.json(updatedMachine);
  } catch (error) {
    console.error('Error updating machine:', error);
    return NextResponse.json(
      { error: 'Failed to update machine' },
      { status: 500 }
    );
  }
}

// Update machine (for syncing timestamps)
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { machineId } = body;
    
    if (!machineId) {
      return NextResponse.json(
        { error: "Machine ID is required" },
        { status: 400 }
      );
    }

    // Update the machine's lastSyncAt timestamp
    const machine = await prisma.machine.update({
      where: {
        id: machineId,
      },
      data: {
        lastSyncAt: new Date(),
      },
    });

    return NextResponse.json(machine);
  } catch (error) {
    console.error("Error updating machine:", error);
    return NextResponse.json(
      { error: "Failed to update machine" },
      { status: 500 }
    );
  }
} 