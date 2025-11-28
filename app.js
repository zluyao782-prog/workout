// ========================================
// 数据管理 (Data Layer)
// ========================================
class WorkoutDB {
    constructor() {
        this.storageKey = 'workoutData_v2';
        this.data = this.loadData();
        this.migrateData(); // 尝试从v1迁移
    }

    loadData() {
        const stored = localStorage.getItem(this.storageKey);
        return stored ? JSON.parse(stored) : {
            workouts: [],
            bodyMetrics: [],
            templates: [
                {
                    id: 'push',
                    name: '推胸日 (Push)',
                    exercises: [
                        { name: '平板卧推', sets: 4, reps: 8 },
                        { name: '哑铃推举', sets: 3, reps: 10 },
                        { name: '侧平举', sets: 3, reps: 12 },
                        { name: '三头下压', sets: 3, reps: 12 }
                    ]
                },
                {
                    id: 'pull',
                    name: '练背日 (Pull)',
                    exercises: [
                        { name: '引体向上', sets: 4, reps: 8 },
                        { name: '杠铃划船', sets: 4, reps: 10 },
                        { name: '面拉', sets: 3, reps: 15 },
                        { name: '二头弯举', sets: 3, reps: 12 }
                    ]
                }
            ],
            settings: { theme: 'dark', autoTimer: false }
        };
    }

    migrateData() {
        const v1Data = localStorage.getItem('workoutData');
        if (v1Data && this.data.workouts.length === 0) {
            try {
                const old = JSON.parse(v1Data);
                if (old.workouts) {
                    this.data.workouts = old.workouts;
                    this.saveData();
                    console.log('Migrated v1 data to v2');
                }
            } catch (e) {
                console.error('Migration failed', e);
            }
        }
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

    addBodyMetric(weight) {
        this.data.bodyMetrics.push({
            date: new Date().toISOString(),
            weight: parseFloat(weight)
        });
        this.data.bodyMetrics.sort((a, b) => new Date(a.date) - new Date(b.date));
        this.saveData();
    }

    getWorkouts() { return this.data.workouts; }
    getBodyMetrics() { return this.data.bodyMetrics; }
    getTemplates() { return this.data.templates; }

    deleteWorkout(id) {
        this.data.workouts = this.data.workouts.filter(w => w.id !== id);
        this.saveData();
    }
}

// ========================================
// 应用逻辑 (App Controller)
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
        this.charts = {};
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.renderHeatmap();
        this.updateStats();
        // 默认添加一组
        this.addSet();
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-item').forEach(btn => {
            btn.addEventListener('click', () => this.switchPage(btn.dataset.page));
        });

        // Form
        document.getElementById('add-set-btn').addEventListener('click', () => this.addSet());
        document.getElementById('save-btn').addEventListener('click', () => this.saveWorkout());

        // Timer
        document.getElementById('timer-toggle').addEventListener('click', () => this.toggleTimer());
        document.getElementById('timer-reset').addEventListener('click', () => this.resetTimer());

        // Settings
        document.getElementById('export-data').addEventListener('click', () => this.exportData());
        document.getElementById('clear-data').addEventListener('click', () => this.clearData());
    }

    switchPage(pageName) {
        document.querySelectorAll('.nav-item').forEach(btn =>
            btn.classList.toggle('active', btn.dataset.page === pageName));

        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
            if (page.id === `page-${pageName}`) {
                page.classList.add('active');
            }
        });

        this.currentPage = pageName;

        if (pageName === 'history') this.renderHistory();
        if (pageName === 'stats') this.updateStats();
    }

    // ========================================
    // 记录功能 (Record)
    // ========================================
    addSet(weight = '', reps = '') {
        const container = document.getElementById('sets-container');
        const index = container.children.length + 1;

        const div = document.createElement('div');
        div.className = 'set-row';
        div.innerHTML = `
            <div class="set-index">${index}</div>
            <div class="set-input-group">
                <input type="number" class="set-weight" placeholder="0" value="${weight}" step="0.5">
                <span>kg</span>
            </div>
            <div class="set-input-group">
                <input type="number" class="set-reps" placeholder="0" value="${reps}">
                <span>次</span>
            </div>
            <button class="btn-icon" onclick="this.parentElement.remove(); app.reindexSets()">✕</button>
        `;
        container.appendChild(div);
    }

    reindexSets() {
        document.querySelectorAll('.set-index').forEach((el, i) => el.textContent = i + 1);
    }

    saveWorkout() {
        const exercise = document.getElementById('exercise-name').value.trim();
        if (!exercise) return this.showToast('请输入动作名称');

        const sets = [];
        document.querySelectorAll('.set-row').forEach(row => {
            const weight = parseFloat(row.querySelector('.set-weight').value) || 0;
            const reps = parseFloat(row.querySelector('.set-reps').value) || 0;
            if (reps > 0) sets.push({ weight, reps });
        });

        if (sets.length === 0) return this.showToast('请至少记录一组数据');

        this.db.addWorkout({ exercise, sets });
        this.showToast(`✅ 已保存: ${exercise}`);

        // 重置表单
        document.getElementById('exercise-name').value = '';
        document.getElementById('sets-container').innerHTML = '';
        this.addSet();
    }

    // ========================================
    // 模板功能 (Templates)
    // ========================================
    startTemplate(id) {
        const template = this.db.getTemplates().find(t => t.id === id);
        if (!template) return;

        if (!confirm(`开始 "${template.name}" 训练？\n这将清空当前未保存的输入。`)) return;

        // 这里简化处理：目前只支持单动作录入，所以我们只取模板的第一个动作演示
        // 完整版应该支持多动作列表
        const firstExercise = template.exercises[0];
        document.getElementById('exercise-name').value = firstExercise.name;

        const container = document.getElementById('sets-container');
        container.innerHTML = '';

        for (let i = 0; i < firstExercise.sets; i++) {
            this.addSet('', firstExercise.reps);
        }

        this.showToast(`已加载模板: ${template.name}`);
    }

    createTemplate() {
        this.showToast('功能开发中... 敬请期待');
    }

    // ========================================
    // 历史 & 热力图 (History & Heatmap)
    // ========================================
    renderHistory() {
        const list = document.getElementById('history-list');
        const workouts = this.db.getWorkouts();

        if (workouts.length === 0) {
            list.innerHTML = '<div class="text-center" style="padding: 40px; color: var(--text-muted)">暂无记录<br>开始你的第一次训练吧！</div>';
            return;
        }

        list.innerHTML = workouts.map(w => `
            <div class="card history-item">
                <div class="history-date">${new Date(w.date).toLocaleDateString()} ${new Date(w.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                <div class="history-exercise">${w.exercise}</div>
                <div class="history-sets">
                    ${w.sets.map(s => `<span class="tag">${s.weight}kg × ${s.reps}</span>`).join('')}
                </div>
                <button class="btn-icon" style="position: absolute; top: 10px; right: 10px;" onclick="app.deleteWorkout('${w.id}')">🗑️</button>
            </div>
        `).join('');
    }

    deleteWorkout(id) {
        if (confirm('确定删除这条记录吗？')) {
            this.db.deleteWorkout(id);
            this.renderHistory();
            this.renderHeatmap(); // 刷新热力图
        }
    }

    renderHeatmap() {
        const container = document.getElementById('heatmap');
        if (!container) return;

        container.innerHTML = '';
        const workouts = this.db.getWorkouts();

        // 生成过去365天的数据映射
        const map = {};
        workouts.forEach(w => {
            const date = w.date.split('T')[0];
            map[date] = (map[date] || 0) + 1;
        });

        // 生成网格 (简化版：只显示最近3个月，约90天)
        const today = new Date();
        for (let i = 89; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const count = map[dateStr] || 0;

            const cell = document.createElement('div');
            cell.className = `heatmap-cell ${count > 0 ? 'active-' + Math.min(count, 4) : ''}`;
            cell.title = `${dateStr}: ${count} 次训练`;
            container.appendChild(cell);
        }
    }

    // ========================================
    // 统计 & 体重 (Stats)
    // ========================================
    updateStats() {
        const workouts = this.db.getWorkouts();
        document.getElementById('total-workouts').textContent = workouts.length;

        const totalVolume = workouts.reduce((sum, w) =>
            sum + w.sets.reduce((s, set) => s + (set.weight * set.reps), 0), 0);
        document.getElementById('total-volume').textContent = (totalVolume / 1000).toFixed(1);

        this.renderWeightChart();
    }

    logBodyMetric() {
        const weight = prompt("请输入当前体重 (kg):");
        if (weight) {
            this.db.addBodyMetric(weight);
            this.updateStats();
            this.showToast('体重记录已更新');
        }
    }

    renderWeightChart() {
        const ctx = document.getElementById('weight-chart');
        if (!ctx) return;

        const data = this.db.getBodyMetrics();
        // 如果没有数据，给个空状态或默认

        if (this.charts.weight) this.charts.weight.destroy();

        this.charts.weight = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.map(d => new Date(d.date).toLocaleDateString()),
                datasets: [{
                    label: '体重 (kg)',
                    data: data.map(d => d.weight),
                    borderColor: '#22c55e',
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { display: false } },
                scales: {
                    x: { display: false },
                    y: { grid: { color: '#27272a' } }
                }
            }
        });
    }

    // ========================================
    // 计时器 (Timer)
    // ========================================
    toggleTimer() {
        if (this.timer.isRunning) {
            clearInterval(this.timer.interval);
            this.timer.isRunning = false;
            document.getElementById('timer-toggle').textContent = '继续';
        } else {
            this.timer.interval = setInterval(() => this.tick(), 1000);
            this.timer.isRunning = true;
            document.getElementById('timer-toggle').textContent = '暂停';
        }
    }

    tick() {
        this.timer.remaining--;
        this.updateTimerDisplay();
        if (this.timer.remaining <= 0) {
            this.timerComplete();
        }
    }

    setTimer(seconds) {
        this.timer.seconds = seconds;
        this.resetTimer();
    }

    resetTimer() {
        clearInterval(this.timer.interval);
        this.timer.isRunning = false;
        this.timer.remaining = this.timer.seconds;
        this.updateTimerDisplay();
        document.getElementById('timer-toggle').textContent = '开始计时';
    }

    updateTimerDisplay() {
        const m = Math.floor(this.timer.remaining / 60).toString().padStart(2, '0');
        const s = (this.timer.remaining % 60).toString().padStart(2, '0');
        document.getElementById('timer-display').textContent = `${m}:${s}`;
    }

    timerComplete() {
        this.resetTimer();
        this.showToast('⏰ 休息结束！');
        if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    }

    // ========================================
    // 工具 (Utils)
    // ========================================
    showToast(msg) {
        const toast = document.getElementById('toast');
        toast.textContent = msg;
        toast.style.opacity = '1';
        setTimeout(() => toast.style.opacity = '0', 3000);
    }

    exportData() {
        const dataStr = JSON.stringify(this.db.data);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `workout_backup_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
    }
}

// Init
const app = new App();
