import Joi from 'joi'

export const createOrdersSchema = Joi.object({
  user_id: Joi.number().integer().required(),
  restaurant_id: Joi.number().integer().required(),
  address_id: Joi.number().integer().required(),
  food_total: Joi.number(),
  delivery_fee: Joi.number(),
  discount: Joi.number(),
  total_amount: Joi.number(),
  note: Joi.string().allow(null, ''),
  status: Joi.string().allow(null, ''),
})

export const updateOrdersSchema = Joi.object({
  user_id: Joi.number().integer().allow(null, ''),
  restaurant_id: Joi.number().integer().allow(null, ''),
  address_id: Joi.number().integer().allow(null, ''),
  food_total: Joi.number().allow(null, ''),
  delivery_fee: Joi.number().allow(null, ''),
  discount: Joi.number().allow(null, ''),
  total_amount: Joi.number().allow(null, ''),
  note: Joi.string().allow(null, ''),
  status: Joi.string().allow(null, ''),
}).min(1)

