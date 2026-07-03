import { Router } from 'express';
import * as c from '../controllers/media.controller.js';
import { requireAuth, requireAdmin } from '../middleware/auth.middleware.js';
import { imageUpload, documentUpload } from '../middleware/upload.middleware.js';

const router = Router();
router.use(requireAuth, requireAdmin);

router.get('/', c.list);
router.post('/upload/image', imageUpload.array('files', 10), c.upload);
router.post('/upload/document', documentUpload.array('files', 10), c.upload);
router.patch('/:id', c.updateMetadata);
router.delete('/:id', c.remove);

export default router;
