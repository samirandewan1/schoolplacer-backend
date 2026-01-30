import generateKey  from "../utils/keys.js";

const ROLE_RULES = {
  parent: ["schoolId", "imei", "userId"],
  admin: ["schoolId", "imei"],
};

export const VerifySocketConnection = (socket) => {
  if (!socket?.handshake.query) {
    return false;
  }
  console.log(JSON.stringify(socket.handshake.query))
  if(!socket.handshake.query.role){
    return reject(socket, "Missing role", "role is mandatory.");
  }
  const { role, schoolId, imei, userId } = socket.handshake.query;

  const context = {
    role,
    schoolId: schoolId?.trim(),
    imei: imei?.trim(),
    userId: userId?.trim(),
  };
  validate(socket, context);
};
const validate = (socket, context) => {
  const { role, schoolId, imei } = context;
  const requiredFields = ROLE_RULES[role];

  if (!requiredFields) {
    return reject(socket, "Invalid or missing role", "Valid role is mandatory.");
  }

  const missingFields = requiredFields.filter((field) => !context[field]);

  if (missingFields.length) {
    return reject(
      `${role} missing mandatory fields`,
      `For ${role} role: ${missingFields.join(", ")} are mandatory.`,
    );
  }
  const channelname = (role === "parent") ?  generateKey.parentkey(schoolId,imei) : generateKey.schoolkey(schoolId);
  socket.join(channelname);
  return true;
};
const reject = (socket, reason, message) => {
  console.error(`Connection rejected: ${reason}`);
  if (socket) {
    socket.emit("error", { message });
    socket.disconnect();
  }
  return false;
};

