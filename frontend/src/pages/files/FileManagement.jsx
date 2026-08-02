import React from 'react';
import { ShieldAlert, Image, FileText, Music, Info, File } from 'lucide-react';
import Card from '../../components/common/Card';

const FileManagement = () => {
  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      {/* Title block */}
      <div>
        <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-zinc-100">
          File & Storage Center
        </h1>
        <p className="text-xs text-zinc-400 mt-1">Review storage quotas, size regulations, and MIME security constraints</p>
      </div>

      {/* Guidelines alert box */}
      <div className="border border-white/5 bg-zinc-900/40 rounded-xl p-4 flex items-start space-x-3 text-zinc-450 leading-relaxed text-xs">
        <Info className="h-5 w-5 text-accent-cyan shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold text-sm text-zinc-200">Security & Upload Policy</h4>
          <p className="mt-1">
            All uploaded files are subjected to strict extension validation, MIME type sniffing, and byte size checks prior to saving. Path identifiers are hashed to protect directory hierarchies and user anonymity.
          </p>
        </div>
      </div>

      {/* Categories limits grids */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        
        {/* Category 1: Images */}
        <Card title="Images" hoverable>
          <div className="space-y-4">
            <div className="w-10 h-10 rounded-lg bg-accent-indigo/10 flex items-center justify-center text-accent-indigo">
              <Image className="h-5 w-5" />
            </div>
            <div className="space-y-1.5 text-xs text-zinc-550">
              <div className="flex justify-between">
                <span>Maximum Size:</span>
                <span className="font-bold text-zinc-300">5 MB</span>
              </div>
              <div className="flex justify-between">
                <span>Allowed Exts:</span>
                <span className="font-bold text-zinc-300">.jpg, .jpeg, .png</span>
              </div>
              <div className="flex justify-between">
                <span>MIME Checks:</span>
                <span className="font-bold text-zinc-300">image/jpeg, image/png</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Category 2: Documents */}
        <Card title="Invoices & PDFs" hoverable>
          <div className="space-y-4">
            <div className="w-10 h-10 rounded-lg bg-accent-cyan/10 flex items-center justify-center text-accent-cyan">
              <FileText className="h-5 w-5" />
            </div>
            <div className="space-y-1.5 text-xs text-zinc-550">
              <div className="flex justify-between">
                <span>Maximum Size:</span>
                <span className="font-bold text-zinc-300">10 MB</span>
              </div>
              <div className="flex justify-between">
                <span>Allowed Exts:</span>
                <span className="font-bold text-zinc-300">.pdf</span>
              </div>
              <div className="flex justify-between">
                <span>MIME Checks:</span>
                <span className="font-bold text-zinc-300">application/pdf</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Category 3: Audio recordings */}
        <Card title="Audio Dictation" hoverable>
          <div className="space-y-4">
            <div className="w-10 h-10 rounded-lg bg-accent-rose/10 flex items-center justify-center text-accent-rose">
              <Music className="h-5 w-5" />
            </div>
            <div className="space-y-1.5 text-xs text-zinc-550">
              <div className="flex justify-between">
                <span>Maximum Size:</span>
                <span className="font-bold text-zinc-300">20 MB</span>
              </div>
              <div className="flex justify-between">
                <span>Allowed Exts:</span>
                <span className="font-bold text-zinc-300">.wav, .mp3</span>
              </div>
              <div className="flex justify-between">
                <span>MIME Checks:</span>
                <span className="font-bold text-zinc-300">audio/wav, audio/mpeg</span>
              </div>
            </div>
          </div>
        </Card>

      </div>
    </div>
  );
};

export default FileManagement;
