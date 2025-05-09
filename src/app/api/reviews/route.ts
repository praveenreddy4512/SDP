import { NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const reviews = await prisma.review.findMany({
      include: {
        ticket: {
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
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(reviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Received review submission:', body);
    const { ticketId, rating, review } = body;

    // Validate required fields
    if (!ticketId || !rating) {
      console.log('Missing required fields:', { ticketId, rating });
      return NextResponse.json(
        { error: 'Ticket ID and rating are required' },
        { status: 400 }
      );
    }

    // Validate rating range
    if (rating < 1 || rating > 5) {
      console.log('Invalid rating:', rating);
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Check if ticket exists
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId }
    });

    if (!ticket) {
      console.log('Ticket not found:', ticketId);
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      );
    }

    // Check if review already exists for this ticket
    const existingReview = await prisma.review.findUnique({
      where: { ticketId }
    });

    if (existingReview) {
      console.log('Review already exists for ticket:', ticketId);
      return NextResponse.json(
        { error: 'Review already exists for this ticket' },
        { status: 400 }
      );
    }

    // Create the review in the database
    console.log('Creating new review for ticket:', ticketId);
    const newReview = await prisma.review.create({
      data: {
        ticketId,
        rating,
        review: review || null,
      },
      include: {
        ticket: true
      }
    });

    console.log('Review created successfully:', newReview);
    return NextResponse.json(newReview, { status: 201 });
  } catch (error) {
    console.error('Error creating review:', error);
    return NextResponse.json(
      { error: 'Failed to create review' },
      { status: 500 }
    );
  }
} 