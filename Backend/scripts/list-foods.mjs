import 'dotenv/config'
import mysql from 'mysql2/promise'

async function main() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: +process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  })

  const [rows] = await db.query(`
    SELECT f.id, f.name, f.description, c.name as cat_name, r.name as res_name, f.image
    FROM foods f
    LEFT JOIN categories c ON f.category_id = c.id
    LEFT JOIN restaurants r ON c.restaurant_id = r.id
    ORDER BY f.id ASC
  `)

  console.log(`TOTAL FOODS: ${rows.length}`)
  for (const r of rows) {
    console.log(`ID:${r.id} | QUAN:${r.res_name} | DM:${r.cat_name} | MON:${r.name} | ANH:${r.image}`)
  }
  await db.end()
}

main().catch(console.error)
