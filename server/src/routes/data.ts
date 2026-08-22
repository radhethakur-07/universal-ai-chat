import { Router } from 'express';
import { insertData } from '../controllers/dataController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Route: POST /api/data/projects/:projectId/import
router.post('/projects/:projectId/import', authenticate, insertData);

export default router;
