import 'dotenv/config'
import mysql from 'mysql2/promise'

const c = await mysql.createConnection({
  host: process.env.DB_HOST,
  port: +process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
})

const [restaurants] = await c.query(`
  SELECT r.id, r.name, r.image, r.status,
         COUNT(DISTINCT cat.id) as category_count,
         COUNT(DISTINCT f.id) as food_count
  FROM restaurants r
  LEFT JOIN categories cat ON r.id = cat.restaurant_id
  LEFT JOIN foods f ON cat.id = f.category_id
  GROUP BY r.id
  ORDER BY r.id DESC
`)

console.table(restaurants)
await c.end()
