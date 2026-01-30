import socketService from "../config/socket.js";
import generateKey from "../utils/keys.js";
import cron from "node-cron";

export const broadcastLocationUpdate = (locationData) => {
  const { schoolId, imei, latitude, longitude, speed } = locationData;
  const parentChnnel = generateKey.parentkey(schoolId, imei);
  const schoolChnnel = generateKey.schoolkey(schoolId);
  const io = socketService.getIO();
   console.log("parentChnnel: "+ parentChnnel);
   console.log("schoolChnnel: "+ schoolChnnel);
  io.to(parentChnnel).to(schoolChnnel).emit("location", {
    schoolId,
    imei,
    latitude,
    longitude,
    speed,
  });
  return true;
};
