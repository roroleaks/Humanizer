'use client';

import React, { useState } from 'react';
import { Globe, ArrowRight, AlertTriangle, CheckCircle2, ShieldCheck, X } from 'lucide-react';

interface UrlImportProps {
  onUrlChange: (url: string | null) => void;
}

export function UrlImport({ onUrlChange }: UrlImportProps) {
  const [urlInput, setUrlInput] = useState('');
  const [confirmedUrl, setConfirmedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function validateUrl(input: string): boolean {
    setError(null);
    const trimmed = input.trim();

    if (!trimmed) {
      setError('Please enter a URL.');
      return false;
    }

    let parsed: URL;
    try {
      parsed = new URL(trimmed);
    } catch {
      setError('Invalid URL format. Please enter a full URL including https://.');
      return false;
    }

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      setError('Only http:// and https:// URLs are supported.');
      return false;
    }

    const host = parsed.hostname.toLowerCase();

    // Block localhost, loopbacks, cloud metadata
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '::1' ||
      host === '169.254.169.254' ||
      host.endsWith('.local') ||
      host.endsWith('.internal')
    ) {
      setError('Security violation: Loopback and internal cloud metadata addresses are strictly blocked.');
      return false;
    }

    // Block RFC 1918 Private IP Ranges (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16)
    const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    const ipMatch = host.match(ipv4Regex);
    if (ipMatch) {
      const b1 = parseInt(ipMatch[1], 10);
      const b2 = parseInt(ipMatch[2], 10);

      if (
        b1 === 10 ||
        (b1 === 172 && b2 >= 16 && b2 <= 31) ||
        (b1 === 192 && b2 === 168) ||
        b1 === 127 ||
        (b1 === 169 && b2 === 254)
      ) {
        setError('Security violation: RFC 1918 private network addresses are strictly blocked to prevent SSRF.');
        return false;
      }
    }

    return true;
  }

  function handleFetch(e: React.FormEvent) {
    e.preventDefault();
    if (validateUrl(urlInput)) {
      const cleanUrl = urlInput.trim();
      setConfirmedUrl(cleanUrl);
      onUrlChange(cleanUrl);
    } else {
      setConfirmedUrl(null);
      onUrlChange(null);
    }
  }

  function handleClear() {
    setUrlInput('');
    setConfirmedUrl(null);
    setError(null);
    onUrlChange(null);
  }

  return (
    <div className="space-y-4">
      {!confirmedUrl ? (
        <form onSubmit={handleFetch} className="space-y-3">
          <label htmlFor="manuscript-url-input" className="block text-sm font-semibold text-brand-navyPrimary">
            Manuscript Web Article or Preprint URL
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-gray">
                <Globe className="w-4 h-4" aria-hidden="true" />
              </div>
              <input
                type="url"
                id="manuscript-url-input"
                value={urlInput}
                onChange={(e) => {
                  setUrlInput(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="https://biorxiv.org/content/10.1101/... or open-access DOI link"
                className="w-full pl-9 pr-3 py-2.5 text-sm bg-white border border-surface-borderDefault rounded-lg shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-accent text-neutral-textPrimary placeholder:text-neutral-gray"
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold rounded-lg bg-teal-accent text-white hover:bg-teal-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-teal-accent transition-colors shadow-sm flex-shrink-0"
            >
              <span>Verify & Import</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
          <p className="text-xs text-neutral-gray">
            Supports open-access research articles, preprints (bioRxiv, medRxiv, arXiv), and public HTML papers.
          </p>
        </form>
      ) : (
        <div className="p-5 rounded-xl border border-teal-200 bg-teal-50/40 shadow-subtle">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-teal-accent text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                <Globe className="w-5 h-5" aria-hidden="true" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-brand-navyPrimary break-all max-w-lg">
                    {confirmedUrl}
                  </h4>
                  <CheckCircle2 className="w-4 h-4 text-scientific-pass flex-shrink-0" aria-hidden="true" />
                </div>
                <p className="mt-1.5 text-xs text-neutral-gray">
                  Public destination verified. Full content extraction and section decomposition will execute upon clicking Begin Processing.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleClear}
              className="p-1.5 text-slate-400 hover:text-scientific-fail rounded-md hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-scientific-fail"
              title="Clear URL"
              aria-label="Clear selected URL"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 p-3 rounded-lg text-xs bg-red-50 border border-red-200 text-scientific-fail" role="alert">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex items-center gap-2 p-3 rounded-lg text-xs bg-slate-50 border border-slate-200 text-neutral-textSecondary">
        <ShieldCheck className="w-4 h-4 text-teal-accent flex-shrink-0" aria-hidden="true" />
        <span>SSRF Guard active: Loopback, private IP ranges (RFC 1918), and internal metadata endpoints are blocked.</span>
      </div>
    </div>
  );
}
