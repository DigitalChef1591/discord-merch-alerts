import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { PrismaClient } from '@prisma/client';
import { logger } from '@merch-alerts/core';

const app = express();
const port = process.env.PORT || 3000;
const prisma = new PrismaClient();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/healthz', async (req, res) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0'
    });
  } catch (error) {
    logger.error('Health check failed', { error });
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Database connection failed'
    });
  }
});

// Ready check endpoint
app.get('/readyz', async (req, res) => {
  try {
    // More comprehensive readiness check
    await prisma.$queryRaw`SELECT 1`;
    
    res.json({
      status: 'ready',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Readiness check failed', { error });
    res.status(503).json({
      status: 'not ready',
      timestamp: new Date().toISOString()
    });
  }
});

// Metrics endpoint (basic)
app.get('/metrics', async (req, res) => {
  try {
    const [
      channelCount,
      productCount,
      eventCount,
      alertCount,
      sourceCount
    ] = await Promise.all([
      prisma.channel.count(),
      prisma.product.count(),
      prisma.event.count(),
      prisma.alert.count(),
      prisma.source.count()
    ]);

    res.json({
      channels: channelCount,
      products: productCount,
      events: eventCount,
      alerts: alertCount,
      sources: sourceCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Metrics endpoint failed', { error });
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

// Sources status endpoint
app.get('/sources', async (req, res) => {
  try {
    const sources = await prisma.source.findMany({
      select: {
        name: true,
        domain: true,
        enabled: true,
        lastFetch: true,
        delayMinutes: true
      }
    });

    res.json(sources);
  } catch (error) {
    logger.error('Sources endpoint failed', { error });
    res.status(500).json({ error: 'Failed to fetch sources' });
  }
});

// Recent alerts endpoint
app.get('/alerts/recent', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    
    const alerts = await prisma.alert.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        event: {
          include: {
            product: true
          }
        }
      }
    });

    res.json(alerts);
  } catch (error) {
    logger.error('Recent alerts endpoint failed', { error });
    res.status(500).json({ error: 'Failed to fetch recent alerts' });
  }
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Express error', { error: err, path: req.path });
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Start server
app.listen(port, () => {
  logger.info(`API server running on port ${port}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Shutting down API server...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Shutting down API server...');
  await prisma.$disconnect();
  process.exit(0);
});
