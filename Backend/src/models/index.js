import Users from '../modules/users/users.model.js'
import Addresses from '../modules/addresses/addresses.model.js'
import Restaurants from '../modules/restaurants/restaurants.model.js'
import Categories from '../modules/categories/categories.model.js'
import Foods from '../modules/foods/foods.model.js'
import Carts from '../modules/carts/carts.model.js'
import CartItems from '../modules/cart_items/cart_items.model.js'
import Orders from '../modules/orders/orders.model.js'
import OrderItems from '../modules/order_items/order_items.model.js'
import Payments from '../modules/payments/payments.model.js'
import Reviews from '../modules/reviews/reviews.model.js'

// ── Users & Addresses ────────────────────────────────────────────────────────
Users.hasMany(Addresses, { foreignKey: 'user_id', as: 'addresses' })
Addresses.belongsTo(Users, { foreignKey: 'user_id', as: 'user' })

// ── Users & Restaurants (Owner) ──────────────────────────────────────────────
Users.hasMany(Restaurants, { foreignKey: 'owner_id', as: 'restaurants' })
Restaurants.belongsTo(Users, { foreignKey: 'owner_id', as: 'owner' })

// ── Restaurants & Categories ─────────────────────────────────────────────────
Restaurants.hasMany(Categories, { foreignKey: 'restaurant_id', as: 'categories' })
Categories.belongsTo(Restaurants, { foreignKey: 'restaurant_id', as: 'restaurant' })

// ── Categories & Foods ───────────────────────────────────────────────────────
Categories.hasMany(Foods, { foreignKey: 'category_id', as: 'foods' })
Foods.belongsTo(Categories, { foreignKey: 'category_id', as: 'category' })

// ── Users & Carts ────────────────────────────────────────────────────────────
Users.hasOne(Carts, { foreignKey: 'user_id', as: 'cart' })
Carts.belongsTo(Users, { foreignKey: 'user_id', as: 'user' })

// ── Carts & CartItems ────────────────────────────────────────────────────────
Carts.hasMany(CartItems, { foreignKey: 'cart_id', as: 'items' })
CartItems.belongsTo(Carts, { foreignKey: 'cart_id', as: 'cart' })

// ── CartItems & Foods ────────────────────────────────────────────────────────
CartItems.belongsTo(Foods, { foreignKey: 'food_id', as: 'food' })
Foods.hasMany(CartItems, { foreignKey: 'food_id', as: 'cart_items' })

// ── Orders & OrderItems ──────────────────────────────────────────────────────
Orders.hasMany(OrderItems, { foreignKey: 'order_id', as: 'items' })
OrderItems.belongsTo(Orders, { foreignKey: 'order_id', as: 'order' })

// ── OrderItems & Foods ───────────────────────────────────────────────────────
OrderItems.belongsTo(Foods, { foreignKey: 'food_id', as: 'food' })

// ── Orders & Users, Restaurants, Addresses, Payments ────────────────────────
Orders.belongsTo(Users, { foreignKey: 'user_id', as: 'user' })
Orders.belongsTo(Restaurants, { foreignKey: 'restaurant_id', as: 'restaurant' })
Orders.belongsTo(Addresses, { foreignKey: 'address_id', as: 'address' })
Orders.hasOne(Payments, { foreignKey: 'order_id', as: 'payment' })
Payments.belongsTo(Orders, { foreignKey: 'order_id', as: 'order' })

// ── Reviews & Users, Restaurants, Orders ─────────────────────────────────────
Restaurants.hasMany(Reviews, { foreignKey: 'restaurant_id', as: 'reviews' })
Reviews.belongsTo(Restaurants, { foreignKey: 'restaurant_id', as: 'restaurant' })
Reviews.belongsTo(Users, { foreignKey: 'user_id', as: 'user' })
Reviews.belongsTo(Orders, { foreignKey: 'order_id', as: 'order' })

export {
  Users,
  Addresses,
  Restaurants,
  Categories,
  Foods,
  Carts,
  CartItems,
  Orders,
  OrderItems,
  Payments,
  Reviews,
}
