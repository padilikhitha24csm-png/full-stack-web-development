import express from 'express';
import {
  getMembers,
  getMemberById,
  createMember,
  updateMember,
  deleteMember
} from '../controllers/memberController.js';

const router = express.Router();

router.get('/', getMembers);
router.get('/:id', getMemberById);
router.post('/', createMember);
router.put('/:id', updateMember);
router.delete('/:id', deleteMember);

export default router;
