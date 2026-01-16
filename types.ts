export enum LogLevel {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error'
}

export interface LogEntry {
  id: string;
  timestamp: Date;
  message: string;
  level: LogLevel;
}

export interface RepairResult {
  fixedContent: string;
  isValid: boolean;
  errors: string[];
  wasModified: boolean;
}

export interface FileData {
  name: string;
  content: string;
  size: number;
}
