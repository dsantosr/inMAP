import React, { useRef } from 'react';
import type { FlowchartData } from '../types/flowchart';
import { Upload, Download, FileJson, Edit2, Image } from 'lucide-react';

interface SidebarProps {
  flowData: FlowchartData | null;
  setFlowData: React.Dispatch<React.SetStateAction<FlowchartData | null>>;
  onAddAction: () => void;
  selectedActionId: string | null;
  onEditSelected: () => void;
  onExportPNG: () => void;
  isExporting: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ flowData, setFlowData, onAddAction, selectedActionId, onEditSelected, onExportPNG, isExporting }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string) as FlowchartData;
        setFlowData(json);
      } catch (error) {
        alert("Erro ao ler JSON. O formato é inválido.");
      }
    };
    reader.readAsText(file);
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDownload = () => {
    if (!flowData) return;
    const blob = new Blob([JSON.stringify(flowData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${flowData.name || "fluxograma"}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="sidebar">
      <div style={{ marginBottom: "1.5rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem", textAlign: "center" }}>
        <img src="/Logo.png" alt="ITERMA Logo" style={{ height: "48px", width: "auto" }} title="ITERMA" />
        <div>
          <h1 style={{ margin: 0, fontSize: "1.2rem" }}>inMAP</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.75rem", margin: 0, marginTop: "0.2rem" }}>
            Mapeamento Interno
          </p>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "2rem" }}>
        <input
          type="file"
          accept=".json"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleFileUpload}
        />
        <button className="btn" onClick={() => fileInputRef.current?.click()}>
          <Upload size={14} /> Importar JSON
        </button>
        <button className="btn btn-secondary" onClick={handleDownload} disabled={!flowData || isExporting}>
          <Download size={14} /> Exportar JSON
        </button>
        <button 
          className="btn" 
          onClick={onExportPNG} 
          disabled={!flowData || isExporting}
          style={{ backgroundColor: isExporting ? "var(--border-color)" : "var(--panel-bg)", border: "1px solid var(--border-color)" }}
        >
          <Image size={14} /> {isExporting ? "Gerando Imagem..." : "Exportar PNG"}
        </button>
        <button className="btn" style={{ backgroundColor: "var(--accent-color)", marginTop: "0.5rem" }} onClick={onAddAction}>
          Adicionar Ação
        </button>
        <button
          className="btn"
          style={{
            backgroundColor: selectedActionId ? "#FDBD13" : "transparent",
            color: selectedActionId ? "#111" : "var(--text-secondary)",
            border: selectedActionId ? "none" : "1px solid var(--border-color)",
            marginTop: "0.5rem"
          }}
          onClick={onEditSelected}
          disabled={!selectedActionId}
        >
          <Edit2 size={14} /> Editar Ação
        </button>
      </div>

      {flowData && (
        <div className="sidebar-editor">
          <h2 style={{ fontSize: "0.9rem", marginBottom: "0.5rem" }}>Propriedades</h2>
          <div style={{ padding: "0.75rem", backgroundColor: "rgba(0,0,0,0.2)", borderRadius: "6px" }}>
            <div style={{ marginBottom: "0.75rem" }}>
              <label style={{ display: "block", fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "0.3rem" }}>Nome do Fluxo</label>
              <input
                type="text"
                value={flowData.name}
                onChange={(e) => setFlowData({ ...flowData, name: e.target.value })}
                style={{
                  width: "100%", padding: "0.4rem", borderRadius: "4px", border: "1px solid var(--border-color)",
                  background: "var(--bg-color)", color: "var(--text-primary)", fontSize: "0.8rem"
                }}
              />
            </div>
            <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
              <FileJson size={12} style={{ display: "inline", verticalAlign: "middle", marginRight: "5px" }} />
              Total de ações: {flowData.actions.length}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
