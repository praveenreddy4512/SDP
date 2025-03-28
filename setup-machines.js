const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // Get routes
    const routes = await prisma.route.findMany();
    
    if (routes.length === 0) {
      console.error("No routes found. Please run the setup-routes.js script first.");
      process.exit(1);
    }
    
    // Create machines for different routes
    const machines = [
      {
        name: "Delhi Central Station Machine",
        location: "Delhi Central Bus Station",
        routeId: routes[0].id
      },
      {
        name: "Mumbai Terminal Machine",
        location: "Mumbai Bus Terminal",
        routeId: routes[0].id
      },
      {
        name: "Bangalore Main Station",
        location: "Bangalore Bus Station",
        routeId: routes.length > 2 ? routes[2].id : routes[0].id
      }
    ];
    
    for (const machineData of machines) {
      // Check if machine already exists
      const existingMachine = await prisma.machine.findFirst({
        where: {
          name: machineData.name
        }
      });
      
      if (!existingMachine) {
        const machine = await prisma.machine.create({
          data: {
            ...machineData,
            isActive: true,
            lastSyncAt: new Date()
          }
        });
        
        console.log(`Created machine: ${machine.name} at ${machine.location}`);
      } else {
        console.log(`Machine already exists: ${existingMachine.name}`);
      }
    }
    
    console.log("Machines setup completed successfully!");
  } catch (error) {
    console.error("Error during setup:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 