import { Router } from 'express'
import { getAll, getById, create, update, remove } from './orders.controller.js'
import { authMiddleware } from '../../middleware/auth.middleware.js'

const router = Router()

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Quản lý orders
 */


/**
 * @swagger
 * /orders:
 *   get:
 *     tags: [Orders]
 *     summary: Lấy danh sách orders
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
 *     tags: [Orders]
 *     summary: Tạo orders mới
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
 *               user_id:
 *                 type: integer
 *               restaurant_id:
 *                 type: integer
 *               address_id:
 *                 type: integer
 *               food_total:
 *                 type: number
 *               delivery_fee:
 *                 type: number
 *               discount:
 *                 type: number
 *               total_amount:
 *                 type: number
 *               note:
 *                 type: string
 *               status:
 *                 type: string
 */
router.get('/', authMiddleware, getAll)
router.post('/', authMiddleware, create)

/**
 * @swagger
 * /orders/{id}:
 *   get:
 *     tags: [Orders]
 *     summary: Lấy orders theo ID
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
 *     tags: [Orders]
 *     summary: Cập nhật orders
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
 *               user_id:
 *                 type: integer
 *               restaurant_id:
 *                 type: integer
 *               address_id:
 *                 type: integer
 *               food_total:
 *                 type: number
 *               delivery_fee:
 *                 type: number
 *               discount:
 *                 type: number
 *               total_amount:
 *                 type: number
 *               note:
 *                 type: string
 *               status:
 *                 type: string
 *   delete:
 *     tags: [Orders]
 *     summary: Xóa orders
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
