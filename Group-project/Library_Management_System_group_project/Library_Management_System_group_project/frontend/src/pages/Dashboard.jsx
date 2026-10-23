import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  Users,
  Repeat,
  AlertTriangle,
  CheckCircle2,
  Library,
  ArrowRight,
  Plus
} from 'lucide-react';
import api from '../api/api';
import StatCard from '../components/StatCard';

const Dashboard = ({ setCurrentTab, openIssueModal, openAddBookModal, openAddMemberModal, notify }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [returningId, setReturningId] = useState(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.getStats();
      if (res.success) {
        setStats(res.data);
      }
    } catch (err) {
      notify('error', 'Error loading dashboard', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleQuickReturn = async (issueId, bookTitle) => {
    try {
      setReturningId(issueId);
      const res = await api.returnBook(issueId);
      if (res.success) {
        notify('success', 'Book Returned', res.message);
        fetchStats();
      }
    } catch (err) {
      notify('error', 'Return Failed', err.message);
    } finally {
      setReturningId(null);
    }
  };

  if (loading && !stats) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        <p>Loading real-time library data...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Stat Cards Grid */}
      <div className="stats-grid">
        <StatCard
          label="Total Book Titles"
          value={stats?.totalBooks ?? 0}
          subtext="Catalogued unique titles"
          icon={BookOpen}
          color="indigo"
        />
        <StatCard
          label="Available Copies"
          value={stats?.availableCopies ?? 0}
          subtext={`Out of ${stats?.totalCopies ?? 0} total copies`}
          icon={CheckCircle2}
          color="emerald"
        />
        <StatCard
          label="Currently Issued"
          value={stats?.issuedBooks ?? 0}
          subtext="Active borrowings"
          icon={Repeat}
          color="amber"
        />
        <StatCard
          label="Total Members"
          value={stats?.totalMembers ?? 0}
          subtext="Registered patrons"
          icon={Users}
          color="purple"
        />
        <StatCard
          label="Overdue Books"
          value={stats?.overdueBooks ?? 0}
          subtext="Past agreed return date"
          icon={AlertTriangle}
          color={stats?.overdueBooks > 0 ? 'rose' : 'emerald'}
        />
      </div>

      {/* Quick Action Bar */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '28px',
          flexWrap: 'wrap'
        }}
      >
        <button
          className="btn btn-primary"
          onClick={() => {
            if (openIssueModal) openIssueModal();
            else setCurrentTab('issues');
          }}
        >
          <Repeat size={16} /> Issue Book to Member
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => {
            if (openAddBookModal) openAddBookModal();
            else setCurrentTab('books');
          }}
        >
          <Plus size={16} /> Add New Book
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => {
            if (openAddMemberModal) openAddMemberModal();
            else setCurrentTab('members');
          }}
        >
          <Plus size={16} /> Register Member
        </button>
      </div>

      {/* Dashboard Main Grid: Recent Activity + Category Breakdown */}
      <div className="dashboard-grid">
        {/* Recent Transactions */}
        <div className="card">
          <div className="card-header">
            <div className="card-title-group">
              <h3>Recent Book Issues & Returns</h3>
              <p>Latest circulation activities across all library members</p>
            </div>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setCurrentTab('issues')}
            >
              View All <ArrowRight size={14} />
            </button>
          </div>

          <div className="card-body p-0">
            {stats?.recentIssues && stats.recentIssues.length > 0 ? (
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Book Title</th>
                      <th>Borrower</th>
                      <th>Issue Date</th>
                      <th>Due Date</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentIssues.map((item) => {
                      const isReturned = item.status === 'returned';
                      const isOverdue = Boolean(item.is_overdue);

                      return (
                        <tr key={item.id}>
                          <td>
                            <strong style={{ display: 'block', color: 'var(--gray-900)' }}>
                              {item.book_title}
                            </strong>
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                              {item.book_category}
                            </span>
                          </td>
                          <td>
                            <div style={{ fontWeight: 500 }}>{item.member_name}</div>
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                              {item.member_email}
                            </span>
                          </td>
                          <td style={{ whiteSpace: 'nowrap' }}>{item.issue_date}</td>
                          <td style={{ whiteSpace: 'nowrap' }}>{item.due_date}</td>
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
                            {!isReturned && (
                              <button
                                className="btn btn-secondary btn-sm"
                                disabled={returningId === item.id}
                                onClick={() => handleQuickReturn(item.id, item.book_title)}
                              >
                                {returningId === item.id ? 'Returning...' : 'Mark Return'}
                              </button>
                            )}
                            {isReturned && (
                              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                {item.return_date ? `Returned ${item.return_date}` : 'Closed'}
                              </span>
                            )}
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
                  <Library size={28} />
                </div>
                <h4>No Circulation Activity Yet</h4>
                <p>Issue books to members to see real-time circulation activity here.</p>
              </div>
            )}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="card">
          <div className="card-header">
            <div className="card-title-group">
              <h3>Books by Category</h3>
              <p>Inventory distribution across genres</p>
            </div>
          </div>
          <div className="card-body">
            {stats?.categoryBreakdown && stats.categoryBreakdown.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {stats.categoryBreakdown.map((cat, idx) => {
                  const total = Number(cat.total_copies) || 1;
                  const available = Number(cat.available_copies) || 0;
                  const percentAvailable = Math.round((available / total) * 100);

                  return (
                    <div key={idx} style={{ paddingBottom: '12px', borderBottom: '1px solid var(--gray-100)' }}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          marginBottom: '6px',
                          fontSize: '13px'
                        }}
                      >
                        <span style={{ fontWeight: 600, color: 'var(--gray-800)' }}>
                          {cat.category}
                        </span>
                        <span style={{ color: 'var(--text-muted)' }}>
                          <strong>{available}</strong> / {total} available ({percentAvailable}%)
                        </span>
                      </div>
                      <div className="stock-bar-track" style={{ width: '100%', height: '8px' }}>
                        <div
                          className="stock-bar-fill"
                          style={{
                            width: `${percentAvailable}%`,
                            backgroundColor:
                              percentAvailable > 50
                                ? 'var(--success)'
                                : percentAvailable > 20
                                ? 'var(--warning)'
                                : 'var(--danger)'
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty-state">
                <p>No category data found.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
