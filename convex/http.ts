import { httpRouter } from 'convex/server';
import { auth } from './auth';
import { search } from './directory';
const http = httpRouter();
auth.addHttpRoutes(http);
http.route({path: '/api/v1/projects', method: 'GET', handler: search});
export default http;
