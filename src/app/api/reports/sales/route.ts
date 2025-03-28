import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import prisma from '@/lib/prisma';

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

    // Get period from query parameters
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'week';

    // Calculate date range based on period
    const now = new Date();
    let startDate = new Date();
    
    switch (period) {
      case 'day':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 7); // Default to week
    }

    // Get all tickets within the date range
    const tickets = await prisma.ticket.findMany({
      where: {
        createdAt: {
          gte: startDate,
        },
      },
      include: {
        trip: {
          include: {
            bus: {
              include: {
                vendor: true,
                route: true
              }
            }
          }
        }
      },
    });

    // Calculate total tickets and revenue
    const totalTickets = tickets.length;
    const totalRevenue = tickets.reduce((sum, ticket) => sum + ticket.price, 0);

    // Group tickets by route
    const routeMap = new Map();
    tickets.forEach(ticket => {
      const routeName = ticket.trip?.bus?.route 
        ? `${ticket.trip.bus.route.source} to ${ticket.trip.bus.route.destination}` 
        : 'Unknown Route';
        
      if (!routeMap.has(routeName)) {
        routeMap.set(routeName, { count: 0, revenue: 0 });
      }
      const routeData = routeMap.get(routeName);
      routeData.count++;
      routeData.revenue += ticket.price;
      routeMap.set(routeName, routeData);
    });

    // Group tickets by vendor
    const vendorMap = new Map();
    tickets.forEach(ticket => {
      const vendorName = ticket.trip?.bus?.vendor?.name || 'Unknown Vendor';
      if (!vendorMap.has(vendorName)) {
        vendorMap.set(vendorName, { count: 0, revenue: 0 });
      }
      const vendorData = vendorMap.get(vendorName);
      vendorData.count++;
      vendorData.revenue += ticket.price;
      vendorMap.set(vendorName, vendorData);
    });

    // Format recent tickets
    const recentTickets = tickets
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
      .map(ticket => {
        const routeName = ticket.trip?.bus?.route 
          ? `${ticket.trip.bus.route.source} to ${ticket.trip.bus.route.destination}` 
          : 'Unknown Route';
        
        return {
          id: ticket.id,
          passengerName: ticket.passengerName,
          routeName,
          date: ticket.createdAt.toISOString().split('T')[0],
          amount: ticket.price
        };
      });

    // Prepare response data
    const salesData = {
      totalTickets,
      totalRevenue,
      ticketsByRoute: Array.from(routeMap.entries()).map(([routeName, data]) => ({
        routeName,
        count: data.count,
        revenue: data.revenue
      })),
      ticketsByVendor: Array.from(vendorMap.entries()).map(([vendorName, data]) => ({
        vendorName,
        count: data.count,
        revenue: data.revenue
      })),
      recentTickets
    };

    return NextResponse.json(salesData);
  } catch (error) {
    console.error('Error fetching sales data:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 