import 'dotenv/config'
import mysql from 'mysql2/promise'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const root = path.join(__dirname, '..')

async function main() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: +process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  })

  const [rows] = await db.query(`
    SELECT f.id, f.name, c.name as category, r.name as restaurant, f.image
    FROM foods f
    LEFT JOIN categories c ON f.category_id = c.id
    LEFT JOIN restaurants r ON c.restaurant_id = r.id
    ORDER BY f.id ASC
  `)

  let missing = 0
  let okCount = 0

  for (const r of rows) {
    if (r.image && r.image.startsWith('/uploads/')) {
      const p = path.join(root, r.image.replace(/^\//, ''))
      const exists = fs.existsSync(p)
      const size = exists ? fs.statSync(p).size : 0
      if (!exists || size === 0) {
        console.error(`❌ [#${r.id}] ${r.name} -> File missing: ${p}`)
        missing++
      } else {
        okCount++
        console.log(`✅ [#${r.id}] [${r.restaurant}] ${r.name.padEnd(35)} -> ${r.image} (${(size / 1024).toFixed(1)} KB)`)
      }
    } else {
      console.log(`🌐 [#${r.id}] [${r.restaurant}] ${r.name.padEnd(35)} -> ${r.image} (REMOTE)`)
      okCount++
    }
  }

  console.log(`\n========================================`)
  console.log(`TOTAL DISHES: ${rows.length}`)
  console.log(`VALID IMAGES: ${okCount}`)
  console.log(`MISSING FILES: ${missing}`)
  console.log(`========================================`)
  await db.end()
}

main().catch(console.error)
