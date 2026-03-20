import React, { useState, useEffect } from 'react';
import type { FlowAction, FlowConnection } from '../types/flowchart';
import { X, Save } from 'lucide-react';

interface ActionEditorProps {
  initialAction: FlowAction | null;
  existingActors: string[];
  existingActions: FlowAction[];
  onSave: (action: FlowAction) => void;
  onClose: () => void;
}

interface OrganogramData {
  organization_structure: {
    sector: string;
  }[];
}

export const ActionEditor: React.FC<ActionEditorProps> = ({ initialAction, existingActors, existingActions, onSave, onClose }) => {
  const [action, setAction] = useState<Partial<FlowAction>>({});
  const [organogramSectors, setOrganogramSectors] = useState<string[]>([]);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}organogram.json`)
      .then(res => res.json())
      .then((data: OrganogramData) => setOrganogramSectors(data.organization_structure.map(s => s.sector)))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (initialAction) {
      setAction(initialAction);
    } else {
      let nextId = "A1";
      if (existingActions && existingActions.length > 0) {
         let maxNum = 0;
         for (const a of existingActions) {
           const match = a.id.match(/^A(\d+)$/i);
           if (match) {
              const num = parseInt(match[1]);
              if (num > maxNum) maxNum = num;
           }
         }
         if (maxNum > 0) nextId = `A${maxNum + 1}`;
         else nextId = `A${existingActions.length + 1}`;
      }
      
      setAction({
        id: nextId,
        what: '',
        who: '',
        how: '',
        reference: '',
        connection: { type: 'none' }
      });
    }
  }, [initialAction]);

  const handleChange = (field: keyof FlowAction, value: any) => {
    setAction(prev => ({ ...prev, [field]: value }));
  };

  const handleConnectionChange = (field: string, value: any) => {
    setAction(prev => {
      const conn = { ...(prev.connection || { type: 'none' }) } as any;
      if (field === 'type') {
        // Reset subfields when type changes
        if (value === 'simple') return { ...prev, connection: { type: 'simple', to: '' } };
        if (value === 'bifurcation') return { ...prev, connection: { type: 'bifurcation', to: [''] } };
        if (value === 'conditional') return { ...prev, connection: { type: 'conditional', text: '', positiveTo: '', negativeTo: '' } };
        return { ...prev, connection: { type: 'none' } };
      }
      conn[field] = value;
      return { ...prev, connection: conn as FlowConnection };
    });
  };

  if (!action.id) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
    }}>
      <div style={{
        backgroundColor: 'var(--panel-bg)', width: '500px', maxHeight: '90vh', overflowY: 'auto',
        borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: 'var(--glass-shadow)',
        display: 'flex', flexDirection: 'column'
      }}>
        <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, color: '#fff' }}>{initialAction ? 'Editar Ação' : 'Nova Ação'}</h3>
          <button style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }} onClick={onClose}><X size={20} /></button>
        </div>

        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ flex: '1' }}>
              <label style={labelStyle}>ID do Bloco</label>
              <input style={{...inputStyle, fontWeight: 'bold'}} value={action.id || ''} onChange={e => handleChange('id', e.target.value.trim())} placeholder="Ex: A1" disabled={!!initialAction} />
            </div>
            <div style={{ flex: '3' }}>
              <label style={labelStyle}>O quê? (Ação)</label>
              <input style={inputStyle} value={action.what || ''} onChange={e => handleChange('what', e.target.value)} placeholder="Ex: Receber documento" />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Quem? (Ator)</label>
            <input 
              style={inputStyle} 
              value={action.who || ''} 
              onChange={e => handleChange('who', e.target.value)} 
              placeholder="Ex: Atendimento" 
              list="actors-list"
            />
            <datalist id="actors-list">
              {Array.from(new Set([...existingActors, ...organogramSectors])).sort().map(actor => (
                <option key={actor} value={actor} />
              ))}
            </datalist>
          </div>
          <div>
            <label style={labelStyle}>Como? (Descrição)</label>
            <textarea style={{...inputStyle, minHeight: '80px', resize: 'vertical'}} value={action.how || ''} onChange={e => handleChange('how', e.target.value)} placeholder="Descreva os passos..." />
          </div>
          <div>
            <label style={labelStyle}>Referência Normativa</label>
            <input style={inputStyle} value={action.reference || ''} onChange={e => handleChange('reference', e.target.value)} placeholder="Ex: Art 2º da IN 01/2023" />
          </div>

          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '0.5rem' }}>
            <label style={labelStyle}>Tipo de Conexão (Próximo Passo)</label>
            <select style={inputStyle} value={action.connection?.type || 'none'} onChange={e => handleConnectionChange('type', e.target.value)}>
              <option value="none">Nenhuma (Fim ou Pendente)</option>
              <option value="simple">Simples</option>
              <option value="bifurcation">Bifurcação (Paralela)</option>
              <option value="conditional">Condicional (Decisão)</option>
            </select>

            {action.connection?.type === 'simple' && (
              <div style={{ marginTop: '1rem' }}>
                <label style={labelStyle}>Ir para (ID da ação):</label>
                <input style={inputStyle} value={(action.connection as any).to || ''} onChange={e => handleConnectionChange('to', e.target.value)} placeholder="ID do próximo passo" list="action-ids" />
              </div>
            )}
            
            {action.connection?.type === 'bifurcation' && (
              <div style={{ marginTop: '1rem' }}>
                <label style={labelStyle}>Ir para (IDs separados por vírgula):</label>
                <input style={inputStyle} value={((action.connection as any).to || []).join(', ')} onChange={e => handleConnectionChange('to', e.target.value.split(',').map((s: string) => s.trim()))} placeholder="ID1, ID2, ID3" />
              </div>
            )}

            {action.connection?.type === 'conditional' && (
              <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                <div>
                  <label style={labelStyle}>Texto da Condição (Pergunta)</label>
                  <input style={inputStyle} value={(action.connection as any).text || ''} onChange={e => handleConnectionChange('text', e.target.value)} placeholder="Ex: Documento válido?" />
                </div>
                <div>
                  <label style={labelStyle}>Se POSITIVO, ir para (ID):</label>
                  <input style={inputStyle} value={(action.connection as any).positiveTo || ''} onChange={e => handleConnectionChange('positiveTo', e.target.value)} list="action-ids" />
                </div>
                <div>
                  <label style={labelStyle}>Se NEGATIVO, ir para (ID):</label>
                  <input style={inputStyle} value={(action.connection as any).negativeTo || ''} onChange={e => handleConnectionChange('negativeTo', e.target.value)} list="action-ids" />
                </div>
              </div>
            )}

            <datalist id="action-ids">
              {existingActions.filter(a => a.id !== action.id).map(a => (
                <option key={a.id} value={a.id} label={`${a.id} - ${a.what}`} />
              ))}
            </datalist>
          </div>
        </div>

        <div style={{ padding: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <button className="btn btn-secondary" style={{ color: 'var(--danger-color)', borderColor: 'var(--danger-color)' }} onClick={onClose}>Cancelar</button>
          <button className="btn" onClick={() => onSave(action as FlowAction)}>
            <Save size={18} /> Salvar
          </button>
        </div>
      </div>
    </div>
  );
};

const labelStyle = { display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' };
const inputStyle = { width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-primary)', fontFamily: 'inherit' };
