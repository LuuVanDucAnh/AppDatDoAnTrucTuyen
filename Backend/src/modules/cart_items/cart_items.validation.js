import Joi from 'joi'

export const createCartItemsSchema = Joi.object({
  cart_id: Joi.number().integer().required(),
  food_id: Joi.number().integer().required(),
  quantity: Joi.number().integer(),
  note: Joi.string().allow(null, ''),
})

export const updateCartItemsSchema = Joi.object({
  cart_id: Joi.number().integer().allow(null, ''),
  food_id: Joi.number().integer().allow(null, ''),
  quantity: Joi.number().integer().allow(null, ''),
  note: Joi.string().allow(null, ''),
}).min(1)

