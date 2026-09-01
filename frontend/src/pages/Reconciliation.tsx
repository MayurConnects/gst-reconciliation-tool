import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { reconciliationApi } from '../services/api';
import { ReconciliationResult } from '../types';

function Reconciliation() {
  const { id } = useParams();
  const [result, setResult] = useState<ReconciliationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('summary');

  useEffect(() => {
    loadReconciliation();
  }, [id]);

  const loadReconciliation = async () => {
    if (!id) return;
    try {
      const response = await reconciliationApi.getSummary(id);
      setResult(response.data);
    } catch (error) {
      console.error('Failed to load reconciliation:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading reconciliation...</div>;
  }

  if (!result) {
    return <div className="text-center py-12">Reconciliation not found</div>;
  }

  return (
    <div>
      <h1 className="text-4xl font-bold text-neutral-900 mb-8">Reconciliation Results</h1>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <SummaryCard label="Total GSTINs" value={result.summary?.totalGstins || 0} color="blue" />
        <SummaryCard label="Matched" value={result.summary?.matched || 0} color="green" />
        <SummaryCard label="Mismatched" value={result.summary?.mismatched || 0} color="orange" />
        <SummaryCard label="Match Rate" value={`${result.summary?.matchPercentage || 0}%`} color="purple" />
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md border border-neutral-200">
        <div className="flex border-b border-neutral-200">
          {['summary', 'matches', 'mismatches', 'duplicates'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 font-medium transition-all ${
                activeTab === tab
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'summary' && (
            <div className="space-y-4">
              {result.details?.map((item: any) => (
                <div key={item.id} className="border border-neutral-200 rounded-lg p-4 hover:shadow-md transition-all">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-neutral-900">{item.gstin}</p>
                      <p className="text-sm text-neutral-500">{item.supplierName || 'Unknown Supplier'}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      item.status === 'MATCHED' ? 'bg-green-100 text-green-700' :
                      item.status === 'MISMATCHED' ? 'bg-orange-100 text-orange-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mt-3 text-xs">
                    <div>
                      <p className="text-neutral-600">Books: ₹{item.booksTotalInvoice.toFixed(2)}</p>
                      <p className="text-neutral-600">GSTR-2B: ₹{item.gstr2bTotalInvoice.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-neutral-600">Invoices Books: {item.booksCount}</p>
                      <p className="text-neutral-600">Invoices 2B: {item.gstr2bCount}</p>
                    </div>
                    <div>
                      <p className="text-neutral-600">Tax Books: ₹{item.booksTaxTotal.toFixed(2)}</p>
                      <p className="text-neutral-600">Tax 2B: ₹{item.gstr2bTaxTotal.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'duplicates' && (
            <div className="text-center py-12">
              <p className="text-neutral-500">Duplicates: {result.duplicates?.length || 0}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, color }: any) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50',
    green: 'bg-green-50',
    orange: 'bg-orange-50',
    purple: 'bg-purple-50'
  };

  return (
    <div className={`${colors[color]} rounded-lg p-4 border border-neutral-200`}>
      <p className="text-sm text-neutral-600 mb-1">{label}</p>
      <p className="text-2xl font-bold text-neutral-900">{value}</p>
    </div>
  );
}

export default Reconciliation;
