import AES from 'crypto-js/aes';

export const encryptPassword = (password?: string): string => {
  if (!password) return '';
  const SECRET_KEY = process.env.NEXT_PUBLIC_CRYPTO_SECRET_KEY as string;
  return AES.encrypt(password, SECRET_KEY.trim()).toString();
};
