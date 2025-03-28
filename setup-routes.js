const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // Get the vendor
    const vendor = await prisma.vendor.findFirst();
    
    if (!vendor) {
      console.error("No vendor found. Please run the seed script first.");
      process.exit(1);
    }
    
    // Create routes
    const routes = [
      {
        name: "Delhi to Mumbai",
        source: "Delhi",
        destination: "Mumbai",
        distance: 1400,
        basePrice: 800
      },
      {
        name: "Mumbai to Pune",
        source: "Mumbai",
        destination: "Pune",
        distance: 150,
        basePrice: 250
      },
      {
        name: "Bangalore to Chennai",
        source: "Bangalore",
        destination: "Chennai",
        distance: 350,
        basePrice: 400
      }
    ];
    
    for (const routeData of routes) {
      const route = await prisma.route.create({
        data: routeData
      });
      
      console.log(`Created route: ${route.name}`);
      
      // Create a bus for each route
      const bus = await prisma.bus.create({
        data: {
          busNumber: `BUS-${route.source.substring(0, 3)}-${Math.floor(Math.random() * 1000)}`,
          routeId: route.id,
          totalSeats: 40,
          busType: "AC",
          amenities: ["WiFi", "USB Charging", "Water Bottle"],
          vendorId: vendor.id,
          isActive: true
        }
      });
      
      console.log(`Created bus: ${bus.busNumber} for route ${route.name}`);
    }
    
    console.log("Setup completed successfully!");
  } catch (error) {
    console.error("Error during setup:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 