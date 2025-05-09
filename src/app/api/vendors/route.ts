import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    // Get session token and check authorization
    const token = await getToken({ req: request });
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (token.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get all vendors
    const vendors = await prisma.vendor.findMany({
      orderBy: {
        name: 'asc'
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return NextResponse.json(vendors);
  } catch (error) {
    console.error('Error fetching vendors:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get session token and check authorization
    const token = await getToken({ req: request });
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (token.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get vendor data from request body
    const data = await request.json();
    
    // Validate required fields
    if (!data.name || !data.email) {
      return NextResponse.json({ error: 'Missing required fields: name and email are required' }, { status: 400 });
    }

    // If userId is provided, check if user exists
    if (data.userId) {
      const user = await prisma.user.findUnique({
        where: { id: data.userId }
      });

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      // Create new vendor with user connection
      const vendorWithUser = await prisma.vendor.create({
        data: {
          name: data.name,
          email: data.email,
          phone: data.phone || null,
          address: data.address || null,
          user: {
            connect: { id: data.userId }
          }
        }
      });

      return NextResponse.json(vendorWithUser, { status: 201 });
    } else {
      // Create new user for the vendor
      const user = await prisma.user.create({
        data: {
          name: data.name,
          email: data.email,
          password: data.password || Math.random().toString(36).slice(-8), // Generate random password if not provided
          role: 'VENDOR'
        }
      });

      // Create vendor associated with the new user
      const vendor = await prisma.vendor.create({
        data: {
          name: data.name,
          email: data.email,
          phone: data.phone || null,
          address: data.address || null,
          user: {
            connect: { id: user.id }
          }
        }
      });

      return NextResponse.json(vendor, { status: 201 });
    }
  } catch (error) {
    console.error('Error creating vendor:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Get session token and check authorization
    const token = await getToken({ req: request });
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (token.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get vendor data from request body
    const data = await request.json();
    
    // Validate required fields
    if (!data.id || !data.name || !data.email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if vendor exists
    const existingVendor = await prisma.vendor.findUnique({
      where: { id: data.id }
    });

    if (!existingVendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    // Update vendor
    const vendor = await prisma.vendor.update({
      where: { id: data.id },
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        address: data.address || null
      }
    });

    return NextResponse.json(vendor);
  } catch (error) {
    console.error('Error updating vendor:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 