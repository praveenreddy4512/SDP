const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateVendorTrips() {
  try {
    console.log('Updating vendor trips to future dates...');
    
    // Get all SCHEDULED trips
    const trips = await prisma.trip.findMany({
      where: {
        status: 'SCHEDULED'
      },
      include: {
        bus: {
          include: {
            route: true
          }
        }
      }
    });
    
    console.log(`Found ${trips.length} scheduled trips in total`);
    
    // Filter out test trips and find trips with past dates
    const vendorTrips = trips.filter(trip => 
      !['test-trip-morning', 'test-trip-evening'].includes(trip.id) && 
      trip.departureTime < new Date()
    );
    
    console.log(`Found ${vendorTrips.length} vendor trips with past dates`);
    
    if (vendorTrips.length === 0) {
      console.log('No vendor trips to update');
      return;
    }
    
    // Group trips by route for better scheduling
    const tripsByRoute = {};
    
    vendorTrips.forEach(trip => {
      const routeId = trip.bus.routeId;
      if (!tripsByRoute[routeId]) {
        tripsByRoute[routeId] = [];
      }
      tripsByRoute[routeId].push(trip);
    });
    
    console.log(`Trips grouped by ${Object.keys(tripsByRoute).length} routes`);
    
    // Update trips with future dates
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(6, 0, 0, 0); // Start at 6 AM
    
    const dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);
    
    const updates = [];
    
    for (const [routeId, routeTrips] of Object.entries(tripsByRoute)) {
      console.log(`Updating ${routeTrips.length} trips for route ${routeId}`);
      
      let currentDate = new Date(tomorrow);
      
      // Take at most 3 trips per route to update
      const tripsToUpdate = routeTrips.slice(0, 3);
      
      for (const trip of tripsToUpdate) {
        // Set departure time
        const departureTime = new Date(currentDate);
        
        // Calculate arrival time (6 hours later)
        const arrivalTime = new Date(departureTime);
        arrivalTime.setHours(arrivalTime.getHours() + 6);
        
        // Add 4 hours to current date for next trip
        currentDate.setHours(currentDate.getHours() + 4);
        
        try {
          const update = await prisma.trip.update({
            where: { id: trip.id },
            data: {
              departureTime: departureTime,
              arrivalTime: arrivalTime
            }
          });
          
          updates.push({
            id: update.id,
            route: trip.bus.route.name,
            bus: trip.bus.busNumber,
            newDeparture: departureTime
          });
          
          console.log(`Updated trip ${trip.id} to depart at ${departureTime}`);
        } catch (err) {
          console.error(`Error updating trip ${trip.id}:`, err);
        }
      }
    }
    
    console.log('\nSuccessfully updated trips:');
    updates.forEach(update => {
      console.log(`- Trip ${update.id} on ${update.route} (Bus: ${update.bus})`);
      console.log(`  New departure: ${update.newDeparture}`);
    });
    
  } catch (e) {
    console.error('Error updating trips:', e);
  } finally {
    await prisma.$disconnect();
  }
}

updateVendorTrips().then(() => {
  console.log('\nVendor trip update complete');
}); 