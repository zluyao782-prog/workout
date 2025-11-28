import React, { useState, useEffect } from 'react';
import { db } from '../lib/db';
import { Trash2 } from 'lucide-react';

export function HistoryPage() {
    const [workouts, setWorkouts] = useState([]);
    const [filter, setFilter] = useState('');

    useEffect(() => {
        migrateOldData();
        loadWorkouts();
    }, []);

    const migrateOldData = async () => {
        // Try to migrate from LocalStorage v2
        const oldData = localStorage.getItem('workoutData_v2');
        if (oldData) {
            try {
                const parsed = JSON.parse(oldData);
                if (parsed.workouts && parsed.workouts.length > 0) {
                    // Check if data already migrated
                    const existing = await db.getWorkouts();
                    if (existing.length === 0) {
                        // Migrate workouts
                        for (const workout of parsed.workouts) {
                            await db.addWorkout(workout);
                        }
                        // Migrate body metrics
                        if (parsed.bodyMetrics) {
                            for (const metric of parsed.bodyMetrics) {
                                await db.addBodyMetric(metric.weight);
                            }
                        }
                        console.log('✅ 成功迁移旧数据！');
                    }
                }
            } catch (e) {
                console.error('数据迁移失败:', e);
            }
        }
    };

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

        // Format date in multiple ways for better matching
        const date = new Date(w.date);
        const dateStr = date.toLocaleDateString(); // e.g., "2025/11/28"
        const isoDate = w.date.split('T')[0]; // e.g., "2025-11-28"
        const year = date.getFullYear().toString();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');

        // Check if filter matches exercise name or any date format
        return w.exercise.toLowerCase().includes(lower) ||
            dateStr.includes(filter) ||
            isoDate.includes(filter) ||
            `${year}/${month}/${day}`.includes(filter) ||
            `${year}-${month}-${day}`.includes(filter) ||
            `${month}/${day}`.includes(filter);
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
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                        <input
                            type="text"
                            placeholder="搜索动作或日期..."
                            value={filter}
                            onChange={e => setFilter(e.target.value)}
                            style={{ padding: '8px', fontSize: '14px', width: '200px' }}
                        />
                        {filter && (
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                找到 {filteredWorkouts.length} 条记录
                            </span>
                        )}
                    </div>
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
