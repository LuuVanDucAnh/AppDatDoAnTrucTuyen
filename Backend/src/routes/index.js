import { Router } from 'express'
import adminRouter from '../modules/admin/admin.route.js'
import addressesRouter from '../modules/addresses/addresses.route.js'
import cartItemsRouter from '../modules/cart_items/cart_items.route.js'
import cartsRouter from '../modules/carts/carts.route.js'
import categoriesRouter from '../modules/categories/categories.route.js'
import foodsRouter from '../modules/foods/foods.route.js'
import orderItemsRouter from '../modules/order_items/order_items.route.js'
import ordersRouter from '../modules/orders/orders.route.js'
import ownerRouter from '../modules/owner/owner.route.js'
import paymentsRouter from '../modules/payments/payments.route.js'
import profileRouter from '../modules/profile/profile.route.js'
import restaurantsRouter from '../modules/restaurants/restaurants.route.js'
import reviewsRouter from '../modules/reviews/reviews.route.js'
import searchRouter from '../modules/search/search.route.js'
import uploadRouter from '../modules/upload/upload.route.js'
import usersRouter from '../modules/users/users.route.js'

const router = Router()

router.use('/admin', adminRouter)
router.use('/addresses', addressesRouter)
router.use('/cart_items', cartItemsRouter)
router.use('/carts', cartsRouter)
router.use('/categories', categoriesRouter)
router.use('/foods', foodsRouter)
router.use('/order_items', orderItemsRouter)
router.use('/orders', ordersRouter)
router.use('/owner', ownerRouter)
router.use('/payments', paymentsRouter)
router.use('/profile', profileRouter)
router.use('/restaurants', restaurantsRouter)
router.use('/reviews', reviewsRouter)
router.use('/search', searchRouter)
router.use('/upload', uploadRouter)
router.use('/users', usersRouter)

export default router
