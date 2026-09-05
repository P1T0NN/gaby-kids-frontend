// LIBRARIES
import { httpRouter } from 'convex/server';
import { authComponent, createAuth } from './betterAuth/config.js';

const http = httpRouter();

authComponent.registerRoutes(http, createAuth);

export default http;
