import { Router } from 'express'
import { getAll, getById, create, update, remove, getActive, getMenu } from './restaurants.controller.js'
import { authMiddleware } from '../../middleware/auth.middleware.js'

const router = Router()

/**
 * @swagger
 * tags:
 *   name: Restaurants
 *   description: Quản lý restaurants
 */

router.get('/', getAll)
router.get('/active', getActive)
router.get('/:id/menu', getMenu)
router.get('/:id', getById)

router.post('/', authMiddleware, create)
router.put('/:id', authMiddleware, update)
router.delete('/:id', authMiddleware, remove)

/**
 * @swagger
 * /restaurants/{id}:
 *   get:
 *     tags: [Restaurants]
 *     summary: Lấy restaurants theo ID
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
 *     tags: [Restaurants]
 *     summary: Cập nhật restaurants
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
 *               owner_id:
 *                 type: integer
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               address:
 *                 type: string
 *               phone_number:
 *                 type: string
 *               image:
 *                 type: string
 *               opening_time:
 *                 type: string
 *               closing_time:
 *                 type: string
 *               status:
 *                 type: string
 *   delete:
 *     tags: [Restaurants]
 *     summary: Xóa restaurants
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

export default router
