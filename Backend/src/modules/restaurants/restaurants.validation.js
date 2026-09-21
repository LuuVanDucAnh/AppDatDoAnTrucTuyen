import Joi from 'joi'

export const createRestaurantsSchema = Joi.object({
  owner_id: Joi.number().integer().allow(null, ''),
  name: Joi.string().required(),
  description: Joi.string().allow(null, ''),
  address: Joi.string().required(),
  phone_number: Joi.string().allow(null, ''),
  image: Joi.string().allow(null, ''),
  opening_time: Joi.string().allow(null, ''),
  closing_time: Joi.string().allow(null, ''),
  status: Joi.string().allow(null, ''),
})

export const updateRestaurantsSchema = Joi.object({
  owner_id: Joi.number().integer().allow(null, ''),
  name: Joi.string().allow(null, ''),
  description: Joi.string().allow(null, ''),
  address: Joi.string().allow(null, ''),
  phone_number: Joi.string().allow(null, ''),
  image: Joi.string().allow(null, ''),
  opening_time: Joi.string().allow(null, ''),
  closing_time: Joi.string().allow(null, ''),
  status: Joi.string().allow(null, ''),
}).min(1)

