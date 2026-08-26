import QRCode from 'qrcode';
import { config } from '../config/index.js';

const verifyUrl = (token) => `${config.urls.client.replace(/\/$/, '')}/verify/${token}`;

/** PNG buffer, for embedding into a generated PDF via pdfkit's doc.image(). */
export const generateVerifyQrBuffer = (token) =>
  QRCode.toBuffer(verifyUrl(token), { type: 'png', margin: 1, color: { dark: '#0A2342', light: '#FFFFFF' } });

/** Data URL, for a plain <img src> in the admin QR-preview endpoint. */
export const generateVerifyQrDataUrl = (token) =>
  QRCode.toDataURL(verifyUrl(token), { margin: 1, color: { dark: '#0A2342', light: '#FFFFFF' } });

export { verifyUrl };
