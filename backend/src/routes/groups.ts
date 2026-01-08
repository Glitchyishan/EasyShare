import { Router } from 'express';
import { getGroupSummary, addExpense, getSettlements, createGroup, getMessages, getMyGroups, sendMessage, addMember, clearSettlements } from '../controllers/groups';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.post('/', createGroup);
router.get('/my', getMyGroups);
router.get('/:id/summary', getGroupSummary);
router.post('/:id/expenses', addExpense);
router.get('/:id/settlements', getSettlements);
router.post('/:id/settlements/clear', clearSettlements);
router.get('/:id/messages', getMessages);
router.post('/:id/messages', sendMessage);
router.post('/:id/members', addMember);

export default router;
