import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Building2, Plus, Users, Trash2, ChevronRight, Mail, UserPlus } from 'lucide-react';
import Modal from '../modules/UI/Modal';

import API_BASE from '../config';

export default function Workspaces() {
    const [workspaces, setWorkspaces] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(true);

    // Member Management
    const [selectedWorkspace, setSelectedWorkspace] = useState(null);
    const [members, setMembers] = useState([]);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteStatus, setInviteStatus] = useState('');

    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('nexus_token');
        axios.get(`${API_BASE}/workspaces`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(response => setWorkspaces(response.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!name.trim()) return;
        const token = localStorage.getItem('nexus_token');

        try {
            const response = await axios.post(`${API_BASE}/workspaces`, { name, description }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setWorkspaces([...workspaces, response.data]);
            setName('');
            setDescription('');
            setShowForm(false);
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async (id) => {
        const token = localStorage.getItem('nexus_token');
        try {
            await axios.delete(`${API_BASE}/workspaces/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setWorkspaces(workspaces.filter(w => w.id !== id));
        } catch (err) {
            console.error(err);
        }
    };

    const openMembersModal = async (e, workspace) => {
        e.stopPropagation();
        setSelectedWorkspace(workspace);
        setInviteStatus('');
        fetchMembers(workspace.id);
    };

    const fetchMembers = async (workspaceId) => {
        const token = localStorage.getItem('nexus_token');
        try {
            const res = await axios.get(`${API_BASE}/workspaces/${workspaceId}/members`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMembers(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleInvite = async (e) => {
        e.preventDefault();
        setInviteStatus('sending');
        const token = localStorage.getItem('nexus_token');
        try {
            await axios.post(`${API_BASE}/workspaces/${selectedWorkspace.id}/invite`, { email: inviteEmail }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setInviteStatus('success');
            setInviteEmail('');
            fetchMembers(selectedWorkspace.id); // Refresh list
        } catch (err) {
            console.error(err);
            setInviteStatus('error');
        }
    };

    if (loading) {
        return <div className="page-loading"><div className="spinner"></div><p>Loading workspaces...</p></div>;
    }

    return (
        <div className="page fade-in">
            <div className="page-header">
                <div>
                    <h2>Workspaces</h2>
                    <p className="text-muted">Organize your team projects</p>
                </div>
                <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
                    <Plus size={18} /> New Workspace
                </button>
            </div>

            {showForm && (
                <form onSubmit={handleCreate} className="create-form glass fade-in">
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Workspace name" required />
                    <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (optional)" />
                    <div className="form-actions">
                        <button type="submit" className="btn-primary">Create</button>
                        <button type="button" className="btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                    </div>
                </form>
            )}

            <div className="workspace-grid">
                {workspaces?.map(ws => (
                    <div key={ws.id} className="workspace-card glass" onClick={() => navigate(`/dashboard/workspaces/${ws.id}`)}>
                        <div className="workspace-card-header">
                            <div className="workspace-icon"><Building2 size={24} /></div>
                            <div className="flex-gap-sm">
                                <button
                                    className="btn-icon"
                                    title="Manage Members"
                                    onClick={(e) => openMembersModal(e, ws)}
                                >
                                    <Users size={16} />
                                </button>
                                <button className="btn-icon-danger" onClick={(e) => { e.stopPropagation(); handleDelete(ws.id); }}>
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                        <h3>{ws.name}</h3>
                        <p className="text-muted">{ws.description || 'No description'}</p>
                        <div className="workspace-card-footer">
                            <span className="badge"><Users size={14} /> {ws.role}</span>
                            <ChevronRight size={18} className="text-muted" />
                        </div>
                    </div>
                ))}
            </div>

            <Modal
                isOpen={!!selectedWorkspace}
                onClose={() => setSelectedWorkspace(null)}
                title={selectedWorkspace ? `Members: ${selectedWorkspace.name}` : 'Members'}
            >
                <div className="members-modal-content">
                    <form onSubmit={handleInvite} className="invite-form">
                        <div className="input-group">
                            <Mail size={16} className="input-icon" />
                            <input
                                type="email"
                                value={inviteEmail}
                                onChange={(e) => setInviteEmail(e.target.value)}
                                placeholder="Invite by email..."
                                required
                            />
                        </div>
                        <button type="submit" className="btn-primary" disabled={inviteStatus === 'sending'}>
                            <UserPlus size={16} /> Invite
                        </button>
                    </form>
                    {inviteStatus === 'success' && <p className="text-success text-sm">Invitation sent!</p>}
                    {inviteStatus === 'error' && <p className="text-danger text-sm">Failed to invite user (User not found or already added).</p>}

                    <div className="members-list">
                        <h4>Current Members ({members.length})</h4>
                        {members.map(member => (
                            <div key={member.id} className="member-item">
                                <div className="member-avatar">
                                    {member.username[0].toUpperCase()}
                                </div>
                                <div className="member-info">
                                    <span className="member-name">{member.username} {member.id === selectedWorkspace?.owner_id && '(Owner)'}</span>
                                    <span className="member-email">{member.email}</span>
                                </div>
                                <span className={`role-badge ${member.role}`}>{member.role}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </Modal>

            <style>{`
                .flex-gap-sm { display: flex; gap: 0.5rem; }
                .invite-form { display: flex; gap: 0.5rem; margin-bottom: 1rem; }
                .input-group { position: relative; flex: 1; }
                .input-group input { width: 100%; padding-left: 2.25rem; }
                .input-icon { position: absolute; left: 0.75rem; top: 50%; transform: translateY(-50%); color: var(--text-muted); }
                
                .members-list { margin-top: 1.5rem; }
                .members-list h4 { margin-bottom: 1rem; font-size: 0.9rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
                
                .member-item { display: flex; align-items: center; gap: 1rem; padding: 0.75rem; border-bottom: 1px solid var(--border); }
                .member-item:last-child { border-bottom: none; }
                
                .member-avatar { 
                    width: 32px; height: 32px; background: linear-gradient(135deg, var(--primary), #a855f7); 
                    border-radius: 50%; display: flex; align-items: center; justify-content: center; 
                    color: white; font-weight: 600; font-size: 0.85rem; 
                }
                
                .member-info { flex: 1; display: flex; flex-direction: column; }
                .member-name { font-weight: 500; font-size: 0.95rem; }
                .member-email { font-size: 0.8rem; color: var(--text-muted); }
                
                .role-badge { font-size: 0.75rem; padding: 0.2rem 0.5rem; border-radius: 1rem; text-transform: capitalize; }
                .role-badge.owner { background: hsla(var(--primary), 0.15); color: hsl(var(--primary)); }
                .role-badge.member { background: hsla(var(--text-muted), 0.15); color: var(--text-muted); }
                .text-sm { font-size: 0.85rem; margin-top: 0.5rem; }
            `}</style>
        </div>
    );
}
