import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';

export const signAccessToken = (payload) =>
  jwt.sign(payload, config.jwt.access.secret, {
    expiresIn: config.jwt.access.expiresIn,
    issuer: 'metlifedm',
    audience: 'metlifedm-client',
  });

export const signRefreshToken = (payload) =>
  jwt.sign(payload, config.jwt.refresh.secret, {
    expiresIn: config.jwt.refresh.expiresIn,
    issuer: 'metlifedm',
    audience: 'metlifedm-client',
  });

export const signEmailVerifyToken = (payload) =>
  jwt.sign(payload, config.jwt.emailVerify.secret, {
    expiresIn: config.jwt.emailVerify.expiresIn,
  });

export const signPasswordResetToken = (payload) =>
  jwt.sign(payload, config.jwt.passwordReset.secret, {
    expiresIn: config.jwt.passwordReset.expiresIn,
  });

export const verifyAccessToken = (token) =>
  jwt.verify(token, config.jwt.access.secret, {
    issuer: 'metlifedm',
    audience: 'metlifedm-client',
  });

export const verifyRefreshToken = (token) =>
  jwt.verify(token, config.jwt.refresh.secret, {
    issuer: 'metlifedm',
    audience: 'metlifedm-client',
  });

export const verifyEmailVerifyToken = (token) =>
  jwt.verify(token, config.jwt.emailVerify.secret);

export const verifyPasswordResetToken = (token) =>
  jwt.verify(token, config.jwt.passwordReset.secret);

export const decodeToken = (token) => jwt.decode(token);
