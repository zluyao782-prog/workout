import React, { useState, useEffect } from 'react';
import { db } from '../lib/db';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import toast from 'react-hot-toast';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

export function StatsPage() {
    const [stats, setStats] = useState({ count: 0, volume: 0 });
    const [weightData, setWeightData] = useState([]);
    const [weightInput, setWeightInput] = useState('');

    useEffect(() => {
        updateStats();
    }, []);

    const updateStats = async () => {
        const workouts = await db.getWorkouts();
        const count = workouts.length;
        const volume = workouts.reduce((sum, w) =>
            sum + w.sets.reduce((s, set) => s + (set.weight * set.reps), 0), 0);

        setStats({ count, volume: (volume / 1000).toFixed(1) });
        setWeightData(await db.getBodyMetrics());
    };

    const saveWeight = async () => {
        const val = parseFloat(weightInput);
        if (!val || val <= 0) return toast.error('请输入有效体重');

        await db.addBodyMetric(val);
        setWeightInput('');
        updateStats();
        toast.success('体重已记录');
    };

    const chartData = {
        labels: weightData.map(d => new Date(d.date).toLocaleDateString()),
        datasets: [
            {
                label: '体重 (kg)',
                data: weightData.map(d => d.weight),
                borderColor: '#22c55e',
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                tension: 0.4,
                fill: true,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
        },
        scales: {
            x: { display: false },
            y: {
                grid: { color: '#27272a' },
                ticks: { color: '#a1a1aa' }
            }
        }
    };

    const [bfInputs, setBfInputs] = useState({ age: '', gender: 'male', height: '', weight: '' });
    const [bodyFatResult, setBodyFatResult] = useState(null);

    const calculateBodyFat = () => {
        const { age, gender, height, weight } = bfInputs;
        if (!age || !height || !weight) return toast.error('请填写完整信息');

        const h = parseFloat(height) / 100; // cm to m
        const w = parseFloat(weight);
        const a = parseFloat(age);

        if (h <= 0 || w <= 0 || a <= 0) return toast.error('请输入有效数值');

        const bmi = w / (h * h);
        const genderVal = gender === 'male' ? 1 : 0;

        // Formula: (1.20 × BMI) + (0.23 × Age) - (10.8 × Gender) - 5.4
        let bf = (1.20 * bmi) + (0.23 * a) - (10.8 * genderVal) - 5.4;

        // Sanity check
        if (bf < 0) bf = 0;

        setBodyFatResult(bf.toFixed(1));
        toast.success('计算完成');
    };

    const getBodyFatRanges = (gender) => {
        if (gender === 'male') {
            return [
                { label: '运动员', range: '6-13%', min: 6, max: 13.9, color: '#3b82f6' },
                { label: '健身', range: '14-17%', min: 14, max: 17.9, color: '#22c55e' },
                { label: '普通', range: '18-24%', min: 18, max: 24.9, color: '#eab308' },
                { label: '肥胖', range: '>25%', min: 25, max: 100, color: '#ef4444' },
            ];
        } else {
            return [
                { label: '运动员', range: '14-20%', min: 14, max: 20.9, color: '#3b82f6' },
                { label: '健身', range: '21-24%', min: 21, max: 24.9, color: '#22c55e' },
                { label: '普通', range: '25-31%', min: 25, max: 31.9, color: '#eab308' },
                { label: '肥胖', range: '>32%', min: 32, max: 100, color: '#ef4444' },
            ];
        }
    };

    return (
        <div className="page active">
            <div className="container">
                <header className="page-header">
                    <h1>STATS</h1>
                </header>

                <div className="stats-grid">
                    <div className="stat-box">
                        <div className="stat-value">{stats.count}</div>
                        <div className="stat-label">总训练次</div>
                    </div>
                    <div className="stat-box">
                        <div className="stat-value">{stats.volume}</div>
                        <div className="stat-label">总容量 (吨)</div>
                    </div>
                </div>

                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h3>体重趋势</h3>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                        <input
                            type="number"
                            placeholder="输入体重 (kg)"
                            style={{ flex: 1 }}
                            value={weightInput}
                            onChange={e => setWeightInput(e.target.value)}
                        />
                        <button className="btn btn-primary" style={{ width: 'auto', padding: '0 20px' }} onClick={saveWeight}>
                            记录
                        </button>
                    </div>

                    <div style={{ height: '200px' }}>
                        {weightData.length > 0 ? (
                            <Line data={chartData} options={chartOptions} />
                        ) : (
                            <div className="text-center" style={{ color: 'var(--text-muted)', paddingTop: '80px' }}>暂无数据</div>
                        )}
                    </div>
                </div>

                {/* Body Fat Calculator */}
                <div className="card">
                    <h3>体脂率计算器 (BMI法)</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '16px' }}>
                        <div className="input-group">
                            <label style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>性别</label>
                            <select
                                value={bfInputs.gender}
                                onChange={e => setBfInputs({ ...bfInputs, gender: e.target.value })}
                                style={{ width: '100%', padding: '12px', background: 'var(--bg-page)', border: '1px solid var(--border)', borderRadius: '8px', color: 'white' }}
                            >
                                <option value="male">男</option>
                                <option value="female">女</option>
                            </select>
                        </div>
                        <div className="input-group">
                            <label style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>年龄</label>
                            <input
                                type="number"
                                placeholder="岁"
                                value={bfInputs.age}
                                onChange={e => setBfInputs({ ...bfInputs, age: e.target.value })}
                            />
                        </div>
                        <div className="input-group">
                            <label style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>身高 (cm)</label>
                            <input
                                type="number"
                                placeholder="cm"
                                value={bfInputs.height}
                                onChange={e => setBfInputs({ ...bfInputs, height: e.target.value })}
                            />
                        </div>
                        <div className="input-group">
                            <label style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>体重 (kg)</label>
                            <input
                                type="number"
                                placeholder="kg"
                                value={bfInputs.weight}
                                onChange={e => setBfInputs({ ...bfInputs, weight: e.target.value })}
                            />
                        </div>
                    </div>

                    <button
                        className="btn btn-primary"
                        style={{ width: '100%', marginTop: '16px' }}
                        onClick={calculateBodyFat}
                    >
                        计算体脂率
                    </button>

                    {bodyFatResult && (
                        <div style={{ marginTop: '16px' }}>
                            <div style={{ padding: '16px', background: 'rgba(34, 197, 94, 0.1)', borderRadius: '12px', textAlign: 'center', border: '1px solid rgba(34, 197, 94, 0.2)', marginBottom: '16px' }}>
                                <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>估算体脂率</div>
                                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#22c55e', marginTop: '4px' }}>
                                    {bodyFatResult}%
                                </div>
                            </div>

                            <h4 style={{ fontSize: '14px', marginBottom: '8px', color: 'var(--text-muted)' }}>
                                {bfInputs.gender === 'male' ? '男性' : '女性'}参考范围
                            </h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {getBodyFatRanges(bfInputs.gender).map((r, i) => {
                                    const val = parseFloat(bodyFatResult);
                                    const isMatch = val >= r.min && val <= r.max;

                                    return (
                                        <div key={i} style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            padding: '8px 12px',
                                            borderRadius: '6px',
                                            background: isMatch ? 'rgba(255,255,255,0.1)' : 'transparent',
                                            border: isMatch ? `1px solid ${r.color}` : '1px solid transparent'
                                        }}>
                                            <span style={{ color: isMatch ? 'white' : 'var(--text-muted)' }}>{r.label}</span>
                                            <span style={{ color: r.color, fontWeight: 'bold' }}>{r.range}</span>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
