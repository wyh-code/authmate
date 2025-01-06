import CryptoJS from 'crypto-js';

// 加密
export const encrypt = (data: any, secretKey: string) => {
  return CryptoJS.AES.encrypt(JSON.stringify(data), secretKey).toString();
};