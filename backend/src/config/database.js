import mongoose from 'mongoose';
import { config } from './index.js';
import logger from './logger.js';

mongoose.set('strictQuery', true);

let isConnected = false;

export const connectDatabase = async () => {
  if (isConnected) return mongoose.connection;

  try {
    const conn = await mongoose.connect(config.db.uri, {
      dbName: config.db.name,
      autoIndex: !config.isProd,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: 50,
      minPoolSize: 5,
    });

    isConnected = true;
    logger.info(`✅  MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);

    mongoose.connection.on('disconnected', () => {
      isConnected = false;
      logger.warn('⚠️  MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      isConnected = true;
      logger.info('🔄  MongoDB reconnected');
    });

    mongoose.connection.on('error', (err) => {
      logger.error(`❌  MongoDB error: ${err.message}`);
    });

    return conn.connection;
  } catch (err) {
    logger.error(`❌  MongoDB connection failed: ${err.message}`);
    throw err;
  }
};

export const disconnectDatabase = async () => {
  if (!isConnected) return;
  await mongoose.disconnect();
  isConnected = false;
  logger.info('🔌  MongoDB disconnected gracefully');
};

export default connectDatabase;
