import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient, Prisma } from '@prisma/client';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tripId, seatId, passengerName, passengerPhone, paymentType, machineId } = body;
    
    // Check if coming from machine (machineId present) or vendor (requires auth)
    const session = machineId ? null : await getServerSession(authOptions);
    
    // If not from machine, verify auth
    if (!machineId && (!session || (session?.user?.role !== 'VENDOR' && session?.user?.role !== 'ADMIN'))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate required fields
    if (!tripId || !seatId || !passengerName || !passengerPhone || !paymentType) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Check if seat is available
    const seat = await prisma.seat.findUnique({
      where: { id: seatId },
      include: {
        trip: {
          include: {
            bus: {
              include: {
                route: true
              }
            }
          }
        }
      }
    });

    if (!seat) {
      return NextResponse.json(
        { error: 'Seat not found' },
        { status: 404 }
      );
    }

    if (seat.status !== 'AVAILABLE') {
      return NextResponse.json(
        { error: 'Seat is not available' },
        { status: 400 }
      );
    }
    
    // Get price from route if not provided
    const price = body.price || seat.trip.bus.route.basePrice;
    
    // Generate a QR code if not provided
    const qrCode = body.qrCode || `TICKET-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

    // Create ticket and update seat in a transaction
    const ticket = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Create ticket
      const newTicket = await tx.ticket.create({
        data: {
          tripId,
          price,
          status: 'BOOKED',
          paymentType,
          paymentStatus: 'COMPLETED', // Assuming payment is completed immediately
          qrCode,
          passengerName,
          passengerPhone,
          machineId: machineId || null
        },
        include: {
          trip: {
            include: {
              bus: {
                include: {
                  route: true
                }
              }
            }
          }
        }
      });

      // Update seat status and link to ticket
      await tx.seat.update({
        where: { id: seatId },
        data: {
          status: 'BOOKED',
          ticketId: newTicket.id
        }
      });

      // Update available seats count in trip
      const trip = await tx.trip.findUnique({
        where: { id: tripId },
        select: { availableSeats: true }
      });

      if (trip) {
        await tx.trip.update({
          where: { id: tripId },
          data: {
            availableSeats: trip.availableSeats - 1
          }
        });
      }

      return newTicket;
    });
    
    // Get the seat for the response
    const ticketWithSeat = await prisma.ticket.findUnique({
      where: { id: ticket.id },
      include: {
        trip: {
          include: {
            bus: {
              include: {
                route: true
              }
            }
          }
        },
        seat: true
      }
    });

    return NextResponse.json(ticketWithSeat, { status: 201 });
  } catch (error) {
    console.error('Error creating ticket:', error);
    return NextResponse.json(
      { error: 'Failed to create ticket' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    // Verify auth
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const ticketId = searchParams.get('id');
    const tripId = searchParams.get('tripId');
    const phoneNumber = searchParams.get('phone');

    if (ticketId) {
      // Get single ticket
      const ticket = await prisma.ticket.findUnique({
        where: {
          id: ticketId
        },
        include: {
          trip: {
            include: {
              bus: {
                include: {
                  route: true
                }
              }
            }
          },
          seat: true
        }
      });

      if (!ticket) {
        return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
      }

      return NextResponse.json(ticket);
    } else if (tripId) {
      // Get tickets by trip
      const tickets = await prisma.ticket.findMany({
        where: {
          tripId: tripId
        },
        include: {
          seat: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return NextResponse.json(tickets);
    } else if (phoneNumber) {
      // Get tickets by phone number
      const tickets = await prisma.ticket.findMany({
        where: {
          passengerPhone: phoneNumber
        },
        include: {
          trip: {
            include: {
              bus: {
                include: {
                  route: true
                }
              }
            }
          },
          seat: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return NextResponse.json(tickets);
    } else {
      // Get all tickets (with pagination in a real app)
      const tickets = await prisma.ticket.findMany({
        take: 50, // Limit to 50 most recent tickets
        include: {
          trip: {
            include: {
              bus: {
                include: {
                  route: true
                }
              }
            }
          },
          seat: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return NextResponse.json(tickets);
    }
  } catch (error) {
    console.error('Error fetching tickets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tickets' },
      { status: 500 }
    );
  }
}

// PUT for updating ticket status (e.g., cancellation)
export async function PUT(req: NextRequest) {
  try {
    // Verify auth
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Only vendors and admins can update tickets
    if (session?.user?.role !== 'VENDOR' && session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { ticketId, status } = body;

    if (!ticketId || !status) {
      return NextResponse.json(
        { error: 'Ticket ID and status are required' },
        { status: 400 }
      );
    }

    // Get the ticket
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { seat: true }
    });

    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      );
    }

    // Update ticket status and related records
    const updatedTicket = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Update ticket status
      const updated = await tx.ticket.update({
        where: { id: ticketId },
        data: {
          status: status as 'BOOKED' | 'CANCELLED' | 'REFUNDED'
        }
      });

      // If cancelling or refunding, free up the seat
      if (status === 'CANCELLED' || status === 'REFUNDED') {
        if (ticket.seat) {
          await tx.seat.update({
            where: { id: ticket.seat.id },
            data: {
              status: 'AVAILABLE',
              ticketId: null
            }
          });
        }

        // Update available seats count
        const trip = await tx.trip.findUnique({
          where: { id: ticket.tripId },
          select: { availableSeats: true }
        });

        if (trip) {
          await tx.trip.update({
            where: { id: ticket.tripId },
            data: {
              availableSeats: trip.availableSeats + 1
            }
          });
        }
      }

      return updated;
    });

    return NextResponse.json(updatedTicket);
  } catch (error) {
    console.error('Error updating ticket:', error);
    return NextResponse.json(
      { error: 'Failed to update ticket' },
      { status: 500 }
    );
  }
} 