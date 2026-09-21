import Joi from 'joi'

export const createFoodsSchema = Joi.object({
  category_id: Joi.number().integer().required(),
  name: Joi.string().required(),
  description: Joi.string().allow(null, ''),
  price: Joi.number().required(),
  image: Joi.string().allow(null, ''),
  status: Joi.string().allow(null, ''),
})

export const updateFoodsSchema = Joi.object({
  category_id: Joi.number().integer().allow(null, ''),
  name: Joi.string().allow(null, ''),
  description: Joi.string().allow(null, ''),
  price: Joi.number().allow(null, ''),
  image: Joi.string().allow(null, ''),
  status: Joi.string().allow(null, ''),
}).min(1)

