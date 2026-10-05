import 'dotenv/config'
import mysql from 'mysql2/promise'

const c = await mysql.createConnection({
  host: process.env.DB_HOST,
  port: +process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
})

const now = new Date()
const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

// Check stats for all owners
const [owners] = await c.query("SELECT id, full_name, email, role FROM users WHERE role = 'RESTAURANT_OWNER'")
for (let u of owners) {
  const [res] = await c.query('SELECT id, name FROM restaurants WHERE owner_id = ?', [u.id])
  const resIds = res.map((r) => r.id)
  let monthOrders = 0,
    monthRevenue = 0,
    totalOrders = 0,
    totalRevenue = 0
  if (resIds.length > 0) {
    const [allTime] = await c.query(
      "SELECT COUNT(id) as cnt, COALESCE(SUM(total_amount), 0) as rev FROM orders WHERE restaurant_id IN (?) AND status = 'DELIVERED'",
      [resIds]
    )
    totalOrders = Number(allTime[0].cnt)
    totalRevenue = Number(allTime[0].rev)

    const [thisMonth] = await c.query(
      "SELECT COUNT(id) as cnt, COALESCE(SUM(total_amount), 0) as rev FROM orders WHERE restaurant_id IN (?) AND status = 'DELIVERED' AND created_at >= ?",
      [resIds, startOfMonth]
    )
    monthOrders = Number(thisMonth[0].cnt)
    monthRevenue = Number(thisMonth[0].rev)
  }
  console.log(u.full_name, `(${u.email}):`, {
    restaurants: res.map((r) => r.name),
    monthOrders,
    monthRevenue,
    totalOrders,
    totalRevenue,
  })
}

await c.end()
