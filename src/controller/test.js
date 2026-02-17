let document = {};
let fields = [];

//
// IMEI
//
if (form.imei) {
    document.imei = form.imei;
    fields.push(['notEmpty', document.imei, 'IMEI']);
}

if (form.imei2) {
    document.imei2 = form.imei2;
    fields.push(['notEmpty', document.imei2, 'IMEI2']);
}

//
// Check IMEI duplicate - imei
//
if (form.imei) {
    let searchQuery2 = {
        $or: [{ imei: form.imei }, { imei2: form.imei }],
        status: "active"
    };

    const ImeiExistObject1 = await controller.mongo.findOne(
        searchQuery2,
        "organization_tracker",
        { filter: { projection: { tracker: 1, organizationTracker: 1 } } }
    );

    if (ImeiExistObject1) {
        return res.json({ status: "failure", ec: "SCB9" });
    }
}

//
// Check IMEI duplicate - imei2
//
if (form.imei2) {
    let searchQuery2 = {
        $or: [{ imei: form.imei2 }, { imei2: form.imei2 }],
        status: "active"
    };

    const ImeiExistObject1 = await controller.mongo.findOne(
        searchQuery2,
        "organization_tracker",
        { filter: { projection: { tracker: 1, organizationTracker: 1 } } }
    );

    if (ImeiExistObject1) {
        return res.json({ status: "failure", ec: "SCB9" });
    }
}

//
// Box IDs
//
if (form.boxid) {
    document.boxid = form.boxid;
    fields.push(['notEmpty', document.boxid, 'Boxid']);
}

if (form.boxid2) {
    document.boxid2 = form.boxid2;
    fields.push(['notEmpty', document.boxid2, 'Boxid 2']);
}

//
// SIM Vendors
//
if (form.simvendor) document.simvendor = form.simvendor;
if (form.simvendor2) document.simvendor2 = form.simvendor2;

//
// SIM Cards
//
if (form.simCard) document.simCard = form.simCard;
if (form.simCard2) document.simCard2 = form.simCard2;

//
// Organization ID Validation
//
if (form.organizationId) {
    fields.push(['notEmpty', form.organizationId, 'organization ID']);
}

//
// Vehicle Information
//
if (form.vehicleInformation) {
    document.vehicleInformation = {};

    const VI = form.vehicleInformation;
    const target = document.vehicleInformation;

    if (VI.regno) {
        target.regno = VI.regno;
        fields.push(['notEmpty', target.regno, 'Vechicle Regno']);
    }

    if (VI.name) {
        target.name = VI.name;
        fields.push(['notEmpty', target.name, 'Vechicle Name']);
    }

    if (VI.type) target.type = VI.type;
    if (VI.tabDeviceName) target.tabDeviceName = VI.tabDeviceName;
    if (VI.make) target.make = VI.make;
    if (VI.ownerName) target.ownerName = VI.ownerName;
    if (VI.ownerPhone) target.ownerPhone = VI.ownerPhone;
    if (VI.ownerAddress) target.ownerAddress = VI.ownerAddress;
    if (VI.model) target.model = VI.model;
    if (VI.manufactureYear) target.manufactureYear = VI.manufactureYear;
    if (VI.purchasedYear) target.purchasedYear = VI.purchasedYear;
    if (VI.color) target.color = VI.color;
    if (VI.fuel) target.fuel = VI.fuel;
    if (VI.engineNumber) target.engineNumber = VI.engineNumber;
    if (VI.chasisNumber) target.chasisNumber = VI.chasisNumber;
    if (VI.insuranceCompany) target.insuranceCompany = VI.insuranceCompany;
    if (VI.insurancePolicyNumber) target.insurancePolicyNumber = VI.insurancePolicyNumber;
    if (VI.seatCapacity) target.seatCapacity = VI.seatCapacity;
    if (VI.driverName) target.driverName = VI.driverName;
    if (VI.driverPhone) target.driverPhone = VI.driverPhone;
    if (VI.driverAddress) target.driverAddress = VI.driverAddress;
}

//
// Status
//
if (form.status) {
    document.status = form.status;
    fields.push(['notEmpty', document.status, 'Status']);
}

//
// Organization Info
//
const OrgInfoObject = await controller.mongo.findOne(
    { tracker: form.organizationId, status: "active" },
    "organization",
    { filter: { projection: { name: 1 } } }
);

//
// Validate Fields
//
const validationRecords = controller.validationFilters.cordinationGo(fields);
const validate = controller.validationFilters.parseErrorsHTML(validationRecords);

if (validate.errorCount > 0) {
    return {
        status: "failure",
        message: `<div class='alert alert-danger'>${validate.html}</div>`,
        rawMessage: validate.errorText
    };
}

//
// Update organization_tracker
//
const searchQuery1 = {
    tracker: form.trackerId,
    organizationTracker: form.organizationId
};

const oldTrackerInfoObject = await controller.mongo.findOne(
    { tracker: form.trackerId },
    "organization_tracker",
    {
        filter: {
            projection: {
                imei: 1,
                imei2: 1,
                vehicleInformation: 1,
                boxid: 1,
                boxid2: 1,
                simCard: 1,
                simCard2: 1,
                organizationTracker: 1
            }
        }
    }
);

await controller.mongo.update(searchQuery1, document, "organization_tracker");

let result = {
    status: "success",
    trackerId: form.trackerId
};

//
// Tracker History Logging
//
if (form.imei || form.vehicleInformation?.regno || form.imei2) {

    let document1 = {};
    let dateTimeMillisec = Date.now();

    document1.tracker = await controller.genrandomnumCommon_Mongo(
        "tracker", "tracker_history", ""
    );

    document1.veh_tracker = form.trackerId;
    document1.old_imei = oldTrackerInfoObject.imei;
    document1.old_imei2 = oldTrackerInfoObject.imei2;
    document1.old_boxid = oldTrackerInfoObject.boxid;
    document1.old_boxid2 = oldTrackerInfoObject.boxid2;
    document1.old_simCard = oldTrackerInfoObject.simCard;
    document1.old_simCard2 = oldTrackerInfoObject.simCard2;
    document1.old_regno = oldTrackerInfoObject.vehicleInformation?.regno;

    document1.userTracker = userTracker;
    document1.orgId = form.organizationId;
    document1.orgName = OrgInfoObject.name;
    document1.logTimeMS = dateTimeMillisec;

    let imeArr = [];

    if (form.imei) {
        document1.new_imei = form.imei;
        imeArr.push(oldTrackerInfoObject.imei);
    }

    if (form.imei2) {
        document1.new_imei2 = form.imei2;
        imeArr.push(oldTrackerInfoObject.imei2);
    }

    if (form.boxid) document1.new_boxid = form.boxid;
    if (form.boxid2) document1.new_boxid2 = form.boxid2;
    if (form.simCard) document1.new_simCard = form.simCard;
    if (form.simCard2) document1.new_simCard2 = form.simCard2;

    //
    // Redis update - IMEI delete
    //
    if (form.imei || form.imei2) {
        const post_data1 = {
            data: {
                key: "atkGjhdhdhdhikkekekek510056767",
                form: {
                    trackerimei: imeArr,
                    action: "delete",
                    channel: "imei",
                    orgId: form.organizationId
                }
            }
        };

        await controller.loadController(
            "Redispickupset",
            "remove_RedisOrgDetail",
            post_data1
        );
    }

    if (form.vehicleInformation?.regno) {
        document1.new_regno = form.vehicleInformation.regno;
    }

    document1.old_data = {
        vehicleInformation: oldTrackerInfoObject.vehicleInformation,
        organizationTracker: oldTrackerInfoObject.organizationTracker
    };

    //
    // Insert History
    //
    if ((form.imei || form.boxid) &&
        (oldTrackerInfoObject.imei !== form.imei ||
            oldTrackerInfoObject.boxid !== form.boxid)) {

        await controller.mongo.insert(document1, "tracker_history");
    }

    if ((form.imei2 || form.boxid2) &&
        (oldTrackerInfoObject.imei2 !== form.imei2 ||
            oldTrackerInfoObject.boxid2 !== form.boxid2)) {

        await controller.mongo.insert(document1, "tracker_history");
    }

    //
    // ROUTE + PICKUP Updates
    //
    const RouteInfoObject1 = await controller.mongo.find(
        { vehId: form.trackerId, status: "active", orgId: form.organizationId },
        "routes",
        { filter: { projection: { tracker: 1 } } }
    );

    let routeIDArr = [];
    let pickupptList1 = [];

    for (const item of RouteInfoObject1) {
        routeIDArr.push(item.tracker);

        const RoutePickupInfoObject1 = await controller.mongo.find(
            { routeId: item.tracker, orgId: form.organizationId, status: "active" },
            "pickupcollection",
            { filter: { projection: { tracker: 1 } } }
        );

        for (const PPitem of RoutePickupInfoObject1) {
            if (PPitem.tracker) pickupptList1.push(PPitem.tracker);
        }
    }

    //
    // Redis update logic
    //
    let post_data1;

    if (routeIDArr.length && pickupptList1.length) {
        post_data1 = {
            data: {
                key: postdata.key,
                form: {
                    routeId: routeIDArr,
                    pickupId: pickupptList1,
                    orgId: oldTrackerInfoObject.organizationTracker
                }
            }
        };

        await controller.loadController("Redispickupset", "update_redisPPData", post_data1);
    }

    if (routeIDArr.length && pickupptList1.length === 0) {
        post_data1 = {
            data: {
                key: postdata.key,
                form: {
                    routeId: routeIDArr,
                    orgId: oldTrackerInfoObject.organizationTracker
                }
            }
        };

        await controller.loadController("Redispickupset", "update_redisPPData", post_data1);
    }

    if (routeIDArr.length === 0 && pickupptList1.length === 0) {
        post_data1 = {
            data: {
                key: postdata.key,
                form: { orgId: oldTrackerInfoObject.organizationTracker }
            }
        };

        await controller.loadController("Redispickupset", "update_redisPPData", post_data1);
    }
}

return result;