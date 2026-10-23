import pool from '../config/db.js';

/**
 * Get aggregated statistics for the dashboard
 * GET /api/dashboard/stats
 */
export const getDashboardStats = async (req, res, next) => {
  try {
    // 1. Book totals
    const [bookStats] = await pool.query(`
      SELECT 
        COUNT(*) AS total_titles,
        COALESCE(SUM(quantity), 0) AS total_copies,
        COALESCE(SUM(available_quantity), 0) AS available_copies
      FROM books
    `);

    // 2. Member totals
    const [memberStats] = await pool.query(`
      SELECT COUNT(*) AS total_members FROM members
    `);

    // 3. Issue totals (active, overdue, returned)
    const [issueStats] = await pool.query(`
      SELECT 
        COUNT(CASE WHEN status = 'issued' THEN 1 END) AS currently_issued,
        COUNT(CASE WHEN status = 'issued' AND due_date < CURDATE() THEN 1 END) AS overdue_books,
        COUNT(CASE WHEN status = 'returned' THEN 1 END) AS total_returned,
        COUNT(*) AS total_transactions
      FROM book_issues
    `);

    // 4. Recent activity (latest 6 issues)
    const [recentIssues] = await pool.query(`
      SELECT 
        bi.id,
        bi.issue_date,
        bi.due_date,
        bi.return_date,
        bi.status,
        b.title AS book_title,
        b.category AS book_category,
        m.name AS member_name,
        m.email AS member_email,
        CASE 
          WHEN bi.status = 'issued' AND bi.due_date < CURDATE() THEN 1 
          ELSE 0 
        END AS is_overdue
      FROM book_issues bi
      JOIN books b ON bi.book_id = b.id
      JOIN members m ON bi.member_id = m.id
      ORDER BY bi.id DESC
      LIMIT 6
    `);

    // 5. Category breakdown
    const [categoryBreakdown] = await pool.query(`
      SELECT 
        category, 
        COUNT(*) AS title_count,
        SUM(quantity) AS total_copies,
        SUM(available_quantity) AS available_copies
      FROM books
      GROUP BY category
      ORDER BY title_count DESC
    `);

    res.json({
      success: true,
      data: {
        totalBooks: Number(bookStats[0].total_titles) || 0,
        totalCopies: Number(bookStats[0].total_copies) || 0,
        availableCopies: Number(bookStats[0].available_copies) || 0,
        totalMembers: Number(memberStats[0].total_members) || 0,
        issuedBooks: Number(issueStats[0].currently_issued) || 0,
        overdueBooks: Number(issueStats[0].overdue_books) || 0,
        returnedBooks: Number(issueStats[0].total_returned) || 0,
        totalTransactions: Number(issueStats[0].total_transactions) || 0,
        recentIssues,
        categoryBreakdown
      }
    });
  } catch (error) {
    next(error);
  }
};
