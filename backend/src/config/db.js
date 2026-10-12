import mongoose from 'mongoose';
import { env } from './env.js';

let isConnected = false;

export const connectDB = async () => {
  const uri = env.MONGODB_URI;

  try {
    mongoose.set('strictQuery', true);

    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });

    isConnected = true;
    console.log(`[Database] MongoDB connected successfully: ${conn.connection.host}/${conn.connection.name}`);

    mongoose.connection.on('error', (err) => {
      isConnected = false;
      console.error(`[Database] MongoDB connection error: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      isConnected = false;
      console.warn('[Database] MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      isConnected = true;
      console.log('[Database] MongoDB reconnected');
    });

    return conn;
  } catch (error) {
    isConnected = false;
    console.warn(`[Database Warning] Could not connect to MongoDB at "${uri}".`);
    console.warn(`Reason: ${error.message}`);
    console.warn('[Database Note] Server will continue running for Phase 0 health checks. Please start MongoDB locally or set MONGODB_URI in backend/.env for persistent storage.');
    return null;
  }
};

export const getDbStatus = () => {
  const stateMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  const readyState = mongoose.connection.readyState;
  return {
    state: stateMap[readyState] || 'unknown',
    readyState,
    isConnected,
    host: mongoose.connection.host || null,
    name: mongoose.connection.name || null,
  };
};
