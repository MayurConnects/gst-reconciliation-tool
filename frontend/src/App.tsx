import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import Upload from './pages/Upload';
import Reconciliation from './pages/Reconciliation';
import Settings from './pages/Settings';

function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <div className="flex h-screen bg-neutral-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md border-r border-neutral-200">
        <div className="p-6 border-b border-neutral-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center text-white font-bold">
              📊
            </div>
            <div>
              <h1 className="text-lg font-bold text-neutral-900">GST Reconcile</h1>
              <p className="text-xs text-neutral-500">v1.0.0</p>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-2">
          {[
            { path: '/', label: '📈 Dashboard', icon: '📈' },
            { path: '/projects', label: '📁 Projects', icon: '📁' },
            { path: '/upload', label: '📤 Upload Data', icon: '📤' },
            { path: '/reconciliation', label: '🔍 Reconciliation', icon: '🔍' },
            { path: '/settings', label: '⚙️ Settings', icon: '⚙️' }
          ].map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`block px-4 py-2 rounded-lg font-medium transition-all ${
                isActive(item.path)
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-neutral-700 hover:bg-neutral-100'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <Layout>
              <Dashboard />
            </Layout>
          }
        />
        <Route
          path="/projects"
          element={
            <Layout>
              <Projects />
            </Layout>
          }
        />
        <Route
          path="/upload"
          element={
            <Layout>
              <Upload />
            </Layout>
          }
        />
        <Route
          path="/reconciliation/:id"
          element={
            <Layout>
              <Reconciliation />
            </Layout>
          }
        />
        <Route
          path="/settings"
          element={
            <Layout>
              <Settings />
            </Layout>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
