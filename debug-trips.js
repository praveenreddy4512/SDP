const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkData() {
  try {
    console.log('Checking database for scheduled trips...');
    
    // Check routes
    const routes = await prisma.route.findMany();
    console.log(`Found ${routes.length} routes`);
    
    // Check machines
    const machines = await prisma.machine.findMany({
      include: { route: true }
    });
    console.log(`Found ${machines.length} machines`);
    
    if (machines.length > 0) {
      console.log('Machine routes:');
      machines.forEach(m => {
        console.log(`- Machine ${m.name} (${m.id}) -> Route: ${m.route.source} to ${m.route.destination} (${m.routeId})`);
      });
    }
    
    // Check buses
    const buses = await prisma.bus.findMany({
      include: { route: true }
    });
    console.log(`Found ${buses.length} buses`);
    
    if (buses.length > 0) {
      console.log('Bus routes:');
      buses.forEach(b => {
        console.log(`- Bus ${b.busNumber} -> Route: ${b.route.source} to ${b.route.destination} (${b.routeId})`);
      });
    }
    
    // Get all future scheduled trips
    const allFutureTrips = await prisma.trip.findMany({
      where: {
        departureTime: { gte: new Date() },
        status: 'SCHEDULED'
      },
      include: {
        bus: true
      }
    });
    
    console.log(`\nFound ${allFutureTrips.length} future scheduled trips`);
    
    // Check each machine for matching trips
    for (const machine of machines) {
      console.log(`\nChecking trips for machine: ${machine.name} (${machine.id})`);
      console.log(`Machine route ID: ${machine.routeId}`);
      
      const matchingTrips = allFutureTrips.filter(trip => trip.bus.routeId === machine.routeId);
      console.log(`Found ${matchingTrips.length} trips for this machine's route`);
      
      if (matchingTrips.length > 0) {
        matchingTrips.forEach(trip => {
          console.log(`- Trip ID: ${trip.id}`);
          console.log(`  Bus: ${trip.bus.busNumber}`);
          console.log(`  Departure: ${trip.departureTime}`);
          console.log(`  Status: ${trip.status}`);
          console.log(`  Bus Route ID: ${trip.bus.routeId}`);
        });
      } else {
        console.log('No matching trips found. Checking issues:');
        
        // Check if there are buses for this route
        const routeBuses = buses.filter(b => b.routeId === machine.routeId);
        console.log(`- Buses for this route: ${routeBuses.length}`);
        
        // Check if there are any trips at all for these buses
        if (routeBuses.length > 0) {
          const busIds = routeBuses.map(b => b.id);
          const anyTrips = await prisma.trip.findMany({
            where: {
              busId: { in: busIds }
            }
          });
          
          console.log(`- Total trips for route buses (any status/date): ${anyTrips.length}`);
          
          if (anyTrips.length > 0) {
            // Check why they're not showing
            const nonFutureTrips = anyTrips.filter(t => t.departureTime < new Date());
            const nonScheduledTrips = anyTrips.filter(t => t.status !== 'SCHEDULED');
            
            console.log(`  - Past trips: ${nonFutureTrips.length}`);
            console.log(`  - Non-scheduled trips: ${nonScheduledTrips.length}`);
          }
        }
      }
    }
    
  } catch (e) {
    console.error('Error checking data:', e);
  } finally {
    await prisma.$disconnect();
  }
}

checkData().then(() => {
  console.log('\nDebug check complete');
}); 