import React, { useState, useEffect } from 'react';
import { db } from '../lib/db';
import { Plus, Save, Clock, RotateCcw, X } from 'lucide-react';
import toast from 'react-hot-toast';

export function RecordPage() {
    const [exercise, setExercise] = useState('');
    const [sets, setSets] = useState([{ weight: '', reps: '' }]);
    const [templates, setTemplates] = useState([]);
    const [activeTemplate, setActiveTemplate] = useState(null);
    const [timer, setTimer] = useState({ seconds: 90, remaining: 90, isRunning: false });

    useEffect(() => {
        const loadTemplates = async () => {
            const t = await db.getTemplates();
            setTemplates(t);
        };
        loadTemplates();

        // Timer interval
        let interval;
        if (timer.isRunning && timer.remaining > 0) {
            interval = setInterval(() => {
                setTimer(prev => {
                    if (prev.remaining <= 1) {
                        toast.success('⏰ 休息结束！', { icon: '🔔' });
                        if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
                        return { ...prev, isRunning: false, remaining: prev.seconds };
                    }
                    return { ...prev, remaining: prev.remaining - 1 };
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [timer.isRunning, timer.remaining]);

    const addSet = () => setSets([...sets, { weight: '', reps: '' }]);

    const removeSet = (index) => {
        const newSets = sets.filter((_, i) => i !== index);
        setSets(newSets.length ? newSets : [{ weight: '', reps: '' }]);
    };

    const updateSet = (index, field, value) => {
        const newSets = [...sets];
        newSets[index][field] = value;
        setSets(newSets);
    };

    const saveWorkout = async () => {
        if (!exercise.trim()) return toast.error('请输入动作名称');

        const validSets = sets.filter(s => s.reps > 0).map(s => ({
            weight: parseFloat(s.weight) || 0,
            reps: parseFloat(s.reps) || 0
        }));

        if (!validSets.length) return toast.error('请至少记录一组数据');

        await db.addWorkout({ exercise: exercise.trim(), sets: validSets });
        toast.success(`✅ 已保存: ${exercise}`);

        // Reset
        setExercise('');
        setSets([{ weight: '', reps: '' }]);
    };

    const loadTemplate = (template) => {
        setActiveTemplate(template);
        toast.success(`选择 "${template.name}" 的动作`);
    };

    const loadExercise = (exerciseData) => {
        setExercise(exerciseData.name);
        setSets(Array(exerciseData.sets).fill(null).map(() => ({
            weight: '',
            reps: exerciseData.reps || ''
        })));
        toast.success(`已加载: ${exerciseData.name}`);
    };

    const closeTemplate = () => {
        setActiveTemplate(null);
    };

    const toggleTimer = () => setTimer(prev => ({ ...prev, isRunning: !prev.isRunning }));
    const resetTimer = () => setTimer(prev => ({ ...prev, isRunning: false, remaining: prev.seconds }));
    const setTimerDuration = (sec) => setTimer({ seconds: sec, remaining: sec, isRunning: false });

    const formatTime = (sec) => {
        const m = Math.floor(sec / 60).toString().padStart(2, '0');
        const s = (sec % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    return (
        <div className="page active">
            <div className="container">
                <header className="page-header">
                    <h1>WORKOUT</h1>
                </header>

                {/* Templates */}
                <div className="template-scroll">
                    {templates.map(t => (
                        <div key={t.id} className="template-card" onClick={() => loadTemplate(t)}>
                            <div className="template-name">{t.name}</div>
                            <div className="template-count">{t.exercises.length} 动作</div>
                        </div>
                    ))}
                    <div className="template-card" style={{ borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center' }} onClick={() => toast('功能开发中...')}>
                        <Plus size={24} />
                    </div>
                </div>

                {/* Template Exercise Modal */}
                {activeTemplate && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.8)',
                        zIndex: 1000,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '20px'
                    }} onClick={closeTemplate}>
                        <div className="card" style={{
                            maxWidth: '400px',
                            width: '100%',
                            maxHeight: '80vh',
                            overflow: 'auto'
                        }} onClick={e => e.stopPropagation()}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <h2>{activeTemplate.name}</h2>
                                <button className="btn-icon" onClick={closeTemplate}>
                                    <X size={20} />
                                </button>
                            </div>
                            <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>
                                选择要训练的动作：
                            </p>
                            {activeTemplate.exercises.map((ex, idx) => (
                                <div
                                    key={idx}
                                    className="card"
                                    style={{
                                        marginBottom: '12px',
                                        cursor: 'pointer',
                                        background: 'var(--bg-body)',
                                        border: '1px solid var(--primary)'
                                    }}
                                    onClick={() => {
                                        loadExercise(ex);
                                        closeTemplate();
                                    }}
                                >
                                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{ex.name}</div>
                                    <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                                        {ex.sets} 组 × {ex.reps} 次
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Form */}
                <div className="card">
                    <div className="workout-header">
                        <input
                            type="text"
                            value={exercise}
                            onChange={e => setExercise(e.target.value)}
                            placeholder="输入动作名称..."
                            list="exercise-list"
                        />
                        <datalist id="exercise-list">
                            <option value="深蹲" />
                            <option value="硬拉" />
                            <option value="卧推" />
                            <option value="推举" />
                            <option value="引体向上" />
                        </datalist>
                    </div>

                    <div className="set-list">
                        {sets.map((set, i) => (
                            <div key={i} className="set-row">
                                <div className="set-index">{i + 1}</div>
                                <div className="set-input-group">
                                    <input
                                        type="number"
                                        value={set.weight}
                                        onChange={e => updateSet(i, 'weight', e.target.value)}
                                        placeholder="0"
                                        step="0.5"
                                    />
                                    <span>kg</span>
                                </div>
                                <div className="set-input-group">
                                    <input
                                        type="number"
                                        value={set.reps}
                                        onChange={e => updateSet(i, 'reps', e.target.value)}
                                        placeholder="0"
                                    />
                                    <span>次</span>
                                </div>
                                <button className="btn-icon" onClick={() => removeSet(i)}><X size={16} /></button>
                            </div>
                        ))}
                    </div>

                    <div style={{ marginTop: '16px', display: 'flex', gap: '10px' }}>
                        <button className="btn btn-secondary" style={{ flex: 1 }} onClick={addSet}>+ 加组</button>
                        <button className="btn btn-primary" style={{ flex: 2 }} onClick={saveWorkout}>完成动作</button>
                    </div>
                </div>

                {/* Timer */}
                <div className="timer-card card">
                    <div className="timer-display">{formatTime(timer.remaining)}</div>
                    <div className="timer-controls">
                        <button className="btn btn-secondary" onClick={toggleTimer}>
                            {timer.isRunning ? '暂停' : '开始计时'}
                        </button>
                        <button className="btn btn-secondary" onClick={resetTimer}>重置</button>
                    </div>
                    <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center', gap: '8px' }}>
                        {[60, 90, 120, 180].map(s => (
                            <button key={s} className="tag" onClick={() => setTimerDuration(s)}>{s}s</button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
