import React, { useState, useEffect } from 'react';
import { getLoginHistory, LoginAttempt, clearLockout } from '../lib/auth';
import { Shield, Clock, CheckCircle2, AlertTriangle, Monitor, RefreshCw, X } from 'lucide-react';

interface SecurityAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
}

export const SecurityAuditModal: React.FC<SecurityAuditModalProps> = ({
  isOpen,
  onClose,
  userEmail,
}) => {
  const [history, setHistory] = useState<LoginAttempt[]>([]);

  useEffect(() => {
    if (isOpen) {
      setHistory(getLoginHistory(userEmail));
    }
  }, [isOpen, userEmail]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#1f2024] border border-white/10 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative text-slate-100 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Login Audit &amp; Security History</h2>
              <p className="text-xs text-slate-400">
                Tracking all authentication attempts, status, timestamps and IP/agents
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Table */}
        <div className="overflow-y-auto flex-1 my-4 divide-y divide-white/5 pr-1">
          {history.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm">
              No recent authentication attempts recorded yet.
            </div>
          ) : (
            history.map((log) => (
              <div key={log.id} className="py-3 flex items-start justify-between gap-4 text-xs">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {log.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-400" />
                    )}
                  </div>
                  <div>
                    <div className="font-semibold text-white flex items-center gap-2">
                      <span>{log.email}</span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                          log.success
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {log.success ? 'SUCCESS' : 'FAILED'}
                      </span>
                    </div>
                    {log.failureReason && (
                      <div className="text-[11px] text-rose-300 mt-0.5">{log.failureReason}</div>
                    )}
                    <div className="text-[10px] text-slate-500 font-mono mt-1 truncate max-w-sm">
                      {log.userAgent || 'Web browser'}
                    </div>
                  </div>
                </div>

                <div className="text-right text-slate-400 font-mono text-[11px] shrink-0">
                  <div className="flex items-center gap-1 justify-end">
                    <Clock className="w-3 h-3 text-slate-500" />
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {new Date(log.timestamp).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
          <span>Enterprise MFA &amp; Lockout Protected</span>
          <button
            onClick={() => {
              if (userEmail) clearLockout(userEmail);
              setHistory(getLoginHistory(userEmail));
            }}
            className="flex items-center gap-1.5 text-amber-400 hover:text-amber-300 text-xs font-semibold"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Clear Lockout / Refresh
          </button>
        </div>
      </div>
    </div>
  );
};
