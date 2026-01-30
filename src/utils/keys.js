const generateKey = {
    parentkey: (schoolId, busId) => `bus_location:${schoolId}:${busId}`,
    schoolkey: (schoolId) => `bus_location:${schoolId}`,
};

export default generateKey;