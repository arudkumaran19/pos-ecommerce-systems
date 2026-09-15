import React, { useEffect, useState } from 'react';
import { 
  ScrollText, 
  Search, 
  Eye, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Shield, 
  Globe, 
  User, 
  Layers
} from 'lucide-react';
import { apiClient } from '../../lib/api-client';
import { AuditLog, PaginatedResponse } from '../../types';
import { formatDate } from '../../lib/formatters';

export const AdminAuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '15');
      if (actionFilter) params.append('action', actionFilter);

      const data = await apiClient.get<PaginatedResponse<AuditLog>>(`/api/v1/admin/audit-logs?${params.toString()}`);
      setLogs(data.items);
      setTotal(data.total);
      setTotalPages(data.total_pages);
    } catch (err: any) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, actionFilter]);

  const getActionBadgeColor = (action: string) => {
    if (action.includes('REFUND') || action.includes('DELETE') || action.includes('FAILED')) {
      return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    }
    if (action.includes('STATUS') || action.includes('ROLE') || action.includes('PASSWORD')) {
      return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    }
    if (action.includes('SUCCEEDED') || action.includes('PAID') || action.includes('REGISTER')) {
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    }
    return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold mb-2">
            <Shield className="w-3.5 h-3.5" />
            System Activity
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">System Activity Log</h1>
          <p className="text-slate-400 text-sm mt-1">
            Complete activity history of customer, administrative, and payment events
          </p>
        </div>
        <div className="text-xs text-slate-400 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
          Total Logged Events: <span className="font-bold text-white">{total}</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass-card p-4 flex flex-wrap gap-2.5 items-center justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 mr-1">Filter Action:</span>
          {[
            '',
            'USER_REGISTERED',
            'LOGIN_SUCCESS',
            'CHECKOUT_RESERVED',
            'PAYMENT_SUCCEEDED',
            'REFUND_ISSUED',
            'ADMIN_USER_SUSPENDED'
          ].map((act) => (
            <button
              key={act}
              onClick={() => {
                setActionFilter(act);
                setPage(1);
              }}
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                actionFilter === act
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {act ? act.replace(/_/g, ' ') : 'All Actions'}
            </button>
          ))}
        </div>
      </div>

      {/* Logs Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-900/40">
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4">Action</th>
                <th className="py-3.5 px-4">Entity</th>
                <th className="py-3.5 px-4">Performed By (Actor)</th>
                <th className="py-3.5 px-4">Affected User (Target)</th>
                <th className="py-3.5 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto" />
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No audit logs found matching criteria.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-900/30 transition-colors">
                    <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                      {formatDate(log.created_at)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider border ${getActionBadgeColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-300 text-[11px]">
                      {log.entity_type} <span className="text-slate-500">#{log.entity_id?.slice(0, 8)}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      {log.actor ? (
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-slate-200">{log.actor.display_name}</span>
                            <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold ${log.actor.role === 'ADMIN' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-slate-800 text-slate-400'}`}>
                              {log.actor.role}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono">{log.actor.email}</div>
                        </div>
                      ) : log.actor_user_id ? (
                        <span className="text-indigo-400 font-mono text-[11px]">User #{log.actor_user_id.slice(0, 8)}</span>
                      ) : (
                        <span className="text-slate-500 italic font-mono text-[11px]">SYSTEM</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {log.target ? (
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-slate-200">{log.target.display_name}</span>
                            <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold ${log.target.role === 'ADMIN' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-slate-800 text-slate-400'}`}>
                              {log.target.role}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono">{log.target.email}</div>
                        </div>
                      ) : log.target_user_id ? (
                        <span className="text-indigo-400 font-mono text-[11px]">User #{log.target_user_id.slice(0, 8)}</span>
                      ) : (
                        <span className="text-slate-600 font-mono text-[11px]">-</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="p-1.5 rounded-lg border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/10 transition-colors"
                        title="View Full Payload"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Page {page} of {totalPages}</span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-40 hover:bg-slate-800"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-40 hover:bg-slate-800"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Forensic Inspection Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-2xl w-full p-6 border-slate-700 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${getActionBadgeColor(selectedLog.action)}`}>
                    {selectedLog.action}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">Event ID: {selectedLog.id}</span>
                </div>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Logged on {formatDate(selectedLog.created_at)}
                </span>
              </div>
              <button onClick={() => setSelectedLog(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Human-Readable Actor and Target Identity */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Actor Identity */}
              <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1.5">
                <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider block flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  Performed By (Actor)
                </span>
                {selectedLog.actor ? (
                  <div>
                    <p className="text-white font-bold text-sm">{selectedLog.actor.display_name}</p>
                    <p className="text-slate-400 font-mono text-[11px]">{selectedLog.actor.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${selectedLog.actor.role === 'ADMIN' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-slate-800 text-slate-300'}`}>
                        {selectedLog.actor.role}
                      </span>
                      {selectedLog.actor.is_deleted && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          Deleted Account
                        </span>
                      )}
                    </div>
                  </div>
                ) : selectedLog.actor_user_id ? (
                  <div>
                    <p className="text-slate-300 font-mono text-[11px]">User #{selectedLog.actor_user_id}</p>
                    <p className="text-slate-500 text-[10px] italic">User record no longer available</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-slate-300 font-bold text-sm">SYSTEM</p>
                    <p className="text-slate-500 text-[10px] italic">Automated daemon or background task</p>
                  </div>
                )}
              </div>

              {/* Target Identity */}
              <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1.5">
                <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wider block flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  Affected User (Target)
                </span>
                {selectedLog.target ? (
                  <div>
                    <p className="text-white font-bold text-sm">{selectedLog.target.display_name}</p>
                    <p className="text-slate-400 font-mono text-[11px]">{selectedLog.target.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${selectedLog.target.role === 'ADMIN' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-slate-800 text-slate-300'}`}>
                        {selectedLog.target.role}
                      </span>
                      {selectedLog.target.is_deleted && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          Deleted Account
                        </span>
                      )}
                    </div>
                  </div>
                ) : selectedLog.target_user_id ? (
                  <div>
                    <p className="text-slate-300 font-mono text-[11px]">User #{selectedLog.target_user_id}</p>
                    <p className="text-slate-500 text-[10px] italic">User record no longer available</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-slate-400 font-medium text-xs">None</p>
                    <p className="text-slate-500 text-[10px] italic">No specific target user</p>
                  </div>
                )}
              </div>
            </div>

            {/* Affected Business Entity */}
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block flex items-center gap-1.5 mb-1">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                Affected Entity
              </span>
              <p className="text-slate-300 font-mono">
                Type: <strong className="text-white">{selectedLog.entity_type}</strong> | ID: <strong className="text-white font-mono">{selectedLog.entity_id}</strong>
              </p>
              {selectedLog.reason && (
                <p className="text-amber-400 mt-1">Reason: &ldquo;{selectedLog.reason}&rdquo;</p>
              )}
            </div>

            {/* Technical & Forensic Identifiers */}
            <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800 text-[11px] space-y-1 font-mono text-slate-400">
              <span className="text-[10px] text-slate-500 uppercase font-sans tracking-wider block flex items-center gap-1.5 mb-1.5">
                <Globe className="w-3.5 h-3.5 text-slate-400" />
                Technical & Forensic Details
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
                <div>
                  <span className="text-slate-500">Actor ID: </span>
                  <span className="text-slate-300">{selectedLog.actor_user_id || 'null'}</span>
                </div>
                <div>
                  <span className="text-slate-500">Target ID: </span>
                  <span className="text-slate-300">{selectedLog.target_user_id || 'null'}</span>
                </div>
                <div>
                  <span className="text-slate-500">IP Origin: </span>
                  <span className="text-slate-300">{selectedLog.ip_address || '127.0.0.1'}</span>
                </div>
                <div>
                  <span className="text-slate-500">Request ID: </span>
                  <span className="text-slate-300">{selectedLog.request_id || 'none'}</span>
                </div>
              </div>
              {selectedLog.user_agent && (
                <p className="text-slate-500 text-[10px] truncate pt-1" title={selectedLog.user_agent}>
                  Agent: {selectedLog.user_agent}
                </p>
              )}
            </div>

            {/* State Diff (Before vs After) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Before Payload
                </span>
                <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-48">
                  {selectedLog.before_data ? JSON.stringify(selectedLog.before_data, null, 2) : 'null'}
                </pre>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  After Payload
                </span>
                <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-48">
                  {selectedLog.after_data ? JSON.stringify(selectedLog.after_data, null, 2) : 'null'}
                </pre>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>

  );
};
