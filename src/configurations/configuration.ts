export default () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri:
    process.env.MONGO_URI || 'mongodb://localhost:27017/notification-system',
  jwtSecret: process.env.JWT_SECRET || 'change-me',
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || 'redis123', // Default from docker-compose
  },
  port: process.env.PORT || 9091,
});


