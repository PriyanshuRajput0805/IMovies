import { connectDB, disconnectDB } from '../config/db.js';
import { User } from '../models/user.model.js';
import { logger } from './logger.js';

export const seedUsers = async () => {
  logger.info('Starting user seed process...');

  const defaultAdmin = {
    name: 'Cinema Admin',
    email: 'admin@imovies.com',
    password: 'Admin@123456',
    phone: '+91 98765 43210',
    role: 'admin',
    accountStatus: 'active'
  };

  const defaultCustomer = {
    name: 'Demo Customer',
    email: 'customer@imovies.com',
    password: 'Customer@123456',
    phone: '+91 98765 00000',
    role: 'user',
    accountStatus: 'active'
  };

  // Upsert admin user
  const adminExists = await User.findOne({ email: defaultAdmin.email });
  if (!adminExists) {
    await User.create(defaultAdmin);
    logger.success(`Default Admin created: ${defaultAdmin.email} (Password: Admin@123456)`);
  } else {
    logger.info(`Default Admin already exists: ${defaultAdmin.email}`);
  }

  // Upsert customer user
  const customerExists = await User.findOne({ email: defaultCustomer.email });
  if (!customerExists) {
    await User.create(defaultCustomer);
    logger.success(`Default Customer created: ${defaultCustomer.email} (Password: Customer@123456)`);
  } else {
    logger.info(`Default Customer already exists: ${defaultCustomer.email}`);
  }
};

const runSeed = async () => {
  try {
    await connectDB();
    await seedUsers();
    logger.success('Database seeded successfully!');
    await disconnectDB();
    process.exit(0);
  } catch (error) {
    logger.error(`Seed failed: ${error.message}`);
    await disconnectDB();
    process.exit(1);
  }
};

// If executed directly: node src/utils/seed.js
if (process.argv[1]?.endsWith('seed.js')) {
  runSeed();
}
