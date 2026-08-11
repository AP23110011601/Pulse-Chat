// Test setup file
const mongoose = require('mongoose');

beforeAll(async () => {
  // Set test environment
  process.env.NODE_ENV = 'test';
  
  // Connect to test database
  const mongoUri = process.env.MONGO_URI_TEST || process.env.MONGO_URI;
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  // Clean up database
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  }
});

afterEach(async () => {
  // Clean up collections between tests
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});
