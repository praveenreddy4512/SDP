import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    
    if (id) {
      // Get a specific route
      const route = await prisma.route.findUnique({
        where: {
          id: id
        }
      });
      
      if (!route) {
        return NextResponse.json({ error: 'Route not found' }, { status: 404 });
      }
      
      return NextResponse.json(route);
    } else {
      // Get all routes
      const routes = await prisma.route.findMany({
        orderBy: {
          name: 'asc'
        }
      });
      
      return NextResponse.json(routes);
    }
  } catch (error) {
    console.error('Error fetching routes:', error);
    return NextResponse.json({ error: 'Failed to fetch routes' }, { status: 500 });
  }
} 