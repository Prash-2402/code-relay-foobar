import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart3, CheckCircle2, Clock, AlertTriangle, FolderKanban, Building2 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, LabelList } from 'recharts';

import API_BASE from '../config';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function Dashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('nexus_token');
        axios.get(`${API_BASE}/analytics/dashboard`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(response => setStats(response.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return <div className="page-loading"><div className="spinner"></div><p>Loading analytics...</p></div>;
    }

    const statCards = [
        { label: 'Total Tasks', value: stats?.totalTasks || 0, icon: BarChart3, color: '#3B82F6' },
        { label: 'Completed', value: stats?.completedTasks || 0, icon: CheckCircle2, color: '#10B981' },
        { label: 'In Progress', value: stats?.inProgressTasks || 0, icon: Clock, color: '#F59E0B' },
        { label: 'Overdue', value: stats?.overdueTasks || 0, icon: AlertTriangle, color: '#EF4444' },
        { label: 'Projects', value: stats?.totalProjects || 0, icon: FolderKanban, color: '#8B5CF6' },
        { label: 'Workspaces', value: stats?.totalWorkspaces || 0, icon: Building2, color: '#06B6D4' },
    ];

    // Process data for Recharts
    const statusData = stats?.tasksByStatus?.map(item => ({
        name: item.status.replace('_', ' '),
        value: item.count
    })) || [];

    const priorityData = stats?.tasksByPriority?.map(item => ({
        name: item.priority,
        count: item.count
    })) || [];

    return (
        <div className="dashboard-page fade-in">
            <div className="page-header">
                <div>
                    <h2>Dashboard</h2>
                    <p className="text-muted">Real-time overview of your workspace</p>
                </div>
                <div className="badge">Updated Now</div>
            </div>

            <div className="stats-grid">
                {statCards.map((card) => (
                    <div key={card.label} className="stat-card glass">
                        <div className="stat-icon" style={{ backgroundColor: `${card.color}20`, color: card.color }}>
                            <card.icon size={22} />
                        </div>
                        <div className="stat-info">
                            <span className="stat-value">{card.value}</span>
                            <span className="stat-label">{card.label}</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="dashboard-charts">
                {/* Status Distribution */}
                <div className="chart-card glass">
                    <h3>Task Distribution</h3>
                    <div style={{ width: '100%', height: 300 }}>
                        {statusData.length > 0 ? (
                            <ResponsiveContainer>
                                <PieChart>
                                    <Pie
                                        data={statusData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    >
                                        {statusData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'var(--glass)', borderRadius: '8px', border: '1px solid var(--border)' }}
                                        itemStyle={{ color: 'var(--text)' }}
                                    />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex-center text-muted h-full">No task data available</div>
                        )}
                    </div>
                </div>

                {/* Priority Breakdown */}
                <div className="chart-card glass">
                    <h3>Tasks by Priority</h3>
                    <div style={{ width: '100%', height: 300 }}>
                        {priorityData.length > 0 ? (
                            <ResponsiveContainer>
                                <BarChart data={priorityData}>
                                    <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        cursor={{ fill: 'var(--glass-hover)' }}
                                        contentStyle={{ backgroundColor: 'var(--glass)', borderRadius: '8px', border: '1px solid var(--border)' }}
                                        itemStyle={{ color: 'var(--text)' }}
                                    />
                                    <Bar dataKey="count" fill="#8884d8" radius={[4, 4, 0, 0]}>
                                        {priorityData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                        <LabelList dataKey="count" position="top" fill="var(--text)" fontSize={12} />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex-center text-muted h-full">No priority data available</div>
                        )}
                    </div>
                </div>
            </div>

            <style>{`
                .flex-center { display: flex; align-items: center; justify-content: center; }
                .h-full { height: 100%; }
            `}</style>
        </div>
    );
}
