import { openDB } from 'idb';

const DB_NAME = 'workout-db';
const DB_VERSION = 1;

class WorkoutDB {
    constructor() {
        this.dbPromise = this.initDB();
    }

    async initDB() {
        return openDB(DB_NAME, DB_VERSION, {
            upgrade(db) {
                // Workouts Store
                if (!db.objectStoreNames.contains('workouts')) {
                    const store = db.createObjectStore('workouts', { keyPath: 'id' });
                    store.createIndex('date', 'date');
                }
                // Templates Store
                if (!db.objectStoreNames.contains('templates')) {
                    db.createObjectStore('templates', { keyPath: 'id' });
                }
                // Body Metrics Store
                if (!db.objectStoreNames.contains('bodyMetrics')) {
                    const store = db.createObjectStore('bodyMetrics', { keyPath: 'id', autoIncrement: true });
                    store.createIndex('date', 'date');
                }
                // Settings Store
                if (!db.objectStoreNames.contains('settings')) {
                    db.createObjectStore('settings');
                }
            },
        });
    }

    async getWorkouts() {
        const db = await this.dbPromise;
        return db.getAllFromIndex('workouts', 'date'); // Sorted by date usually
    }

    async addWorkout(workout) {
        const db = await this.dbPromise;
        workout.id = workout.id || Date.now().toString() + Math.random().toString(36).substr(2, 9);
        workout.date = workout.date || new Date().toISOString();
        await db.put('workouts', workout);
        return workout;
    }

    async deleteWorkout(id) {
        const db = await this.dbPromise;
        await db.delete('workouts', id);
    }

    async getTemplates() {
        const db = await this.dbPromise;
        let templates = await db.getAll('templates');
        if (templates.length === 0) {
            // Seed default templates if empty
            const defaults = [
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
            ];
            const tx = db.transaction('templates', 'readwrite');
            await Promise.all(defaults.map(t => tx.store.put(t)));
            await tx.done;
            templates = defaults;
        }
        return templates;
    }

    async saveTemplate(template) {
        const db = await this.dbPromise;
        await db.put('templates', template);
    }

    async deleteTemplate(id) {
        const db = await this.dbPromise;
        await db.delete('templates', id);
    }

    async getBodyMetrics() {
        const db = await this.dbPromise;
        return db.getAllFromIndex('bodyMetrics', 'date');
    }

    async addBodyMetric(weight) {
        const db = await this.dbPromise;
        await db.add('bodyMetrics', {
            date: new Date().toISOString(),
            weight: parseFloat(weight)
        });
    }

    async exportData() {
        const db = await this.dbPromise;
        const workouts = await db.getAll('workouts');
        const templates = await db.getAll('templates');
        const bodyMetrics = await db.getAll('bodyMetrics');
        return { workouts, templates, bodyMetrics };
    }

    async clearData() {
        const db = await this.dbPromise;
        await db.clear('workouts');
        await db.clear('templates');
        await db.clear('bodyMetrics');
    }
}

export const db = new WorkoutDB();
