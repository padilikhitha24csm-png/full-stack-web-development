import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Users,
  Mail,
  Phone,
  BookOpen,
  Calendar,
  Repeat
} from 'lucide-react';
import api from '../api/api';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';

const INITIAL_FORM = {
  name: '',
  email: '',
  phone: ''
};

const Members = ({ notify, onQuickIssueToMember }) => {
  const [members, setMembers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Detail Modal State
  const [viewingMember, setViewingMember] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const res = await api.getMembers(search);
      if (res.success) {
        setMembers(res.data);
      }
    } catch (err) {
      notify('error', 'Error fetching members', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMembers();
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingMember(null);
    setFormData(INITIAL_FORM);
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (member) => {
    setEditingMember(member);
    setFormData({
      name: member.name,
      email: member.email,
      phone: member.phone
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // View Member Detail & Active Borrows
  const handleViewMember = async (memberId) => {
    try {
      setLoadingDetail(true);
      const res = await api.getMemberById(memberId);
      if (res.success) {
        setViewingMember(res.data);
      }
    } catch (err) {
      notify('error', 'Failed to load details', err.message);
    } finally {
      setLoadingDetail(false);
    }
  };

  // Validation
  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Full name is required';
    if (!formData.email.trim()) {
      errors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = 'Please enter a valid email address';
    }
    if (!formData.phone.trim()) errors.phone = 'Phone number is required';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Save
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      if (editingMember) {
        const res = await api.updateMember(editingMember.id, formData);
        if (res.success) {
          notify('success', 'Member Updated', res.message);
          setIsModalOpen(false);
          fetchMembers();
        }
      } else {
        const res = await api.createMember(formData);
        if (res.success) {
          notify('success', 'Member Registered', res.message);
          setIsModalOpen(false);
          fetchMembers();
        }
      }
    } catch (err) {
      notify('error', 'Operation Failed', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Delete
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      const res = await api.deleteMember(deleteTarget.id);
      if (res.success) {
        notify('success', 'Member Deleted', res.message);
        setDeleteTarget(null);
        fetchMembers();
      }
    } catch (err) {
      notify('error', 'Cannot Delete Member', err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Toolbar */}
      <div className="toolbar">
        <div className="search-input-wrapper">
          <Search className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search members by name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <button className="btn btn-primary" onClick={handleOpenAdd}>
          <Plus size={16} /> Register Member
        </button>
      </div>

      {/* Members Table */}
      <div className="card">
        <div className="card-header">
          <div className="card-title-group">
            <h3>Registered Library Members</h3>
            <p>
              Showing {members.length} {members.length === 1 ? 'member' : 'members'}
              {search ? ` matching "${search}"` : ''}
            </p>
          </div>
        </div>

        <div className="card-body p-0">
          {loading ? (
            <div className="loading-container">
              <div className="spinner" />
              <p>Loading members...</p>
            </div>
          ) : members.length > 0 ? (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Member Name</th>
                    <th>Email Address</th>
                    <th>Phone</th>
                    <th>Active Issues</th>
                    <th>Joined</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => {
                    const activeCount = Number(member.active_issues_count) || 0;

                    return (
                      <tr key={member.id}>
                        <td>
                          <button
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--primary)',
                              fontWeight: 600,
                              cursor: 'pointer',
                              padding: 0,
                              textAlign: 'left'
                            }}
                            onClick={() => handleViewMember(member.id)}
                            title="Click to view borrowed books"
                          >
                            {member.name}
                          </button>
                        </td>
                        <td>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Mail size={14} color="var(--gray-400)" />
                            {member.email}
                          </span>
                        </td>
                        <td>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Phone size={14} color="var(--gray-400)" />
                            {member.phone}
                          </span>
                        </td>
                        <td>
                          {activeCount > 0 ? (
                            <span className="badge badge-warning">
                              {activeCount} {activeCount === 1 ? 'book' : 'books'}
                            </span>
                          ) : (
                            <span className="badge badge-neutral">0 active</span>
                          )}
                        </td>
                        <td style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                          {member.created_at ? member.created_at.split(' ')[0] : '-'}
                        </td>
                        <td>
                          <div className="action-buttons" style={{ justifyContent: 'flex-end' }}>
                            <button
                              className="btn btn-secondary btn-sm"
                              title="Issue a book to this member"
                              onClick={() => onQuickIssueToMember && onQuickIssueToMember(member)}
                            >
                              <Repeat size={14} /> Issue
                            </button>
                            <button
                              className="btn btn-secondary btn-icon"
                              title="Edit member"
                              onClick={() => handleOpenEdit(member)}
                            >
                              <Edit2 size={15} />
                            </button>
                            <button
                              className="btn btn-danger btn-icon"
                              title="Delete member"
                              onClick={() => setDeleteTarget(member)}
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
                <Users size={28} />
              </div>
              <h4>No Members Found</h4>
              <p>
                {search
                  ? 'No members matched your search. Try another keyword.'
                  : 'Start by registering your first library member.'}
              </p>
              {search ? (
                <button className="btn btn-secondary" onClick={() => setSearch('')}>
                  Clear Search
                </button>
              ) : (
                <button className="btn btn-primary" onClick={handleOpenAdd}>
                  <Plus size={16} /> Register First Member
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Member Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => !submitting && setIsModalOpen(false)}
        title={editingMember ? 'Edit Member Details' : 'Register New Member'}
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
              {submitting ? 'Saving...' : editingMember ? 'Save Changes' : 'Register Member'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">
              Full Name <span className="required">*</span>
            </label>
            <input
              type="text"
              className={`form-control ${formErrors.name ? 'is-invalid' : ''}`}
              placeholder="e.g. Alice Johnson"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            {formErrors.name && <span className="form-error-msg">{formErrors.name}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">
              Email Address <span className="required">*</span>
            </label>
            <input
              type="email"
              className={`form-control ${formErrors.email ? 'is-invalid' : ''}`}
              placeholder="e.g. alice.johnson@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            {formErrors.email && <span className="form-error-msg">{formErrors.email}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">
              Phone Number <span className="required">*</span>
            </label>
            <input
              type="tel"
              className={`form-control ${formErrors.phone ? 'is-invalid' : ''}`}
              placeholder="e.g. 555-0101"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
            {formErrors.phone && <span className="form-error-msg">{formErrors.phone}</span>}
          </div>
        </form>
      </Modal>

      {/* Member Details Modal with Active Books */}
      <Modal
        isOpen={Boolean(viewingMember)}
        onClose={() => setViewingMember(null)}
        title="Member Profile & Active Borrows"
        footer={
          <button className="btn btn-secondary" onClick={() => setViewingMember(null)}>
            Close
          </button>
        }
      >
        {viewingMember && (
          <div>
            <div
              style={{
                backgroundColor: 'var(--gray-50)',
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                marginBottom: '20px'
              }}
            >
              <h4 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--gray-900)' }}>
                {viewingMember.name}
              </h4>
              <div
                style={{
                  display: 'flex',
                  gap: '20px',
                  marginTop: '8px',
                  fontSize: '13px',
                  color: 'var(--gray-600)',
                  flexWrap: 'wrap'
                }}
              >
                <span>
                  <Mail size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                  {viewingMember.email}
                </span>
                <span>
                  <Phone size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                  {viewingMember.phone}
                </span>
              </div>
            </div>

            <h5
              style={{
                fontSize: '14px',
                fontWeight: 700,
                color: 'var(--gray-800)',
                marginBottom: '10px'
              }}
            >
              Currently Borrowed Books ({viewingMember.active_issues?.length || 0})
            </h5>

            {viewingMember.active_issues && viewingMember.active_issues.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {viewingMember.active_issues.map((issue) => (
                  <div
                    key={issue.id}
                    style={{
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-md)',
                      padding: '12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <strong style={{ display: 'block', color: 'var(--gray-900)' }}>
                        {issue.title}
                      </strong>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        ISBN: {issue.isbn} &bull; Due: {issue.due_date}
                      </span>
                    </div>
                    <span className="badge badge-warning">Issued</span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                This member currently has no borrowed books.
              </p>
            )}
          </div>
        )}
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => !isDeleting && setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Member"
        message={`Are you sure you want to remove member "${deleteTarget?.name}"? You will not be able to delete if they currently have active book issues.`}
        confirmText="Delete Member"
        isLoading={isDeleting}
        isDanger={true}
      />
    </div>
  );
};

export default Members;
