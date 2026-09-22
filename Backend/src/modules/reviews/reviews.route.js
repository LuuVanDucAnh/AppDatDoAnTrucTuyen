import { Router } from 'express'
import {
  getAll,
  getById,
  create,
  update,
  remove,
  getByRestaurant,
  createCustomerReview,
} from './reviews.controller.js'
import { authMiddleware } from '../../middleware/auth.middleware.js'

const router = Router()

/**
 * @swagger
 * tags:
 *   name: Reviews
 *   description: Quản lý reviews
 */


/**
 * @swagger
 * /reviews:
 *   get:
 *     tags: [Reviews]
 *     summary: Lấy danh sách reviews
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
 *     tags: [Reviews]
 *     summary: Tạo reviews mới
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
 *               order_id:
 *                 type: integer
 *               rating:
 *                 type: integer
 *               comment:
 *                 type: string
 */
// ── Public Restaurant Reviews ───────────────────────────────────────────────
router.get('/restaurant/:restaurant_id', getByRestaurant)

// ── Customer Create Review ──────────────────────────────────────────────────
router.post('/', authMiddleware, createCustomerReview)

// ── General Admin/CRUD ──────────────────────────────────────────────────────
router.get('/', authMiddleware, getAll)

/**
 * @swagger
 * /reviews/{id}:
 *   get:
 *     tags: [Reviews]
 *     summary: Lấy reviews theo ID
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
 *     tags: [Reviews]
 *     summary: Cập nhật reviews
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
 *               order_id:
 *                 type: integer
 *               rating:
 *                 type: integer
 *               comment:
 *                 type: string
 *   delete:
 *     tags: [Reviews]
 *     summary: Xóa reviews
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
