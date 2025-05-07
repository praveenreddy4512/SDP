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

    // Get all trips with related data
    const trips = await prisma.trip.findMany({
      include: {
        bus: {
          include: {
            route: true
          }
        },
        tickets: {
          include: {
            seat: true
          }
        },
        seats: {
          include: {
            ticket: true
          }
        }
      },
      orderBy: {
        departureTime: 'desc'
      }
    });

    // Transform the data to match the frontend interface
    const formattedTrips = trips.map(trip => {
      // Calculate actual metrics
      const totalTickets = trip.tickets.length;
      const totalRevenue = trip.tickets.reduce((sum, ticket) => sum + ticket.price, 0);
      const occupiedSeats = trip.seats.filter(seat => seat.status === 'BOOKED').length;
      const cancelledTickets = trip.tickets.filter(ticket => ticket.status === 'CANCELLED').length;
      const refundedTickets = trip.tickets.filter(ticket => ticket.status === 'REFUNDED').length;
      
      // Calculate occupancy rate
      const occupancyRate = (occupiedSeats / trip.bus.totalSeats) * 100;
      
      // Calculate on-time performance
      const isOnTime = new Date(trip.arrivalTime) <= new Date(trip.departureTime);
      
      return {
        id: trip.id,
        bus: {
          busNumber: trip.bus.busNumber,
          route: {
            name: trip.bus.route.name,
            source: trip.bus.route.source,
            destination: trip.bus.route.destination
          }
        },
        departureTime: trip.departureTime.toISOString(),
        arrivalTime: trip.arrivalTime.toISOString(),
        status: trip.status,
        availableSeats: trip.availableSeats,
        totalSeats: trip.bus.totalSeats,
        // Historical metrics
        metrics: {
          totalPassengers: totalTickets,
          totalRevenue: totalRevenue,
          occupancyRate: Math.round(occupancyRate),
          cancelledTickets: cancelledTickets,
          refundedTickets: refundedTickets,
          isOnTime: isOnTime,
          averageTicketPrice: totalTickets > 0 ? Math.round(totalRevenue / totalTickets) : 0
        }
      };
    });

    return NextResponse.json(formattedTrips);
  } catch (error) {
    console.error('Error fetching trips:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trips' },
      { status: 500 }
    );
  }
} 