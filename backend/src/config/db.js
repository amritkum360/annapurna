import dns from 'node:dns';
import mongoose from 'mongoose';

// Ensure Node.js can resolve MongoDB SRV records on Windows without querySrv ECONNREFUSED
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {
  // Ignore in environments where setting DNS servers is restricted
}

/**
 * Connects to MongoDB database using Mongoose.
 * Supports local MongoDB and MongoDB Atlas connection strings.
 */
export const connectDB = async () => {
  const uri =
    process.env.MONGODB_URI ||
    'mongodb+srv://amritkum360:7004343011@cluster0.3ssdupo.mongodb.net/annapurna?retryWrites=true&w=majority';

  try {
    const conn = await mongoose.connect(uri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    console.log(
      'TIP: Ensure your MongoDB server is running locally or set MONGODB_URI in .env to your MongoDB Atlas connection string.'
    );
    // In production, failure to connect to database should be fatal
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};
