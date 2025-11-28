import React, { useState, useEffect } from 'react';
import { db } from '../lib/db';
import toast from 'react-hot-toast';
import { Download, Trash2, Zap } from 'lucide-react';

export function SettingsPage() {
    const [autoTimer, setAutoTimer] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        const settings = await db.getSettings();
        setAutoTimer(settings.autoTimer);
    };

    const toggleAutoTimer = async () => {
        const newValue = !autoTimer;
        await db.saveSetting('autoTimer', newValue);
        setAutoTimer(newValue);
        toast.success(newValue ? '✅ 已开启自动倒计时' : '❌ 已关闭自动倒计时');
    };

    const exportData = async () => {
        const data = await db.exportData();
        const dataStr = JSON.stringify(data, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `workout_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success('导出成功');
    };

    const clearData = async () => {
        if (confirm("确定要清空所有数据吗？此操作不可恢复！")) {
            await db.clearData();
            location.reload();
        }
    };

    return (
        <div className="page active">
            <div className="container">
                <header className="page-header">
                    <h1>SETTINGS</h1>
                </header>

                <div className="card">
                    <h2 className="flex items-center gap-2">
                        <Zap size={20} className="text-yellow-400" />
                        偏好设置
                    </h2>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #27272a' }}>
                        <div>
                            <div style={{ fontWeight: 600 }}>自动倒计时</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                完成动作后自动开始休息计时
                            </div>
                        </div>
                        <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '50px', height: '24px' }}>
                            <input
                                type="checkbox"
                                checked={autoTimer}
                                onChange={toggleAutoTimer}
                                style={{ opacity: 0, width: 0, height: 0 }}
                            />
                            <span style={{
                                position: 'absolute',
                                cursor: 'pointer',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                backgroundColor: autoTimer ? 'var(--primary)' : '#3a3a3a',
                                transition: '0.3s',
                                borderRadius: '24px'
                            }}>
                                <span style={{
                                    position: 'absolute',
                                    content: '',
                                    height: '18px',
                                    width: '18px',
                                    left: autoTimer ? '26px' : '3px',
                                    bottom: '3px',
                                    backgroundColor: 'white',
                                    transition: '0.3s',
                                    borderRadius: '50%'
                                }}></span>
                            </span>
                        </label>
                    </div>
                </div>

                <div className="card">
                    <h2 className="flex items-center gap-2">
                        <Download size={20} className="text-sky-400" />
                        数据管理
                    </h2>
                    <button className="btn btn-secondary" style={{ width: '100%', marginBottom: '8px' }} onClick={exportData}>
                        <Download size={18} className="inline mr-2" />
                        导出数据 (JSON)
                    </button>
                    <button className="btn btn-secondary" style={{ width: '100%', marginBottom: '8px' }} disabled>
                        导入数据 (开发中)
                    </button>
                    <button
                        className="btn btn-secondary"
                        style={{ width: '100%', color: 'var(--danger)', borderColor: 'var(--danger)' }}
                        onClick={clearData}
                    >
                        <Trash2 size={18} className="inline mr-2" />
                        清空所有数据
                    </button>
                </div>

                <div className="text-center" style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '32px' }}>
                    Workout Pro v3.0 (React + IndexedDB)<br />
                    Designed for Gains
                </div>
            </div>
        </div>
    );
}