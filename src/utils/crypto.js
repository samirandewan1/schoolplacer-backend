import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; 
const SALT_LENGTH = 16;
const TAG_LENGTH = 16;
const password = 'message';

export const  encrypt = (text) => {
    const salt = crypto.randomBytes(SALT_LENGTH);
    const key = crypto.scryptSync(password, salt, 32);
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return Buffer.concat([salt, iv, tag, encrypted]).toString('base64');
}


export const decrypt = (bundle) => {
    const data = Buffer.from(bundle, 'base64');
    const salt = data.slice(0, SALT_LENGTH);
    const iv = data.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const tag = data.slice(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
    const encrypted = data.slice(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
    const key = crypto.scryptSync(password, salt, 32);
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    const decrypted = decipher.update(encrypted) + decipher.final('utf8');
    return decrypted;
}

