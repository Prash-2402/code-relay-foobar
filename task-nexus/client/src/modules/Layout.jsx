import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../modules/context/AuthContext';
import { useTheme } from '../modules/context/ThemeContext';
import { useNotifications } from '../modules/context/NotificationContext';
import { LayoutDashboard, Building2, LogOut, User, Sun, Moon, Bell } from 'lucide-react';
import Modal from './UI/Modal';

export default function Layout() {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const { notifications, unreadCount, markAsRead } = useNotifications();
    const [showNotifications, setShowNotifications] = useState(false);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="app-layout">
            <aside className="sidebar glass">
                <div className="sidebar-header">
                    <h1 className="sidebar-logo">Task<span className="text-primary">Nexus</span></h1>
                </div>

                <nav className="sidebar-nav">
                    <NavLink to="/dashboard" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        <LayoutDashboard size={20} /><span>Dashboard</span>
                    </NavLink>
                    <NavLink to="/dashboard/workspaces" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        <Building2 size={20} /><span>Workspaces</span>
                    </NavLink>
                    <button className="nav-link" onClick={() => setShowNotifications(true)}>
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <Bell size={20} />
                            <span>Notifications</span>
                            {unreadCount > 0 && <span className="badge-count">{unreadCount}</span>}
                        </div>
                    </button>
                </nav>

                <div className="sidebar-footer">
                    <div className="user-info">
                        <div className="user-avatar"><User size={18} /></div>
                        <div className="user-details">
                            <span className="user-name">{user?.username || user?.data?.username || 'User'}</span>
                            <span className="user-email">{user?.email || user?.data?.email || ''}</span>
                        </div>
                    </div>

                    <button className="btn-ghost logout-btn" onClick={toggleTheme}>
                        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                        <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                    </button>

                    <button className="btn-ghost logout-btn" onClick={handleLogout}>
                        <LogOut size={18} /><span>Logout</span>
                    </button>
                </div>
            </aside>

            <main className="main-content">
                <Outlet />
            </main>

            <Modal
                isOpen={showNotifications}
                onClose={() => setShowNotifications(false)}
                title="Notifications"
            >
                <div className="notifications-list">
                    {notifications.length === 0 ? (
                        <p className="text-muted text-center">No notifications yet</p>
                    ) : (
                        notifications.map(notif => (
                            <div
                                key={notif.id}
                                className={`notification-item ${!notif.read_status ? 'unread' : ''}`}
                                onClick={() => markAsRead(notif.id)}
                            >
                                <div className="indicator"></div>
                                <div className="notif-content">
                                    <p>{notif.message}</p>
                                    <span className="notif-time">{new Date(notif.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </Modal>

            <style>{`
                .badge-count {
                    background: var(--danger);
                    color: white;
                    font-size: 0.7rem;
                    padding: 0.1rem 0.4rem;
                    border-radius: 1rem;
                    margin-left: auto;
                }
                .notification-item {
                    padding: 1rem;
                    border-bottom: 1px solid var(--border);
                    cursor: pointer;
                    display: flex;
                    gap: 1rem;
                    transition: background 0.2s;
                }
                .notification-item:hover {
                    background: var(--glass-hover);
                }
                .notification-item.unread {
                    background: hsla(var(--primary), 0.05);
                }
                .notification-item.unread .indicator {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: var(--primary);
                    margin-top: 6px;
                }
                .notif-time {
                    font-size: 0.8rem;
                    color: var(--text-muted);
                    margin-top: 0.25rem;
                    display: block;
                }
            `}</style>
        </div>
    );
}
