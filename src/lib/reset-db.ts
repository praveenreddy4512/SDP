// This is a utility to ensure the database tables are created properly
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

async function createDemoUsers() {
  // Create admin user
  const adminPassword = await hash('admin123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@buspos.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@buspos.com',
      password: adminPassword,
      role: 'ADMIN',
    }
  });

  // Create vendor user
  const vendorPassword = await hash('vendor123', 10);
  const vendor = await prisma.user.upsert({
    where: { email: 'vendor@buspos.com' },
    update: {},
    create: {
      name: 'Vendor User',
      email: 'vendor@buspos.com',
      password: vendorPassword,
      role: 'VENDOR',
    }
  });

  // Create vendor profile
  if (vendor) {
    const existingVendor = await prisma.vendor.findUnique({
      where: { userId: vendor.id }
    });

    if (!existingVendor) {
      await prisma.vendor.create({
        data: {
          name: 'Vendor Company',
          email: 'vendor@buspos.com',
          userId: vendor.id,
          phone: '1234567890',
          address: '123 Vendor St'
        }
      });
    }
  }

  console.log('Demo users created successfully');
}

async function main() {
  try {
    await createDemoUsers();
    console.log('Database setup complete');
  } catch (error) {
    console.error('Database setup error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the setup if this file is directly executed
if (require.main === module) {
  main();
}

export { createDemoUsers }; 