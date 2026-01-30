import { broadcastLocationUpdate } from "../services/gpslocation.service.js";
export const processLocationUpdate = async (req, res) => {
  try {
    const rawData = req.body?.rawLine;
     console.log('rawData: '+ rawData);
     if (!rawData) {
      return res.status(400).json({ message: "Invalid GPS data" });
    }
    const parts = rawData.split(",");
    console.log('parts: '+ parts);
    const busData = {
        serverDate: parts[0],
        serverTime: parts[1],
        imei: parts[2],
        deviceTime: parts[3],
        deviceDate: parts[4],
        latitude: parseFloat(parts[5]),  
        longitude: parseFloat(parts[6]), 
        speed: (!parts[7] || parts[7] === 0) ? 0 : parseFloat(parts[7]),
        schoolId: '0001'
    };
    console.log('busData: '+ JSON.stringify(busData));
     if (!busData.imei || !busData.latitude || !busData.longitude || !busData.schoolId) {
      console.log('busData: '+ 'inside false');
      return res.status(400).json({ success: false, message: "Invalid GPS data" });
    }
    const data = await broadcastLocationUpdate(busData);
    res.status(200).send({ success: data });
  } catch (error) {
    console.error("GPS Ingress Error:", error);
    res.status(500).send("Internal Server Error");
  }
};
