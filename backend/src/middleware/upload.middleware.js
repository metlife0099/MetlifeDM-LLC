import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary.js';
import { config } from '../config/index.js';
import ApiError from '../utils/ApiError.js';

const IMAGE_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
const DOC_MIME = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const buildStorage = (folder = 'general', allowed_formats = ['jpg', 'jpeg', 'png', 'webp', 'gif']) =>
  new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => ({
      folder: `${config.cloudinary.folder}/${folder}`,
      allowed_formats,
      resource_type: 'auto',
      transformation: allowed_formats.includes('webp')
        ? [{ fetch_format: 'auto', quality: 'auto:good' }]
        : undefined,
      public_id: `${Date.now()}-${file.originalname.split('.')[0].replace(/[^a-z0-9]/gi, '_')}`,
    }),
  });

const buildFilter = (mimes) => (req, file, cb) => {
  if (mimes.includes(file.mimetype)) cb(null, true);
  else cb(ApiError.badRequest(`Unsupported file type: ${file.mimetype}`), false);
};

export const imageUpload = multer({
  storage: buildStorage('images'),
  limits: { fileSize: 5 * 1024 * 1024, files: 10 },
  fileFilter: buildFilter(IMAGE_MIME),
});

export const documentUpload = multer({
  storage: buildStorage('documents', ['pdf', 'doc', 'docx']),
  limits: { fileSize: 10 * 1024 * 1024, files: 3 },
  fileFilter: buildFilter([...IMAGE_MIME, ...DOC_MIME]),
});

export const resumeUpload = multer({
  storage: buildStorage('resumes', ['pdf', 'doc', 'docx']),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: buildFilter(DOC_MIME),
});

export const chatAttachmentUpload = multer({
  storage: buildStorage('chat', ['jpg', 'jpeg', 'png', 'webp', 'gif', 'pdf']),
  limits: { fileSize: 5 * 1024 * 1024, files: 5 },
  fileFilter: buildFilter([...IMAGE_MIME, 'application/pdf']),
});

// Memory storage for stream-processed uploads (avatars etc.)
export const memoryUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: buildFilter(IMAGE_MIME),
});
