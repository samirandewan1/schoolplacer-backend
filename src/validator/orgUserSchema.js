import Joi from "joi";

export const createUserSchema = Joi.object({
  name: Joi.string().required(),
  loginname: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().required(),
  phone: Joi.string().required(),
  gender: Joi.string().valid("male", "female").required(),
  dob: Joi.date().iso().optional(),
  designation: Joi.string().optional(),
  address: Joi.string().required(),
  area: Joi.string().required(),
  city: Joi.string().required(),
  state: Joi.string().required(),
  country: Joi.string().required(),
  campaignType: Joi.string().valid("sms", "broadcast", "both"),
  organizationId: Joi.string().required(),
  modifiedAt: Joi.string().isoDate().default(() => new Date().toISOString()),
  status: Joi.string().valid("active", "disabled", "hold").default("active"),
  
});

export const updateUserSchema = Joi.object({
  name: Joi.string(),
  loginname: Joi.string(),
  email: Joi.string().email(),
  password: Joi.string(),
  phone: Joi.string(),
  gender: Joi.string().valid("male", "female"),
  dob: Joi.date().iso().optional(),
  designation: Joi.string().optional(),
  address: Joi.string(),
  area: Joi.string(),
  city: Joi.string(),
  state: Joi.string(),
  country: Joi.string(),
  campaignType: Joi.string().valid("sms", "broadcast", "both"),
  organizationId: Joi.string().required(),
  levels: Joi.number(),
  modifiedAt: Joi.string().isoDate().default(() => new Date().toISOString()),
  status: Joi.string().valid("active", "disabled", "hold").optional(),
});

export const resetUserSchema = Joi.object({
  loginname: Joi.string().required(),
  password: Joi.string().required(),
  modifiedAt: Joi.string().isoDate().default(() => new Date().toISOString()),
})
