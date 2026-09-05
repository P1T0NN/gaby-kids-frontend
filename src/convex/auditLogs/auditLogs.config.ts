// LIBRARIES
import { AuditLog } from 'convex-audit-log';
import { components } from '../_generated/api.js';

export const AUDIT_LOG_RETENTION_DAYS = 90;
export const AUDIT_LOG_CLEANUP_BATCH_SIZE = 100;

export const auditLog = new AuditLog(components.auditLog, {
	defaultRetentionDays: AUDIT_LOG_RETENTION_DAYS,
	piiFields: ['email', 'phone', 'ssn', 'password']
});
