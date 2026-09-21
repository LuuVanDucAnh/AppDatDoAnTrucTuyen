import Joi from 'joi'

export const createCategoriesSchema = Joi.object({
  restaurant_id: Joi.number().integer().required(),
  name: Joi.string().required(),
  description: Joi.string().allow(null, ''),
})

export const updateCategoriesSchema = Joi.object({
  restaurant_id: Joi.number().integer().allow(null, ''),
  name: Joi.string().allow(null, ''),
  description: Joi.string().allow(null, ''),
}).min(1)

