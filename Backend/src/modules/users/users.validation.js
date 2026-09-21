import Joi from 'joi'

export const createUsersSchema = Joi.object({
  full_name: Joi.string().required(),
  email: Joi.string().allow(null, ''),
  phone_number: Joi.string().required(),
  password: Joi.string().required(),
  role: Joi.string().allow(null, ''),
  status: Joi.number().integer().allow(null, ''),
})

export const updateUsersSchema = Joi.object({
  full_name: Joi.string().allow(null, ''),
  email: Joi.string().allow(null, ''),
  phone_number: Joi.string().allow(null, ''),
  password: Joi.string().allow(null, ''),
  role: Joi.string().allow(null, ''),
  status: Joi.number().integer().allow(null, ''),
}).min(1)

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
})
