import React, { useState } from 'react';
import { Download, FileSpreadsheet, FileText, Database, Shield } from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import ExportModal from '../../components/common/ExportModal';

const ExportPanel = () => {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      {/* Title block */}
      <div>
        <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-zinc-100">
          Data Export Hub
        </h1>
        <p className="text-xs text-zinc-400 mt-1">Export transaction logs, goals, and monthly budgets for local accounting</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Col: Export trigger action */}
        <Card title="Export Console" className="md:col-span-2 flex flex-col justify-between">
          <div className="space-y-3 text-xs text-zinc-400 leading-relaxed">
            <p>Generate exports matching standard accountant formatting frameworks. Download ledgers locally for backups or audit reviews.</p>
            <div className="border border-white/5 bg-zinc-900/40 rounded-xl p-4 space-y-3">
              <h5 className="font-bold text-zinc-350 text-[10px] uppercase tracking-wider">Available Packages</h5>
              <ul className="list-disc pl-4 space-y-1.5 text-zinc-500">
                <li><strong className="text-zinc-400">CSV Sheet</strong>: Plain-text comma separated formatting.</li>
                <li><strong className="text-zinc-400">Excel Workbook (.xlsx)</strong>: Standard worksheet containing sheets.</li>
                <li><strong className="text-zinc-400">PDF Document</strong>: Beautifully typeset, aligned tables with grids.</li>
              </ul>
            </div>
          </div>
          <div className="pt-4 flex justify-end">
            <Button onClick={() => setModalOpen(true)}>
              <Download className="h-4 w-4 mr-1 text-accent-cyan" /> Configure Export
            </Button>
          </div>
        </Card>

        {/* Right Col: Parameters constraints info */}
        <div className="space-y-4">
          <Card title="Storage Protocols" subtitle="Upload thresholds & limitations">
            <div className="space-y-3 text-xs text-zinc-500 leading-relaxed">
              <div className="flex items-center space-x-2">
                <Database className="h-4 w-4 text-accent-indigo shrink-0" />
                <span className="font-bold text-zinc-400 text-[10px] uppercase tracking-wider">Providers</span>
              </div>
              <p className="pl-6">Unified Storage routes files dynamically to the local filesystem or AWS S3 cloud buckets depending on server configurations.</p>
              
              <div className="flex items-center space-x-2 pt-2">
                <Shield className="h-4 w-4 text-accent-rose shrink-0" />
                <span className="font-bold text-zinc-400 text-[10px] uppercase tracking-wider">File Limits</span>
              </div>
              <ul className="pl-6 list-disc space-y-1">
                <li>Images: 5 MB limit</li>
                <li>PDFs: 10 MB limit</li>
                <li>Audio clips: 20 MB limit</li>
              </ul>
            </div>
          </Card>
        </div>
      </div>

      {/* Export modal launcher */}
      <ExportModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
};

export default ExportPanel;
