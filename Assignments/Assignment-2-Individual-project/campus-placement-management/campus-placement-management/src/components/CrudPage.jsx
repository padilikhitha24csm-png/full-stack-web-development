import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';
import Modal from './Modal.jsx';
import { getValue, isValidEmail } from '../utils/helpers';

const NO_REFS = [];

export default function CrudPage({ config }) {
  const {
    singular,
    title,
    subtitle,
    resource,
    columns,
    fields,
    filter,
    validate,
    deleteGuard,
  } = config;
  const refs = config.refs ?? NO_REFS;

  const [items, setItems] = useState([]);
  const [refData, setRefData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const notify = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [main, ...others] = await Promise.all([
        api.list(resource),
        ...refs.map((r) => api.list(r)),
      ]);
      setItems(main);
      setRefData(Object.fromEntries(refs.map((r, i) => [r, others[i]])));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [resource, refs]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Lookup helpers for related records (e.g. student name from studentId)
  const ctx = useMemo(() => {
    const indexes = {};
    Object.entries(refData).forEach(([res, list]) => {
      indexes[res] = Object.fromEntries(list.map((item) => [String(item.id), item]));
    });
    return {
      get: (res, id) => indexes[res]?.[String(id)],
      list: (res) => refData[res] || [],
    };
  }, [refData]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((row) => {
      if (filter && statusFilter !== 'All' && row[filter.key] !== statusFilter) return false;
      if (!q) return true;
      return columns.some((col) => String(getValue(col, row, ctx)).toLowerCase().includes(q));
    });
  }, [items, search, statusFilter, columns, filter, ctx]);

  /* ---------- Form handling ---------- */
  const openAdd = () => {
    setEditing(null);
    setForm(Object.fromEntries(fields.map((f) => [f.name, f.defaultValue ?? ''])));
    setFormErrors({});
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm(Object.fromEntries(fields.map((f) => [f.name, row[f.name] ?? ''])));
    setFormErrors({});
    setModalOpen(true);
  };

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setEditing(null);
  }, []);

  const handleChange = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const validateForm = () => {
    const errors = {};
    fields.forEach((f) => {
      const value = String(form[f.name] ?? '').trim();
      if (f.required && !value) {
        errors[f.name] = `${f.label} is required`;
      } else if (value && f.type === 'email' && !isValidEmail(value)) {
        errors[f.name] = 'Enter a valid email address';
      } else if (value && f.type === 'number') {
        const num = Number(value);
        if (Number.isNaN(num)) errors[f.name] = 'Enter a valid number';
        else if (f.min !== undefined && num < f.min) errors[f.name] = `Must be at least ${f.min}`;
        else if (f.max !== undefined && num > f.max) errors[f.name] = `Must be at most ${f.max}`;
      }
    });
    const extra = validate ? validate(form, { items, editing, ctx }) : {};
    return { ...errors, ...extra };
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const errors = validateForm();
    const cleanErrors = Object.fromEntries(Object.entries(errors).filter(([, v]) => v));
    if (Object.keys(cleanErrors).length) {
      setFormErrors(cleanErrors);
      return;
    }

    const payload = {};
    fields.forEach((f) => {
      const raw = form[f.name];
      if (f.type === 'number') {
        payload[f.name] = raw === '' || raw === undefined ? null : Number(raw);
      } else {
        payload[f.name] = typeof raw === 'string' ? raw.trim() : raw;
      }
    });

    setSaving(true);
    try {
      if (editing) {
        const updated = await api.update(resource, editing.id, payload);
        setItems((prev) =>
          prev.map((r) => (String(r.id) === String(editing.id) ? { ...r, ...updated } : r))
        );
        notify(`${singular} updated successfully`);
      } else {
        const created = await api.create(resource, payload);
        setItems((prev) => [...prev, created]);
        notify(`${singular} added successfully`);
      }
      closeModal();
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  /* ---------- Delete ---------- */
  const handleDelete = async (row) => {
    const blocker = deleteGuard ? deleteGuard(row, ctx) : null;
    if (blocker) {
      notify(blocker, 'error');
      return;
    }
    if (!window.confirm(`Delete this ${singular.toLowerCase()}? This cannot be undone.`)) return;

    try {
      await api.remove(resource, row.id);
      setItems((prev) => prev.filter((r) => String(r.id) !== String(row.id)));
      notify(`${singular} deleted`);
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  /* ---------- Field rendering ---------- */
  const renderInput = (f) => {
    const hasError = Boolean(formErrors[f.name]);
    const common = {
      id: f.name,
      name: f.name,
      value: form[f.name] ?? '',
      onChange: (e) => handleChange(f.name, e.target.value),
      className: `input${hasError ? ' input-invalid' : ''}`,
    };

    if (f.type === 'select') {
      const options = f.source
        ? ctx.list(f.source).map((item) => ({ value: String(item.id), label: f.optionLabel(item) }))
        : f.options.map((o) => ({ value: o, label: o }));
      return (
        <select {...common}>
          <option value="">Select {f.label}</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      );
    }

    if (f.type === 'textarea') {
      return <textarea {...common} rows={3} />;
    }

    return (
      <input
        {...common}
        type={f.type || 'text'}
        min={f.min}
        max={f.max}
        step={f.step}
        placeholder={f.placeholder || ''}
      />
    );
  };

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>{title}</h1>
          <p className="muted">{subtitle}</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openAdd}>
          + Add {singular}
        </button>
      </header>

      <div className="card toolbar">
        <input
          type="search"
          className="input search-input"
          placeholder={`Search ${title.toLowerCase()}...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {filter && (
          <select
            className="input"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All {filter.label}</option>
            {filter.options.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        )}
        <span className="muted count">
          Showing {rows.length} of {items.length} records
        </span>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}. Make sure JSON Server is running (<code>npm run server</code>).
        </div>
      )}

      <div className="card table-card">
        {loading ? (
          <div className="loading">Loading records…</div>
        ) : rows.length === 0 ? (
          <div className="empty">No records found. Try a different search or add a new {singular.toLowerCase()}.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  {columns.map((col) => (
                    <th key={col.key}>{col.label}</th>
                  ))}
                  <th className="actions-col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    {columns.map((col) => (
                      <td key={col.key}>
                        {col.render ? col.render(row, ctx) : getValue(col, row, ctx)}
                      </td>
                    ))}
                    <td className="actions">
                      <button type="button" className="btn btn-sm btn-outline" onClick={() => openEdit(row)}>
                        Edit
                      </button>
                      <button type="button" className="btn btn-sm btn-danger" onClick={() => handleDelete(row)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={modalOpen} title={`${editing ? 'Edit' : 'Add'} ${singular}`} onClose={closeModal}>
        <form onSubmit={handleSubmit} noValidate>
          <div className="form-grid">
            {fields.map((f) => (
              <div key={f.name} className={`form-group${f.wide ? ' full' : ''}`}>
                <label htmlFor={f.name}>
                  {f.label}
                  {f.required && <span className="req">*</span>}
                </label>
                {renderInput(f)}
                {formErrors[f.name] && <small className="error-text">{formErrors[f.name]}</small>}
              </div>
            ))}
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-outline" onClick={closeModal}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : editing ? 'Update' : 'Save'}
            </button>
          </div>
        </form>
      </Modal>

      {toast && <div className={`toast toast-${toast.type}`}>{toast.message}</div>}
    </div>
  );
}
