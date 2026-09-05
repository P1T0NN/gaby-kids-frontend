// TYPES
import type { AuditEventInput, ChangeEventInput } from 'convex-audit-log';
import type { UserIdentity } from 'convex/server';

export type AuditIdentity = Pick<UserIdentity, 'subject'>;
export type AuditEvent = Omit<AuditEventInput, 'actorId'>;
export type AuditChangeEvent = Omit<ChangeEventInput, 'actorId'>;
