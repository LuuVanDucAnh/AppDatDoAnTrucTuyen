import 'dotenv/config';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

const c = await mysql.createConnection({
  host: process.env.DB_HOST,
  port: +process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

const [users] = await c.query('SELECT id, full_name, email, password, role, status FROM users');
console.log('ALL USERS:');
for (const u of users) {
  const is123456 = bcrypt.compareSync('123456', u.password);
  const is14102005 = bcrypt.compareSync('14102005', u.password);
  console.log({
    id: u.id,
    name: u.full_name,
    email: u.email,
    role: u.role,
    status: u.status,
    pass_is_123456: is123456,
    pass_is_14102005: is14102005,
    hash_prefix: u.password?.substring(0, 10),
  });
}

await c.end();
