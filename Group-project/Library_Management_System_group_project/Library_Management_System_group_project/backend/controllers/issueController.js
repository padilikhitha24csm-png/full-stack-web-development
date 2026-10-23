import pool from '../config/db.js';

/**
 * Get all book issues with member and book details
 * Supports filtering by status (?status=issued|returned) and search query (?search=...)
 * GET /api/issues
 */
export const getAllIssues = async (req, res, next) => {
  try {
    const { status, search } = req.query;

    let query = `
      SELECT 
        bi.id,
        bi.book_id,
        bi.member_id,
        bi.issue_date,
        bi.due_date,
        bi.return_date,
        bi.status,
        b.title AS book_title,
        b.author AS book_author,
        b.isbn AS book_isbn,
        m.name AS member_name,
        m.email AS member_email,
        m.phone AS member_phone,
        CASE 
          WHEN bi.status = 'issued' AND bi.due_date < CURDATE() THEN 1 
          ELSE 0 
        END AS is_overdue
      FROM book_issues bi
      JOIN books b ON bi.book_id = b.id
      JOIN members m ON bi.member_id = m.id
      WHERE 1=1
    `;
    const params = [];

    if (status && status.trim() !== '' && status.toLowerCase() !== 'all') {
      query += ' AND bi.status = ?';
      params.push(status.trim().toLowerCase());
    }

    if (search && search.trim() !== '') {
      const term = `%${search.trim()}%`;
      query += ' AND (b.title LIKE ? OR b.isbn LIKE ? OR m.name LIKE ? OR m.email LIKE ?)';
      params.push(term, term, term, term);
    }

    query += ' ORDER BY bi.id DESC';

    const [rows] = await pool.query(query, params);
    res.json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    next(error);
  }
};

/**
 * Issue a book to a member using an ACID transaction
 * POST /api/issues
 * Body: { book_id, member_id, due_date }
 */
export const issueBook = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const { book_id, member_id, due_date } = req.body;

    // Basic input validation
    if (!book_id) {
      connection.release();
      return res.status(400).json({ success: false, message: 'Please select a book.' });
    }
    if (!member_id) {
      connection.release();
      return res.status(400).json({ success: false, message: 'Please select a member.' });
    }

    // Begin ACID transaction
    await connection.beginTransaction();

    // 1. Lock and check book record
    const [bookRows] = await connection.query(
      'SELECT id, title, available_quantity FROM books WHERE id = ? FOR UPDATE',
      [book_id]
    );

    if (bookRows.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({ success: false, message: 'Selected book does not exist.' });
    }

    const book = bookRows[0];

    // Check inventory availability
    if (book.available_quantity <= 0) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({
        success: false,
        message: `"${book.title}" is currently out of stock. All copies have been issued.`
      });
    }

    // 2. Lock and check member record
    const [memberRows] = await connection.query(
      'SELECT id, name FROM members WHERE id = ? FOR UPDATE',
      [member_id]
    );

    if (memberRows.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({ success: false, message: 'Selected member does not exist.' });
    }

    const member = memberRows[0];

    // 3. Prevent duplicate active borrow of same book by same member
    const [activeCopy] = await connection.query(
      'SELECT id FROM book_issues WHERE book_id = ? AND member_id = ? AND status = "issued"',
      [book_id, member_id]
    );
    if (activeCopy.length > 0) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({
        success: false,
        message: `Member ${member.name} already has an active issue of "${book.title}".`
      });
    }

    // 4. Calculate issue date and due date
    const today = new Date().toISOString().split('T')[0];
    let finalDueDate = due_date;

    if (!finalDueDate || !finalDueDate.trim()) {
      // Default due date: 14 days from today
      const d = new Date();
      d.setDate(d.getDate() + 14);
      finalDueDate = d.toISOString().split('T')[0];
    } else {
      // Ensure due date is not in the past
      if (finalDueDate < today) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({
          success: false,
          message: 'Due date cannot be set in the past.'
        });
      }
    }

    // 5. Decrement available quantity in books table
    await connection.query(
      'UPDATE books SET available_quantity = available_quantity - 1 WHERE id = ?',
      [book_id]
    );

    // 6. Insert new issue record
    const [insertResult] = await connection.query(
      'INSERT INTO book_issues (book_id, member_id, issue_date, due_date, status) VALUES (?, ?, ?, ?, "issued")',
      [book_id, member_id, today, finalDueDate]
    );

    // Commit transaction
    await connection.commit();
    connection.release();

    res.status(201).json({
      success: true,
      message: `"${book.title}" was successfully issued to ${member.name}.`,
      data: {
        id: insertResult.insertId,
        book_id,
        member_id,
        issue_date: today,
        due_date: finalDueDate,
        status: 'issued'
      }
    });
  } catch (error) {
    await connection.rollback();
    connection.release();
    next(error);
  }
};

/**
 * Return an issued book using an ACID transaction
 * POST /api/issues/:id/return or PUT /api/issues/:id/return
 */
export const returnBook = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;

    // Begin ACID transaction
    await connection.beginTransaction();

    // 1. Lock and check issue record
    const [issueRows] = await connection.query(
      `SELECT bi.id, bi.book_id, bi.member_id, bi.status, b.title, m.name AS member_name
       FROM book_issues bi
       JOIN books b ON bi.book_id = b.id
       JOIN members m ON bi.member_id = m.id
       WHERE bi.id = ? FOR UPDATE`,
      [id]
    );

    if (issueRows.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({ success: false, message: 'Issue record not found.' });
    }

    const issue = issueRows[0];

    if (issue.status === 'returned') {
      await connection.rollback();
      connection.release();
      return res.status(400).json({
        success: false,
        message: 'This book has already been returned.'
      });
    }

    // 2. Lock book record and increment available_quantity
    await connection.query(
      'SELECT id, quantity, available_quantity FROM books WHERE id = ? FOR UPDATE',
      [issue.book_id]
    );

    await connection.query(
      'UPDATE books SET available_quantity = LEAST(quantity, available_quantity + 1) WHERE id = ?',
      [issue.book_id]
    );

    // 3. Update issue record with return_date and status
    const returnDate = new Date().toISOString().split('T')[0];
    await connection.query(
      'UPDATE book_issues SET return_date = ?, status = "returned" WHERE id = ?',
      [returnDate, id]
    );

    // Commit transaction
    await connection.commit();
    connection.release();

    res.json({
      success: true,
      message: `"${issue.title}" was successfully returned by ${issue.member_name}.`,
      data: {
        id: Number(id),
        return_date: returnDate,
        status: 'returned'
      }
    });
  } catch (error) {
    await connection.rollback();
    connection.release();
    next(error);
  }
};
