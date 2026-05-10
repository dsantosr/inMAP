import React, { useRef } from 'react';
import { Upload, CheckCircle, AlertCircle } from 'lucide-react';

interface UploadZoneProps {
  label: string;
  fileType: string;
  accepted: string;
  loaded: boolean;
  onFile: (text: string) => void;
  rowCount?: number;
}

const UploadZoneItem: React.FC<UploadZoneProps> = ({
  label,
  fileType,
  accepted,
  loaded,
  onFile,
  rowCount,
}) => {
  const ref = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) onFile(ev.target.result as string);
    };
    reader.readAsText(file, 'UTF-8');
    if (ref.current) ref.current.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) onFile(ev.target.result as string);
    };
    reader.readAsText(file, 'UTF-8');
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      onClick={() => ref.current?.click()}
      style={{
        flex: 1,
        border: `2px dashed ${loaded ? 'var(--accent-color)' : 'var(--border-color)'}`,
        borderRadius: '10px',
        padding: '1.2rem',
        cursor: 'pointer',
        background: loaded ? 'rgba(253,189,19,0.06)' : 'transparent',
        transition: 'all 0.2s',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.5rem',
        textAlign: 'center',
      }}
    >
      <input
        ref={ref}
        type="file"
        accept={accepted}
        style={{ display: 'none' }}
        onChange={handleFile}
      />
      {loaded ? (
        <CheckCircle size={22} color="var(--accent-color)" />
      ) : (
        <Upload size={22} color="var(--text-secondary)" />
      )}
      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: loaded ? 'var(--accent-color)' : 'var(--text-primary)' }}>
        {label}
      </div>
      <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
        {loaded ? `✓ ${rowCount ?? '?'} registros carregados` : `Arraste ou clique — ${fileType}`}
      </div>
    </div>
  );
};

interface UploadZoneProps2 {
  consolidadoLoaded: boolean;
  sicarfLoaded: boolean;
  consolidadoCount: number;
  sicarfCount: number;
  onConsolidado: (text: string) => void;
  onSICARF: (text: string) => void;
}

export const UploadZone: React.FC<UploadZoneProps2> = ({
  consolidadoLoaded,
  sicarfLoaded,
  consolidadoCount,
  sicarfCount,
  onConsolidado,
  onSICARF,
}) => {
  return (
    <div style={{ marginBottom: '1rem' }}>
      {!consolidadoLoaded || !sicarfLoaded ? (
        <div style={{
          background: 'var(--panel-bg)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          padding: '1.25rem',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            marginBottom: '0.85rem',
          }}>
            <AlertCircle size={15} color="var(--accent-color)" />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Faça upload dos dois arquivos CSV para começar a análise
            </span>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <UploadZoneItem
              label="Dados Técnicos (Consolidado)"
              fileType="consolidado_municipios_ma.csv"
              accepted=".csv"
              loaded={consolidadoLoaded}
              onFile={onConsolidado}
              rowCount={consolidadoCount}
            />
            <UploadZoneItem
              label="Dados SICARF (REURB)"
              fileType="Relatorio_SICARF_municipios.csv"
              accepted=".csv"
              loaded={sicarfLoaded}
              onFile={onSICARF}
              rowCount={sicarfCount}
            />
          </div>
        </div>
      ) : (
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          alignItems: 'center',
          padding: '0.6rem 1rem',
          background: 'rgba(253,189,19,0.08)',
          borderRadius: '8px',
          border: '1px solid rgba(253,189,19,0.3)',
        }}>
          <CheckCircle size={14} color="var(--accent-color)" />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            <strong style={{ color: 'var(--accent-color)' }}>{consolidadoCount}</strong> municípios do Consolidado ·{' '}
            <strong style={{ color: 'var(--accent-color)' }}>{sicarfCount}</strong> municípios do SICARF carregados
          </span>
          <button
            onClick={() => { onConsolidado(''); onSICARF(''); }}
            style={{
              marginLeft: 'auto',
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              fontSize: '0.65rem',
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            Redefinir arquivos
          </button>
        </div>
      )}
    </div>
  );
};
