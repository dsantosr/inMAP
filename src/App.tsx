import { useState, useRef } from 'react';
import { toPng } from 'html-to-image';
import './App.css';
import { Sidebar } from './components/Sidebar';
import { SwimlaneViewer } from './components/SwimlaneViewer';
import { ActionEditor } from './components/ActionEditor';
import { ProcessDashboard } from './components/ProcessDashboard';
import type { FlowchartData, FlowAction } from './types/flowchart';

export type AppModule = 'flowchart' | 'processos';

function App() {
  const [activeModule, setActiveModule] = useState<AppModule>('flowchart');
  const [flowData, setFlowData] = useState<FlowchartData | null>(null);
  const [editingAction, setEditingAction] = useState<FlowAction | Partial<FlowAction> | null>(null);
  const [selectedActionId, setSelectedActionId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  const handleSaveAction = (action: FlowAction) => {
    if (!flowData) {
      setFlowData({ name: "Novo Fluxograma", actions: [action] });
    } else {
      const exists = flowData.actions.find(a => a.id === action.id);
      const newActions = exists
        ? flowData.actions.map(a => a.id === action.id ? action : a)
        : [...flowData.actions, action];
      setFlowData({ ...flowData, actions: newActions });
    }
    setEditingAction(null);
  };

  const handleEditSelected = () => {
    if (!flowData || !selectedActionId) return;
    const actionToEdit = flowData.actions.find(a => a.id === selectedActionId);
    if (actionToEdit) setEditingAction(actionToEdit);
  };

  const handleExportPNG = async () => {
    if (!exportRef.current || !flowData) return;
    setIsExporting(true);

    setTimeout(async () => {
      try {
        const dataUrl = await toPng(exportRef.current!, {
          backgroundColor: '#1a1a1a',
          pixelRatio: 2
        });
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `${flowData.name || 'fluxograma'}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } catch (err) {
        console.error("Erro ao exportar PNG", err);
        alert("Erro ao exportar imagem.");
      } finally {
        setIsExporting(false);
      }
    }, 500);
  };

  return (
    <div className="layout-container">
      <Sidebar
        activeModule={activeModule}
        onModuleChange={setActiveModule}
        flowData={flowData}
        setFlowData={setFlowData}
        onAddAction={() => setEditingAction({})}
        selectedActionId={selectedActionId}
        onEditSelected={handleEditSelected}
        onExportPNG={handleExportPNG}
        isExporting={isExporting}
      />
      <div className="main-view">
        {activeModule === 'flowchart' ? (
          <SwimlaneViewer
            flowData={flowData}
            selectedActionId={selectedActionId}
            onSelectAction={setSelectedActionId}
            exportRef={exportRef}
            isExporting={isExporting}
            onChangeName={(newName: string) => flowData && setFlowData({ ...flowData, name: newName })}
          />
        ) : (
          <ProcessDashboard />
        )}
      </div>
      {editingAction !== null && activeModule === 'flowchart' && (
        <ActionEditor
          initialAction={Object.keys(editingAction).length ? editingAction as FlowAction : null}
          existingActors={flowData ? Array.from(new Set(flowData.actions.map(a => a.who))) : []}
          existingActions={flowData ? flowData.actions : []}
          onSave={handleSaveAction}
          onClose={() => setEditingAction(null)}
        />
      )}
    </div>
  );
}

export default App;
