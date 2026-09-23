import { cronJobs } from 'convex/server';
import { internal } from './_generated/api';
const crons = cronJobs();
crons.cron('Refresh GitHub repository metadata daily', '17 3 * * *', internal.github.refresh, {});
export default crons;
