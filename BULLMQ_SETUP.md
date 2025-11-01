# BullMQ Setup for Scheduled Notifications

## Overview

This implementation uses **BullMQ** with **Redis** for scheduled notification queuing. This is a superior approach compared to cron jobs or database triggers for several reasons:

### Why BullMQ > Cron Jobs > DB Triggers?

1. **BullMQ with Delayed Jobs** ✅
   - **Precise timing**: Jobs execute at exact scheduled time
   - **Scalable**: Can handle millions of scheduled jobs
   - **Reliable**: Built-in retry mechanisms and failure handling
   - **Persistent**: Jobs survive server restarts
   - **Resource efficient**: No polling, Redis handles scheduling
   - **Distributed**: Can scale workers across multiple servers
   - **Monitoring**: Built-in job status tracking

2. **Cron Jobs** ⚠️
   - **Polling overhead**: Continuously checks database
   - **Imprecise timing**: Only runs at fixed intervals (e.g., every minute)
   - **Resource intensive**: Constant database queries
   - **Hard to scale**: Single point of failure
   - **No built-in retries**: Manual error handling needed

3. **Database Triggers** ❌
   - **Database overhead**: Triggers run synchronously in DB
   - **Limited capabilities**: Can't handle complex scheduling logic
   - **Hard to debug**: Difficult to troubleshoot trigger failures
   - **Platform dependent**: Different syntax per database
   - **No retry mechanism**: Must handle failures manually

## Architecture

```
API Request → Schedule Notification → BullMQ Queue (Redis) → Worker Process → Send Notification
```

1. **API receives** scheduled notification request
2. **NotificationService** creates a job in BullMQ queue with delay
3. **Redis stores** the job and schedules execution
4. **Worker process** (separate) processes jobs when delay expires
5. **Notification sent** and status updated in database

## Setup Instructions

### 1. Install Dependencies

```bash
npm install bullmq ioredis
```

### 2. Start Redis

Using Docker Compose (already configured):
```bash
docker-compose up -d redis
```

Or manually:
```bash
docker run -d -p 6379:6379 redis:7-alpine
```

### 3. Environment Variables

Update your `.env` or configuration:
```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=redis123  # If using password (as in docker-compose)
```

### 4. Start the Worker Process

**Development:**
```bash
npm run worker
```

**Production:**
```bash
npm run build
npm run worker:prod
```

**Important:** The worker must run in a separate process from your main API server!

### 5. Running Both Processes

**Development (Terminal 1 - API):**
```bash
npm run start:dev
```

**Development (Terminal 2 - Worker):**
```bash
npm run worker
```

**Production (using PM2):**
```json
{
  "apps": [
    {
      "name": "notification-api",
      "script": "dist/main.js",
      "instances": 1
    },
    {
      "name": "notification-worker",
      "script": "dist/workers/notification.worker.js",
      "instances": 2  // Can run multiple workers for scalability
    }
  ]
}
```

## How It Works

### Scheduling a Notification

When you call the `/notifications/send` endpoint with a `scheduledAt` date:

1. `NotificationsService.scheduleNotification()` is called
2. Creates a `NotificationLogs` entry with `SCHEDULED` status
3. Adds a job to BullMQ queue with calculated delay
4. Redis stores the job and will trigger it at the scheduled time
5. Job ID is stored in `NotificationLogs.jobId` for potential cancellation

### Worker Processing

1. Worker subscribes to `notification-queue`
2. When scheduled time arrives, Redis releases the job
3. Worker picks up the job
4. Worker calls `sendNotification()` logic
5. Updates `NotificationLogs` status to `SENT` or `FAILED`
6. Job is marked as completed

## Features

### ✅ Delayed Job Execution
Jobs are automatically delayed until `scheduledAt` time.

### ✅ Automatic Retries
Failed jobs are retried 3 times with exponential backoff.

### ✅ Job Persistence
Jobs survive server restarts (stored in Redis).

### ✅ Concurrent Processing
Worker processes up to 5 jobs concurrently (configurable).

### ✅ Rate Limiting
Built-in rate limiting (100 jobs per second max).

### ✅ Error Handling
Failed jobs update notification log status and error messages.

## Monitoring

### Check Queue Status

You can monitor the queue using BullMQ Dashboard or Redis CLI:

```bash
# Connect to Redis
redis-cli -h localhost -p 6379 -a redis123

# Check queue length
LLEN bull:notification-queue:wait
LLEN bull:notification-queue:active
LLEN bull:notification-queue:completed
LLEN bull:notification-queue:failed
```

### Worker Logs

The worker logs all job processing:
- Job completed successfully
- Job failed with error
- Worker errors

## Cancelling Scheduled Notifications

You can cancel a scheduled notification by removing the job:

```typescript
await notificationQueue.removeScheduledNotification(jobId);
```

The `jobId` is stored in `NotificationLogs.jobId` field.

## Scaling

### Horizontal Scaling

You can run multiple worker processes:
- Different servers
- Same server with different ports
- Using process managers (PM2, Docker Swarm, Kubernetes)

Each worker will compete for jobs, ensuring load distribution.

### Vertical Scaling

Increase worker concurrency:
```typescript
// In notification.worker.ts
this.worker = new Worker('notification-queue', handler, {
  concurrency: 10, // Process 10 jobs at once
});
```

## Troubleshooting

### Worker not processing jobs

1. Check Redis connection
2. Verify worker is running (`npm run worker`)
3. Check worker logs for errors
4. Ensure queue name matches: `notification-queue`

### Jobs not being scheduled

1. Check Redis connection in main app
2. Verify `NotificationQueue` is injected correctly
3. Check notification service logs

### Jobs stuck in queue

1. Check worker is running
2. Verify worker can connect to MongoDB
3. Check for errors in worker logs

## Performance Considerations

- **Redis Memory**:** Large numbers of scheduled jobs consume Redis memory
- **Worker Concurrency**: Balance between throughput and resource usage
- **Job Cleanup**: Old completed jobs are auto-removed (24h) to save memory
- **Failed Jobs**: Kept for 7 days for debugging

## Comparison Summary

| Feature | BullMQ | Cron Jobs | DB Triggers |
|---------|--------|-----------|-------------|
| Precision | ⭐⭐⭐⭐⭐ Exact | ⭐⭐⭐ Interval-based | ⭐⭐⭐ Synchronous |
| Scalability | ⭐⭐⭐⭐⭐ Excellent | ⭐⭐ Limited | ⭐ Poor |
| Reliability | ⭐⭐⭐⭐⭐ High | ⭐⭐⭐ Medium | ⭐⭐ Low |
| Resource Usage | ⭐⭐⭐⭐⭐ Low | ⭐⭐ High (polling) | ⭐⭐⭐ Medium |
| Retry Logic | ⭐⭐⭐⭐⭐ Built-in | ⭐ Manual | ⭐ Manual |
| Monitoring | ⭐⭐⭐⭐⭐ Excellent | ⭐⭐ Basic | ⭐ Poor |

**Conclusion:** BullMQ is the best choice for production-grade scheduled notifications! 🚀

