import express from 'express';
import {
  getAllIssues,
  issueBook,
  returnBook
} from '../controllers/issueController.js';

const router = express.Router();

router.get('/', getAllIssues);
router.post('/', issueBook);
router.post('/:id/return', returnBook);
router.put('/:id/return', returnBook); // Support both POST and PUT for flexibility

export default router;
