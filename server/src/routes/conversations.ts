import { Router } from 'express';
import { getConversations, getConversation, updateConversation, deleteConversation } from '../controllers/conversationController';
import { authenticate } from '../middleware/auth';

const router = Router();
router.get('/', authenticate, getConversations);
router.get('/:id', authenticate, getConversation);
router.patch('/:id', authenticate, updateConversation);
router.delete('/:id', authenticate, deleteConversation);
export default router;
