import Joi from 'joi'

export const createOrderItemsSchema = Joi.object({
  order_id: Joi.number().integer().required(),
  food_id: Joi.number().integer().required(),
  food_name: Joi.string().required(),
  quantity: Joi.number().integer().required(),
  unit_price: Joi.number().required(),
  subtotal: Joi.number().required(),
  note: Joi.string().allow(null, ''),
})

export const updateOrderItemsSchema = Joi.object({
  order_id: Joi.number().integer().allow(null, ''),
  food_id: Joi.number().integer().allow(null, ''),
  food_name: Joi.string().allow(null, ''),
  quantity: Joi.number().integer().allow(null, ''),
  unit_price: Joi.number().allow(null, ''),
  subtotal: Joi.number().allow(null, ''),
  note: Joi.string().allow(null, ''),
}).min(1)

