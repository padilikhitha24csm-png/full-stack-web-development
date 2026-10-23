import React from 'react';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  Repeat,
  Library,
  Database,
  X
} from 'lucide-react';

const Sidebar = ({ currentTab, setCurrentTab, mobileOpen, setMobileOpen }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'books', label: 'Books Catalog', icon: BookOpen },
    { id: 'members', label: 'Library Members', icon: Users },
    { id: 'issues', label: 'Issue & Return', icon: Repeat }
  ];

  const handleNavClick = (tabId) => {
    setCurrentTab(tabId);
    if (setMobileOpen) {
      setMobileOpen(false);
    }
  };

  return (
    <>
      <div
        className={`mobile-backdrop ${mobileOpen ? 'mobile-open' : ''}`}
        onClick={() => setMobileOpen(false)}
      />

      <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <div className="brand-icon-box">
            <Library size={22} />
          </div>
          <div className="brand-text">
            <h1>BiblioTech</h1>
            <span>Library Admin</span>
          </div>
          {setMobileOpen && (
            <button
              className="btn btn-icon btn-secondary mobile-menu-btn"
              style={{ marginLeft: 'auto', border: 'none', color: '#fff' }}
              onClick={() => setMobileOpen(false)}
            >
              <X size={18} />
            </button>
          )}
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-title">Navigation</div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => handleNavClick(item.id)}
              >
                <Icon className="icon" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="db-status-pill">
            <span className="status-dot" />
            <div>
              <strong style={{ display: 'block', color: '#fff', fontSize: '11px' }}>
                MySQL Database
              </strong>
              <span>Connected & Ready</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
