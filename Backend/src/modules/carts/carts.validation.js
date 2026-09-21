import Joi from 'joi'

export const createCartsSchema = Joi.object({
  user_id: Joi.number().integer().required(),
})

export const updateCartsSchema = Joi.object({
  user_id: Joi.number().integer().allow(null, ''),
}).min(1)

