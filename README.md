# Notification System Backend

A production-ready notification system built with NestJS that supports sending and scheduling notifications via Email, SMS, and Push channels using a queue-based architecture.

## Live URL 

   https://notification-system-frontend-jqss.onrender.com/notifications
   
   Please Note : The server is running on free tier so it might take 2-5 mins for Cold start. Please be patient. Thankyou.

## Architecture

### Overview
The system follows a **modular microservices-like architecture** with clear separation of concerns:

```
API Server → Notification Service → Queue (Redis/BullMQ) → Worker Process → Channel Services
     ↓              ↓                        ↓                   ↓                ↓
  Auth Guard    CRUD Ops              Scheduled Jobs      Background Jobs    Email/SMS/Push
```


### Key Components

1. **API Server** (`src/main.ts`)
   - RESTful API endpoints for notification management
   - JWT-based authentication
   - CORS enabled for frontend integration

2. **Auth Module** (`src/modules/auth/`)
   - User signup/login with bcrypt password hashing
   - JWT token generation and validation
   - Protected routes via AuthGuard

3. **Notifications Module** (`src/modules/notifications/`)
   - Notification CRUD operations
   - Multi-channel support (Email, SMS, Push) via Factory pattern
   - Notification logs with status tracking

4. **Queue System** (`src/queues/notification.queue.ts`)
   - BullMQ for job queuing with Redis
   - Delayed job execution for scheduled notifications
   - Automatic retries with exponential backoff

5. **Worker Process** (`src/workers/notification.worker.ts`)
   - Background process consuming jobs from Redis queue
   - Processes scheduled notifications at specified times
   - Updates notification logs (SENT/FAILED status)

### Design Decisions

**Why BullMQ over Cron Jobs?**
- ✅ Precise timing (no polling overhead)
- ✅ Scalable (handles millions of jobs)
- ✅ Reliable (built-in retries, persistent storage)
- ✅ Distributed (can scale workers independently)

**Why Factory Pattern for Channels?**
- Easy to add new notification channels
- Clean separation of concerns
- Type-safe channel selection

**Why Separate Worker Process?**
- Keeps API responsive (background processing)
- Independent scaling of workers
- Better resource management

## Setup

### Prerequisites
- Node.js 18+
- MongoDB (local or MongoDB Atlas)
- Redis (local or Upstash)
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Build the project
npm run build
```

### Environment Variables

Create a `.env` file in the root directory:

```env
# MongoDB Configuration
MONGO_URI=mongodb://admin:admin123@localhost:27017/notification-system?authSource=admin
# OR for MongoDB Atlas:
# MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/notification-system

# Redis Configuration (Local)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=redis123
REDIS_USE_TLS=false

# Redis Configuration (Upstash - Production)
# REDIS_HOST=your-host.upstash.io
# REDIS_PORT=6379
# REDIS_PASSWORD=your_password
# REDIS_USE_TLS=true

# JWT Secret (generate a strong random string)
JWT_SECRET=your_super_secret_jwt_key_here

# Server Configuration
PORT=9091
NODE_ENV=development

# Frontend URL (for CORS in production)
# FRONTEND_URL=https://your-frontend.vercel.app
```

### Running the Application

#### Development Mode

**Terminal 1 - API Server:**
```bash
npm run start:dev
```

**Terminal 2 - Worker Process:**
```bash
npm run worker
```

#### Production Mode

**Terminal 1 - API Server:**
```bash
npm run build
npm run start:prod
```

**Terminal 2 - Worker Process:**
```bash
npm run worker:prod
```

### Docker Setup

**Start MongoDB and Redis:**
```bash
docker compose up -d
```

This starts:
- MongoDB on port `27017`
- Redis on port `6379`

## Testing

```bash
# Unit tests
npm run test

# Watch mode
npm run test:watch

# Coverage report
npm run test:cov

# E2E tests
npm run test:e2e
```

**Note:** Currently, tests focus on core functionality. Full test coverage is recommended for production.

## API Endpoints

### Authentication
- `POST /auth/signup` - User registration
- `POST /auth/login` - User login

### Notifications (Protected - requires JWT)
- `GET /notifications` - List all notifications
- `POST /notifications` - Create notification
- `GET /notifications/:id` - Get single notification
- `PATCH /notifications/:id` - Update notification
- `DELETE /notifications/:id` - Delete notification
- `POST /notifications/send` - Send or schedule notification
- `GET /notifications/logs?type=status` - Get notification logs (filter by status)

**Authentication:** Include JWT token in `Authorization: Bearer <token>` header

## Assumptions & Shortcuts

### Assumptions
1. **Notification channels are placeholders** - Email/SMS/Push services return mock responses. In production, integrate with actual providers (SendGrid, Twilio, FCM).
2. **Single worker instance** - For high-volume production, run multiple worker instances.
3. **MongoDB for persistence** - Chosen for flexibility with nested notification data.
4. **Upstash Redis** - Used for production (free tier suitable for small/medium scale).

### Shortcuts Taken
1. **No email/SMS provider integration** - Channels return success/failure without actual sending
2. **Simple error handling** - Production should have more robust error handling and retry logic
3. **Basic validation** - DTOs have basic validation; production needs stricter rules
4. **CORS allows all origins** - Currently `app.enableCors()` allows all; configure properly for production
5. **Worker runs separately** - For cost savings on Render, worker can run in same container as API

### Trade-offs
- **Simplicity over complexity** - Prioritized getting core functionality working
- **Flexibility over performance** - MongoDB and BullMQ chosen for ease of use and scaling
- **Development speed** - Some features (email validation, rate limiting) left for production hardening

## Production Deployment

###  Stack (Free Tier)
- **Frontend**: Render (Web service)
- **Backend API**: Render (Web Service)
- **Worker**: Can run in same Render service OR separate Background Worker
- **Database**: MongoDB Atlas (Free M0 cluster)
- **Queue**: Upstash Redis (Free tier: 10K commands/day)

### Cost Optimization
- Use free tier services (MongoDB Atlas, Upstash)
- Consider upgrading when traffic increases

## Project Structure

```
src/
├── main.ts                 # Application entry point
├── app.module.ts          # Root module
├── configurations/         # Environment configuration
├── middlewares/           # Auth guard
├── modules/
│   ├── auth/             # Authentication module
│   └── notifications/    # Notification module
│       ├── channels/     # Email, SMS, Push services
│       ├── dto/         # Data transfer objects
│       ├── schemas/     # MongoDB schemas
│       └── services/    # Business logic
├── queues/               # BullMQ queue configuration
├── services/            # Shared services (JWT)
└── workers/            # Background worker process
```


## License

MIT
