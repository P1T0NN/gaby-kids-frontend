type AdminUserWhere = {
	field: 'name' | 'email' | 'role' | 'banned' | 'emailVerified';
	operator: 'eq' | 'ne' | 'contains';
	value: string | boolean;
};

/**
 * Translate client-owned symbolic filters into the small Better Auth where
 * vocabulary this feature supports.
 */
export function buildAdminUserWhere(
	search?: string,
	filters?: Record<string, string>
): AdminUserWhere[] {
	const where: AdminUserWhere[] = [];

	if (filters?.role === 'admin' || filters?.role === 'user') {
		where.push({
			field: 'role',
			operator: filters.role === 'admin' ? 'eq' : 'ne',
			value: 'admin'
		});
	}

	if (filters?.status === 'active' || filters?.status === 'banned') {
		where.push({
			field: 'banned',
			operator: filters.status === 'banned' ? 'eq' : 'ne',
			value: true
		});
	}

	if (filters?.verification === 'verified' || filters?.verification === 'unverified') {
		where.push({
			field: 'emailVerified',
			operator: 'eq',
			value: filters.verification === 'verified'
		});
	}

	if (search) {
		// ponytail: Better Auth pagination rejects cross-field OR clauses; use the
		// name index by default and switch to email when the term looks like one.
		const field = search.includes('@') ? 'email' : 'name';
		where.push({ field, operator: 'contains', value: search });
	}

	return where;
}
