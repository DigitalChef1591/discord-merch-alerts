"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
exports.connectDatabase = connectDatabase;
exports.disconnectDatabase = disconnectDatabase;
const client_1 = require("@prisma/client");
const core_1 = require("@merch-alerts/core");
exports.prisma = new client_1.PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error']
});
async function connectDatabase() {
    try {
        await exports.prisma.$connect();
        core_1.logger.info('Connected to database');
    }
    catch (error) {
        core_1.logger.error('Failed to connect to database', { error });
        throw error;
    }
}
async function disconnectDatabase() {
    try {
        await exports.prisma.$disconnect();
        core_1.logger.info('Disconnected from database');
    }
    catch (error) {
        core_1.logger.error('Failed to disconnect from database', { error });
    }
}
//# sourceMappingURL=database.js.map