import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seeding...');

  // Create vendor user
  const vendorPassword = await hash('vendor123', 10);
  const vendorUser = await prisma.user.upsert({
    where: { email: 'vendor@buspos.com' },
    update: {},
    create: {
      name: 'Vendor User',
      email: 'vendor@buspos.com',
      password: vendorPassword,
      role: 'VENDOR',
      vendorProfile: {
        create: {
          name: 'Vendor Company',
          email: 'vendor@buspos.com',
          phone: '1234567890',
          address: '123 Vendor St'
        }
      }
    },
    include: {
      vendorProfile: true
    }
  });
  
  console.log({ vendorUser });
  
  // Create admin user
  const adminPassword = await hash('admin123', 10);
  
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@buspos.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@buspos.com',
      password: adminPassword,
      role: 'ADMIN',
    }
  });
  
  console.log({ adminUser });
  
  // Create a route
  const route = await prisma.route.upsert({
    where: { id: 'route1' },
    update: {},
    create: {
      id: 'route1',
      name: 'Delhi to Mumbai',
      source: 'Delhi',
      destination: 'Mumbai',
      distance: 1400,
      basePrice: 800
    }
  });
  
  console.log({ route });
  
  // Create a bus
  const bus = await prisma.bus.upsert({
    where: { busNumber: 'BUS001' },
    update: {},
    create: {
      busNumber: 'BUS001',
      routeId: route.id,
      totalSeats: 40,
      busType: 'AC',
      amenities: ['WiFi', 'USB Charging', 'Water Bottle'],
      vendorId: vendorUser.vendorProfile!.id,
      isActive: true
    }
  });
  
  console.log({ bus });
  
  // Create a trip
  const departureTime = new Date();
  departureTime.setDate(departureTime.getDate() + 1); // Tomorrow
  
  const arrivalTime = new Date(departureTime);
  arrivalTime.setHours(arrivalTime.getHours() + 14); // 14 hours later
  
  const trip = await prisma.trip.upsert({
    where: { id: 'trip1' },
    update: {},
    create: {
      id: 'trip1',
      busId: bus.id,
      departureTime,
      arrivalTime,
      status: 'SCHEDULED',
      availableSeats: 40
    }
  });
  
  console.log({ trip });
  
  // Create seats for the trip
  for (let i = 1; i <= 40; i++) {
    await prisma.seat.upsert({
      where: { 
        tripId_seatNumber: {
          tripId: trip.id,
          seatNumber: i
        }
      },
      update: {},
      create: {
        tripId: trip.id,
        seatNumber: i,
        status: 'AVAILABLE'
      }
    });
  }
  
  console.log('Created 40 seats for the trip');

  console.log('Seeding completed!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  }); 