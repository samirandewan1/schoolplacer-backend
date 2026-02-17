import Joi from "joi";

const imeiSchema = Joi.object({
  imei: Joi.string().required(),
  boxid: Joi.string().required(),
  simvendor: Joi.string().required(),
  simvendor2: Joi.string().required(),
  orgId: Joi.string().required(),
  vehicleId: Joi.string().required()
});