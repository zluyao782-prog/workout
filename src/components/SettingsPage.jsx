import React, { useState, useEffect, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, getDocs, deleteDoc, doc, query, writeBatch } from 'firebase/firestore';
import { Loader2, Zap, Trash2, Download } from 'lucide-react';

// --- Global Variables and Firebase Setup (Mandatory) ---
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-workout-app';
const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');

// Initialize Firebase services outside of components to avoid re-initialization
let app, auth, db;
if (Object.keys(firebaseConfig).length > 0) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
}

// ----------------------------------------------------
// Custom Toast Component for Notifications
// ----------------------------------------------------
const Toast = ({ message, type, onClose }) => (
    <div className={`fixed bottom-4 right-4 z-50 p-4 rounded-lg shadow-xl transition-opacity duration-300 ${message ? 'opacity-100' : 'opacity-0 pointer-events-none'}
        ${type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
        {message}
    </div>
);

// ----------------------------------------------------
// Custom Confirmation Modal Component
// ----------------------------------------------------
const ConfirmationModal = ({ isOpen, title, message, onConfirm, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-zinc-800 p-6 rounded-xl shadow-2xl w-full max-w-sm">
                <h3 className="text-xl font-bold text-red-400 mb-3">{title}</h3>
                <p className="text-gray-300 mb-6">{message}</p>
                <div className="flex justify-end space-x-3">
                    <button
                        className="px-4 py-2 bg-zinc-700 text-white rounded-lg hover:bg-zinc-600 transition duration-150"
                        onClick={onClose}
                    >
                        取消
                    </button>
                    <button
                        className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition duration-150 flex items-center space-x-1"
                        onClick={onConfirm}
                    >
                        <Trash2 size={18} />
                        <span>确认清空</span>
                    </button>
                </div>
            </div>
        </div>
    );
};


// ----------------------------------------------------
// Main Application Component
// ----------------------------------------------------
export default function App() {
    const [userId, setUserId] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [toastMessage, setToastMessage] = useState(null);
    const [toastType, setToastType] = useState('success');
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Custom Toast handler
    const showToast = useCallback((message, type = 'success') => {
        setToastMessage(message);
        setToastType(type);
        setTimeout(() => setToastMessage(null), 3000);
    }, []);

    // 1. Firebase Authentication Effect
    useEffect(() => {
        if (!auth) {
            console.error("Firebase not configured. Check __firebase_config.");
            setIsLoading(false);
            return;
        }

        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setUserId(user.uid);
            } else {
                // Sign in anonymously if no user is found
                try {
                    if (typeof __initial_auth_token !== 'undefined') {
                        await signInWithCustomToken(auth, __initial_auth_token);
                    } else {
                        await signInAnonymously(auth);
                    }
                } catch (error) {
                    console.error("Firebase auth error:", error);
                }
            }
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // 2. Data Management Functions
    const collectionName = 'workout_sessions';

    const getCollectionRef = useCallback(() => {
        if (!db || !userId) return null;
        // Path: /artifacts/{appId}/users/{userId}/{collectionName}
        return collection(db, `artifacts/${appId}/users/${userId}/${collectionName}`);
    }, [userId]);


    // Data Export Logic
    const exportData = async () => {
        if (!userId) {
            showToast('用户未认证，无法导出数据。', 'error');
            return;
        }

        try {
            const querySnapshot = await getDocs(getCollectionRef());
            const allData = [];
            querySnapshot.forEach((doc) => {
                allData.push({ id: doc.id, ...doc.data() });
            });

            if (allData.length === 0) {
                showToast('没有数据可供导出。', 'success');
                return;
            }

            const dataStr = JSON.stringify({
                appId,
                userId,
                collectionName,
                timestamp: new Date().toISOString(),
                data: allData
            }, null, 2);

            // Trigger file download
            const blob = new Blob([dataStr], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `workout_backup_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            showToast('数据导出成功！', 'success');
        } catch (error) {
            console.error("Error exporting data:", error);
            showToast('数据导出失败。', 'error');
        }
    };

    // Data Clear Logic - Step 1: Open Modal
    const handleClearDataClick = () => {
        if (!userId) {
            showToast('用户未认证，无法清空数据。', 'error');
            return;
        }
        setIsModalOpen(true);
    };

    // Data Clear Logic - Step 2: Confirmation Action
    const clearData = async () => {
        setIsModalOpen(false); // Close modal first
        try {
            const collectionRef = getCollectionRef();
            if (!collectionRef) return;

            const batch = writeBatch(db);
            const snapshot = await getDocs(collectionRef);

            if (snapshot.empty) {
                showToast('数据已是空的，无需清空。', 'success');
                return;
            }

            snapshot.docs.forEach((d) => {
                batch.delete(d.ref);
            });

            await batch.commit();
            showToast('所有数据已成功清空！', 'success');
            // Optional: Reload the window after clearing
            // window.location.reload(); 

        } catch (error) {
            console.error("Error clearing data:", error);
            showToast('清空数据失败。', 'error');
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen bg-zinc-900 text-white">
                <Loader2 className="animate-spin mr-2" size={24} /> 正在加载认证信息...
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-900 text-white font-sans p-4 sm:p-8">
            <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage(null)} />
            <ConfirmationModal
                isOpen={isModalOpen}
                title="清空所有数据"
                message="您确定要永久清空所有锻炼数据吗？此操作不可恢复！"
                onConfirm={clearData}
                onClose={() => setIsModalOpen(false)}
            />

            <div className="max-w-xl mx-auto">
                <header className="py-4 mb-8">
                    <h1 className="text-3xl font-bold text-center border-b border-zinc-700 pb-2">偏好与设置</h1>
                    <p className="text-sm text-center text-zinc-400 mt-2">用户 ID: {userId}</p>
                </header>

                {/* 偏好设置 Card */}
                <div className="bg-zinc-800 p-6 rounded-xl shadow-lg mb-6">
                    <h2 className="text-xl font-semibold mb-4 flex items-center space-x-2">
                        <Zap size={20} className="text-yellow-400" />
                        <span>偏好设置</span>
                    </h2>
                    <div className="flex justify-between items-center py-3 border-b border-zinc-700 last:border-b-0">
                        <span className="text-lg">自动倒计时</span>
                        <div className="flex items-center space-x-2">
                            <span className="text-sm text-zinc-500">(开发中)</span>
                            <label className="relative inline-flex items-center cursor-not-allowed">
                                <input type="checkbox" className="sr-only peer" disabled />
                                <div className="w-11 h-6 bg-zinc-700 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                            </label>
                        </div>
                    </div>
                </div>

                {/* 数据管理 Card */}
                <div className="bg-zinc-800 p-6 rounded-xl shadow-lg">
                    <h2 className="text-xl font-semibold mb-4 flex items-center space-x-2">
                        <Download size={20} className="text-sky-400" />
                        <span>数据管理</span>
                    </h2>

                    <button
                        className="w-full flex items-center justify-center space-x-2 py-3 mb-3 bg-zinc-700 hover:bg-zinc-600 rounded-lg transition duration-150 text-lg font-medium"
                        onClick={exportData}
                    >
                        <Download size={20} />
                        <span>导出数据 (JSON)</span>
                    </button>

                    <button
                        className="w-full flex items-center justify-center space-x-2 py-3 mb-3 bg-zinc-700 rounded-lg text-lg font-medium opacity-50 cursor-not-allowed"
                        disabled
                    >
                        <span>导入数据 (开发中)</span>
                    </button>

                    <button
                        className="w-full flex items-center justify-center space-x-2 py-3 bg-red-600 hover:bg-red-700 rounded-lg transition duration-150 text-lg font-medium"
                        onClick={handleClearDataClick}
                    >
                        <Trash2 size={20} />
                        <span>清空所有数据</span>
                    </button>
                </div>

                <div className="text-center text-zinc-500 text-xs mt-10">
                    Workout Pro v3.0 (React & Firebase)<br />
                    Designed for Gains on App ID: {appId}
                </div>
            </div>
        </div>
    );
}