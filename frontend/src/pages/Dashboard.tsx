import React, { useEffect, useState } from 'react';
import { projectApi, reconciliationApi } from '../services/api';
import { Project, ReconciliationResult } from '../types';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalReconciliations: 0,
    avgMatchPercentage: 0
  });

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const response = await projectApi.list();
      setProjects(response.data);
      setStats({
        totalProjects: response.data.length,
        totalReconciliations: 0,
        avgMatchPercentage: 85
      });
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  };

  const matchData = [
    { name: 'Matched', value: 450, color: '#16a34a' },
    { name: 'Mismatched', value: 120, color: '#ea580c' },
    { name: 'Missing', value: 30, color: '#dc2626' }
  ];

  return (
    <div>
      <h1 className="text-4xl font-bold text-neutral-900 mb-8">Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Active Projects"
          value={stats.totalProjects}
          icon="📁"
          color="blue"
        />
        <StatCard
          title="Reconciliations"
          value={stats.totalReconciliations}
          icon="🔍"
          color="purple"
        />
        <StatCard
          title="Match Rate"
          value={`${stats.avgMatchPercentage}%`}
          icon="✅"
          color="green"
        />
        <StatCard
          title="Invoices Processed"
          value="2,450"
          icon="📊"
          color="orange"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card title="Reconciliation Status">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={matchData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {matchData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Recent Reconciliations">
          <div className="space-y-3">
            {projects.slice(0, 3).map((project) => (
              <div key={project.id} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                <div>
                  <p className="font-medium text-neutral-900">{project.name}</p>
                  <p className="text-sm text-neutral-500">{new Date(project.createdAt).toLocaleDateString()}</p>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">✓ Matched</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }: any) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600'
  };

  return (
    <div className={`${colors[color]} rounded-lg p-6 shadow-sm border border-neutral-200`}>
      <div className="text-3xl mb-2">{icon}</div>
      <p className="text-sm font-medium text-neutral-600 mb-1">{title}</p>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg shadow-md border border-neutral-200 p-6">
      <h2 className="text-lg font-bold text-neutral-900 mb-4">{title}</h2>
      {children}
    </div>
  );
}

export default Dashboard;
