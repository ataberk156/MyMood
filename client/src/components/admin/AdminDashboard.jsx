import { useState } from 'react';
import PromptManager from './PromptManager.jsx';
import GameSettings from './GameSettings.jsx';
import RoomsOverview from './RoomsOverview.jsx';

const TABS = [
  { id: 'prompts', label: '📝 Metinler', icon: '📝' },
  { id: 'settings', label: '⚙️ Ayarlar', icon: '⚙️' },
  { id: 'rooms', label: '🎮 Odalar', icon: '🎮' }
];

export default function AdminDashboard({ token, onLogout }) {
  const [activeTab, setActiveTab] = useState('prompts');

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <span>😂</span>
          <span>Admin Panel</span>
        </div>

        <nav className="admin-nav">
          {TABS.map(tab => (
            <button
              key={tab.id}
              className={`admin-nav-item ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <a href="/" className="btn btn-ghost btn-sm">← Oyuna Dön</a>
          <button className="btn btn-danger btn-sm" onClick={onLogout}>🚪 Çıkış</button>
        </div>
      </aside>

      {/* Main content */}
      <main className="admin-main">
        {activeTab === 'prompts' && <PromptManager token={token} />}
        {activeTab === 'settings' && <GameSettings token={token} />}
        {activeTab === 'rooms' && <RoomsOverview token={token} />}
      </main>
    </div>
  );
}
