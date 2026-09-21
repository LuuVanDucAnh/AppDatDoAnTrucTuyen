import Joi from 'joi'

export const createAddressesSchema = Joi.object({
  user_id: Joi.number().integer().required(),
  receiver_name: Joi.string().required(),
  phone_number: Joi.string().required(),
  address_detail: Joi.string().required(),
  ward: Joi.string().allow(null, ''),
  district: Joi.string().allow(null, ''),
  city: Joi.string().allow(null, ''),
  is_default: Joi.number().integer().allow(null, ''),
})

export const updateAddressesSchema = Joi.object({
  user_id: Joi.number().integer().allow(null, ''),
  receiver_name: Joi.string().allow(null, ''),
  phone_number: Joi.string().allow(null, ''),
  address_detail: Joi.string().allow(null, ''),
  ward: Joi.string().allow(null, ''),
  district: Joi.string().allow(null, ''),
  city: Joi.string().allow(null, ''),
  is_default: Joi.number().integer().allow(null, ''),
}).min(1)

