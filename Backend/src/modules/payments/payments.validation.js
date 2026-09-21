import Joi from 'joi'

export const createPaymentsSchema = Joi.object({
  order_id: Joi.number().integer().required(),
  payment_method: Joi.string().allow(null, ''),
  amount: Joi.number().required(),
  status: Joi.string().allow(null, ''),
  transaction_code: Joi.string().allow(null, ''),
  payment_date: Joi.date().allow(null, ''),
})

export const updatePaymentsSchema = Joi.object({
  order_id: Joi.number().integer().allow(null, ''),
  payment_method: Joi.string().allow(null, ''),
  amount: Joi.number().allow(null, ''),
  status: Joi.string().allow(null, ''),
  transaction_code: Joi.string().allow(null, ''),
  payment_date: Joi.date().allow(null, ''),
}).min(1)

