import React, { useState } from 'react';
import { X, Plus, Trash2, Save } from 'lucide-react';
import toast from 'react-hot-toast';

export function TemplateBuilder({ onSave, onClose, initialTemplate = null }) {
    const [templateName, setTemplateName] = useState(initialTemplate?.name || '');
    const [exercises, setExercises] = useState(
        initialTemplate?.exercises || [{ name: '', sets: 3, reps: 10 }]
    );

    const addExercise = () => {
        setExercises([...exercises, { name: '', sets: 3, reps: 10 }]);
    };

    const removeExercise = (index) => {
        if (exercises.length === 1) {
            return toast.error('至少需要一个动作');
        }
        setExercises(exercises.filter((_, i) => i !== index));
    };

    const updateExercise = (index, field, value) => {
        const updated = [...exercises];
        updated[index][field] = value;
        setExercises(updated);
    };

    const handleSave = () => {
        if (!templateName.trim()) {
            return toast.error('请输入模板名称');
        }

        const hasEmptyExercise = exercises.some(ex => !ex.name.trim());
        if (hasEmptyExercise) {
            return toast.error('请填写所有动作名称');
        }

        const template = {
            id: initialTemplate?.id || `custom_${Date.now()}`,
            name: templateName.trim(),
            exercises: exercises.map(ex => ({
                name: ex.name.trim(),
                sets: parseInt(ex.sets) || 3,
                reps: parseInt(ex.reps) || 10
            }))
        };

        onSave(template);
    };

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0,0,0,0.9)',
                zIndex: 2000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px',
                overflowY: 'auto'
            }}
            onClick={onClose}
        >
            <div
                className="card"
                style={{
                    maxWidth: '500px',
                    width: '100%',
                    maxHeight: '90vh',
                    overflow: 'auto'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2>{initialTemplate ? '编辑模板' : '新建模板'}</h2>
                    <button className="btn-icon" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                {/* Template Name */}
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-muted)' }}>
                        模板名称
                    </label>
                    <input
                        type="text"
                        value={templateName}
                        onChange={(e) => setTemplateName(e.target.value)}
                        placeholder="例如：腿日、手臂日..."
                        style={{ width: '100%' }}
                    />
                </div>

                {/* Exercises */}
                <div style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <label style={{ fontSize: '14px', color: 'var(--text-muted)' }}>动作列表</label>
                        <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '14px' }} onClick={addExercise}>
                            <Plus size={16} className="inline mr-1" />
                            添加动作
                        </button>
                    </div>

                    {exercises.map((ex, idx) => (
                        <div
                            key={idx}
                            className="card"
                            style={{
                                marginBottom: '12px',
                                background: 'var(--bg-body)',
                                padding: '12px',
                                position: 'relative'
                            }}
                        >
                            <button
                                className="btn-icon"
                                style={{ position: 'absolute', top: '8px', right: '8px' }}
                                onClick={() => removeExercise(idx)}
                            >
                                <Trash2 size={16} />
                            </button>

                            <div style={{ marginBottom: '8px' }}>
                                <input
                                    type="text"
                                    value={ex.name}
                                    onChange={(e) => updateExercise(idx, 'name', e.target.value)}
                                    placeholder="动作名称"
                                    style={{ width: '100%' }}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                <div>
                                    <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                                        组数
                                    </label>
                                    <input
                                        type="number"
                                        value={ex.sets}
                                        onChange={(e) => updateExercise(idx, 'sets', e.target.value)}
                                        min="1"
                                        style={{ width: '100%' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                                        次数
                                    </label>
                                    <input
                                        type="number"
                                        value={ex.reps}
                                        onChange={(e) => updateExercise(idx, 'reps', e.target.value)}
                                        min="1"
                                        style={{ width: '100%' }}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>
                        取消
                    </button>
                    <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSave}>
                        <Save size={18} className="inline mr-2" />
                        保存模板
                    </button>
                </div>
            </div>
        </div>
    );
}
