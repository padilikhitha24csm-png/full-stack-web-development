import { useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';
import { APPLICATION_STATUSES } from '../config/resources.jsx';
import { formatDate, statusClass } from '../utils/helpers';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api.list('students'),
      api.list('companies'),
      api.list('jobs'),
      api.list('applications'),
    ])
      .then(([students, companies, jobs, applications]) =>
        setData({ students, companies, jobs, applications })
      )
      .catch((err) => setError(err.message));
  }, []);

  const stats = useMemo(() => {
    if (!data) return null;
    const { students, companies, jobs, applications } = data;

    const placedIds = new Set(
      applications.filter((a) => a.status === 'Selected').map((a) => String(a.studentId))
    );
    const placed = placedIds.size;

    const statusCounts = APPLICATION_STATUSES.map((status) => ({
      status,
      count: applications.filter((a) => a.status === status).length,
    }));
    const maxStatus = Math.max(1, ...statusCounts.map((s) => s.count));

    const topCompanies = companies
      .map((c) => ({
        id: c.id,
        name: c.name,
        count: jobs.filter((j) => String(j.companyId) === String(c.id)).length,
      }))
      .filter((c) => c.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    const maxCompany = Math.max(1, ...topCompanies.map((c) => c.count));

    const findById = (list, id) => list.find((x) => String(x.id) === String(id));
    const recent = [...applications]
      .sort((a, b) => (b.appliedDate || '').localeCompare(a.appliedDate || ''))
      .slice(0, 5)
      .map((a) => ({
        ...a,
        studentName: findById(students, a.studentId)?.name ?? 'Unknown',
        jobTitle: findById(jobs, a.jobId)?.title ?? 'Unknown',
      }));

    const avgCgpa = students.length
      ? (students.reduce((sum, s) => sum + Number(s.cgpa || 0), 0) / students.length).toFixed(2)
      : '0.00';

    return {
      totalStudents: students.length,
      totalCompanies: companies.length,
      openJobs: jobs.filter((j) => j.status === 'Open').length,
      totalApplications: applications.length,
      placed,
      placementRate: students.length ? Math.round((placed / students.length) * 100) : 0,
      avgCgpa,
      statusCounts,
      maxStatus,
      topCompanies,
      maxCompany,
      recent,
    };
  }, [data]);

  if (error) {
    return (
      <div className="page">
        <h1>Dashboard</h1>
        <div className="alert alert-error" style={{ marginTop: 16 }}>
          {error}. Make sure JSON Server is running (<code>npm run server</code>).
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="page">
        <h1>Dashboard</h1>
        <div className="loading">Loading placement statistics…</div>
      </div>
    );
  }

  const cards = [
    { label: 'Total Students', value: stats.totalStudents, sub: `Avg CGPA ${stats.avgCgpa}`, accent: '#4f46e5' },
    { label: 'Recruiting Companies', value: stats.totalCompanies, sub: 'Registered partners', accent: '#0ea5e9' },
    { label: 'Open Job Postings', value: stats.openJobs, sub: 'Currently accepting applications', accent: '#f59e0b' },
    { label: 'Total Applications', value: stats.totalApplications, sub: 'Across all jobs', accent: '#8b5cf6' },
  ];

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Placement Dashboard</h1>
          <p className="muted">Overview of recruitment activity and placement progress</p>
        </div>
      </header>

      <section className="stats-grid">
        {cards.map((card) => (
          <div key={card.label} className="card stat-card" style={{ '--accent': card.accent }}>
            <div className="stat-label">{card.label}</div>
            <div className="stat-value">{card.value}</div>
            <div className="stat-sub">{card.sub}</div>
          </div>
        ))}

        <div className="card stat-card" style={{ '--accent': '#16a34a' }}>
          <div className="stat-label">Placement Rate</div>
          <div className="stat-value">{stats.placementRate}%</div>
          <div className="stat-sub">
            {stats.placed} of {stats.totalStudents} students placed
          </div>
          <div className="progress">
            <div className="progress-fill" style={{ width: `${stats.placementRate}%` }} />
          </div>
        </div>
      </section>

      <section className="dashboard-grid">
        <div className="card panel">
          <h2 className="section-title">Application Pipeline</h2>
          {stats.statusCounts.map(({ status, count }) => (
            <div key={status} className="bar-row">
              <span>{status}</span>
              <div className="bar-track">
                <div
                  className="bar-fill"
                  style={{ width: `${(count / stats.maxStatus) * 100}%` }}
                />
              </div>
              <strong>{count}</strong>
            </div>
          ))}
        </div>

        <div className="card panel">
          <h2 className="section-title">Top Hiring Companies</h2>
          {stats.topCompanies.length === 0 ? (
            <p className="muted">No job postings yet.</p>
          ) : (
            stats.topCompanies.map((company) => (
              <div key={company.id} className="bar-row">
                <span>{company.name}</span>
                <div className="bar-track">
                  <div
                    className="bar-fill"
                    style={{ width: `${(company.count / stats.maxCompany) * 100}%` }}
                  />
                </div>
                <strong>{company.count}</strong>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="card panel">
        <h2 className="section-title">Recent Applications</h2>
        {stats.recent.length === 0 ? (
          <p className="muted">No applications yet.</p>
        ) : (
          <div className="table-wrap">
            <table className="table-compact">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Job Title</th>
                  <th>Applied On</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {stats.recent.map((a) => (
                  <tr key={a.id}>
                    <td>{a.studentName}</td>
                    <td>{a.jobTitle}</td>
                    <td>{formatDate(a.appliedDate)}</td>
                    <td>
                      <span className={statusClass(a.status)}>{a.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
