// TYPES
import type { FilterDef } from '@/shared/features/filters/types/filterTypes.js';

export const ADMIN_USERS_FILTER_DEFS = [
	{
		key: 'role',
		label: 'Role',
		options: [
			{ value: '', label: 'All roles' },
			{ value: 'admin', label: 'Admins' },
			{ value: 'user', label: 'Users' }
		]
	},
	{
		key: 'status',
		label: 'Status',
		options: [
			{ value: '', label: 'All statuses' },
			{ value: 'active', label: 'Active' },
			{ value: 'banned', label: 'Banned' }
		]
	},
	{
		key: 'verification',
		label: 'Verification',
		options: [
			{ value: '', label: 'All verification' },
			{ value: 'verified', label: 'Verified' },
			{ value: 'unverified', label: 'Unverified' }
		]
	}
] satisfies FilterDef[];
