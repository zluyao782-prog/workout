import React, { useState, useEffect } from 'react';
import { db } from '../lib/db';
import { Trash2 } from 'lucide-react';

export function HistoryPage() {
    const [workouts, setWorkouts] = useState([]);
    const [filter, setFilter] = useState('');

    useEffect(() => {
        loadWorkouts();
    }, []);

    const loadWorkouts = async () => {
        const data = await db.getWorkouts();
        // IndexedDB returns sorted by index (date), but usually ascending. We want descending.
        setWorkouts(data.reverse());
    };

    const handleDelete = async (id) => {
        if (confirm('确定删除这条记录吗？')) {
            await db.deleteWorkout(id);
            loadWorkouts();
        }
    };

    const filteredWorkouts = workouts.filter(w => {
        if (!filter) return true;
        const lower = filter.toLowerCase();
        const dateStr = new Date(w.date).toLocaleDateString();
        return w.exercise.toLowerCase().includes(lower) || dateStr.includes(lower);
    });

    // Heatmap Logic
    const renderHeatmap = () => {
        const map = {};
        workouts.forEach(w => {
            const date = w.date.split('T')[0];
            map[date] = (map[date] || 0) + 1;
        });

        const cells = [];
        const today = new Date();
        for (let i = 90; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const count = map[dateStr] || 0;
            let activeClass = '';
            if (count > 0) activeClass = `active-${Math.min(count, 4)}`;

            cells.push(
                <div
                    key={dateStr}
                    className={`heatmap-cell ${activeClass}`}
                    title={`${dateStr}: ${count} 次训练`}
                />
            );
        }
        return cells;
    };

    return (
        <div className="page active">
            <div className="container">
                <header className="page-header">
                    <h1>HISTORY</h1>
                    <input
                        type="text"
                        placeholder="搜索..."
                        value={filter}
                        onChange={e => setFilter(e.target.value)}
                        style={{ padding: '8px', fontSize: '14px', width: '150px' }}
                    />
                </header>

                <div className="card">
                    <h3>训练频率 (近90天)</h3>
                    <div className="heatmap-container">
                        {renderHeatmap()}
                    </div>
                </div>

                <div className="history-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {filteredWorkouts.length === 0 ? (
                        <div className="text-center" style={{ padding: '40px', color: 'var(--text-muted)' }}>
                            暂无记录
                        </div>
                    ) : (
                        filteredWorkouts.map(w => (
                            <div key={w.id} className="card history-item">
                                <div className="history-date">
                                    {new Date(w.date).toLocaleDateString()} {new Date(w.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                                <div className="history-exercise">{w.exercise}</div>
                                <div className="history-sets">
                                    {w.sets.map((s, i) => (
                                        <span key={i} className="tag">{s.weight}kg × {s.reps}</span>
                                    ))}
                                </div>
                                <button
                                    className="btn-icon"
                                    style={{ position: 'absolute', top: '10px', right: '10px' }}
                                    onClick={() => handleDelete(w.id)}
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
