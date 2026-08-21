import { Router } from 'express';
import { getProjects, getProject } from '../controllers/projectController';
import { authenticate } from '../middleware/auth';

const router = Router();
router.get('/', authenticate, getProjects);
router.get('/:id', authenticate, getProject);
export default router;
