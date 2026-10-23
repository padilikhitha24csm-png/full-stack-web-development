import { BrowserRouter, NavLink, Route, Routes } from 'react-router-dom';
import Dashboard from './pages/Dashboard.jsx';
import CrudPage from './components/CrudPage.jsx';
import {
  studentsConfig,
  companiesConfig,
  jobsConfig,
  applicationsConfig,
} from './config/resources.jsx';

const navItems = [
  { to: '/', label: 'Dashboard' },
  { to: '/students', label: 'Students' },
  { to: '/companies', label: 'Companies' },
  { to: '/jobs', label: 'Job Opportunities' },
  { to: '/applications', label: 'Applications' },
];

export default function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <aside className="sidebar">
          <div className="brand">
            <span className="brand-logo">CP</span>
            <div>
              <div className="brand-title">Campus Placement</div>
              <div className="brand-sub">Management System</div>
            </div>
          </div>

          <nav className="nav">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="sidebar-footer">v1.0 · JSON Server backend</div>
        </aside>

        <main className="content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/students" element={<CrudPage config={studentsConfig} />} />
            <Route path="/companies" element={<CrudPage config={companiesConfig} />} />
            <Route path="/jobs" element={<CrudPage config={jobsConfig} />} />
            <Route path="/applications" element={<CrudPage config={applicationsConfig} />} />
            <Route path="*" element={<div className="page"><h1>Page not found</h1></div>} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
