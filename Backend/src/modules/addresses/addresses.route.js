import { Router } from 'express'
import {
  getAll,
  getById,
  create,
  update,
  remove,
  getMyAddresses,
  createMyAddress,
  setDefault,
} from './addresses.controller.js'
import { authMiddleware } from '../../middleware/auth.middleware.js'

const router = Router()

/**
 * @swagger
 * tags:
 *   name: Addresses
 *   description: Quản lý addresses
 */


/**
 * @swagger
 * /addresses:
 *   get:
 *     tags: [Addresses]
 *     summary: Lấy danh sách addresses
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
 *     tags: [Addresses]
 *     summary: Tạo addresses mới
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
 *               receiver_name:
 *                 type: string
 *               phone_number:
 *                 type: string
 *               address_detail:
 *                 type: string
 *               ward:
 *                 type: string
 *               district:
 *                 type: string
 *               city:
 *                 type: string
 *               is_default:
 *                 type: integer
 */
// ── Customer Address APIs ───────────────────────────────────────────────────
router.get('/my-addresses', authMiddleware, getMyAddresses)
router.post('/my-addresses', authMiddleware, createMyAddress)
router.patch('/:id/set-default', authMiddleware, setDefault)

// ── General CRUD ────────────────────────────────────────────────────────────
router.get('/', authMiddleware, getAll)
router.post('/', authMiddleware, create)

/**
 * @swagger
 * /addresses/{id}:
 *   get:
 *     tags: [Addresses]
 *     summary: Lấy addresses theo ID
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
 *     tags: [Addresses]
 *     summary: Cập nhật addresses
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
 *               receiver_name:
 *                 type: string
 *               phone_number:
 *                 type: string
 *               address_detail:
 *                 type: string
 *               ward:
 *                 type: string
 *               district:
 *                 type: string
 *               city:
 *                 type: string
 *               is_default:
 *                 type: integer
 *   delete:
 *     tags: [Addresses]
 *     summary: Xóa addresses
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
