import React from 'react';
import { Dumbbell, Calendar, TrendingUp, Settings } from 'lucide-react';

export function Navbar({ activePage, onNavigate }) {
    const navItems = [
        { id: 'record', icon: Dumbbell, label: '记录' },
        { id: 'history', icon: Calendar, label: '历史' },
        { id: 'stats', icon: TrendingUp, label: '统计' },
        { id: 'settings', icon: Settings, label: '设置' },
    ];

    return (
        <nav className="bottom-nav">
            {navItems.map((item) => (
                <button
                    key={item.id}
                    className={`nav-item ${activePage === item.id ? 'active' : ''}`}
                    onClick={() => onNavigate(item.id)}
                >
                    <item.icon size={24} className="nav-icon" />
                    <span>{item.label}</span>
                </button>
            ))}
        </nav>
    );
}
