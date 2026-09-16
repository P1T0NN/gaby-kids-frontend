import { cronJobs } from 'convex/server';
import { internal } from './_generated/api';
import { STORAGE_CONFIG } from '../shared/features/storage/config.js';
import { ORDER_CONFIG } from '../shared/features/orders/config.js';

const crons = cronJobs();

crons.interval(
	'release expired checkout reservations',
	{ minutes: ORDER_CONFIG.reservationCleanupIntervalMinutes },
	internal.tables.checkoutReservations.crons.deleteExpiredCheckoutReservationsCron
		.deleteExpiredCheckoutReservationsCron,
	{}
);

crons.interval(
	'clean up abandoned R2 uploads',
	{ minutes: STORAGE_CONFIG.cleanupIntervalMinutes },
	internal.storage.r2.cleanupStaleUploads
);

crons.interval(
	'clean up expired audit logs',
	{ hours: 24 },
	internal.auditLogs.crons.cleanupAuditLogsCron.cleanupAuditLogsCron
);

export default crons;
