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
            </div>
        </div>
    );
}
