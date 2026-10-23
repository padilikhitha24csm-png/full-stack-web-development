import express from 'express';
import {
  getBooks,
  getBookById,
  getCategories,
  createBook,
  updateBook,
  deleteBook
} from '../controllers/bookController.js';

const router = express.Router();

router.get('/categories', getCategories);
router.get('/', getBooks);
router.get('/:id', getBookById);
router.post('/', createBook);
router.put('/:id', updateBook);
router.delete('/:id', deleteBook);

export default router;
