import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import swaggerUi from 'swagger-ui-express'
import { swaggerSpec } from './config/swagger.js'
import { errorMiddleware } from './middleware/error.middleware.js'
import { logger } from './utils/logger.js'
import router from './routes/index.js'

const app = express()

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(helmet())
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(morgan('combined', { stream: { write: (msg) => logger.http(msg.trim()) } }))

// ── Swagger Docs ──────────────────────────────────────────────────────────────
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'backend API Docs',
  customCss: '.swagger-ui .topbar { display: none }',
}))

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/v1', router)

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() })
})

// ── Error Handler ─────────────────────────────────────────────────────────────
app.use(errorMiddleware)

export default app
