'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Folder,
  FileAudio,
  MoveRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FolderOpen,
  Terminal,
  Sun,
  Moon,
  History,
  LayoutDashboard,
  Clock,
  ExternalLink
} from 'lucide-react';

import { startFullSyncProcess, getSyncStatus, getSyncHistory } from '../app/sync';

export default function App() {
  const [view, setView] = useState('start');
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' or 'history'
  const [logs, setLogs] = useState([]);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState(null);
  const [theme, setTheme] = useState('light');
  const scrollRef = useRef(null);

  useEffect(() => {
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setTheme('dark');
      document.documentElement.classList.add('dark');
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'history') {
      loadHistory();
    }
  }, [activeTab]);

  const loadHistory = async () => {
    const data = await getSyncHistory();
    setHistory(data);
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark');
    localStorage.theme = newTheme;
  };

  const handleFullSync = async () => {
    setView('processing');
    setActiveTab('dashboard');
    setLogs([]);
    setError(null);

    try {
      const res = await startFullSyncProcess();
      if (res.status === "error" || res.message) throw new Error(res.message);
    } catch (err) {
      setError(err.message);
      setView('start');
    }
  };

  useEffect(() => {
    let interval;
    if (view === 'processing') {
      interval = setInterval(async () => {
        const data = await getSyncStatus();
        if (data.logs) {
          const lines = data.logs.split('\n').filter(l => l.trim() !== "");
          setLogs(lines.map(l => ({
            msg: l,
            type: l.includes('ERROR') ? 'error' : l.includes('🚀') ? 'success' : 'info',
            time: new Date().toLocaleTimeString()
          })));
        }
        if (data.status === 'COMPLETED') { setView('done'); clearInterval(interval); }
        else if (data.status === 'FAILED') { setError("Sync failed."); setView('start'); clearInterval(interval); }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [view]);

  const renderHistory = () => (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold dark:text-white flex items-center gap-2">
          <History className="w-5 h-5 text-indigo-500" /> Sync History
        </h2>
        <button onClick={loadHistory} className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">Refresh</button>
      </div>

      <div className="space-y-4">
        {history.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
            <Clock className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500">No sync history found.</p>
          </div>
        ) : (
          history.map((job) => (
            <div key={job.id} className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-hover hover:shadow-md">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${job.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                    job.status === 'FAILED' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-blue-100 text-blue-700'
                    }`}>
                    {job.status}
                  </span>
                  <span className="text-slate-400 text-sm">Job #{job.id}</span>
                </div>
                <span className="text-xs text-slate-500">{new Date(job.start_time).toLocaleString()}</span>
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400 font-mono line-clamp-2 bg-slate-50 dark:bg-slate-900/50 p-2 rounded">
                {job.logs.split('\n').slice(-2)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 transition-colors duration-300">
      <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-white/70 dark:bg-slate-900/70 border-b border-slate-200/60 dark:border-slate-800/60">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-600 p-2 rounded-lg"><FolderOpen className="w-5 h-5 text-white" /></div>
              <h1 className="text-lg font-bold dark:text-white hidden sm:block">Session Sync</h1>
            </div>
            <nav className="flex items-center gap-1">
              <button
                onClick={() => { setActiveTab('dashboard'); setView('start'); }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'dashboard' ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              >
                <LayoutDashboard className="w-4 h-4" /> Dashboard
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'history' ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              >
                <History className="w-4 h-4" /> History
              </button>
            </nav>
          </div>
          <button onClick={toggleTheme} className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {activeTab === 'dashboard' ? (
          view === 'start' ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
              <div className="bg-white dark:bg-slate-800 p-12 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 max-w-lg w-full text-center">
                <h2 className="text-3xl font-bold mb-3 dark:text-white">Sync Engine</h2>
                <p className="text-slate-500 dark:text-slate-400 mb-8">Update System Concepts Sessions</p>
                <button onClick={handleFullSync} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-4 rounded-xl shadow-lg transition-transform hover:-translate-y-0.5 flex items-center justify-center gap-2">
                  Start Full Pipeline <MoveRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto flex flex-col items-center py-10">
              <div className="mb-6">{view === 'done' ? <CheckCircle2 className="w-16 h-16 text-emerald-500" /> : <Loader2 className="w-16 h-16 animate-spin text-indigo-600" />}</div>
              <div className="w-full bg-slate-900 p-4 rounded-lg font-mono text-xs text-slate-300 h-96 overflow-y-auto">
                {logs.map((l, i) => <div key={i} className="mb-1">[{l.time}] $ {l.msg}</div>)}
              </div>
            </div>
          )
        ) : renderHistory()}
      </main>
    </div>
  );
}