import React, { useState, useEffect } from 'react';
import { settingsApi } from '../services/api';
import { ReconciliationSettings } from '../types';

function Settings() {
  const [settings, setSettings] = useState<ReconciliationSettings>({
    taxTolerance: 1,
    invoiceValueTolerance: 1,
    dateTolerance: 0,
    fuzzyMatchThreshold: 90
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await settingsApi.get();
      setSettings(response.data);
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const handleSave = async () => {
    try {
      await settingsApi.update(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  return (
    <div>
      <h1 className="text-4xl font-bold text-neutral-900 mb-8">Settings</h1>

      <div className="max-w-2xl">
        <div className="bg-white rounded-lg shadow-md border border-neutral-200 p-8">
          <h2 className="text-xl font-bold text-neutral-900 mb-6">Reconciliation Configuration</h2>

          <div className="space-y-6">
            <SettingField
              label="Tax Tolerance (₹)"
              description="Maximum rupee difference allowed for tax amounts"
              value={settings.taxTolerance}
              onChange={(value) => setSettings({ ...settings, taxTolerance: value })}
              type="number"
            />
            <SettingField
              label="Invoice Value Tolerance (₹)"
              description="Maximum rupee difference allowed for invoice totals"
              value={settings.invoiceValueTolerance}
              onChange={(value) => setSettings({ ...settings, invoiceValueTolerance: value })}
              type="number"
            />
            <SettingField
              label="Date Tolerance (Days)"
              description="Maximum days difference allowed between invoice dates"
              value={settings.dateTolerance}
              onChange={(value) => setSettings({ ...settings, dateTolerance: value })}
              type="number"
            />
            <SettingField
              label="Fuzzy Match Threshold (%)"
              description="Minimum confidence percentage for fuzzy matching"
              value={settings.fuzzyMatchThreshold}
              onChange={(value) => setSettings({ ...settings, fuzzyMatchThreshold: value })}
              type="number"
              min={0}
              max={100}
            />
          </div>

          <div className="mt-8 flex gap-3">
            <button
              onClick={handleSave}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2 rounded-lg font-medium transition-all"
            >
              Save Settings
            </button>
            {saved && (
              <div className="flex items-center gap-2 text-green-600">
                <span>✓</span>
                <span>Settings saved successfully</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingField({ label, description, value, onChange, type, min, max }: any) {
  return (
    <div className="border-b border-neutral-200 pb-6 last:border-b-0">
      <label className="block text-sm font-medium text-neutral-900 mb-1">{label}</label>
      <p className="text-xs text-neutral-600 mb-3">{description}</p>
      <input
        type={type || 'text'}
        value={value}
        onChange={(e) => onChange(type === 'number' ? parseFloat(e.target.value) : e.target.value)}
        min={min}
        max={max}
        className="px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:border-blue-500 font-mono"
      />
    </div>
  );
}

export default Settings;
