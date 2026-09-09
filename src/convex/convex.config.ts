// LIBRARIES
import { defineApp } from 'convex/server';
import { v } from 'convex/values';
import aggregate from '@convex-dev/aggregate/convex.config';
import migrations from '@convex-dev/migrations/convex.config';
import rateLimiter from '@convex-dev/rate-limiter/convex.config';
import resend from '@convex-dev/resend/convex.config.js';
import analytics from '@vllnt/convex-analytics/convex.config';
import r2 from '@convex-dev/r2/convex.config.js';
import auditLog from 'convex-audit-log/convex.config.js';

// COMPONENTS
import betterAuth from './betterAuth/component/convex.config.js';

const app = defineApp({
	env: {
		STRIPE_SECRET_KEY: v.string(),
		STRIPE_WEBHOOK_SECRET: v.string()
	}
});

app.use(betterAuth);
app.use(migrations);
app.use(rateLimiter);
app.use(resend);
app.use(analytics);
app.use(aggregate, { name: 'productsAggregate' });
app.use(aggregate, { name: 'categoriesAggregate' });
app.use(aggregate, { name: 'ordersAggregate' });
app.use(r2);
app.use(auditLog);

export default app;
