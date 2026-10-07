import { Check, Copy, Download, Upload } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { generateNagiosConfig } from '@/domain/nagios-config';
import type { Target } from '@/domain/types';
import { downloadText } from '@/lib/download';

export interface ExportDialogProps {
  open: boolean;
  onClose: () => void;
  targets: readonly Target[];
  onImport: (targets: Target[]) => void;
}

type Block = 'hosts' | 'services';

export function ExportDialog({ open, onClose, targets, onImport }: ExportDialogProps) {
  const [copied, setCopied] = useState<Block | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const config = useMemo(() => generateNagiosConfig(targets), [targets]);

  const copy = async (block: Block) => {
    const text = block === 'hosts' ? config.hosts : config.services;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(block);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      setCopied(null);
    }
  };

  const handleImport = async (file: File) => {
    setImportError(null);
    try {
      const parsed = JSON.parse(await file.text()) as unknown;
      if (!Array.isArray(parsed)) {
        setImportError('That file does not contain a list of targets.');
        return;
      }
      onImport(parsed as Target[]);
    } catch {
      setImportError('That file could not be read as JSON.');
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Deploy configuration"
      description="Copy these objects into Nagios, then validate and reload."
      className="w-[min(56rem,calc(100vw-2rem))]"
    >
      <div className="flex flex-col gap-5">
        <dl className="grid gap-3 sm:grid-cols-3">
          <SummaryItem label="Hosts" value={config.hostCount} />
          <SummaryItem label="Services" value={config.serviceCount} />
          <SummaryItem label="Disabled (excluded)" value={config.disabled.length} />
        </dl>

        <ConfigBlock
          title="hosts.cfg"
          description="One host per address, plus host groups by target kind."
          content={config.hosts}
          filename="hosts.cfg"
          copied={copied === 'hosts'}
          onCopy={() => void copy('hosts')}
        />

        <ConfigBlock
          title="services.cfg"
          description="One service per enabled target."
          content={config.services}
          filename="services.cfg"
          copied={copied === 'services'}
          onCopy={() => void copy('services')}
        />

        <div className="rounded-lg border border-border bg-muted/40 p-4">
          <h3 className="text-xs font-semibold">Apply to Nagios</h3>
          <ol className="mt-2 flex list-decimal flex-col gap-1 pl-4 text-xs text-muted-foreground">
            <li>
              Save the two files into <code className="font-mono">objects/generated/</code> on the
              Nagios host.
            </li>
            <li>
              Validate: <code className="font-mono">nagios -v /usr/local/nagios/etc/nagios.cfg</code>
            </li>
            <li>
              Reload: <code className="font-mono">systemctl reload nagios</code> (or{' '}
              <code className="font-mono">service nagios reload</code>)
            </li>
          </ol>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-4">
          <div className="flex flex-col gap-1">
            <h3 className="text-xs font-semibold">Target registry backup</h3>
            <p className="text-xs text-muted-foreground">
              Export the registry as JSON, or restore a previous export.
            </p>
            {importError ? (
              <p className="text-xs text-status-critical-foreground">{importError}</p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                downloadText(
                  'monitoring-targets.json',
                  JSON.stringify(targets, null, 2),
                  'application/json',
                )
              }
            >
              <Download aria-hidden="true" />
              Backup JSON
            </Button>
            <Button variant="outline" size="sm" onClick={() => fileInput.current?.click()}>
              <Upload aria-hidden="true" />
              Restore JSON
            </Button>
            <input
              ref={fileInput}
              type="file"
              accept="application/json,.json"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void handleImport(file);
                event.target.value = '';
              }}
            />
          </div>
        </div>
      </div>
    </Dialog>
  );
}

function SummaryItem({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border p-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-lg font-semibold tabular-nums">{value}</dd>
    </div>
  );
}

interface ConfigBlockProps {
  title: string;
  description: string;
  content: string;
  filename: string;
  copied: boolean;
  onCopy: () => void;
}

function ConfigBlock({
  title,
  description,
  content,
  filename,
  copied,
  onCopy,
}: ConfigBlockProps) {
  return (
    <section className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-xs font-semibold">{title}</h3>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onCopy}>
            {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
            {copied ? 'Copied' : 'Copy'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => downloadText(filename, content)}
            aria-label={`Download ${filename}`}
          >
            <Download aria-hidden="true" />
            Download
          </Button>
        </div>
      </div>
      <pre className="max-h-56 overflow-auto rounded-lg border border-border bg-muted/40 p-3 font-mono text-xs leading-relaxed">
        {content}
      </pre>
    </section>
  );
}
