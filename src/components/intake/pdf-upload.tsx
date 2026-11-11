'use client';

import React, { useState, useRef } from 'react';
import { UploadCloud, File, X, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PdfFileInfo {
  file: File;
  name: string;
  size: number;
  estimatedPages: number;
}

interface PdfUploadProps {
  onFileChange: (info: PdfFileInfo | null) => void;
  wordDensity?: number;
}

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

export function PdfUpload({ onFileChange, wordDensity = 500 }: PdfUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [fileInfo, setFileInfo] = useState<PdfFileInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File) {
    setError(null);

    const isPdf = file.name.endsWith('.pdf') || file.type === 'application/pdf';
    if (!isPdf) {
      setError('Invalid file format. Please upload a PDF document (.pdf).');
      setFileInfo(null);
      onFileChange(null);
      return;
    }

    if (file.size === 0) {
      setError('The selected file is empty. Please choose a valid PDF document.');
      setFileInfo(null);
      onFileChange(null);
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError('File size exceeds the 25 MB limit. Please select a smaller PDF.');
      setFileInfo(null);
      onFileChange(null);
      return;
    }

    // Client-side heuristic estimate before server-side physical page verification
    const approxWords = Math.max(1, Math.round(file.size / 45));
    const estimatedPages = Math.max(1, Math.ceil(approxWords / wordDensity));

    const info: PdfFileInfo = {
      file,
      name: file.name,
      size: file.size,
      estimatedPages,
    };

    setFileInfo(info);
    onFileChange(info);
  }

  function handleDrag(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  }

  function handleRemove() {
    setFileInfo(null);
    setError(null);
    onFileChange(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }

  function formatBytes(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return (
    <div className="space-y-4">
      <input
        ref={inputRef}
        type="file"
        id="pdf-file-input"
        accept=".pdf,application/pdf"
        onChange={handleChange}
        className="sr-only"
        aria-label="Upload PDF file"
      />

      {!fileInfo ? (
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            'flex flex-col items-center justify-center p-8 md:p-12 border-2 border-dashed rounded-xl cursor-pointer transition-colors text-center',
            dragActive
              ? 'border-teal-accent bg-teal-50/50'
              : 'border-surface-borderDefault hover:border-teal-accent bg-surface-cardBackground hover:bg-slate-50/60'
          )}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          aria-label="Dropzone for PDF manuscript document"
        >
          <div className="w-14 h-14 rounded-full bg-teal-50 flex items-center justify-center text-teal-accent mb-4 shadow-subtle">
            <UploadCloud className="w-7 h-7" aria-hidden="true" />
          </div>
          <p className="text-base font-semibold text-brand-navyPrimary">
            Click to upload or drag & drop PDF (.pdf)
          </p>
          <p className="mt-1 text-xs text-neutral-gray max-w-sm">
            Digital and scanned PDFs supported. Scanned documents will be flagged for OCR processing. Maximum 25 MB.
          </p>
          <span className="mt-4 px-3 py-1.5 text-xs font-medium rounded-md bg-slate-100 text-neutral-textSecondary">
            Browse file on device
          </span>
        </div>
      ) : (
        <div className="p-5 rounded-xl border border-teal-200 bg-teal-50/40 shadow-subtle">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-teal-accent text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                <File className="w-5 h-5" aria-hidden="true" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-brand-navyPrimary truncate max-w-md">
                    {fileInfo.name}
                  </h4>
                  <CheckCircle2 className="w-4 h-4 text-scientific-pass flex-shrink-0" aria-hidden="true" />
                </div>
                <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-neutral-gray">
                  <span>Size: {formatBytes(fileInfo.size)}</span>
                  <span>•</span>
                  <span className="font-medium text-brand-navyPrimary">
                    Physical Page Count: Verified during server intake
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleRemove}
              className="p-1.5 text-slate-400 hover:text-scientific-fail rounded-md hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-scientific-fail"
              title="Remove file"
              aria-label="Remove selected PDF file"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          <div className="mt-3 flex items-center gap-2 text-xs text-neutral-textSecondary">
            <span className="w-2 h-2 rounded-full bg-teal-accent flex-shrink-0" aria-hidden="true" />
            <span>Exact physical page count will be determined using PDF structural markers on intake.</span>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg text-xs bg-red-50 border border-red-200 text-scientific-fail" role="alert">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
