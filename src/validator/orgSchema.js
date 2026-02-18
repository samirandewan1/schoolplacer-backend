import Joi from "joi";

export const createOrgSchema = Joi.object({
  name: Joi.string().required(),
  parentorg: Joi.object({
    id: Joi.string().required(),
    name: Joi.string().required(),
  }).required(),
  category: Joi.string().required(),
  address: Joi.string().required(),
  area: Joi.string().allow(""),
  city: Joi.string().required(),
  state: Joi.string().required(),
  country: Joi.string().required(),
  website: Joi.string().uri().allow(""),
  email: Joi.string().email().required(),
  description: Joi.string().allow(""),
  orgStartTime: Joi.string().required(),
  orgEndTime: Joi.string().required(),
  callingURL: Joi.string().allow(""),
  alertlock: Joi.boolean().truthy("true").falsy("false"),
  etaAlert: Joi.boolean().truthy("true").falsy("false"),
  cameraModuleView: Joi.boolean().truthy("true").falsy("false"),
  smsAlert: Joi.boolean().truthy("true").falsy("false"),
  appAlert: Joi.boolean().truthy("true").falsy("false"),
  emailAlert: Joi.boolean().truthy("true").falsy("false"),
  callAlert: Joi.boolean().truthy("true").falsy("false"),
  rfidAlert: Joi.boolean().truthy("true").falsy("false"),
  otherlang: Joi.boolean().truthy("true").falsy("false"),
  contactInformation: Joi.object({
    0: Joi.object({
      name: Joi.string().required(),
      phone: Joi.string().required(),
      email: Joi.string().email().required(),
      designation: Joi.string().allow(""),
    }).required(),
  }).required(),
  location: Joi.object({
    lattitude: Joi.number().required(),
    longitude: Joi.number().required(),
    locationAddress: Joi.string().required(),
  }),
  classLists: Joi.array().items(Joi.string()),
  SectionLists: Joi.array().items(Joi.string()),
  reports: Joi.object({
    rfid: Joi.object({
      general: Joi.boolean().truthy("true").falsy("false"),
      RFIDWithClass: Joi.boolean().truthy("true").falsy("false"),
      RFIDWithMember: Joi.boolean().truthy("true").falsy("false"),
      RFIDWithRoute: Joi.boolean().truthy("true").falsy("false"),
      RFIDAppPush: Joi.boolean().truthy("true").falsy("false"),
      RFIDWithAttendance: Joi.boolean().truthy("true").falsy("false"),
      RFIDWithSmsLog: Joi.boolean().truthy("true").falsy("false"),
      RFIDStatusCheck: Joi.boolean().truthy("true").falsy("false"),
      rfidNotAssign: Joi.boolean().truthy("true").falsy("false"),
      RFIDSwipeCount: Joi.boolean().truthy("true").falsy("false"),
      RFIDRouteWiseCount: Joi.boolean().truthy("true").falsy("false"),
    }).required(),
    tracking: Joi.object({
      movement: Joi.boolean().truthy("true").falsy("false"),
      halt: Joi.boolean().truthy("true").falsy("false"),
      haltDurationReport: Joi.boolean().truthy("true").falsy("false"),
      movementandhalt: Joi.boolean().truthy("true").falsy("false"),
      overspeed: Joi.boolean().truthy("true").falsy("false"),
      lowspeed: Joi.boolean().truthy("true").falsy("false"),
      betweentwospeed: Joi.boolean().truthy("true").falsy("false"),
      daysummary: Joi.boolean().truthy("true").falsy("false"),
      vehcoordinate: Joi.boolean().truthy("true").falsy("false"),
      routeDeviation: Joi.boolean().truthy("true").falsy("false"),
    }).required(),
    alertlog: Joi.object({
      callalertmadelog: Joi.boolean().truthy("true").falsy("false"),
      routehistorylog: Joi.boolean().truthy("true").falsy("false"),
      memberhistorylog: Joi.boolean().truthy("true").falsy("false"),
      callLogCount: Joi.boolean().truthy("true").falsy("false"),
      callMadeReport: Joi.boolean().truthy("true").falsy("false"),
      callEligibleReport: Joi.boolean().truthy("true").falsy("false"),
      callMadeEarly: Joi.boolean().truthy("true").falsy("false"),
      callMadeDelayed: Joi.boolean().truthy("true").falsy("false"),
      nrOnTime: Joi.boolean().truthy("true").falsy("false"),
      rOnTime: Joi.boolean().truthy("true").falsy("false"),
      callProcessedReport: Joi.boolean().truthy("true").falsy("false"),
      callProcessedAnalysReport: Joi.boolean().truthy("true").falsy("false"),
      appReportsLog: { appReportsLog: false },
    }).required(),
    analytics: Joi.object({
      notreached: Joi.boolean().truthy("true").falsy("false"),
    }),
    others: Joi.object({
      panic: Joi.boolean().truthy("true").falsy("false"),
      vehiclelastupdate: Joi.boolean().truthy("true").falsy("false"),
      engine: Joi.boolean().truthy("true").falsy("false"),
      ac: Joi.boolean().truthy("true").falsy("false"),
      accanddecc: Joi.boolean().truthy("true").falsy("false"),
      routevehiclemapped: Joi.boolean().truthy("true").falsy("false"),
      geofence: Joi.boolean().truthy("true").falsy("false"),
      otherOverspeed: Joi.boolean().truthy("true").falsy("false"),
      notificationAlert: Joi.boolean().truthy("true").falsy("false"),
      vehicleBasedNotificationAlert: Joi.boolean()
        .truthy("true")
        .falsy("false"),
      breakDownReport: Joi.boolean().truthy("true").falsy("false"),
    }).required(),
    attendance: Joi.object({
      routewiseAttendance: Joi.boolean().truthy("true").falsy("false"),
      datewiseAttendance: Joi.boolean().truthy("true").falsy("false"),
      memberwiseAttendance: Joi.boolean().truthy("true").falsy("false"),
    }).required(),
    studentroutemanagement: Joi.object({
      studentRouteManagement: Joi.boolean().truthy("true").falsy("false"),
    }).required(),
    routeanalytics: Joi.object({
      routeAnalytics: Joi.boolean().truthy("true").falsy("false"),
    }).required(),
    routeAdhoc: Joi.object({
      routeAdhoc: Joi.boolean().truthy("true").falsy("false"),
    }).required(),
    vehicleManagement: Joi.object({
      vehicleManagement: Joi.boolean().truthy("true").falsy("false"),
    }).required(),
    faceAttendance: Joi.object({
      faceAttendance: Joi.boolean().truthy("true").falsy("false"),
    }).required(),
    routeDashboard: Joi.object({
      routeDashboard: Joi.boolean().truthy("true").falsy("false"),
    }).required(),
    referenceRouteMap: Joi.object({
      referenceRouteMap: Joi.boolean().truthy("true").falsy("false"),
    }),
  }).required(),
  weekdays: Joi.object({
    sunday: Joi.boolean().truthy("true").falsy("false"),
    monday: Joi.boolean().truthy("true").falsy("false"),
    tuesday: Joi.boolean().truthy("true").falsy("false"),
    wednesday: Joi.boolean().truthy("true").falsy("false"),
    thursday: Joi.boolean().truthy("true").falsy("false"),
    friday: Joi.boolean().truthy("true").falsy("false"),
    saturday: Joi.boolean().truthy("true").falsy("false"),
  }).required(),
  schoolsessionLists: Joi.array().items(
    Joi.object({
      sessionName: Joi.string(),
      sessionStartTime: Joi.string(),
      sessionEndTime: Joi.string(),
      checked: Joi.boolean().default(false),
    }),
  ),
  modifiedAt: Joi.string().isoDate().default(() => new Date().toISOString()),
  status: Joi.string().valid("active", "inactive").default("active"),
}).unknown(false);

export const updateOrgSchema = Joi.object({
  name: Joi.string(),
  parentorg: Joi.object({
    id: Joi.string(),
    name: Joi.string(),
  }),
  category: Joi.string(),
  address: Joi.string(),
  area: Joi.string().allow(""),
  city: Joi.string(),
  state: Joi.string(),
  country: Joi.string(),
  website: Joi.string().uri().allow(""),
  email: Joi.string().email(),
  description: Joi.string().allow(""),
  orgStartTime: Joi.string(),
  orgEndTime: Joi.string(),
  callingURL: Joi.string().allow(""),
  alertlock: Joi.boolean().truthy("true").falsy("false"),
  etaAlert: Joi.boolean().truthy("true").falsy("false"),
  cameraModuleView: Joi.boolean().truthy("true").falsy("false"),
  smsAlert: Joi.boolean().truthy("true").falsy("false"),
  appAlert: Joi.boolean().truthy("true").falsy("false"),
  emailAlert: Joi.boolean().truthy("true").falsy("false"),
  callAlert: Joi.boolean().truthy("true").falsy("false"),
  rfidAlert: Joi.boolean().truthy("true").falsy("false"),
  otherlang: Joi.boolean().truthy("true").falsy("false"),
  contactInformation: Joi.object({
    0: Joi.object({
      name: Joi.string(),
      phone: Joi.string(),
      email: Joi.string().email(),
      designation: Joi.string().allow(""),
    }),
  }),
  location: Joi.object({
    lattitude: Joi.number(),
    longitude: Joi.number(),
    locationAddress: Joi.string(),
  }),
  classLists: Joi.array().items(Joi.string()),
  SectionLists: Joi.array().items(Joi.string()),
  reports: Joi.object({
    rfid: Joi.object({
      general: Joi.boolean().truthy("true").falsy("false"),
      RFIDWithClass: Joi.boolean().truthy("true").falsy("false"),
      RFIDWithMember: Joi.boolean().truthy("true").falsy("false"),
      RFIDWithRoute: Joi.boolean().truthy("true").falsy("false"),
      RFIDAppPush: Joi.boolean().truthy("true").falsy("false"),
      RFIDWithAttendance: Joi.boolean().truthy("true").falsy("false"),
      RFIDWithSmsLog: Joi.boolean().truthy("true").falsy("false"),
      RFIDStatusCheck: Joi.boolean().truthy("true").falsy("false"),
      rfidNotAssign: Joi.boolean().truthy("true").falsy("false"),
      RFIDSwipeCount: Joi.boolean().truthy("true").falsy("false"),
      RFIDRouteWiseCount: Joi.boolean().truthy("true").falsy("false"),
    }),
    tracking: Joi.object({
      movement: Joi.boolean().truthy("true").falsy("false"),
      halt: Joi.boolean().truthy("true").falsy("false"),
      haltDurationReport: Joi.boolean().truthy("true").falsy("false"),
      movementandhalt: Joi.boolean().truthy("true").falsy("false"),
      overspeed: Joi.boolean().truthy("true").falsy("false"),
      lowspeed: Joi.boolean().truthy("true").falsy("false"),
      betweentwospeed: Joi.boolean().truthy("true").falsy("false"),
      daysummary: Joi.boolean().truthy("true").falsy("false"),
      vehcoordinate: Joi.boolean().truthy("true").falsy("false"),
      routeDeviation: Joi.boolean().truthy("true").falsy("false"),
    }),
    alertlog: Joi.object({
      callalertmadelog: Joi.boolean().truthy("true").falsy("false"),
      routehistorylog: Joi.boolean().truthy("true").falsy("false"),
      memberhistorylog: Joi.boolean().truthy("true").falsy("false"),
      callLogCount: Joi.boolean().truthy("true").falsy("false"),
      callMadeReport: Joi.boolean().truthy("true").falsy("false"),
      callEligibleReport: Joi.boolean().truthy("true").falsy("false"),
      callMadeEarly: Joi.boolean().truthy("true").falsy("false"),
      callMadeDelayed: Joi.boolean().truthy("true").falsy("false"),
      nrOnTime: Joi.boolean().truthy("true").falsy("false"),
      rOnTime: Joi.boolean().truthy("true").falsy("false"),
      callProcessedReport: Joi.boolean().truthy("true").falsy("false"),
      callProcessedAnalysReport: Joi.boolean().truthy("true").falsy("false"),
      appReportsLog: { appReportsLog: false },
    }),
    analytics: Joi.object({
      notreached: Joi.boolean().truthy("true").falsy("false"),
    }),
    others: Joi.object({
      panic: Joi.boolean().truthy("true").falsy("false"),
      vehiclelastupdate: Joi.boolean().truthy("true").falsy("false"),
      engine: Joi.boolean().truthy("true").falsy("false"),
      ac: Joi.boolean().truthy("true").falsy("false"),
      accanddecc: Joi.boolean().truthy("true").falsy("false"),
      routevehiclemapped: Joi.boolean().truthy("true").falsy("false"),
      geofence: Joi.boolean().truthy("true").falsy("false"),
      otherOverspeed: Joi.boolean().truthy("true").falsy("false"),
      notificationAlert: Joi.boolean().truthy("true").falsy("false"),
      vehicleBasedNotificationAlert: Joi.boolean()
        .truthy("true")
        .falsy("false"),
      breakDownReport: Joi.boolean().truthy("true").falsy("false"),
    }),
    attendance: Joi.object({
      routewiseAttendance: Joi.boolean().truthy("true").falsy("false"),
      datewiseAttendance: Joi.boolean().truthy("true").falsy("false"),
      memberwiseAttendance: Joi.boolean().truthy("true").falsy("false"),
    }),
    studentroutemanagement: Joi.object({
      studentRouteManagement: Joi.boolean().truthy("true").falsy("false"),
    }),
    routeanalytics: Joi.object({
      routeAnalytics: Joi.boolean().truthy("true").falsy("false"),
    }),
    routeAdhoc: Joi.object({
      routeAdhoc: Joi.boolean().truthy("true").falsy("false"),
    }),
    vehicleManagement: Joi.object({
      vehicleManagement: Joi.boolean().truthy("true").falsy("false"),
    }),
    faceAttendance: Joi.object({
      faceAttendance: Joi.boolean().truthy("true").falsy("false"),
    }),
    routeDashboard: Joi.object({
      routeDashboard: Joi.boolean().truthy("true").falsy("false"),
    }),
    referenceRouteMap: Joi.object({
      referenceRouteMap: Joi.boolean().truthy("true").falsy("false"),
    }),
  }),
  weekdays: Joi.object({
    sunday: Joi.boolean().truthy("true").falsy("false"),
    monday: Joi.boolean().truthy("true").falsy("false"),
    tuesday: Joi.boolean().truthy("true").falsy("false"),
    wednesday: Joi.boolean().truthy("true").falsy("false"),
    thursday: Joi.boolean().truthy("true").falsy("false"),
    friday: Joi.boolean().truthy("true").falsy("false"),
    saturday: Joi.boolean().truthy("true").falsy("false"),
  }),
  schoolsessionLists: Joi.array().items(
    Joi.object({
      sessionName: Joi.string(),
      sessionStartTime: Joi.string(),
      sessionEndTime: Joi.string(),
      checked: Joi.boolean().default(false),
    }),
  ),
  modifiedAt: Joi.string().isoDate().default(() => new Date().toISOString()),
  status: Joi.string().valid("active", "inactive", "hold")
}).unknown(false);

const strOptional  = Joi.string().trim().allow('', null).optional();
const boolString   = Joi.string().valid('true', 'false').optional();
export const viewOrgFilterSchema = Joi.object({
  organizationId: strOptional,
  name          : strOptional,
  category      : strOptional,
  city          : strOptional,
  state         : strOptional,
  country       : strOptional,
  email         : strOptional,
  location      : strOptional,
  smsAlert      : boolString,
  appAlert      : boolString,
  emailAlert    : boolString,
  callAlert     : boolString,
  rfidAlert     : boolString,
  etaAlert      : boolString,
  alertlock     : boolString
  // regNo         : strOptional,
  // boxId         : strOptional,
  // imei          : strOptional,
  // simCard       : strOptional,
});
const strRequired  = Joi.string().trim().required();
export const deleteOrgSchema = Joi.object({
  organizationId : strRequired.label('organizationId'),
});



