import mongoose from 'mongoose';

let isConnected = false;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;
const RECONNECT_INTERVAL = 3000;

export async function connectDB(uri?: string): Promise<typeof mongoose> {
  if (isConnected && mongoose.connection.readyState === 1) {
    return mongoose;
  }

  const mongoUri = uri || process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error('MONGODB_URI is not defined');
  }

  try {
    const db = await mongoose.connect(mongoUri, {
      maxPoolSize: 10,
      // Increased timeout for replica set failover (30 seconds)
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      // Connection timeout
      connectTimeoutMS: 30000,
      // Heartbeat frequency
      heartbeatFrequencyMS: 10000,
      // Retry options for high availability
      retryWrites: true,
      retryReads: true,
      // Read from secondary if primary unavailable
      readPreference: 'secondaryPreferred',
      // Write concern for data durability
      w: 'majority',
      wtimeoutMS: 10000,
    });

    isConnected = true;
    reconnectAttempts = 0;
    console.log('MongoDB connected successfully');

    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
      isConnected = false;
      attemptReconnect(mongoUri);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
      isConnected = false;
      attemptReconnect(mongoUri);
    });

    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected');
      isConnected = true;
      reconnectAttempts = 0;
    });

    return db;
  } catch (error) {
    console.error('MongoDB connection failed:', error);
    throw error;
  }
}

async function attemptReconnect(uri: string): Promise<void> {
  if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    console.error('Max reconnection attempts reached');
    return;
  }

  reconnectAttempts++;
  console.log(`Attempting to reconnect (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);

  setTimeout(async () => {
    try {
      if (!isConnected && mongoose.connection.readyState !== 1) {
        await mongoose.connect(uri, {
          maxPoolSize: 10,
          serverSelectionTimeoutMS: 30000,
          socketTimeoutMS: 45000,
          retryWrites: true,
          retryReads: true,
          readPreference: 'secondaryPreferred',
        });
        isConnected = true;
        reconnectAttempts = 0;
        console.log('MongoDB reconnected successfully');
      }
    } catch (error) {
      console.error('Reconnection attempt failed:', error);
      attemptReconnect(uri);
    }
  }, RECONNECT_INTERVAL);
}

export async function disconnectDB(): Promise<void> {
  if (!isConnected) return;

  await mongoose.disconnect();
  isConnected = false;
  console.log('MongoDB disconnected');
}

export { mongoose };

