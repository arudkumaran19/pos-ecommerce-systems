import React, { useEffect, useState } from 'react';
import { 
  Eye, 
  X, 
  ChevronLeft, 
  ChevronRight
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

  const formatActionName = (action: string) => {
    return action
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const getActionBadgeColor = (action: string) => {
    if (action.includes('REFUND') || action.includes('DELETE') || action.includes('FAILED') || action.includes('SUSPENDED')) {
      return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    }
    if (action.includes('STATUS') || action.includes('ROLE') || action.includes('PASSWORD') || action.includes('CANCEL')) {
      return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    }
    if (action.includes('SUCCEEDED') || action.includes('PAID') || action.includes('REGISTER') || action.includes('CREATED')) {
      return 'bg-[#151922] text-[#4FB7A5] border border-[#4FB7A5]/30';
    }
    return 'bg-[#151922] text-[#A5ABB5] border border-[#242A35]';
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#F5F3EE] tracking-tight">Audit logs</h1>
          <p className="text-[#A5ABB5] text-xs mt-0.5">
            Operational history of customer, admin, and order events.
          </p>
        </div>
        <div className="text-xs text-[#A5ABB5] bg-[#10131A] px-3 py-1.5 rounded-lg border border-[#242A35]">
          Total events: <span className="font-semibold text-[#F5F3EE]">{total}</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-[#10131A] p-3.5 rounded-xl border border-[#242A35] flex flex-wrap gap-2 items-center justify-between">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-medium text-[#A5ABB5] mr-1.5">Filter action:</span>
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
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                actionFilter === act
                  ? 'bg-[#4FB7A5] text-[#080A0F] font-semibold'
                  : 'bg-[#151922] border border-[#242A35] text-[#A5ABB5] hover:text-[#F5F3EE] hover:bg-[#1C222C]'
              }`}
            >
              {act ? formatActionName(act) : 'All events'}
            </button>
          ))}
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-[#10131A] rounded-xl border border-[#242A35] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#242A35] text-[11px] font-semibold text-[#A5ABB5] uppercase tracking-wider bg-[#151922]/50">
                <th className="py-3 px-4">Time</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Entity</th>
                <th className="py-3 px-4">Performed by</th>
                <th className="py-3 px-4">Affected user</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#242A35] text-xs">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#A5ABB5]">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#4FB7A5] border-t-transparent mx-auto" />
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#A5ABB5]">
                    No audit records found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#151922]/40 transition-colors">
                    <td className="py-3 px-4 text-[#A5ABB5] text-[11px]">
                      {formatDate(log.created_at)}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border ${getActionBadgeColor(log.action)}`}>
                        {formatActionName(log.action)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#F5F3EE] text-xs">
                      {log.entity_type} <span className="text-[#6F7682]">#{log.entity_id?.slice(0, 8)}</span>
                    </td>
                    <td className="py-3 px-4">
                      {log.actor ? (
                        <div>
                          <div className="font-medium text-[#F5F3EE]">{log.actor.display_name}</div>
                          <div className="text-[11px] text-[#A5ABB5]">{log.actor.email}</div>
                        </div>
                      ) : log.actor_user_id ? (
                        <span className="text-[#A5ABB5]">User #{log.actor_user_id.slice(0, 8)}</span>
                      ) : (
                        <span className="text-[#6F7682] italic">System</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {log.target ? (
                        <div>
                          <div className="font-medium text-[#F5F3EE]">{log.target.display_name}</div>
                          <div className="text-[11px] text-[#A5ABB5]">{log.target.email}</div>
                        </div>
                      ) : log.target_user_id ? (
                        <span className="text-[#A5ABB5]">User #{log.target_user_id.slice(0, 8)}</span>
                      ) : (
                        <span className="text-[#6F7682]">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="p-1.5 rounded-lg border border-[#242A35] text-[#A5ABB5] hover:text-[#F5F3EE] hover:bg-[#151922] transition-colors"
                        title="View details"
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
          <div className="p-3.5 border-t border-[#242A35] flex items-center justify-between text-xs text-[#A5ABB5]">
            <span>Page {page} of {totalPages}</span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                className="p-1 rounded-lg bg-[#151922] border border-[#242A35] text-[#F5F3EE] disabled:opacity-40 hover:bg-[#1C222C]"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
                className="p-1 rounded-lg bg-[#151922] border border-[#242A35] text-[#F5F3EE] disabled:opacity-40 hover:bg-[#1C222C]"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-[#10131A] border border-[#242A35] max-w-2xl w-full p-6 rounded-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#242A35] pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-md text-[11px] font-medium border ${getActionBadgeColor(selectedLog.action)}`}>
                    {formatActionName(selectedLog.action)}
                  </span>
                  <span className="text-xs text-[#A5ABB5]">Event #{selectedLog.id.slice(0, 8)}</span>
                </div>
                <span className="text-[11px] text-[#6F7682] mt-1 block">
                  {formatDate(selectedLog.created_at)}
                </span>
              </div>
              <button onClick={() => setSelectedLog(null)} className="text-[#A5ABB5] hover:text-[#F5F3EE]">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Human-Readable Actor and Target */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-[#151922] border border-[#242A35]">
                <span className="text-[10px] text-[#A5ABB5] uppercase tracking-wider block mb-1">Actor</span>
                {selectedLog.actor ? (
                  <div>
                    <p className="font-semibold text-[#F5F3EE]">{selectedLog.actor.display_name}</p>
                    <p className="text-[#A5ABB5] text-[11px]">{selectedLog.actor.email}</p>
                    <span className="inline-block mt-1 text-[10px] px-1.5 py-0.2 bg-[#10131A] border border-[#242A35] rounded text-[#A5ABB5]">
                      Role: {selectedLog.actor.role}
                    </span>
                  </div>
                ) : (
                  <span className="text-[#6F7682] italic">System</span>
                )}
              </div>

              <div className="p-3 rounded-lg bg-[#151922] border border-[#242A35]">
                <span className="text-[10px] text-[#A5ABB5] uppercase tracking-wider block mb-1">Target</span>
                {selectedLog.target ? (
                  <div>
                    <p className="font-semibold text-[#F5F3EE]">{selectedLog.target.display_name}</p>
                    <p className="text-[#A5ABB5] text-[11px]">{selectedLog.target.email}</p>
                    <span className="inline-block mt-1 text-[10px] px-1.5 py-0.2 bg-[#10131A] border border-[#242A35] rounded text-[#A5ABB5]">
                      Role: {selectedLog.target.role}
                    </span>
                  </div>
                ) : (
                  <span className="text-[#6F7682] italic">None / System Resource</span>
                )}
              </div>
            </div>

            {/* Technical Details */}
            <div className="space-y-2 text-xs">
              <h4 className="font-semibold text-[#A5ABB5]">Technical details</h4>
              <div className="p-3 bg-[#080A0F] rounded-lg border border-[#242A35] font-mono text-[11px] text-[#A5ABB5] space-y-1">
                <p>Event ID: {selectedLog.id}</p>
                <p>Entity: {selectedLog.entity_type} ({selectedLog.entity_id})</p>
                {selectedLog.ip_address && <p>IP: {selectedLog.ip_address}</p>}
                {selectedLog.user_agent && <p className="truncate">User Agent: {selectedLog.user_agent}</p>}
              </div>
            </div>

            {/* Changes Payload */}
            {(selectedLog.before_data || selectedLog.after_data) && (
              <div className="space-y-2 text-xs">
                <h4 className="font-semibold text-[#A5ABB5]">Payload changes</h4>
                {selectedLog.before_data && (
                  <>
                    <p className="text-[#6F7682] uppercase tracking-wide text-[10px]">Before</p>
                    <pre className="p-3 bg-[#080A0F] rounded-lg border border-[#242A35] font-mono text-[11px] text-[#A5ABB5] overflow-x-auto">
                      {JSON.stringify(selectedLog.before_data, null, 2)}
                    </pre>
                  </>
                )}
                {selectedLog.after_data && (
                  <>
                    <p className="text-[#6F7682] uppercase tracking-wide text-[10px]">After</p>
                    <pre className="p-3 bg-[#080A0F] rounded-lg border border-[#242A35] font-mono text-[11px] text-[#A5ABB5] overflow-x-auto">
                      {JSON.stringify(selectedLog.after_data, null, 2)}
                    </pre>
                  </>
                )}
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-[#242A35]">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-3.5 py-1.5 rounded-lg bg-[#151922] text-[#A5ABB5] text-xs font-medium hover:text-[#F5F3EE]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
