import React from 'react';

const StatCard = ({ label, value, subtext, icon: Icon, color = 'indigo' }) => {
  return (
    <div className="stat-card">
      <div className="stat-info">
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value}</div>
        {subtext && <div className="stat-desc">{subtext}</div>}
      </div>
      {Icon && (
        <div className={`stat-icon ${color}`}>
          <Icon size={24} />
        </div>
      )}
    </div>
  );
};

export default StatCard;
