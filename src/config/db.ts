import mongoose from 'mongoose';

async function connectDB() {
  const mongoUri = process.env.DB_URI;

  if (!mongoUri) {
    throw new Error('DB_URI_ is missing from the environment');
  }

  await mongoose.connect(mongoUri);
  console.log('MongoDB connected');
}

export default connectDB;