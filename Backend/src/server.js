import 'dotenv/config'
import app from './app.js'
import { sequelize } from './config/database.js'
import { logger } from './utils/logger.js'

const PORT = process.env.PORT || 3000

async function bootstrap() {
  try {
    // Test DB connection
    await sequelize.authenticate()
    logger.info('✅ Database connection established.')

    app.listen(PORT, () => {
      logger.info(`🚀 Server running on http://localhost:${PORT}`)
    })
  } catch (error) {
    logger.error('❌ Unable to start server:', error)
    process.exit(1)
  }
}

bootstrap()
