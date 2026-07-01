import { v2 as cloudinary } from 'cloudinary';
import { config } from './index.js';
import logger from './logger.js';

cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
  secure: true,
});

logger.info('✅  Cloudinary configured');

/**
 * Upload a file (buffer or path) with automatic WebP conversion + optimization.
 */
export const uploadToCloudinary = (fileSource, options = {}) => {
  const { folder = config.cloudinary.folder, resource_type = 'auto', ...rest } = options;

  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder,
      resource_type,
      format: 'webp',
      quality: 'auto:good',
      fetch_format: 'auto',
      ...rest,
    };

    if (Buffer.isBuffer(fileSource)) {
      const stream = cloudinary.uploader.upload_stream(uploadOptions, (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
      stream.end(fileSource);
    } else {
      cloudinary.uploader.upload(fileSource, uploadOptions, (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    }
  });
};

export const deleteFromCloudinary = (publicId, resource_type = 'image') =>
  cloudinary.uploader.destroy(publicId, { resource_type });

export const generateOptimizedUrl = (publicId, options = {}) =>
  cloudinary.url(publicId, {
    fetch_format: 'auto',
    quality: 'auto:good',
    ...options,
  });

export default cloudinary;
