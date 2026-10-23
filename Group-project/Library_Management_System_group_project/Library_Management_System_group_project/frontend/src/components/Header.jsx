import React from 'react';
import { Menu, Calendar } from 'lucide-react';

const TAB_TITLES = {
  dashboard: {
    title: 'Dashboard Overview',
    subtitle: 'Real-time library statistics, recent transactions, and inventory breakdown.'
  },
  books: {
    title: 'Books Management',
    subtitle: 'Add, search, edit, and maintain full catalog inventory and availability.'
  },
  members: {
    title: 'Member Directory',
    subtitle: 'Manage patron memberships, contact information, and active borrowings.'
  },
  issues: {
    title: 'Book Circulation & Issues',
    subtitle: 'Issue books with ACID transactions, track due dates, and process returns.'
  }
};

const Header = ({ currentTab, setMobileOpen }) => {
  const meta = TAB_TITLES[currentTab] || {
    title: 'Library Management System',
    subtitle: 'Manage books, members, and transactions.'
  };

  const todayStr = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <header className="top-header">
      <div className="header-left">
        <button
          className="mobile-menu-btn"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
        <div className="page-titles">
          <h2>{meta.title}</h2>
          <p>{meta.subtitle}</p>
        </div>
      </div>

      <div className="header-right">
        <div className="current-date-badge">
          <Calendar size={15} />
          <span>{todayStr}</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
