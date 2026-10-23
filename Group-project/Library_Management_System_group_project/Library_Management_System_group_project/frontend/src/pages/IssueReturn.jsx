import React, { useState, useEffect } from 'react';
import {
  Repeat,
  CheckCircle,
  AlertTriangle,
  Clock,
  Search,
  BookOpen,
  User,
  Calendar,
  Plus
} from 'lucide-react';
import api from '../api/api';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';

const IssueReturn = ({
  notify,
  isIssueModalOpen,
  setIsIssueModalOpen,
  preselectedBook,
  preselectedMember
}) => {
  const [issues, setIssues] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Available books and members for dropdowns
  const [availableBooks, setAvailableBooks] = useState([]);
  const [membersList, setMembersList] = useState([]);

  // Form State for Issuing Book
  const [selectedBookId, setSelectedBookId] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Return Confirm Dialog State
  const [returnTarget, setReturnTarget] = useState(null);
  const [returning, setReturning] = useState(false);

  // Default due date helper: today + 14 days
  const getDefaultDueDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  };

  // Fetch issue records
  const fetchIssues = async () => {
    try {
      setLoading(true);
      const res = await api.getIssues(statusFilter, search);
      if (res.success) {
        setIssues(res.data);
      }
    } catch (err) {
      notify('error', 'Error fetching issues', err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch books and members for modal select
  const fetchDropdownData = async () => {
    try {
      const [booksRes, membersRes] = await Promise.all([
        api.getBooks(),
        api.getMembers()
      ]);
      if (booksRes.success) setAvailableBooks(booksRes.data);
      if (membersRes.success) setMembersList(membersRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDropdownData();
  }, [isIssueModalOpen]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchIssues();
    }, 250);
    return () => clearTimeout(timer);
  }, [statusFilter, search]);

  // Sync pre-selected book or member if opened from other pages
  useEffect(() => {
    if (isIssueModalOpen) {
      setSelectedBookId(preselectedBook?.id ? String(preselectedBook.id) : '');
      setSelectedMemberId(preselectedMember?.id ? String(preselectedMember.id) : '');
      setDueDate(getDefaultDueDate());
      setFormErrors({});
    }
  }, [isIssueModalOpen, preselectedBook, preselectedMember]);

  // Validate Issue Form
  const validateIssueForm = () => {
    const errors = {};
    if (!selectedBookId) errors.book = 'Please select a book to issue';
    if (!selectedMemberId) errors.member = 'Please select a library member';
    if (!dueDate) {
      errors.dueDate = 'Please select a due date';
    } else {
      const today = new Date().toISOString().split('T')[0];
      if (dueDate < today) {
        errors.dueDate = 'Due date cannot be in the past';
      }
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle Submit Issue
  const handleIssueSubmit = async (e) => {
    e.preventDefault();
    if (!validateIssueForm()) return;

    try {
      setSubmitting(true);
      const payload = {
        book_id: Number(selectedBookId),
        member_id: Number(selectedMemberId),
        due_date: dueDate
      };
      const res = await api.issueBook(payload);
      if (res.success) {
        notify('success', 'Book Issued Successfully', res.message);
        setIsIssueModalOpen(false);
        fetchIssues();
        fetchDropdownData();
      }
    } catch (err) {
      notify('error', 'Issue Failed', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Return
  const handleReturnConfirm = async () => {
    if (!returnTarget) return;

    try {
      setReturning(true);
      const res = await api.returnBook(returnTarget.id);
      if (res.success) {
        notify('success', 'Book Returned', res.message);
        setReturnTarget(null);
        fetchIssues();
        fetchDropdownData();
      }
    } catch (err) {
      notify('error', 'Return Failed', err.message);
    } finally {
      setReturning(false);
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Toolbar */}
      <div className="toolbar">
        <div style={{ display: 'flex', gap: '12px', flex: 1, flexWrap: 'wrap' }}>
          <div className="search-input-wrapper">
            <Search className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search by book title, ISBN, or member name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="select-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Circulation Records</option>
            <option value="issued">Currently Issued (Active)</option>
            <option value="returned">Returned Books</option>
          </select>
        </div>

        <button className="btn btn-primary" onClick={() => setIsIssueModalOpen(true)}>
          <Repeat size={16} /> Issue Book
        </button>
      </div>

      {/* Issues Table */}
      <div className="card">
        <div className="card-header">
          <div className="card-title-group">
            <h3>Circulation History & Active Issues</h3>
            <p>
              Showing {issues.length} {issues.length === 1 ? 'record' : 'records'}
              {statusFilter !== 'all' ? ` (status: ${statusFilter})` : ''}
              {search ? ` matching "${search}"` : ''}
            </p>
          </div>
        </div>

        <div className="card-body p-0">
          {loading ? (
            <div className="loading-container">
              <div className="spinner" />
              <p>Loading circulation logs...</p>
            </div>
          ) : issues.length > 0 ? (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Book Details</th>
                    <th>Borrower</th>
                    <th>Issue Date</th>
                    <th>Due Date</th>
                    <th>Return Date</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {issues.map((issue) => {
                    const isReturned = issue.status === 'returned';
                    const isOverdue = Boolean(issue.is_overdue);

                    return (
                      <tr key={issue.id}>
                        <td style={{ minWidth: '200px' }}>
                          <strong style={{ display: 'block', color: 'var(--gray-900)' }}>
                            {issue.book_title}
                          </strong>
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            ISBN: {issue.book_isbn}
                          </span>
                        </td>
                        <td>
                          <strong style={{ display: 'block', color: 'var(--gray-800)' }}>
                            {issue.member_name}
                          </strong>
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            {issue.member_email} &bull; {issue.member_phone}
                          </span>
                        </td>
                        <td style={{ whiteSpace: 'nowrap' }}>{issue.issue_date}</td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          <span
                            style={{
                              color: !isReturned && isOverdue ? 'var(--danger-text)' : 'inherit',
                              fontWeight: !isReturned && isOverdue ? 700 : 'normal'
                            }}
                          >
                            {issue.due_date}
                          </span>
                        </td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          {issue.return_date ? (
                            <span style={{ color: 'var(--success-text)', fontWeight: 500 }}>
                              {issue.return_date}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-light)' }}>Pending</span>
                          )}
                        </td>
                        <td>
                          {isReturned ? (
                            <span className="badge badge-success">Returned</span>
                          ) : isOverdue ? (
                            <span className="badge badge-danger">Overdue</span>
                          ) : (
                            <span className="badge badge-warning">Active Issue</span>
                          )}
                        </td>
                        <td>
                          <div className="action-buttons" style={{ justifyContent: 'flex-end' }}>
                            {!isReturned ? (
                              <button
                                className="btn btn-primary btn-sm"
                                onClick={() => setReturnTarget(issue)}
                              >
                                Return Book
                              </button>
                            ) : (
                              <span
                                style={{
                                  fontSize: '12px',
                                  color: 'var(--text-muted)',
                                  padding: '4px 8px'
                                }}
                              >
                                Completed
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">
                <Repeat size={28} />
              </div>
              <h4>No Circulation Records Found</h4>
              <p>
                {search || statusFilter !== 'all'
                  ? 'No records matched your search or status filter.'
                  : 'No books have been issued yet. Click "Issue Book" to start borrowing.'}
              </p>
              {search || statusFilter !== 'all' ? (
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setSearch('');
                    setStatusFilter('all');
                  }}
                >
                  Reset Filters
                </button>
              ) : (
                <button className="btn btn-primary" onClick={() => setIsIssueModalOpen(true)}>
                  <Plus size={16} /> Issue Book Now
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Issue Book Modal */}
      <Modal
        isOpen={isIssueModalOpen}
        onClose={() => !submitting && setIsIssueModalOpen(false)}
        title="Issue Book to Member"
        footer={
          <>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsIssueModalOpen(false)}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleIssueSubmit}
              disabled={submitting}
            >
              {submitting ? 'Processing Transaction...' : 'Confirm Issue'}
            </button>
          </>
        }
      >
        <form onSubmit={handleIssueSubmit}>
          <div className="form-group">
            <label className="form-label">
              Select Book <span className="required">*</span>
            </label>
            <select
              className={`form-control ${formErrors.book ? 'is-invalid' : ''}`}
              value={selectedBookId}
              onChange={(e) => setSelectedBookId(e.target.value)}
            >
              <option value="">-- Choose a book from catalog --</option>
              {availableBooks.map((b) => (
                <option
                  key={b.id}
                  value={b.id}
                  disabled={b.available_quantity <= 0}
                >
                  {b.title} by {b.author} (Available: {b.available_quantity}/{b.quantity} copies)
                  {b.available_quantity <= 0 ? ' [OUT OF STOCK]' : ''}
                </option>
              ))}
            </select>
            {formErrors.book && <span className="form-error-msg">{formErrors.book}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">
              Select Member <span className="required">*</span>
            </label>
            <select
              className={`form-control ${formErrors.member ? 'is-invalid' : ''}`}
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
            >
              <option value="">-- Choose a member --</option>
              {membersList.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.email})
                </option>
              ))}
            </select>
            {formErrors.member && <span className="form-error-msg">{formErrors.member}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">
              Due Date <span className="required">*</span>
            </label>
            <input
              type="date"
              className={`form-control ${formErrors.dueDate ? 'is-invalid' : ''}`}
              value={dueDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setDueDate(e.target.value)}
            />
            {formErrors.dueDate && <span className="form-error-msg">{formErrors.dueDate}</span>}
            <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
              Standard borrow period is 14 days from today.
            </small>
          </div>
        </form>
      </Modal>

      {/* Return Book Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(returnTarget)}
        onClose={() => !returning && setReturnTarget(null)}
        onConfirm={handleReturnConfirm}
        title="Return Issued Book"
        message={`Confirm return of "${returnTarget?.book_title}" from member ${returnTarget?.member_name}? This will mark the issue completed and increment available inventory back to stock.`}
        confirmText="Confirm Return"
        isLoading={returning}
        isDanger={false}
      />
    </div>
  );
};

export default IssueReturn;
