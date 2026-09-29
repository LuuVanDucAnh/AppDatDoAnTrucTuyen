import 'dotenv/config'
import mysql from 'mysql2/promise'
const c = await mysql.createConnection({
  host: process.env.DB_HOST, port: +process.env.DB_PORT,
  user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME,
})
const tables = ['users','addresses','restaurants','categories','foods','carts','cart_items','orders','order_items','payments','reviews']
for (const t of tables) {
  try { const [r] = await c.query(`SELECT COUNT(*) n FROM \`${t}\``); console.log(t.padEnd(14), r[0].n) }
  catch (e) { console.log(t.padEnd(14), 'ERR', e.code) }
}
try {
  const [u] = await c.query('SELECT id, full_name, email, phone_number, role, status FROM users LIMIT 10')
  console.log('\nusers sample:'); console.table(u)
  const [r] = await c.query('SELECT id, name, status, owner_id FROM restaurants LIMIT 10')
  console.log('restaurants sample:'); console.table(r)
} catch (e) { console.log('sample err', e.message) }
await c.end()
