import React, { useState } from 'react';
import './styles/index.css';
import './styles/layout.css';
import './styles/components.css';
import './styles/toast.css';

import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Toast from './components/Toast';

import Dashboard from './pages/Dashboard';
import Books from './pages/Books';
import Members from './pages/Members';
import IssueReturn from './pages/IssueReturn';

function App() {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [toasts, setToasts] = useState([]);

  // Cross-page state for quick issuing
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [preselectedBook, setPreselectedBook] = useState(null);
  const [preselectedMember, setPreselectedMember] = useState(null);

  // Toast notification manager
  const notify = (type, title, message) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Cross-page quick actions
  const handleQuickIssue = (book) => {
    setPreselectedBook(book);
    setPreselectedMember(null);
    setIsIssueModalOpen(true);
    setCurrentTab('issues');
  };

  const handleQuickIssueToMember = (member) => {
    setPreselectedBook(null);
    setPreselectedMember(member);
    setIsIssueModalOpen(true);
    setCurrentTab('issues');
  };

  const handleOpenGeneralIssue = () => {
    setPreselectedBook(null);
    setPreselectedMember(null);
    setIsIssueModalOpen(true);
    setCurrentTab('issues');
  };

  return (
    <div className="app-container">
      {/* Toast Notification Container */}
      <Toast toasts={toasts} removeToast={removeToast} />

      {/* Navigation Sidebar */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Main Content Area */}
      <div className="main-wrapper">
        <Header currentTab={currentTab} setMobileOpen={setMobileOpen} />

        <main className="content-body">
          {currentTab === 'dashboard' && (
            <Dashboard
              setCurrentTab={setCurrentTab}
              openIssueModal={handleOpenGeneralIssue}
              openAddBookModal={() => setCurrentTab('books')}
              openAddMemberModal={() => setCurrentTab('members')}
              notify={notify}
            />
          )}

          {currentTab === 'books' && (
            <Books notify={notify} onQuickIssue={handleQuickIssue} />
          )}

          {currentTab === 'members' && (
            <Members
              notify={notify}
              onQuickIssueToMember={handleQuickIssueToMember}
            />
          )}

          {currentTab === 'issues' && (
            <IssueReturn
              notify={notify}
              isIssueModalOpen={isIssueModalOpen}
              setIsIssueModalOpen={setIsIssueModalOpen}
              preselectedBook={preselectedBook}
              preselectedMember={preselectedMember}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
