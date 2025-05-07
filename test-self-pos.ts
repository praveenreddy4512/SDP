import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Creating test data for Self POS...');

  try {
    // 1. Create a test route
    const route = await prisma.route.upsert({
      where: { id: 'test-route-for-self-pos' },
      update: {
        name: 'Hyderabad to Bangalore',
        source: 'Hyderabad',
        destination: 'Bangalore',
        distance: 570,
        basePrice: 600
      },
      create: {
        id: 'test-route-for-self-pos',
        name: 'Hyderabad to Bangalore',
        source: 'Hyderabad',
        destination: 'Bangalore',
        distance: 570,
        basePrice: 600
      }
    });

    console.log('Created/updated test route:', route);

    // 2. Create a vendor for the test
    const vendor = await prisma.vendor.findFirst();
    
    if (!vendor) {
      throw new Error('No vendor found in the database. Please run the main seed script first.');
    }

    // 3. Create test buses for this route
    const bus1 = await prisma.bus.upsert({
      where: { busNumber: 'SPS-AC-001' },
      update: {
        routeId: route.id,
        vendorId: vendor.id,
        totalSeats: 40,
        busType: 'AC',
        isActive: true
      },
      create: {
        busNumber: 'SPS-AC-001',
        routeId: route.id,
        vendorId: vendor.id,
        totalSeats: 40,
        busType: 'AC',
        amenities: ['WiFi', 'USB Charging', 'Water Bottle'],
        isActive: true
      }
    });

    const bus2 = await prisma.bus.upsert({
      where: { busNumber: 'SPS-NON-AC-001' },
      update: {
        routeId: route.id,
        vendorId: vendor.id,
        totalSeats: 40,
        busType: 'NON_AC',
        isActive: true
      },
      create: {
        busNumber: 'SPS-NON-AC-001',
        routeId: route.id,
        vendorId: vendor.id,
        totalSeats: 40,
        busType: 'NON_AC',
        amenities: ['Water Bottle'],
        isActive: true
      }
    });

    console.log('Created/updated test buses:', { bus1, bus2 });

    // 4. Create a machine for this route
    const machine = await prisma.machine.upsert({
      where: { id: 'test-machine-self-pos' },
      update: {
        name: 'Self POS Test Machine',
        location: 'Hyderabad Bus Station',
        routeId: route.id,
        isActive: true
      },
      create: {
        id: 'test-machine-self-pos',
        name: 'Self POS Test Machine',
        location: 'Hyderabad Bus Station',
        routeId: route.id,
        isActive: true
      }
    });

    console.log('Created/updated test machine:', machine);

    // 5. Create test trips
    // Morning trip (tomorrow)
    const morningDeparture = new Date();
    morningDeparture.setDate(morningDeparture.getDate() + 1);
    morningDeparture.setHours(8, 0, 0, 0);

    const morningArrival = new Date(morningDeparture);
    morningArrival.setHours(morningArrival.getHours() + 6);

    const morningTrip = await prisma.trip.upsert({
      where: { id: 'test-trip-morning' },
      update: {
        busId: bus1.id,
        departureTime: morningDeparture,
        arrivalTime: morningArrival,
        status: 'SCHEDULED',
        availableSeats: 40
      },
      create: {
        id: 'test-trip-morning',
        busId: bus1.id,
        departureTime: morningDeparture,
        arrivalTime: morningArrival,
        status: 'SCHEDULED',
        availableSeats: 40
      }
    });

    // Evening trip (tomorrow)
    const eveningDeparture = new Date();
    eveningDeparture.setDate(eveningDeparture.getDate() + 1);
    eveningDeparture.setHours(18, 0, 0, 0);

    const eveningArrival = new Date(eveningDeparture);
    eveningArrival.setHours(eveningArrival.getHours() + 6);

    const eveningTrip = await prisma.trip.upsert({
      where: { id: 'test-trip-evening' },
      update: {
        busId: bus2.id,
        departureTime: eveningDeparture,
        arrivalTime: eveningArrival,
        status: 'SCHEDULED',
        availableSeats: 40
      },
      create: {
        id: 'test-trip-evening',
        busId: bus2.id,
        departureTime: eveningDeparture,
        arrivalTime: eveningArrival,
        status: 'SCHEDULED',
        availableSeats: 40
      }
    });

    console.log('Created/updated test trips:', { morningTrip, eveningTrip });

    // 6. Create seats for both trips
    for (const trip of [morningTrip, eveningTrip]) {
      // Check if seats already exist
      const existingSeats = await prisma.seat.count({
        where: { tripId: trip.id }
      });

      if (existingSeats === 0) {
        // Create seats if they don't exist
        const seatPromises = [];
        for (let i = 1; i <= 40; i++) {
          seatPromises.push(
            prisma.seat.create({
              data: {
                tripId: trip.id,
                seatNumber: i,
                status: 'AVAILABLE'
              }
            })
          );
        }
        await Promise.all(seatPromises);
        console.log(`Created 40 seats for trip ${trip.id}`);
      } else {
        console.log(`Seats already exist for trip ${trip.id}`);
      }
    }

    console.log('Test data creation complete!');
    console.log('----------------------------------------');
    console.log('To use the Self POS, navigate to:');
    console.log(`/self-pos/${machine.id}`);
    console.log('----------------------------------------');

  } catch (error) {
    console.error('Error creating test data:', error);
  }
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