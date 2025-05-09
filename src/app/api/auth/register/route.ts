import { NextRequest, NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";
import { hash } from 'bcrypt';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password, role = 'USER' } = body;

    console.log('Registration attempt:', { name, email, role });

    // Validate required fields
    if (!name || !email || !password) {
      console.log('Missing required fields');
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      console.log('User already exists:', email);
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hash(password, 10);

    // Create user with the proper role
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role as 'ADMIN' | 'VENDOR' | 'USER'
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      }
    });

    console.log('User created successfully:', user);

    // Create vendor profile if role is VENDOR
    if (role === 'VENDOR') {
      await prisma.vendor.create({
        data: {
          name,
          email,
          userId: user.id,
        }
      });
      console.log('Vendor profile created for:', user.id);
    }

    return NextResponse.json(
      { 
        message: 'User registered successfully',
        user 
      }, 
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error details:', error);
    return NextResponse.json(
      { error: 'Failed to register user' },
      { status: 500 }
    );
  }
} 