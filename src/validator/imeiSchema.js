import Joi from "joi";

export const imeiSchema = Joi.object({
  imei: Joi.string().required(),
  boxid: Joi.string().required(),
  simvendor: Joi.string().required(),
  simvendor2: Joi.string().required(),
  orgId: Joi.string().required(),
  vehicleId: Joi.string().required(),
  status: Joi.string().valid("active", "inactive", "hold"),
  modifiedAt: Joi.string().isoDate().default(() => new Date().toISOString()),
});

// imea

export const imeiField  = Joi.string().trim();

export const assignImeiSchema = Joi.object({
  organizationId: Joi.string().trim().required(),
  vehicleId     : Joi.string().trim().required(),
  imei          : imeiField.optional(),
  imei2         : imeiField.optional(),
  boxid         : Joi.string().trim().required(),
  boxid2        : Joi.string().trim().optional(),
  simCard       : Joi.string().trim().allow('').optional(),
  simCard2      : Joi.string().trim().allow('').optional(),
  simvendor     : Joi.string().trim().allow('').required(),
  simvendor2    : Joi.string().trim().allow('').required(),
  status: Joi.string().valid("active", "inactive", "hold"),
  modifiedAt: Joi.string().isoDate().default(() => new Date().toISOString()),
}).or('imei', 'imei2'); // at least one IMEI is required

export const updateImeiSchema = Joi.object({
  organizationId: Joi.string().trim().required(),
  vehicleId     : Joi.string().trim().required(),
  imei          : imeiField.optional(),
  imei2         : imeiField.optional(),
  boxid         : Joi.string().trim().optional(),
  boxid2        : Joi.string().trim().optional(),
  simCard       : Joi.string().trim().allow('').optional(),
  simCard2      : Joi.string().trim().allow('').optional(),
  simvendor     : Joi.string().trim().allow('').optional(),
  simvendor2    : Joi.string().trim().allow('').optional(),
  status: Joi.string().valid("active", "inactive", "hold"),
  modifiedAt: Joi.string().isoDate().default(() => new Date().toISOString()),
});

export const unassignImeiSchema = Joi.object({
  organizationId: Joi.string().trim().required(),
  vehicleId     : Joi.string().trim().required(),
});

export const viewImeiSchema = Joi.object({
  organizationId: Joi.string().trim().required(),
  vehicleId     : Joi.string().trim().optional(),
  imei          : Joi.string().trim().optional(),
  status        : Joi.string().valid('active', 'inactive', 'hold').optional(),
});
