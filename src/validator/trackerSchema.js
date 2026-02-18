import Joi from "joi";
// export const addVehicleSchema = Joi.object({
//   name: Joi.string().trim().min(1).max(200).required(),
//   type: Joi.string().trim().min(1).max(100).required(),
//   make: Joi.string().trim().max(100).allow("", null).optional(),
//   regno: Joi.string().trim().min(1).max(50).required(),
//   tabDeviceName: Joi.string().trim().max(100).allow("", null).optional(),
//   ownername: Joi.string().trim().max(200).allow("", null).optional(),
//   ownerPhone: Joi.string().trim().allow("", null).optional(),
//   ownerAddress: Joi.string().trim().max(500).allow("", null).optional(),
//   model: Joi.string().trim().max(100).allow("", null).optional(),
//   manufactureYear: Joi.number().integer().min(1900).max(new Date().getFullYear() + 1).allow(null).optional(),
//   purchasedYear: Joi.number().integer().min(1900).max(new Date().getFullYear() + 1).allow(null).optional(),
//   color: Joi.string().trim().max(50).allow("", null).optional(),
//   fuel: Joi.string().trim().allow("", null).optional(),
//   engineNumber: Joi.string().trim().max(100).allow("", null).optional(),
//   chasisNumber: Joi.string().trim().max(100).allow("", null).optional(),
//   insuranceCompany: Joi.string().trim().max(200).allow("", null).optional(),
//   insurancePolicyNumber: Joi.string().trim().max(100).allow("", null).optional(),
//   insuranceExpiryDate: Joi.date().iso().allow("", null).optional(),
//   seatCapacity: Joi.string().trim().allow(null).optional(),
//   driverName: Joi.string().trim().max(200).allow("", null).optional(),
//   driverPhone: Joi.string().max(20).allow("", null).optional(), 
//   driverAddress: Joi.string().trim().max(500).allow("", null).optional(),
//   organizationId: Joi.string().trim().required(),
//   imeiId: Joi.string().trim().required(),
//   modifiedAt: Joi.string().isoDate().default(() => new Date().toISOString()),
//   status: Joi.string().valid("active", "inactive", "retired").default("active"),
// });

// export const updateVehicleSchema = Joi.object({
//   name: Joi.string().trim().min(1).max(200).optional(),
//   type: Joi.string().trim().min(1).max(100).optional(),
//   make: Joi.string().trim().max(100).allow("", null).optional(),
//   regno: Joi.string().trim().min(1).max(50).optional(),
//   tabDeviceName: Joi.string().trim().max(100).allow("", null).optional(),
//   ownername: Joi.string().trim().max(200).allow("", null).optional(),
//   ownerPhone: Joi.string().trim().allow("", null).optional(),
//   ownerAddress: Joi.string().trim().max(500).allow("", null).optional(),
//   model: Joi.string().trim().max(100).allow("", null).optional(),
//   manufactureYear: Joi.number().integer().min(1900).max(new Date().getFullYear() + 1).allow(null).optional(),
//   purchasedYear: Joi.number().integer().min(1900).max(new Date().getFullYear() + 1).allow(null).optional(),
//   color: Joi.string().trim().max(50).allow("", null).optional(),
//   fuel: Joi.string().trim().allow("", null).optional(),
//   engineNumber: Joi.string().trim().max(100).allow("", null).optional(),
//   chasisNumber: Joi.string().trim().max(100).allow("", null).optional(),
//   insuranceCompany: Joi.string().trim().max(200).allow("", null).optional(),
//   insurancePolicyNumber: Joi.string().trim().max(100).allow("", null).optional(),
//   insuranceExpiryDate: Joi.date().iso().allow("", null).optional(),
//   seatCapacity: Joi.number().max(100).allow(null).optional(),
//   driverName: Joi.string().trim().max(200).allow("", null).optional(),
//   driverPhone: Joi.string().max(20).allow("", null).optional(),
//   driverAddress: Joi.string().trim().max(500).allow("", null).optional(),
//   organizationId: Joi.string().trim().optional(),
//   imeiId: Joi.string().trim().optional(),
//   modifiedAt: Joi.string().isoDate().default(() => new Date().toISOString()),
//   status: Joi.string().valid("active", "inactive", "retired").optional(),
// });

// // Main Form Schema
// export const addImeaSchema = Joi.object({
//   imei: Joi.string().trim().required(),
//   imei2: Joi.string().trim().allow("", null).optional(),
//   boxid: Joi.string().trim().min(1).max(100).required(),
//   boxid2: Joi.string().trim().allow("", null).optional(),
//   simvendor: Joi.string().trim().max(100).allow("", null).optional(),
//   simvendor2: Joi.string().trim().max(100).allow("", null).optional(),
//   simCard: Joi.string().trim().allow("", null).optional(),
//   simCard2: Joi.string().trim().allow("", null).optional(),
//   organizationId: Joi.string().trim().required(),
//   modifiedAt: Joi.string().isoDate().default(() => new Date().toISOString()),
//   status: Joi.string().valid("active", "inactive", "retired").optional().default("inactive"),
// });

// export const updateImeaSchema = Joi.object({
//   imei: Joi.string().trim().optional(),
//   imei2: Joi.string().trim().allow("", null).optional(),
//   boxid: Joi.string().trim().min(1).max(100).optional(),
//   boxid2: Joi.string().trim().allow("", null).optional(),
//   simvendor: Joi.string().trim().max(100).allow("", null).optional(),
//   simvendor2: Joi.string().trim().max(100).allow("", null).optional(),
//   simCard: Joi.string().trim().allow("", null).optional(),
//   simCard2: Joi.string().trim().allow("", null).optional(),
//   organizationId: Joi.string().trim().required(),
//   modifiedAt: Joi.string().isoDate().default(() => new Date().toISOString()),
//   status: Joi.string().valid("active", "inactive", "retired").optional()
// });


export const vehicleInfoSchema = Joi.object({
  name                 : Joi.string().trim().required(),
  regno                : Joi.string().trim().required(),
  type                 : Joi.string().trim().allow('').optional(),
  make                 : Joi.string().trim().allow('').optional(),
  model                : Joi.string().trim().allow('').optional(),
  tabDeviceName        : Joi.string().trim().allow('').optional(),
  ownerName            : Joi.string().trim().allow('').optional(),
  ownerPhone           : Joi.string().trim().allow('').optional(),
  ownerAddress         : Joi.string().trim().allow('').optional(),
  manufactureYear      : Joi.string().trim().allow('').optional(),
  purchasedYear        : Joi.string().trim().allow('').optional(),
  color                : Joi.string().trim().allow('').optional(),
  fuel                 : Joi.string().trim().allow('').optional(),
  engineNumber         : Joi.string().trim().allow('').optional(),
  chasisNumber         : Joi.string().trim().allow('').optional(),
  insuranceCompany     : Joi.string().trim().allow('').optional(),
  insurancePolicyNumber: Joi.string().trim().allow('').optional(),
  insuranceExpiryDate  : Joi.date().iso().allow(null).optional(),
  seatCapacity         : Joi.alternatives().try(Joi.string(), Joi.number()).allow('').optional(),
  driverName           : Joi.string().trim().allow('').optional(),
  driverPhone          : Joi.string().trim().allow('').optional(),
  driverAddress        : Joi.string().trim().allow('').optional(),
});

export const vehicleInfoUpdateSchema = vehicleInfoSchema.fork(
  ['name', 'regno'],
  f => f.optional()
);

export const createVehicleSchema = Joi.object({
  organizationId    : Joi.string().trim().required(),
  vehicleInformation: vehicleInfoSchema.required(),
  modifiedAt: Joi.string().isoDate().default(() => new Date().toISOString()),
  status: Joi.string().valid("active", "inactive", "hold")
});

export const updateVehicleSchema = Joi.object({
  organizationId    : Joi.string().trim().required(),
  vehicleId         : Joi.string().trim().required(),
  vehicleInformation: vehicleInfoUpdateSchema.optional(),
  status            : Joi.string().valid('active', 'disabled', 'hold').optional(),
  modifiedAt: Joi.string().isoDate().default(() => new Date().toISOString()),
});

export const deleteVehicleSchema = Joi.object({
  organizationId: Joi.string().trim().required(),
  vehicleId     : Joi.string().trim().required(),
  modifiedAt: Joi.string().isoDate().default(() => new Date().toISOString()),
});

export const viewVehiclesSchema = Joi.object({
  organizationId: Joi.string().trim().required(),
  vehicleId     : Joi.string().trim().optional(),
  regno         : Joi.string().trim().optional(),
  status        : Joi.string().valid('active', 'disabled', 'hold').optional(),
});
