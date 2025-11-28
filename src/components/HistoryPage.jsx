import React, { useState, useEffect } from 'react';
import { db } from '../lib/db';
import { Trash2, Trophy } from 'lucide-react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import toast from 'react-hot-toast';
import { getBestSet } from '../lib/fitness';

export function HistoryPage() {
    const [workouts, setWorkouts] = useState([]);
    const [filter, setFilter] = useState('');

    useEffect(() => {
        migrateOldData();
        loadWorkouts();
    }, []);

    const migrateOldData = async () => {
        const oldData = localStorage.getItem('workoutData_v2');
        if (oldData) {
            try {
                const parsed = JSON.parse(oldData);
                if (parsed.workouts && parsed.workouts.length > 0) {
                    const existing = await db.getWorkouts();
                    if (existing.length === 0) {
                        for (const workout of parsed.workouts) {
                            await db.addWorkout(workout);
                        }
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
        setWorkouts(data.reverse());
    };

    const handleDelete = async (id) => {
        await db.deleteWorkout(id);
        loadWorkouts();
        toast.success('已删除');
    };

    const filteredWorkouts = workouts.filter(w => {
        if (!filter) return true;
        const lower = filter.toLowerCase();

        const date = new Date(w.date);
        const dateStr = date.toLocaleDateString();
        const isoDate = w.date.split('T')[0];
        const year = date.getFullYear().toString();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');

        return w.exercise.toLowerCase().includes(lower) ||
            dateStr.includes(filter) ||
            isoDate.includes(filter) ||
            `${year}/${month}/${day}`.includes(filter) ||
            `${year}-${month}-${day}`.includes(filter) ||
            `${month}/${day}`.includes(filter);
    });

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
        // Swipeable history item component
    };
    const SwipeableHistoryItem = ({ workout }) => {
        const x = useMotionValue(0);
        const background = useTransform(
            x,
            [-100, 0],
            ['rgba(220, 38, 38, 0.3)', 'transparent']
        );

        const bestSet = getBestSet(workout.sets);

        return (
            <motion.div
                style={{
                    x,
                    background,
                    position: 'relative',
                    marginBottom: '12px',
                    borderRadius: '12px'
                }}
                drag="x"
                dragConstraints={{ left: -100, right: 0 }}
                dragElastic={0.2}
                onDragEnd={(e, { offset }) => {
                    if (offset.x < -80) {
                        if (confirm('确定删除这条记录吗？')) {
                            handleDelete(workout.id);
                        }
                    }
                }}
            >
                <div className="card history-item">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <div className="history-date">
                                {new Date(workout.date).toLocaleDateString()} {new Date(workout.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <div className="history-exercise">{workout.exercise}</div>
                        </div>
                        {bestSet && (
                            <div className="tag" style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
                                <Trophy size={12} className="inline mr-1" />
                                1RM {bestSet.oneRM}kg
                            </div>
                        )}
                    </div>
                    <div className="history-sets">
                        {workout.sets.map((s, i) => (
                            <span key={i} className="tag">{s.weight}kg × {s.reps}</span>
                        ))}
                    </div>
                    <button
                        className="btn-icon"
                        style={{ position: 'absolute', top: '10px', right: '10px', opacity: 0 }} // Hidden but clickable if needed, or rely on swipe
                        onClick={() => handleDelete(workout.id)}
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
                <div style={{
                    position: 'absolute',
                    right: '20px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'white',
                    fontWeight: 'bold',
                    pointerEvents: 'none',
                    opacity: 0.7
                }}>
                    ← 滑动删除
                </div>
            </motion.div>
        );
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
                        filteredWorkouts.map(w => <SwipeableHistoryItem key={w.id} workout={w} />)
                    )}
                </div>
            </div>
        </div>
    );
}
