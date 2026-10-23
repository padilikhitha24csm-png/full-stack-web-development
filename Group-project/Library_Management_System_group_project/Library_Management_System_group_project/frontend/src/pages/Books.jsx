import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  BookOpen,
  Filter,
  CheckCircle,
  AlertCircle,
  Repeat
} from 'lucide-react';
import api from '../api/api';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';

const INITIAL_FORM = {
  title: '',
  author: '',
  isbn: '',
  category: '',
  quantity: 1
};

const Books = ({ notify, onQuickIssue }) => {
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Delete Confirm State
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch Books
  const fetchBooks = async () => {
    try {
      setLoading(true);
      const res = await api.getBooks(search, selectedCategory);
      if (res.success) {
        setBooks(res.data);
      }
    } catch (err) {
      notify('error', 'Error fetching books', err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Categories for dropdown filter
  const fetchCategories = async () => {
    try {
      const res = await api.getCategories();
      if (res.success) {
        setCategories(res.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Debounced search / filter trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchBooks();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, selectedCategory]);

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingBook(null);
    setFormData(INITIAL_FORM);
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (book) => {
    setEditingBook(book);
    setFormData({
      title: book.title,
      author: book.author,
      isbn: book.isbn,
      category: book.category,
      quantity: book.quantity
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Validate Form
  const validateForm = () => {
    const errors = {};
    if (!formData.title.trim()) errors.title = 'Title is required';
    if (!formData.author.trim()) errors.author = 'Author name is required';
    if (!formData.isbn.trim()) errors.isbn = 'ISBN is required';
    if (!formData.category.trim()) errors.category = 'Category is required';
    const qty = parseInt(formData.quantity, 10);
    if (isNaN(qty) || qty < 1) {
      errors.quantity = 'Quantity must be at least 1';
    } else if (editingBook) {
      const currentlyIssued = editingBook.quantity - editingBook.available_quantity;
      if (qty < currentlyIssued) {
        errors.quantity = `Cannot be less than currently issued copies (${currentlyIssued})`;
      }
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Save (Create or Update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      if (editingBook) {
        const res = await api.updateBook(editingBook.id, formData);
        if (res.success) {
          notify('success', 'Book Updated', res.message);
          setIsModalOpen(false);
          fetchBooks();
          fetchCategories();
        }
      } else {
        const res = await api.createBook(formData);
        if (res.success) {
          notify('success', 'Book Added', res.message);
          setIsModalOpen(false);
          fetchBooks();
          fetchCategories();
        }
      }
    } catch (err) {
      notify('error', 'Operation Failed', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Book
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      const res = await api.deleteBook(deleteTarget.id);
      if (res.success) {
        notify('success', 'Book Deleted', res.message);
        setDeleteTarget(null);
        fetchBooks();
        fetchCategories();
      }
    } catch (err) {
      notify('error', 'Delete Failed', err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Filter and Action Toolbar */}
      <div className="toolbar">
        <div style={{ display: 'flex', gap: '12px', flex: 1, flexWrap: 'wrap' }}>
          <div className="search-input-wrapper">
            <Search className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search by title, author, or ISBN..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="select-filter"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="All">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <button className="btn btn-primary" onClick={handleOpenAdd}>
          <Plus size={16} /> Add New Book
        </button>
      </div>

      {/* Books Table Card */}
      <div className="card">
        <div className="card-header">
          <div className="card-title-group">
            <h3>Book Inventory Catalog</h3>
            <p>
              Showing {books.length} {books.length === 1 ? 'record' : 'records'}
              {selectedCategory !== 'All' ? ` in category "${selectedCategory}"` : ''}
              {search ? ` matching "${search}"` : ''}
            </p>
          </div>
        </div>

        <div className="card-body p-0">
          {loading ? (
            <div className="loading-container">
              <div className="spinner" />
              <p>Loading book catalog...</p>
            </div>
          ) : books.length > 0 ? (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Title & Author</th>
                    <th>ISBN</th>
                    <th>Category</th>
                    <th>Availability</th>
                    <th>Stock Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {books.map((book) => {
                    const available = book.available_quantity;
                    const total = book.quantity;
                    const isOutOfStock = available === 0;
                    const isLowStock = available > 0 && available <= 1;

                    return (
                      <tr key={book.id}>
                        <td style={{ minWidth: '220px' }}>
                          <strong style={{ display: 'block', color: 'var(--gray-900)' }}>
                            {book.title}
                          </strong>
                          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                            by {book.author}
                          </span>
                        </td>
                        <td>
                          <code className="font-mono" style={{ fontSize: '12px' }}>
                            {book.isbn}
                          </code>
                        </td>
                        <td>
                          <span className="badge badge-neutral">{book.category}</span>
                        </td>
                        <td>
                          <div className="stock-bar-wrapper">
                            <div>
                              <strong
                                style={{
                                  color: isOutOfStock ? 'var(--danger-text)' : 'inherit'
                                }}
                              >
                                {available}
                              </strong>
                              <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                                {' '}/ {total}
                              </span>
                            </div>
                            <div className="stock-bar-track">
                              <div
                                className="stock-bar-fill"
                                style={{
                                  width: `${Math.round((available / total) * 100)}%`,
                                  backgroundColor: isOutOfStock
                                    ? 'var(--danger)'
                                    : isLowStock
                                    ? 'var(--warning)'
                                    : 'var(--success)'
                                }}
                              />
                            </div>
                          </div>
                        </td>
                        <td>
                          {isOutOfStock ? (
                            <span className="badge badge-danger">Out of Stock</span>
                          ) : isLowStock ? (
                            <span className="badge badge-warning">Low Stock</span>
                          ) : (
                            <span className="badge badge-success">In Stock</span>
                          )}
                        </td>
                        <td>
                          <div className="action-buttons" style={{ justifyContent: 'flex-end' }}>
                            <button
                              className="btn btn-secondary btn-sm"
                              title="Issue this book"
                              disabled={isOutOfStock}
                              onClick={() => onQuickIssue && onQuickIssue(book)}
                            >
                              <Repeat size={14} /> Issue
                            </button>
                            <button
                              className="btn btn-secondary btn-icon"
                              title="Edit book"
                              onClick={() => handleOpenEdit(book)}
                            >
                              <Edit2 size={15} />
                            </button>
                            <button
                              className="btn btn-danger btn-icon"
                              title="Delete book"
                              onClick={() => setDeleteTarget(book)}
                            >
                              <Trash2 size={15} />
                            </button>
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
                <BookOpen size={28} />
              </div>
              <h4>No Books Found</h4>
              <p>
                {search || selectedCategory !== 'All'
                  ? 'No book records matched your search filters. Try clearing your search.'
                  : 'Start by adding your first book to the library catalog.'}
              </p>
              {search || selectedCategory !== 'All' ? (
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setSearch('');
                    setSelectedCategory('All');
                  }}
                >
                  Clear Filters
                </button>
              ) : (
                <button className="btn btn-primary" onClick={handleOpenAdd}>
                  <Plus size={16} /> Add First Book
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Book Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => !submitting && setIsModalOpen(false)}
        title={editingBook ? 'Edit Book Record' : 'Add New Book'}
        footer={
          <>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsModalOpen(false)}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? 'Saving...' : editingBook ? 'Save Changes' : 'Add Book'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">
              Book Title <span className="required">*</span>
            </label>
            <input
              type="text"
              className={`form-control ${formErrors.title ? 'is-invalid' : ''}`}
              placeholder="e.g. Clean Code"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
            {formErrors.title && <span className="form-error-msg">{formErrors.title}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">
              Author(s) <span className="required">*</span>
            </label>
            <input
              type="text"
              className={`form-control ${formErrors.author ? 'is-invalid' : ''}`}
              placeholder="e.g. Robert C. Martin"
              value={formData.author}
              onChange={(e) => setFormData({ ...formData, author: e.target.value })}
            />
            {formErrors.author && <span className="form-error-msg">{formErrors.author}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">
                ISBN <span className="required">*</span>
              </label>
              <input
                type="text"
                className={`form-control ${formErrors.isbn ? 'is-invalid' : ''}`}
                placeholder="e.g. 978-0132350884"
                value={formData.isbn}
                onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
              />
              {formErrors.isbn && <span className="form-error-msg">{formErrors.isbn}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">
                Category <span className="required">*</span>
              </label>
              <input
                type="text"
                list="category-suggestions"
                className={`form-control ${formErrors.category ? 'is-invalid' : ''}`}
                placeholder="e.g. Computer Science"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              />
              <datalist id="category-suggestions">
                {categories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
              {formErrors.category && (
                <span className="form-error-msg">{formErrors.category}</span>
              )}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              Total Quantity <span className="required">*</span>
            </label>
            <input
              type="number"
              min="1"
              className={`form-control ${formErrors.quantity ? 'is-invalid' : ''}`}
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
            />
            {formErrors.quantity && (
              <span className="form-error-msg">{formErrors.quantity}</span>
            )}
            {editingBook && (
              <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                Currently issued: {editingBook.quantity - editingBook.available_quantity} copies.
                Available after update: {Math.max(0, parseInt(formData.quantity || 0, 10) - (editingBook.quantity - editingBook.available_quantity))} copies.
              </small>
            )}
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => !isDeleting && setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Book"
        message={`Are you sure you want to permanently delete "${deleteTarget?.title}"? This action cannot be undone.`}
        confirmText="Delete Book"
        isLoading={isDeleting}
        isDanger={true}
      />
    </div>
  );
};

export default Books;
