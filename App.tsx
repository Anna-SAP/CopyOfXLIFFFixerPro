import React, { useState, useCallback } from 'react';
import { UploadCloud, FileCode, Download, RefreshCw, Wand2, Trash2, AlertCircle, Check } from 'lucide-react';
import { Button } from './components/Button';
import { ConsoleLog } from './components/ConsoleLog';
import { FileData, LogEntry, LogLevel, RepairResult } from './types';
import { heuristicRepair } from './services/repairService';
import { repairWithGemini } from './services/geminiService';
import { ALLOWED_EXTENSIONS, MAX_FILE_SIZE } from './constants';

const App: React.FC = () => {
  const [file, setFile] = useState<FileData | null>(null);
  const [result, setResult] = useState<RepairResult | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);

  const addLog = (message: string, level: LogLevel = LogLevel.INFO) => {
    setLogs(prev => [...prev, {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      message,
      level
    }]);
  };

  const handleFileRead = (fileObj: File) => {
    if (fileObj.size > MAX_FILE_SIZE) {
      addLog(`File too large: ${(fileObj.size / 1024 / 1024).toFixed(2)}MB. Max is 5MB.`, LogLevel.ERROR);
      return;
    }

    const ext = '.' + fileObj.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      addLog(`Invalid file type: ${ext}. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`, LogLevel.ERROR);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setFile({
        name: fileObj.name,
        size: fileObj.size,
        content
      });
      setResult(null);
      setLogs([]); // Clear logs on new file
      addLog(`File loaded: ${fileObj.name} (${(fileObj.size / 1024).toFixed(1)}KB)`, LogLevel.INFO);
    };
    reader.onerror = () => addLog("Failed to read file.", LogLevel.ERROR);
    reader.readAsText(fileObj);
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileRead(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileRead(e.target.files[0]);
    }
  };

  const runHeuristicRepair = () => {
    if (!file) return;
    setIsProcessing(true);
    addLog("Starting heuristic repair...", LogLevel.INFO);

    try {
      // Simulate steps for UX
      setTimeout(() => {
        addLog("Scanning for illegal control characters...", LogLevel.INFO);
        const repair = heuristicRepair(file.content);
        
        if (repair.wasModified) {
          addLog("Modifications applied to file structure.", LogLevel.SUCCESS);
        } else {
          addLog("No heuristic patterns matched. File might be intact or have complex issues.", LogLevel.WARNING);
        }

        if (repair.isValid) {
          addLog("XML Validation Passed.", LogLevel.SUCCESS);
        } else {
          addLog(`XML Validation Failed: ${repair.errors[0]}`, LogLevel.ERROR);
        }

        setResult(repair);
        setIsProcessing(false);
      }, 800);
    } catch (e: any) {
      addLog(`Unexpected error: ${e.message}`, LogLevel.ERROR);
      setIsProcessing(false);
    }
  };

  const runGeminiRepair = async () => {
    if (!file) return;
    
    // Check for API key (using window.aistudio logic as requested for Veo, adapted for general key check here)
    // Since this is a standard text model, we follow the standard env var pattern or prompt if missing.
    // However, specifically for this prompt's constraints, we'll try to use the environment key first.
    // If we wanted to strictly follow the "Select Key" pattern for *all* calls:
    try {
        if (!process.env.API_KEY && window.aistudio) {
            const hasKey = await window.aistudio.hasSelectedApiKey();
            if (!hasKey) {
                await window.aistudio.openSelectKey();
            }
        }
    } catch (e) {
        // Fallback or ignore if window.aistudio isn't injected in this specific preview environment
    }

    setIsProcessing(true);
    addLog("Initializing AI Repair Agent (Gemini 2.5)...", LogLevel.INFO);

    try {
      const repair = await repairWithGemini(file.content);
      addLog("AI Reconstruction complete.", LogLevel.SUCCESS);
      
      if (repair.isValid) {
        addLog("AI Output Validated Successfully.", LogLevel.SUCCESS);
      } else {
        addLog(`AI Output Validation Warning: ${repair.errors[0]}`, LogLevel.WARNING);
      }
      
      setResult(repair);
    } catch (e: any) {
      addLog(`AI Repair Failed: ${e.message}`, LogLevel.ERROR);
      addLog("Tip: Ensure you have selected a valid API Key.", LogLevel.INFO);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!result || !file) return;
    const blob = new Blob([result.fixedContent], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `fixed_${file.name}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    addLog(`Downloaded fixed_${file.name}`, LogLevel.SUCCESS);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">XLIFF Fixer Pro</h1>
            <p className="text-slate-500 mt-1">Industrial-grade XML localization file repair utility.</p>
          </div>
          <div className="mt-4 md:mt-0 flex space-x-2">
             <Button variant="ghost" onClick={() => window.location.reload()}>
                <RefreshCw className="w-4 h-4 mr-2" /> Reset
             </Button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Col: Input & Controls */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Upload Area */}
            {!file ? (
              <div 
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors h-64 flex flex-col items-center justify-center cursor-pointer ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                <input 
                  id="file-upload" 
                  type="file" 
                  className="hidden" 
                  accept=".xlf,.xliff,.xml" 
                  onChange={handleFileChange}
                />
                <div className="bg-blue-100 p-4 rounded-full mb-4">
                  <UploadCloud className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-sm font-semibold text-slate-900">Click to upload or drag & drop</h3>
                <p className="text-xs text-slate-500 mt-1">.xlf, .xliff, .xml (Max 5MB)</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <FileCode className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-slate-900 truncate max-w-[150px]">{file.name}</h3>
                      <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                  <button onClick={() => { setFile(null); setResult(null); setLogs([]); }} className="text-slate-400 hover:text-red-500">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                <div className="mt-6 space-y-3">
                  <Button 
                    className="w-full justify-center" 
                    onClick={runHeuristicRepair}
                    isLoading={isProcessing}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Standard Repair (Algorithm)
                  </Button>
                  
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                      <div className="w-full border-t border-gray-200" />
                    </div>
                    <div className="relative flex justify-center">
                      <span className="bg-white px-2 text-xs text-gray-400 uppercase">Or use AI</span>
                    </div>
                  </div>

                  <Button 
                    className="w-full justify-center bg-purple-600 hover:bg-purple-700 focus:ring-purple-500"
                    onClick={runGeminiRepair}
                    isLoading={isProcessing}
                  >
                    <Wand2 className="w-4 h-4 mr-2" />
                    Smart Repair (Gemini AI)
                  </Button>
                </div>
              </div>
            )}

            {/* Logs */}
            <ConsoleLog logs={logs} />
          </div>

          {/* Right Col: Preview & Result */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl border shadow-sm h-full min-h-[500px] flex flex-col">
              <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50 rounded-t-xl">
                <h3 className="font-semibold text-slate-700">File Preview</h3>
                {result && (
                  <div className={`flex items-center space-x-2 text-sm px-3 py-1 rounded-full ${result.isValid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {result.isValid ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    <span>{result.isValid ? 'Valid XML' : 'Invalid XML'}</span>
                  </div>
                )}
              </div>
              
              <div className="flex-1 p-0 relative group">
                 {!file ? (
                    <div className="absolute inset-0 flex items-center justify-center text-slate-300">
                       <p>Upload a file to view content</p>
                    </div>
                 ) : (
                    <textarea 
                      className="w-full h-full resize-none p-4 font-mono text-xs md:text-sm focus:outline-none bg-white text-slate-800"
                      value={result ? result.fixedContent : file.content}
                      readOnly
                      spellCheck={false}
                    />
                 )}
              </div>

              {result && (
                <div className="p-4 border-t bg-gray-50 rounded-b-xl flex justify-end">
                   <Button onClick={handleDownload} disabled={!result.isValid && !result.fixedContent}>
                      <Download className="w-4 h-4 mr-2" />
                      Download Fixed File
                   </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
