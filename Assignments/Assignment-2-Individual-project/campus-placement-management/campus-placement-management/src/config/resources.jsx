import { formatDate, statusClass, today } from '../utils/helpers';

export const DEPARTMENTS = ['CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL'];
export const JOB_TYPES = ['Full-time', 'Internship'];
export const JOB_STATUSES = ['Open', 'Closed'];
export const APPLICATION_STATUSES = ['Applied', 'Shortlisted', 'Interview', 'Selected', 'Rejected'];

const Badge = ({ value }) => <span className={statusClass(value)}>{value}</span>;

const sameId = (a, b) => String(a) === String(b);
const isOtherRecord = (item, editing) => !editing || !sameId(item.id, editing.id);

const isPlaced = (student, ctx) =>
  ctx.list('applications').some((a) => sameId(a.studentId, student.id) && a.status === 'Selected');

/* ---------------- Students ---------------- */
export const studentsConfig = {
  singular: 'Student',
  title: 'Students',
  subtitle: 'Manage student profiles and academic details',
  resource: 'students',
  refs: ['applications'],
  columns: [
    { key: 'name', label: 'Name' },
    { key: 'rollNo', label: 'Roll No' },
    { key: 'department', label: 'Department' },
    { key: 'cgpa', label: 'CGPA' },
    { key: 'graduationYear', label: 'Batch' },
    { key: 'email', label: 'Email' },
    {
      key: 'placement',
      label: 'Placement',
      value: (row, ctx) => (isPlaced(row, ctx) ? 'Placed' : 'Not Placed'),
      render: (row, ctx) => <Badge value={isPlaced(row, ctx) ? 'Placed' : 'Not Placed'} />,
    },
  ],
  fields: [
    { name: 'name', label: 'Full Name', required: true },
    { name: 'rollNo', label: 'Roll Number', required: true },
    { name: 'email', label: 'Email', type: 'email', required: true },
    { name: 'phone', label: 'Phone', type: 'tel' },
    { name: 'department', label: 'Department', type: 'select', options: DEPARTMENTS, required: true },
    { name: 'cgpa', label: 'CGPA (out of 10)', type: 'number', min: 0, max: 10, step: 0.01, required: true },
    { name: 'graduationYear', label: 'Graduation Year', type: 'number', min: 2000, max: 2040, step: 1, required: true },
    { name: 'skills', label: 'Skills (comma separated)', wide: true },
  ],
  validate: (form, { items, editing }) => {
    const errors = {};
    const roll = String(form.rollNo || '').trim().toLowerCase();
    if (roll && items.some((s) => s.rollNo?.toLowerCase() === roll && isOtherRecord(s, editing))) {
      errors.rollNo = 'This roll number already exists';
    }
    return errors;
  },
  deleteGuard: (row, ctx) =>
    ctx.list('applications').some((a) => sameId(a.studentId, row.id))
      ? 'This student has job applications. Remove those applications first.'
      : null,
};

/* ---------------- Companies ---------------- */
export const companiesConfig = {
  singular: 'Company',
  title: 'Companies',
  subtitle: 'Recruiting companies and their HR contacts',
  resource: 'companies',
  refs: ['jobs'],
  columns: [
    { key: 'name', label: 'Company' },
    { key: 'industry', label: 'Industry' },
    { key: 'location', label: 'Location' },
    { key: 'contactPerson', label: 'Contact Person' },
    { key: 'email', label: 'Email' },
    {
      key: 'openings',
      label: 'Job Postings',
      value: (row, ctx) => ctx.list('jobs').filter((j) => sameId(j.companyId, row.id)).length,
    },
  ],
  fields: [
    { name: 'name', label: 'Company Name', required: true },
    { name: 'industry', label: 'Industry', required: true },
    { name: 'location', label: 'Location', required: true },
    { name: 'website', label: 'Website', type: 'url' },
    { name: 'contactPerson', label: 'HR Contact Person', required: true },
    { name: 'email', label: 'HR Email', type: 'email', required: true },
    { name: 'phone', label: 'Phone', type: 'tel' },
  ],
  validate: (form, { items, editing }) => {
    const errors = {};
    const name = String(form.name || '').trim().toLowerCase();
    if (name && items.some((c) => c.name?.toLowerCase() === name && isOtherRecord(c, editing))) {
      errors.name = 'A company with this name already exists';
    }
    return errors;
  },
  deleteGuard: (row, ctx) =>
    ctx.list('jobs').some((j) => sameId(j.companyId, row.id))
      ? 'This company has job postings. Delete those jobs first.'
      : null,
};

/* ---------------- Jobs ---------------- */
export const jobsConfig = {
  singular: 'Job',
  title: 'Job Opportunities',
  subtitle: 'Job and internship postings from recruiting companies',
  resource: 'jobs',
  refs: ['companies', 'applications'],
  filter: { key: 'status', label: 'Status', options: JOB_STATUSES },
  columns: [
    { key: 'title', label: 'Job Title' },
    {
      key: 'company',
      label: 'Company',
      value: (row, ctx) => ctx.get('companies', row.companyId)?.name ?? '—',
    },
    { key: 'jobType', label: 'Type' },
    { key: 'location', label: 'Location' },
    {
      key: 'packageLpa',
      label: 'Package',
      render: (row) => `${row.packageLpa} LPA`,
    },
    { key: 'minCgpa', label: 'Min CGPA' },
    {
      key: 'deadline',
      label: 'Deadline',
      render: (row) => formatDate(row.deadline),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <Badge value={row.status} />,
    },
  ],
  fields: [
    { name: 'title', label: 'Job Title', required: true },
    { name: 'companyId', label: 'Company', type: 'select', source: 'companies', optionLabel: (c) => c.name, required: true },
    { name: 'jobType', label: 'Job Type', type: 'select', options: JOB_TYPES, required: true },
    { name: 'location', label: 'Location', required: true },
    { name: 'packageLpa', label: 'Package (LPA)', type: 'number', min: 0, max: 200, step: 0.1, required: true },
    { name: 'minCgpa', label: 'Minimum CGPA', type: 'number', min: 0, max: 10, step: 0.1, required: true },
    { name: 'deadline', label: 'Application Deadline', type: 'date', required: true },
    { name: 'status', label: 'Status', type: 'select', options: JOB_STATUSES, required: true, defaultValue: 'Open' },
    { name: 'description', label: 'Description', type: 'textarea', wide: true },
  ],
  deleteGuard: (row, ctx) =>
    ctx.list('applications').some((a) => sameId(a.jobId, row.id))
      ? 'Students have applied to this job. Remove those applications first.'
      : null,
};

/* ---------------- Applications ---------------- */
export const applicationsConfig = {
  singular: 'Application',
  title: 'Placement Applications',
  subtitle: 'Track student applications through the recruitment pipeline',
  resource: 'applications',
  refs: ['students', 'jobs', 'companies'],
  filter: { key: 'status', label: 'Status', options: APPLICATION_STATUSES },
  columns: [
    {
      key: 'student',
      label: 'Student',
      value: (row, ctx) => ctx.get('students', row.studentId)?.name ?? '—',
    },
    {
      key: 'job',
      label: 'Job Title',
      value: (row, ctx) => ctx.get('jobs', row.jobId)?.title ?? '—',
    },
    {
      key: 'company',
      label: 'Company',
      value: (row, ctx) => {
        const job = ctx.get('jobs', row.jobId);
        return (job && ctx.get('companies', job.companyId)?.name) || '—';
      },
    },
    {
      key: 'appliedDate',
      label: 'Applied On',
      render: (row) => formatDate(row.appliedDate),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <Badge value={row.status} />,
    },
  ],
  fields: [
    {
      name: 'studentId',
      label: 'Student',
      type: 'select',
      source: 'students',
      optionLabel: (s) => `${s.name} (${s.rollNo})`,
      required: true,
    },
    {
      name: 'jobId',
      label: 'Job',
      type: 'select',
      source: 'jobs',
      optionLabel: (j) => j.title,
      required: true,
    },
    { name: 'appliedDate', label: 'Applied On', type: 'date', required: true, defaultValue: today() },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      options: APPLICATION_STATUSES,
      required: true,
      defaultValue: 'Applied',
    },
    { name: 'remarks', label: 'Remarks', type: 'textarea', wide: true },
  ],
  validate: (form, { items, editing }) => {
    const errors = {};
    const duplicate = items.some(
      (a) =>
        sameId(a.studentId, form.studentId) &&
        sameId(a.jobId, form.jobId) &&
        isOtherRecord(a, editing)
    );
    if (form.studentId && form.jobId && duplicate) {
      errors.jobId = 'This student has already applied to this job';
    }
    return errors;
  },
};
