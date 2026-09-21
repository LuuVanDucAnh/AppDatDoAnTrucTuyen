import { Router } from 'express'
import { getAll, getById, create, update, remove, login, refresh, getMe } from './users.controller.js'
import { authMiddleware } from '../../middleware/auth.middleware.js'

const router = Router()

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Quản lý users
 */

/**
 * @swagger
 * /users/login:
 *   post:
 *     tags: [Users]
 *     summary: Đăng nhập
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Đăng nhập thành công
 */
router.post('/login', login)

/**
 * @swagger
 * /users/refresh:
 *   post:
 *     tags: [Users]
 *     summary: Làm mới Access Token
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Thành công
 */
router.post('/refresh', refresh)

/**
 * @swagger
 * /users/me:
 *   get:
 *     tags: [Users]
 *     summary: Lấy thông tin bản thân
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/me', authMiddleware, getMe)

/**
 * @swagger
 * /users:
 *   get:
 *     tags: [Users]
 *     summary: Lấy danh sách users
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *     responses:
 *       200:
 *         description: Thành công
 *   post:
 *     tags: [Users]
 *     summary: Tạo users mới
 *     responses:
 *       201:
 *         description: Đã tạo thành công
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               full_name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone_number:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *               status:
 *                 type: integer
 */
router.get('/', authMiddleware, getAll)
router.post('/', create)

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Lấy users theo ID
 *     responses:
 *       200:
 *         description: Thành công
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *   put:
 *     tags: [Users]
 *     summary: Cập nhật users
 *     responses:
 *       200:
 *         description: Thành công
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               full_name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone_number:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *               status:
 *                 type: integer
 *   delete:
 *     tags: [Users]
 *     summary: Xóa users
 *     responses:
 *       200:
 *         description: Thành công
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.get('/:id', authMiddleware, getById)
router.put('/:id', authMiddleware, update)
router.delete('/:id', authMiddleware, remove)

export default router
