import pool from '../config/db.js';

// Basic email format validation
const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

/**
 * Get all members with optional search (name, email, phone)
 * Also includes the count of currently issued books for each member.
 * GET /api/members?search=xyz
 */
export const getMembers = async (req, res, next) => {
  try {
    const { search } = req.query;
    let query = `
      SELECT 
        m.id, 
        m.name, 
        m.email, 
        m.phone, 
        m.created_at,
        COUNT(CASE WHEN bi.status = 'issued' THEN 1 END) AS active_issues_count,
        COUNT(bi.id) AS total_issues_count
      FROM members m
      LEFT JOIN book_issues bi ON m.id = bi.member_id
      WHERE 1=1
    `;
    const params = [];

    if (search && search.trim() !== '') {
      const term = `%${search.trim()}%`;
      query += ' AND (m.name LIKE ? OR m.email LIKE ? OR m.phone LIKE ?)';
      params.push(term, term, term);
    }

    query += ' GROUP BY m.id ORDER BY m.id DESC';

    const [rows] = await pool.query(query, params);
    res.json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single member by ID with their active books
 * GET /api/members/:id
 */
export const getMemberById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [members] = await pool.query('SELECT * FROM members WHERE id = ?', [id]);

    if (members.length === 0) {
      return res.status(404).json({ success: false, message: 'Member not found.' });
    }

    // Get active book issues for this member
    const [issues] = await pool.query(
      `SELECT bi.id, bi.issue_date, bi.due_date, bi.status, b.title, b.author, b.isbn
       FROM book_issues bi
       JOIN books b ON bi.book_id = b.id
       WHERE bi.member_id = ? AND bi.status = 'issued'
       ORDER BY bi.due_date ASC`,
      [id]
    );

    res.json({
      success: true,
      data: {
        ...members[0],
        active_issues: issues
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new member
 * POST /api/members
 */
export const createMember = async (req, res, next) => {
  try {
    const { name, email, phone } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Member name is required.' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: 'Email address is required.' });
    }
    if (!isValidEmail(email.trim())) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
    }
    if (!phone || !phone.trim()) {
      return res.status(400).json({ success: false, message: 'Phone number is required.' });
    }

    // Check if email already registered
    const [existing] = await pool.query('SELECT id FROM members WHERE email = ?', [email.trim()]);
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'A member with this email already exists.' });
    }

    const [result] = await pool.query(
      'INSERT INTO members (name, email, phone) VALUES (?, ?, ?)',
      [name.trim(), email.trim().toLowerCase(), phone.trim()]
    );

    const [newMember] = await pool.query('SELECT * FROM members WHERE id = ?', [result.insertId]);

    res.status(201).json({
      success: true,
      message: 'Member registered successfully!',
      data: newMember[0]
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update member details
 * PUT /api/members/:id
 */
export const updateMember = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, phone } = req.body;

    // Check member exists
    const [existing] = await pool.query('SELECT id FROM members WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Member not found.' });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Member name is required.' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: 'Email address is required.' });
    }
    if (!isValidEmail(email.trim())) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
    }
    if (!phone || !phone.trim()) {
      return res.status(400).json({ success: false, message: 'Phone number is required.' });
    }

    // Check if email taken by another member
    const [emailCheck] = await pool.query('SELECT id FROM members WHERE email = ? AND id != ?', [
      email.trim(),
      id
    ]);
    if (emailCheck.length > 0) {
      return res.status(409).json({ success: false, message: 'Another member already uses this email.' });
    }

    await pool.query(
      'UPDATE members SET name = ?, email = ?, phone = ? WHERE id = ?',
      [name.trim(), email.trim().toLowerCase(), phone.trim(), id]
    );

    const [updated] = await pool.query('SELECT * FROM members WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Member details updated successfully!',
      data: updated[0]
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a member record
 * DELETE /api/members/:id
 */
export const deleteMember = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;

    // Check member exists
    const [existing] = await connection.query('SELECT * FROM members WHERE id = ?', [id]);
    if (existing.length === 0) {
      connection.release();
      return res.status(404).json({ success: false, message: 'Member not found.' });
    }

    // Check if member has active issues
    const [activeIssues] = await connection.query(
      'SELECT id FROM book_issues WHERE member_id = ? AND status = "issued"',
      [id]
    );

    if (activeIssues.length > 0) {
      connection.release();
      return res.status(400).json({
        success: false,
        message: `Cannot delete member. They currently have ${activeIssues.length} book(s) issued. Please return books first.`
      });
    }

    await connection.beginTransaction();

    // Clean up past returned issue records for this member
    await connection.query('DELETE FROM book_issues WHERE member_id = ?', [id]);

    // Delete member
    await connection.query('DELETE FROM members WHERE id = ?', [id]);

    await connection.commit();
    connection.release();

    res.json({ success: true, message: 'Member and their past history deleted successfully.' });
  } catch (error) {
    await connection.rollback();
    connection.release();
    next(error);
  }
};
