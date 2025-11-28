// ========================================
// 数据管理
// ========================================
class WorkoutDB {
    constructor() {
        this.storageKey = 'workoutData';
        this.data = this.loadData();
    }

    loadData() {
        const stored = localStorage.getItem(this.storageKey);
        return stored ? JSON.parse(stored) : { workouts: [], settings: { theme: 'light' } };
    }

    saveData() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.data));
    }

    addWorkout(workout) {
        workout.id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
        workout.date = new Date().toISOString();
        this.data.workouts.unshift(workout);
        this.saveData();
        return workout;
    }

    getWorkouts() {
        return this.data.workouts;
    }

    deleteWorkout(id) {
        this.data.workouts = this.data.workouts.filter(w => w.id !== id);
        this.saveData();
    }

    updateWorkout(id, updates) {
        const index = this.data.workouts.findIndex(w => w.id === id);
        if (index !== -1) {
            this.data.workouts[index] = { ...this.data.workouts[index], ...updates };
            this.saveData();
        }
    }

    getSetting(key) {
        return this.data.settings[key];
    }

    setSetting(key, value) {
        this.data.settings[key] = value;
        this.saveData();
    }

    exportData() {
        return JSON.stringify(this.data, null, 2);
    }

    importData(jsonString) {
        try {
            const imported = JSON.parse(jsonString);
            if (imported.workouts && Array.isArray(imported.workouts)) {
                this.data = imported;
                this.saveData();
                return true;
            }
        } catch (e) {
            return false;
        }
        return false;
    }

    clearAll() {
        this.data = { workouts: [], settings: { theme: this.data.settings.theme } };
        this.saveData();
    }

    getStorageSize() {
        const size = new Blob([this.exportData()]).size;
        return size < 1024 ? size + ' B' : (size / 1024).toFixed(2) + ' KB';
    }
}

// ========================================
// 应用状态
// ========================================
class App {
    constructor() {
        this.db = new WorkoutDB();
        this.currentPage = 'record';
        this.timer = {
            seconds: 90,
            remaining: 90,
            interval: null,
            isRunning: false
        };
        this.charts = {
            volume: null,
            progress: null
        };
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.applyTheme();
        this.updateStorageInfo();
        this.setupDeleteButtons();
    }

    setupDeleteButtons() {
        // 为初始的第一组添加删除事件
        const container = document.getElementById('sets-container');
        container.addEventListener('click', (e) => {
            if (e.target.classList.contains('delete-set-btn')) {
                const setItem = e.target.closest('.set-item');
                this.deleteSet(setItem);
            }
        });
    }

    // ========================================
    // 事件监听
    // ========================================
    setupEventListeners() {
        // 导航
        document.querySelectorAll('.nav-item').forEach(btn => {
            btn.addEventListener('click', () => this.switchPage(btn.dataset.page));
        });

        // 主题切换
        const themeToggle = document.getElementById('theme-toggle');
        const darkModeToggle = document.getElementById('dark-mode-toggle');

        themeToggle.addEventListener('click', () => this.toggleTheme());
        darkModeToggle.addEventListener('change', () => this.toggleTheme());

        // 表单提交
        const workoutForm = document.getElementById('workout-form');
        workoutForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveWorkout();
        });

        // 添加组
        document.getElementById('add-set-btn').addEventListener('click', () => this.addSet());

        // 倒计时器
        document.getElementById('timer-start').addEventListener('click', () => this.startTimer());
        document.getElementById('timer-pause').addEventListener('click', () => this.pauseTimer());
        document.getElementById('timer-reset').addEventListener('click', () => this.resetTimer());

        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.timer.seconds = parseInt(btn.dataset.seconds);
                this.timer.remaining = this.timer.seconds;
                this.updateTimerDisplay();
            });
        });

        // 搜索
        document.getElementById('search-input').addEventListener('input', (e) => {
            this.filterHistory(e.target.value);
        });

        // 排序
        document.getElementById('sort-toggle').addEventListener('click', () => {
            this.toggleSort();
        });

        // 统计周期
        document.querySelectorAll('.period-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.updateStats(btn.dataset.period);
            });
        });

        // 动作选择器
        document.getElementById('exercise-select').addEventListener('change', (e) => {
            this.updateProgressChart(e.target.value);
        });

        // 设置
        document.getElementById('export-data').addEventListener('click', () => this.exportData());
        document.getElementById('import-data').addEventListener('click', () => {
            document.getElementById('import-file').click();
        });
        document.getElementById('import-file').addEventListener('change', (e) => this.importData(e));
        document.getElementById('clear-data').addEventListener('click', () => this.clearData());
    }

    // ========================================
    // 页面切换
    // ========================================
    switchPage(pageName) {
        // 更新导航
        document.querySelectorAll('.nav-item').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.page === pageName);
        });

        // 更新页面
        document.querySelectorAll('.page').forEach(page => {
            page.classList.toggle('active', page.id === `page-${pageName}`);
        });

        this.currentPage = pageName;

        // 页面特定操作
        if (pageName === 'history') {
            this.renderHistory();
        } else if (pageName === 'stats') {
            this.updateStats('week');
        } else if (pageName === 'settings') {
            this.updateStorageInfo();
        }
    }

    // ========================================
    // 主题管理
    // ========================================
    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);

        const themeIcon = document.querySelector('.theme-icon');
        themeIcon.textContent = newTheme === 'dark' ? '☀️' : '🌙';

        const darkModeToggle = document.getElementById('dark-mode-toggle');
        darkModeToggle.checked = newTheme === 'dark';

        this.db.setSetting('theme', newTheme);

        // 更新图表颜色
        if (this.currentPage === 'stats') {
            this.updateStats(document.querySelector('.period-btn.active').dataset.period);
        }
    }

    applyTheme() {
        const theme = this.db.getSetting('theme') || 'light';
        document.documentElement.setAttribute('data-theme', theme);

        const themeIcon = document.querySelector('.theme-icon');
        themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';

        const darkModeToggle = document.getElementById('dark-mode-toggle');
        darkModeToggle.checked = theme === 'dark';
    }

    // ========================================
    // 训练记录
    // ========================================
    addSet() {
        const container = document.getElementById('sets-container');
        const setCount = container.querySelectorAll('.set-item').length + 1;

        const setItem = document.createElement('div');
        setItem.className = 'set-item';
        setItem.innerHTML = `
            <div class="set-header">
                <div class="set-number">第 ${setCount} 组</div>
                <button type="button" class="delete-set-btn" title="删除此组">🗑️</button>
            </div>
            <div class="set-inputs">
                <div class="input-group">
                    <input type="number" class="set-weight" placeholder="重量" step="0.5" min="0" required>
                    <span class="unit">kg</span>
                </div>
                <div class="input-group">
                    <input type="number" class="set-reps" placeholder="次数" min="1" required>
                    <span class="unit">次</span>
                </div>
            </div>
        `;

        container.appendChild(setItem);
    }

    deleteSet(setItem) {
        const container = document.getElementById('sets-container');
        const setItems = container.querySelectorAll('.set-item');

        // 至少保留一组
        if (setItems.length <= 1) {
            this.showToast('⚠️ 至少需要保留一组');
            return;
        }

        setItem.remove();

        // 重新编号
        this.updateSetNumbers();
    }

    updateSetNumbers() {
        const setItems = document.querySelectorAll('.set-item');
        setItems.forEach((item, index) => {
            const setNumber = item.querySelector('.set-number');
            setNumber.textContent = `第 ${index + 1} 组`;
        });
    }

    saveWorkout() {
        const exercise = document.getElementById('exercise-name').value.trim();
        const notes = document.getElementById('notes').value.trim();

        const setItems = document.querySelectorAll('.set-item');
        const sets = Array.from(setItems).map(item => ({
            weight: parseFloat(item.querySelector('.set-weight').value),
            reps: parseInt(item.querySelector('.set-reps').value)
        }));

        if (!exercise || sets.length === 0) {
            this.showToast('请填写完整信息');
            return;
        }

        const workout = { exercise, sets, notes };
        this.db.addWorkout(workout);

        this.showToast('✅ 记录已保存');
        this.resetForm();
    }

    resetForm() {
        document.getElementById('workout-form').reset();

        // 保留第一组，删除其他
        const container = document.getElementById('sets-container');
        const setItems = container.querySelectorAll('.set-item');
        for (let i = 1; i < setItems.length; i++) {
            setItems[i].remove();
        }
    }

    // ========================================
    // 历史记录
    // ========================================
    renderHistory(filter = '') {
        const workouts = this.db.getWorkouts();
        const historyList = document.getElementById('history-list');

        if (workouts.length === 0) {
            historyList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📝</div>
                    <p>还没有训练记录</p>
                    <p class="empty-hint">点击下方"记录"开始你的第一次训练</p>
                </div>
            `;
            return;
        }

        // 过滤
        const filtered = filter
            ? workouts.filter(w => w.exercise.toLowerCase().includes(filter.toLowerCase()))
            : workouts;

        if (filtered.length === 0) {
            historyList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🔍</div>
                    <p>没有找到匹配的记录</p>
                </div>
            `;
            return;
        }

        // 按日期分组
        const grouped = this.groupByDate(filtered);

        historyList.innerHTML = Object.keys(grouped).map(date => `
            <div class="history-date">${this.formatDate(date)}</div>
            ${grouped[date].map(workout => this.renderWorkoutCard(workout)).join('')}
        `).join('');

        // 添加删除事件
        historyList.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (confirm('确定删除这条记录吗？')) {
                    this.db.deleteWorkout(btn.dataset.id);
                    this.renderHistory(filter);
                    this.showToast('记录已删除');
                }
            });
        });
    }

    groupByDate(workouts) {
        const grouped = {};
        workouts.forEach(workout => {
            const date = workout.date.split('T')[0];
            if (!grouped[date]) grouped[date] = [];
            grouped[date].push(workout);
        });
        return grouped;
    }

    renderWorkoutCard(workout) {
        const time = new Date(workout.date).toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit'
        });

        return `
            <div class="workout-card">
                <div class="workout-header">
                    <div>
                        <div class="workout-title">${workout.exercise}</div>
                        <div class="workout-time">${time}</div>
                    </div>
                    <div class="workout-actions">
                        <button class="action-btn delete-btn" data-id="${workout.id}">🗑️</button>
                    </div>
                </div>
                <div class="workout-sets">
                    ${workout.sets.map((set, i) => `
                        <span class="set-badge">${i + 1}组: ${set.weight}kg × ${set.reps}次</span>
                    `).join('')}
                </div>
                ${workout.notes ? `<div class="workout-notes">💭 ${workout.notes}</div>` : ''}
            </div>
        `;
    }

    filterHistory(query) {
        this.renderHistory(query);
    }

    toggleSort() {
        // 简单实现：反转当前列表
        this.db.data.workouts.reverse();
        this.renderHistory();
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (dateString === today.toISOString().split('T')[0]) {
            return '今天';
        } else if (dateString === yesterday.toISOString().split('T')[0]) {
            return '昨天';
        } else {
            return date.toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }
    }

    // ========================================
    // 倒计时器
    // ========================================
    startTimer() {
        if (this.timer.isRunning) return;

        this.timer.isRunning = true;
        document.getElementById('timer-start').disabled = true;
        document.getElementById('timer-pause').disabled = false;
        document.querySelector('.timer-display').classList.add('running');

        this.timer.interval = setInterval(() => {
            this.timer.remaining--;
            this.updateTimerDisplay();

            if (this.timer.remaining <= 0) {
                this.timerComplete();
            }
        }, 1000);
    }

    pauseTimer() {
        this.timer.isRunning = false;
        clearInterval(this.timer.interval);
        document.getElementById('timer-start').disabled = false;
        document.getElementById('timer-pause').disabled = true;
        document.querySelector('.timer-display').classList.remove('running');
    }

    resetTimer() {
        this.pauseTimer();
        this.timer.remaining = this.timer.seconds;
        this.updateTimerDisplay();
    }

    timerComplete() {
        this.pauseTimer();
        this.timer.remaining = this.timer.seconds;
        this.updateTimerDisplay();

        // 震动提醒
        if ('vibrate' in navigator) {
            navigator.vibrate([200, 100, 200]);
        }

        // 音频提醒（简单的beep）
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 800;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);

        this.showToast('⏰ 休息时间结束！');
    }

    updateTimerDisplay() {
        const minutes = Math.floor(this.timer.remaining / 60);
        const seconds = this.timer.remaining % 60;
        const display = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        document.getElementById('timer-display').textContent = display;
    }

    // ========================================
    // 统计数据
    // ========================================
    updateStats(period) {
        const workouts = this.getWorkoutsInPeriod(period);

        // 更新统计卡片
        document.getElementById('total-workouts').textContent = workouts.length;

        const totalSets = workouts.reduce((sum, w) => sum + w.sets.length, 0);
        document.getElementById('total-sets').textContent = totalSets;

        const exerciseCounts = {};
        workouts.forEach(w => {
            exerciseCounts[w.exercise] = (exerciseCounts[w.exercise] || 0) + 1;
        });

        const favorite = Object.keys(exerciseCounts).length > 0
            ? Object.keys(exerciseCounts).reduce((a, b) =>
                exerciseCounts[a] > exerciseCounts[b] ? a : b)
            : '-';

        document.getElementById('favorite-exercise').textContent = favorite;

        // 更新图表
        this.updateVolumeChart(workouts);
        this.populateExerciseSelect();
    }

    getWorkoutsInPeriod(period) {
        const workouts = this.db.getWorkouts();
        const now = new Date();

        if (period === 'all') return workouts;

        const days = period === 'week' ? 7 : 30;
        const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

        return workouts.filter(w => new Date(w.date) >= cutoff);
    }

    updateVolumeChart(workouts) {
        const canvas = document.getElementById('volume-chart');
        const ctx = canvas.getContext('2d');

        // 按日期统计训练量
        const dailyVolume = {};
        workouts.forEach(w => {
            const date = w.date.split('T')[0];
            const volume = w.sets.reduce((sum, set) => sum + (set.weight * set.reps), 0);
            dailyVolume[date] = (dailyVolume[date] || 0) + volume;
        });

        const sortedDates = Object.keys(dailyVolume).sort();
        const labels = sortedDates.map(d => new Date(d).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }));
        const data = sortedDates.map(d => dailyVolume[d]);

        if (this.charts.volume) {
            this.charts.volume.destroy();
        }

        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const textColor = isDark ? '#cbd5e1' : '#64748b';
        const gridColor = isDark ? '#334155' : '#e2e8f0';

        this.charts.volume = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: '训练量 (kg)',
                    data: data,
                    backgroundColor: 'rgba(99, 102, 241, 0.6)',
                    borderColor: 'rgba(99, 102, 241, 1)',
                    borderWidth: 2,
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { color: textColor },
                        grid: { color: gridColor }
                    },
                    x: {
                        ticks: { color: textColor },
                        grid: { color: gridColor }
                    }
                }
            }
        });
    }

    populateExerciseSelect() {
        const workouts = this.db.getWorkouts();
        const exercises = [...new Set(workouts.map(w => w.exercise))];

        const select = document.getElementById('exercise-select');
        select.innerHTML = '<option value="">选择动作...</option>' +
            exercises.map(ex => `<option value="${ex}">${ex}</option>`).join('');

        if (exercises.length > 0 && !select.value) {
            select.value = exercises[0];
            this.updateProgressChart(exercises[0]);
        }
    }

    updateProgressChart(exercise) {
        if (!exercise) return;

        const workouts = this.db.getWorkouts()
            .filter(w => w.exercise === exercise)
            .reverse();

        const labels = workouts.map((w, i) => `第${i + 1}次`);
        const maxWeights = workouts.map(w => Math.max(...w.sets.map(s => s.weight)));
        const maxReps = workouts.map(w => Math.max(...w.sets.map(s => s.reps)));

        const canvas = document.getElementById('progress-chart');
        const ctx = canvas.getContext('2d');

        if (this.charts.progress) {
            this.charts.progress.destroy();
        }

        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const textColor = isDark ? '#cbd5e1' : '#64748b';
        const gridColor = isDark ? '#334155' : '#e2e8f0';

        this.charts.progress = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: '最大重量 (kg)',
                        data: maxWeights,
                        borderColor: 'rgba(99, 102, 241, 1)',
                        backgroundColor: 'rgba(99, 102, 241, 0.1)',
                        borderWidth: 3,
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: '最大次数',
                        data: maxReps,
                        borderColor: 'rgba(236, 72, 153, 1)',
                        backgroundColor: 'rgba(236, 72, 153, 0.1)',
                        borderWidth: 3,
                        tension: 0.4,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        labels: { color: textColor }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { color: textColor },
                        grid: { color: gridColor }
                    },
                    x: {
                        ticks: { color: textColor },
                        grid: { color: gridColor }
                    }
                }
            }
        });
    }

    // ========================================
    // 设置
    // ========================================
    exportData() {
        const data = this.db.exportData();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `workout-data-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        this.showToast('✅ 数据导出成功');
    }

    importData(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const success = this.db.importData(e.target.result);
            if (success) {
                this.showToast('✅ 数据导入成功');
                this.renderHistory();
                this.updateStorageInfo();
            } else {
                this.showToast('❌ 数据格式错误');
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    }

    clearData() {
        if (confirm('确定要清空所有数据吗？此操作不可恢复！')) {
            if (confirm('再次确认：真的要删除所有训练记录吗？')) {
                this.db.clearAll();
                this.renderHistory();
                this.updateStorageInfo();
                this.showToast('所有数据已清空');
            }
        }
    }

    updateStorageInfo() {
        document.getElementById('storage-usage').textContent = this.db.getStorageSize();
    }

    // ========================================
    // Toast 通知
    // ========================================
    showToast(message) {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
}

// ========================================
// 初始化应用
// ========================================
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new App();
});

// PWA支持
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // 注册service worker（可选，需要单独创建sw.js文件）
        // navigator.serviceWorker.register('/sw.js');
    });
}
