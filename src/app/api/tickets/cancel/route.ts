import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { ticketId } = body;
    
    if (!ticketId) {
      return NextResponse.json(
        { error: "Ticket ID is required" },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      // Find the ticket
      const ticket = await tx.ticket.findUnique({
        where: { id: ticketId },
        include: {
          seat: true,
        },
      });

      if (!ticket) {
        throw new Error('Ticket not found');
      }

      if (ticket.status !== 'BOOKED') {
        throw new Error('Ticket is already cancelled or refunded');
      }

      // Update the ticket status
      const updatedTicket = await tx.ticket.update({
        where: { id: ticketId },
        data: {
          status: 'CANCELLED',
          paymentStatus: 'REFUNDED',
        },
      });

      // Update the seat status
      if (ticket.seat) {
        await tx.seat.update({
          where: { id: ticket.seat.id },
          data: {
            status: 'AVAILABLE',
            ticketId: null,
          },
        });
      }

      // Update the available seats count in the trip
      await tx.trip.update({
        where: { id: ticket.tripId },
        data: {
          availableSeats: {
            increment: 1,
          },
        },
      });

      // Create a refund transaction
      await tx.transaction.create({
        data: {
          amount: ticket.price,
          type: 'REFUND',
          status: 'COMPLETED',
          ticketId: ticket.id,
          paymentMethod: ticket.paymentType,
          referenceId: `REFUND-${ticket.qrCode}`,
        },
      });

      return updatedTicket;
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error cancelling ticket:", error);
    return NextResponse.json(
      { error: error.message || "Failed to cancel ticket" },
      { status: 500 }
    );
  }
} 