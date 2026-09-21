import Joi from 'joi'

export const createReviewsSchema = Joi.object({
  user_id: Joi.number().integer().required(),
  restaurant_id: Joi.number().integer().required(),
  order_id: Joi.number().integer().required(),
  rating: Joi.number().integer().required(),
  comment: Joi.string().allow(null, ''),
})

export const updateReviewsSchema = Joi.object({
  user_id: Joi.number().integer().allow(null, ''),
  restaurant_id: Joi.number().integer().allow(null, ''),
  order_id: Joi.number().integer().allow(null, ''),
  rating: Joi.number().integer().allow(null, ''),
  comment: Joi.string().allow(null, ''),
}).min(1)

