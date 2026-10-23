import pool from '../config/db.js';

/**
 * Get all books with optional search (title, author, isbn) and category filter.
 * GET /api/books?search=xyz&category=Computer%20Science
 */
export const getBooks = async (req, res, next) => {
  try {
    const { search, category } = req.query;
    let query = 'SELECT * FROM books WHERE 1=1';
    const params = [];

    if (search && search.trim() !== '') {
      const term = `%${search.trim()}%`;
      query += ' AND (title LIKE ? OR author LIKE ? OR isbn LIKE ?)';
      params.push(term, term, term);
    }

    if (category && category.trim() !== '' && category.toLowerCase() !== 'all') {
      query += ' AND category = ?';
      params.push(category.trim());
    }

    query += ' ORDER BY id DESC';

    const [rows] = await pool.query(query, params);
    res.json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single book by ID
 * GET /api/books/:id
 */
export const getBookById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT * FROM books WHERE id = ?', [id]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }

    res.json({ success: true, data: rows[0] });
  } catch (error) {
    next(error);
  }
};

/**
 * Get list of all distinct categories
 * GET /api/books/categories
 */
export const getCategories = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT DISTINCT category FROM books WHERE category IS NOT NULL AND category != "" ORDER BY category ASC'
    );
    const categories = rows.map((r) => r.category);
    res.json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new book
 * POST /api/books
 */
export const createBook = async (req, res, next) => {
  try {
    const { title, author, isbn, category, quantity } = req.body;

    // Validation
    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Book title is required.' });
    }
    if (!author || !author.trim()) {
      return res.status(400).json({ success: false, message: 'Author name is required.' });
    }
    if (!isbn || !isbn.trim()) {
      return res.status(400).json({ success: false, message: 'ISBN is required.' });
    }
    if (!category || !category.trim()) {
      return res.status(400).json({ success: false, message: 'Category is required.' });
    }

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty < 1) {
      return res.status(400).json({ success: false, message: 'Quantity must be at least 1.' });
    }

    // Check if ISBN already exists
    const [existing] = await pool.query('SELECT id FROM books WHERE isbn = ?', [isbn.trim()]);
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'A book with this ISBN already exists.' });
    }

    // Available quantity initially equals total quantity
    const [result] = await pool.query(
      'INSERT INTO books (title, author, isbn, category, quantity, available_quantity) VALUES (?, ?, ?, ?, ?, ?)',
      [title.trim(), author.trim(), isbn.trim(), category.trim(), qty, qty]
    );

    const [newBook] = await pool.query('SELECT * FROM books WHERE id = ?', [result.insertId]);

    res.status(201).json({
      success: true,
      message: 'Book created successfully!',
      data: newBook[0]
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a book record
 * PUT /api/books/:id
 */
export const updateBook = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, author, isbn, category, quantity } = req.body;

    // Check book exists
    const [existing] = await pool.query('SELECT * FROM books WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Book not found.' });
    }
    const currentBook = existing[0];

    // Validation
    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Book title is required.' });
    }
    if (!author || !author.trim()) {
      return res.status(400).json({ success: false, message: 'Author name is required.' });
    }
    if (!isbn || !isbn.trim()) {
      return res.status(400).json({ success: false, message: 'ISBN is required.' });
    }
    if (!category || !category.trim()) {
      return res.status(400).json({ success: false, message: 'Category is required.' });
    }

    const newQty = parseInt(quantity, 10);
    if (isNaN(newQty) || newQty < 1) {
      return res.status(400).json({ success: false, message: 'Quantity must be at least 1.' });
    }

    // Check if ISBN taken by another book
    const [isbnCheck] = await pool.query('SELECT id FROM books WHERE isbn = ? AND id != ?', [
      isbn.trim(),
      id
    ]);
    if (isbnCheck.length > 0) {
      return res.status(409).json({ success: false, message: 'Another book already uses this ISBN.' });
    }

    // Currently issued copies = current total quantity - current available quantity
    const currentlyIssued = currentBook.quantity - currentBook.available_quantity;

    if (newQty < currentlyIssued) {
      return res.status(400).json({
        success: false,
        message: `Cannot reduce total quantity to ${newQty}. There are currently ${currentlyIssued} copies issued to members.`
      });
    }

    // Compute updated available quantity
    const newAvailable = newQty - currentlyIssued;

    await pool.query(
      'UPDATE books SET title = ?, author = ?, isbn = ?, category = ?, quantity = ?, available_quantity = ? WHERE id = ?',
      [title.trim(), author.trim(), isbn.trim(), category.trim(), newQty, newAvailable, id]
    );

    const [updated] = await pool.query('SELECT * FROM books WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Book updated successfully!',
      data: updated[0]
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a book record
 * DELETE /api/books/:id
 */
export const deleteBook = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;

    // Check if book exists
    const [existing] = await connection.query('SELECT * FROM books WHERE id = ?', [id]);
    if (existing.length === 0) {
      connection.release();
      return res.status(404).json({ success: false, message: 'Book not found.' });
    }

    // Check if book currently has active (unreturned) issues
    const [activeIssues] = await connection.query(
      'SELECT id FROM book_issues WHERE book_id = ? AND status = "issued"',
      [id]
    );

    if (activeIssues.length > 0) {
      connection.release();
      return res.status(400).json({
        success: false,
        message: `Cannot delete book. It is currently issued to ${activeIssues.length} member(s). Please return all copies first.`
      });
    }

    await connection.beginTransaction();

    // Clean up any historical returned issue records for this book
    await connection.query('DELETE FROM book_issues WHERE book_id = ?', [id]);

    // Delete the book
    await connection.query('DELETE FROM books WHERE id = ?', [id]);

    await connection.commit();
    connection.release();

    res.json({ success: true, message: 'Book and its return history deleted successfully.' });
  } catch (error) {
    await connection.rollback();
    connection.release();
    next(error);
  }
};
