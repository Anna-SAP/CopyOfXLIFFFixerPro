import React, { useEffect, useRef } from 'react';
import { LogEntry, LogLevel } from '../types';
import { CheckCircle, AlertTriangle, XCircle, Info } from 'lucide-react';

interface ConsoleLogProps {
  logs: LogEntry[];
}

export const ConsoleLog: React.FC<ConsoleLogProps> = ({ logs }) => {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const getIcon = (level: LogLevel) => {
    switch (level) {
      case LogLevel.SUCCESS: return <CheckCircle className="w-4 h-4 text-green-500" />;
      case LogLevel.WARNING: return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case LogLevel.ERROR: return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <Info className="w-4 h-4 text-blue-400" />;
    }
  };

  const getColor = (level: LogLevel) => {
    switch (level) {
      case LogLevel.SUCCESS: return "text-green-700 bg-green-50";
      case LogLevel.WARNING: return "text-yellow-700 bg-yellow-50";
      case LogLevel.ERROR: return "text-red-700 bg-red-50";
      default: return "text-gray-600";
    }
  };

  return (
    <div className="bg-white border rounded-xl overflow-hidden shadow-sm flex flex-col h-64">
      <div className="bg-gray-50 px-4 py-2 border-b flex justify-between items-center">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">System Log</h3>
        <span className="text-xs text-gray-400">{logs.length} events</span>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-2 font-mono text-sm bg-gray-50/50">
        {logs.length === 0 && (
          <div className="text-gray-400 italic text-center py-8">Waiting for input...</div>
        )}
        {logs.map((log) => (
          <div key={log.id} className={`flex items-start space-x-2 p-2 rounded ${getColor(log.level)}`}>
            <span className="mt-0.5 shrink-0">{getIcon(log.level)}</span>
            <div className="flex-1">
              <span className="text-xs opacity-70 mr-2 block sm:inline">
                [{log.timestamp.toLocaleTimeString()}]
              </span>
              <span>{log.message}</span>
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>
    </div>
  );
};
