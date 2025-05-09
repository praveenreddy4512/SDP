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
        startDate = new Date(now.getFullYear(), now.getMonth(), 1); // first day of current month
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
    const totalRevenue = tickets.reduce((sum: number, ticket: any) => sum + ticket.price, 0);

    // Group tickets by route
    const routeMap = new Map();
    tickets.forEach((ticket: any) => {
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
    tickets.forEach((ticket: any) => {
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
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
      .map((ticket: any) => {
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

    // --- Sales Trend ---
    let trend: { name: string; sales: number; revenue: number }[] = [];
    if (period === 'day') {
      // Hourly trend for today
      trend = Array.from({ length: 24 }, (_, h) => ({ name: `${h}h`, sales: 0, revenue: 0 }));
      tickets.forEach((ticket: any) => {
        const hour = new Date(ticket.createdAt).getHours();
        trend[hour].sales += 1;
        trend[hour].revenue += ticket.price;
      });
    } else if (period === 'week') {
      // Daily trend for last 7 days
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const today = new Date();
      // Use a local type that includes 'date'
      let weekTrend: { name: string; date: string; sales: number; revenue: number }[] = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(today);
        d.setDate(today.getDate() - (6 - i));
        return {
          name: days[d.getDay()],
          date: d.toISOString().slice(0, 10),
          sales: 0,
          revenue: 0
        };
      });
      tickets.forEach((ticket: any) => {
        const ticketDate = ticket.createdAt.toISOString().slice(0, 10);
        const idx = weekTrend.findIndex(t => t.date === ticketDate);
        if (idx !== -1) {
          weekTrend[idx].sales += 1;
          weekTrend[idx].revenue += ticket.price;
        }
      });
      // Remove the 'date' property for frontend compatibility
      trend = weekTrend.map(({ name, sales, revenue }) => ({ name, sales, revenue }));
    } else if (period === 'month') {
      // Daily trend for current month
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();
      // Get number of days in the current month
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      let monthTrend: { name: string; date: string; sales: number; revenue: number }[] = Array.from({ length: daysInMonth }, (_, i) => {
        const d = new Date(year, month, i + 1);
        return {
          name: `${i + 1}`,
          date: d.toISOString().slice(0, 10),
          sales: 0,
          revenue: 0
        };
      });
      tickets.forEach((ticket: any) => {
        const ticketDate = ticket.createdAt.toISOString().slice(0, 10);
        const idx = monthTrend.findIndex(t => t.date === ticketDate);
        if (idx !== -1) {
          monthTrend[idx].sales += 1;
          monthTrend[idx].revenue += ticket.price;
        }
      });
      trend = monthTrend.map(({ name, sales, revenue }) => ({ name, sales, revenue }));
    }

    // Prepare response data
    const salesData = {
      totalTickets,
      totalRevenue,
      ticketsByRoute: Array.from(routeMap.entries()).map(([routeName, data]: [string, any]) => ({
        routeName,
        count: data.count,
        revenue: data.revenue
      })),
      ticketsByVendor: Array.from(vendorMap.entries()).map(([vendorName, data]: [string, any]) => ({
        vendorName,
        count: data.count,
        revenue: data.revenue
      })),
      recentTickets,
      trend
    };

    return NextResponse.json(salesData);
  } catch (error) {
    console.error('Error fetching sales data:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 