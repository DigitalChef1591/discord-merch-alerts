"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const client_1 = require("@prisma/client");
const core_1 = require("@merch-alerts/core");
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
const prisma = new client_1.PrismaClient();
// Middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Health check endpoint
app.get('/healthz', async (req, res) => {
    try {
        // Check database connection
        await prisma.$queryRaw `SELECT 1`;
        res.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            version: process.env.npm_package_version || '1.0.0'
        });
    }
    catch (error) {
        core_1.logger.error('Health check failed', { error });
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
        await prisma.$queryRaw `SELECT 1`;
        res.json({
            status: 'ready',
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        core_1.logger.error('Readiness check failed', { error });
        res.status(503).json({
            status: 'not ready',
            timestamp: new Date().toISOString()
        });
    }
});
// Metrics endpoint (basic)
app.get('/metrics', async (req, res) => {
    try {
        const [channelCount, productCount, eventCount, alertCount, sourceCount] = await Promise.all([
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
    }
    catch (error) {
        core_1.logger.error('Metrics endpoint failed', { error });
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
    }
    catch (error) {
        core_1.logger.error('Sources endpoint failed', { error });
        res.status(500).json({ error: 'Failed to fetch sources' });
    }
});
// Recent alerts endpoint
app.get('/alerts/recent', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
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
    }
    catch (error) {
        core_1.logger.error('Recent alerts endpoint failed', { error });
        res.status(500).json({ error: 'Failed to fetch recent alerts' });
    }
});
// Error handling middleware
app.use((err, req, res, next) => {
    core_1.logger.error('Express error', { error: err, path: req.path });
    res.status(500).json({ error: 'Internal server error' });
});
// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});
// Start server
app.listen(port, () => {
    core_1.logger.info(`API server running on port ${port}`);
});
// Graceful shutdown
process.on('SIGINT', async () => {
    core_1.logger.info('Shutting down API server...');
    await prisma.$disconnect();
    process.exit(0);
});
process.on('SIGTERM', async () => {
    core_1.logger.info('Shutting down API server...');
    await prisma.$disconnect();
    process.exit(0);
});
//# sourceMappingURL=index.js.map