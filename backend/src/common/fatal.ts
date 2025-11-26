import { logger } from './logger';
import { closeDB } from '../db/connection';

const shutdown = async (signal: string) => {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  try {
    await closeDB();
    logger.info('Database connection closed.');
  } catch (err) {
    logger.error({ err }, 'Error closing DB:');
  }
  process.exit(0);
};

export const handleUncaughtErrors = () => {
  process.on('unhandledRejection', (reason) => {
    logger.error({ reason }, 'Unhandled Rejection:');
    process.exit(1);
  });

  process.on('uncaughtException', (error) => {
    logger.error({ error }, 'Uncaught Exception:');
    process.exit(1);
  });
};

export const handleShutdownSignals = () => {
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};