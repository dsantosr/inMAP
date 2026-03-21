import React, { useState, useEffect, useRef } from 'react';
import type { FlowchartData, FlowAction } from '../types/flowchart';
import { LayoutTemplate, ChevronDown, ChevronUp, ZoomIn, ZoomOut, Maximize, Edit2 } from 'lucide-react';

interface SwimlaneViewerProps {
  flowData: FlowchartData | null;
  selectedActionId: string | null;
  onSelectAction: (id: string | null) => void;
  exportRef?: React.RefObject<HTMLDivElement | null>;
  isExporting?: boolean;
  onChangeName?: (name: string) => void;
}

interface OrganogramData {
  theme_config: {
    acting_levels: Record<string, { hue: number; saturation: number; lightness: number }>;
    hierarchy_styles: Record<string, string>;
  };
  organization_structure: {
    sector: string;
    aliases?: string[];
    acting_level: string;
    reports_to: string | null;
    hierarchy_type: "root" | "parent" | "child" | "grandchild";
  }[];
}

const getActionLevels = (actions: FlowAction[]): Record<string, number> => {
  const levels: Record<string, number> = {};
  const graph: Record<string, string[]> = {};
  const inDegree: Record<string, number> = {};
  const backEdges = new Set<string>();

  actions.forEach(a => {
    graph[a.id] = [];
    levels[a.id] = 0;
  });

  actions.forEach(a => {
    let targets: string[] = [];
    if (a.connection.type === 'simple' && (a.connection as any).to) targets.push((a.connection as any).to);
    else if (a.connection.type === 'bifurcation' && (a.connection as any).to) targets.push(...(a.connection as any).to);
    else if (a.connection.type === 'conditional') {
      if ((a.connection as any).positiveTo) targets.push((a.connection as any).positiveTo);
      if ((a.connection as any).negativeTo) targets.push((a.connection as any).negativeTo);
    }
    targets.forEach(t => {
      if (graph[a.id]) {
         graph[a.id].push(t);
      }
    });
  });

  const state: Record<string, 'unvisited' | 'visiting' | 'visited'> = {};
  actions.forEach(a => state[a.id] = 'unvisited');

  const dfs = (node: string) => {
    state[node] = 'visiting';
    (graph[node] || []).forEach(neighbor => {
      if (state[neighbor] === 'visiting') {
        backEdges.add(`${node}->${neighbor}`);
      } else if (state[neighbor] === 'unvisited') {
        dfs(neighbor);
      }
    });
    state[node] = 'visited';
  };

  actions.forEach(a => {
    if (state[a.id] === 'unvisited') dfs(a.id);
  });

  actions.forEach(a => {
    inDegree[a.id] = 0;
  });
  actions.forEach(a => {
    graph[a.id].forEach(t => {
      if (!backEdges.has(`${a.id}->${t}`) && inDegree[t] !== undefined) {
        inDegree[t]++;
      }
    });
  });

  let queue = actions.filter(a => inDegree[a.id] === 0).map(a => a.id);
  if (queue.length === 0 && actions.length > 0) queue.push(actions[0].id);

  while (queue.length > 0) {
    const curr = queue.shift()!;
    const currLevel = levels[curr] || 0;

    (graph[curr] || []).forEach(target => {
      if (backEdges.has(`${curr}->${target}`)) return;

      const act = actions.find(a => a.id === curr);
      const targetAct = actions.find(a => a.id === target);
      const isCond = act?.connection.type === 'conditional';
      
      // Se mudar de ator (raia), permitimos o mesmo nível (alinhamento vertical)
      // Se for o mesmo ator, precisamos de no mínimo 1 (ou 2 se for condicional para dar espaço ao diamante)
      // Se for condicional, precisamos de pelo menos 1 (no caso de ator diferente) para passar o losango
      let jump = 0;
      if (act?.who === targetAct?.who) {
        jump = isCond ? 3 : 2;
      } else if (isCond) {
        jump = 1;
      } else {
        // Descolamento em cascata de 0.4 níveis (40px) para melhorar leitura de conexões verticais longas
        jump = 0.4;
      }

      if (levels[target] < currLevel + jump) {
        levels[target] = currLevel + jump;
      }
      
      inDegree[target]--;
      if (inDegree[target] === 0) {
        queue.push(target);
      }
    });
  }

  let overlapResolved = false;
  while (!overlapResolved) {
    overlapResolved = true;
    const nextAvailableByActor: Record<string, number> = {};
    
    const sortedActions = [...actions].sort((a,b) => levels[a.id] - levels[b.id]);
    sortedActions.forEach(a => {
       const minAllowed = nextAvailableByActor[a.who] || 0;
       
       if (levels[a.id] < minAllowed) {
          levels[a.id] = minAllowed;
          overlapResolved = false;
       }
       
        const isCond = a.connection.type === 'conditional';
        // Colunas de 100px, Card de 150px.
        // span = 2 -> Próximo começa em 200px. Gap = 200 - 150 = 50px fixos.
        // span = 3 -> Próximo começa em 300px. Gap = 300 - (150 + diametro ~85) = ~65px.
        const span = isCond ? 3 : 2;
        
        nextAvailableByActor[a.who] = levels[a.id] + span;
    });
  }
  return levels;
};

export const SwimlaneViewer: React.FC<SwimlaneViewerProps> = ({ flowData, selectedActionId, onSelectAction, exportRef, isExporting = false, onChangeName }) => {
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [paths, setPaths] = useState<any[]>([]);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });
  const [organogram, setOrganogram] = useState<OrganogramData | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const contentRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const actionLevels = React.useMemo(() => flowData ? getActionLevels(flowData.actions) : {}, [flowData]);
  const maxLevel = Math.ceil(Math.max(0, ...Object.values(actionLevels)));

  const activeZoom = isExporting ? 1 : zoomLevel;

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}organogram.json`)
      .then(res => res.json())
      .then(data => setOrganogram(data))
      .catch(console.error);
  }, []);

  const getActorStyle = (actorName: string): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      width: "140px",
      minWidth: "140px",
      borderTopLeftRadius: "8px",
      borderBottomLeftRadius: "8px",
      padding: "0.5rem",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      textAlign: "center",
      fontWeight: "600",
      fontSize: "0.80rem",
      boxSizing: "border-box",
      position: "sticky",
      left: 0,
      zIndex: 10,
    };

    if (!organogram) {
      return { ...baseStyle, borderRight: "1px solid var(--border-color)", background: "rgba(69, 182, 74, 0.1)", color: "var(--accent-color)" };
    }

    const hierarchyWeight: Record<string, number> = {
      'root': 4,
      'parent': 3,
      'child': 2,
      'grandchild': 1
    };

    // Busca todos os setores que dão match (via nome do setor ou aliases)
    const matches = organogram.organization_structure.filter(s => {
      const matchSector = actorName.toLowerCase().includes(s.sector.toLowerCase());
      const matchAlias = s.aliases?.some(alias => actorName.toLowerCase().includes(alias.toLowerCase()));
      return matchSector || matchAlias;
    });

    if (matches.length === 0) {
      return {
        ...baseStyle,
        background: "linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), var(--bg-color, #1a1a1a)",
        border: "2px dotted #777",
        color: "#aaa"
      };
    }

    // Ordena pelo maior peso hierárquico
    matches.sort((a, b) => hierarchyWeight[b.hierarchy_type] - hierarchyWeight[a.hierarchy_type]);
    const sector = matches[0];

    const levelConfig = organogram.theme_config.acting_levels[sector.acting_level];
    if (!levelConfig) return { ...baseStyle, borderRight: "1px solid var(--border-color)" };

    const { hue, saturation, lightness } = levelConfig;
    const hslBase = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    const hslText = `hsl(${hue}, ${saturation}%, ${Math.max(lightness, 70)}%)`;

    switch (sector.hierarchy_type) {
      case 'root':
      case 'parent':
        return {
          ...baseStyle,
          background: hslBase,
          border: `1px solid ${hslBase}`,
          color: "#ffffff",
          textShadow: "1px 1px 2px rgba(0,0,0,0.5)"
        };
      case 'child':
        return {
          ...baseStyle,
          background: `linear-gradient(hsla(${hue}, ${saturation}%, ${lightness}%, 0.15), hsla(${hue}, ${saturation}%, ${lightness}%, 0.15)), var(--bg-color, #1a1a1a)`,
          border: `2px solid ${hslBase}`,
          color: hslText
        };
      case 'grandchild':
        return {
          ...baseStyle,
          background: "var(--bg-color, #1a1a1a)",
          border: `2px dashed ${hslBase}`,
          color: hslText
        };
      default:
        return { ...baseStyle, borderRight: "1px solid var(--border-color)" };
    }
  };

  const toggleExpand = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setExpandedCards(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const updateConnections = () => {
    if (!flowData || !contentRef.current) return;
    const contentRect = contentRef.current.getBoundingClientRect();

    // -- Phase 1: Build edge list --
    type Side = 'left'|'right'|'top'|'bottom';
    type Edge = { sourceId: string; targetId: string; color: string; index: number };
    type RoutedEdge = Edge & { sourceSide: Side; targetSide: Side; sourceRect: DOMRect; targetRect: DOMRect };

    const edges: Edge[] = [];
    flowData.actions.forEach(action => {
      if (action.connection.type === 'none') return;
      if (action.connection.type === 'conditional') {
         const decisionId = `decision-${action.id}`;
         edges.push({ sourceId: action.id, targetId: decisionId, color: '#ffffff', index: 0 });
         let vIndex = 1;
         if ((action.connection as any).positiveTo) {
           edges.push({ sourceId: decisionId, targetId: (action.connection as any).positiveTo, color: '#45B64A', index: vIndex++ });
         }
         if ((action.connection as any).negativeTo) {
           edges.push({ sourceId: decisionId, targetId: (action.connection as any).negativeTo, color: '#D91A21', index: vIndex++ });
         }
         return;
      }
      
      let targets: { id: string, color: string }[] = [];
      if (action.connection.type === 'simple' && (action.connection as any).to) {
         targets.push({ id: (action.connection as any).to, color: '#ffffff' });
      } else if (action.connection.type === 'bifurcation' && (action.connection as any).to) {
         (action.connection as any).to.forEach((t: string) => targets.push({ id: t, color: '#016295' }));
      }
      targets.forEach((target, index) => {
        edges.push({ sourceId: action.id, targetId: target.id, color: target.color, index });
      });
    });

    // -- Phase 2: Get structural metadata for each action --
    const actors = Array.from(new Set(flowData.actions.map(a => a.who)));
    const actorIndex: Record<string, number> = {};
    actors.forEach((a, i) => actorIndex[a] = i);

    const meta: Record<string, { rect: DOMRect; row: number; col: number }> = {};
    flowData.actions.forEach(a => {
      const el = document.getElementById(`action-${a.id}`);
      if (el) {
        meta[a.id] = { rect: el.getBoundingClientRect(), row: actorIndex[a.who] ?? 0, col: actionLevels[a.id] ?? 0 };
      }
      if (a.connection.type === 'conditional') {
        const del = document.getElementById(`decision-${a.id}`);
        if (del) {
          meta[`decision-${a.id}`] = { rect: del.getBoundingClientRect(), row: actorIndex[a.who] ?? 0, col: (actionLevels[a.id] ?? 0) + 0.5 };
        }
      }
    });

    // -- Phase 3: Choose sides using structural layout --
    // Track outgoing and incoming ports SEPARATELY per side per action
    const ports: Record<string, { out: Record<Side, RoutedEdge[]>; inc: Record<Side, RoutedEdge[]> }> = {};
    const initPorts = (id: string) => {
      if (!ports[id]) {
        ports[id] = {
          out: { top: [], bottom: [], left: [], right: [] },
          inc: { top: [], bottom: [], left: [], right: [] }
        };
      }
    };

    const allActionRects: { id: string, rect: DOMRect }[] = [];
    flowData.actions.forEach(a => {
       const el = document.getElementById(`action-${a.id}`);
       if (el) allActionRects.push({ id: a.id, rect: el.getBoundingClientRect() });
       if (a.connection.type === 'conditional') {
          const dl = document.getElementById(`decision-${a.id}`);
          if (dl) allActionRects.push({ id: `decision-${a.id}`, rect: dl.getBoundingClientRect() });
       }
    });

    const isIntersecting = (sx: number, sy: number, tx: number, ty: number, srcId: string, tgtId: string) => {
        return allActionRects.some(a => {
            if (a.id === srcId || a.id === tgtId) return false;
            const r = a.rect;
            const l = r.left - 10, right = r.right + 10, top = r.top - 10, bottom = r.bottom + 10;
            for (let step = 0.2; step <= 0.8; step += 0.2) {
                const px = sx + (tx - sx) * step;
                const py = sy + (ty - sy) * step;
                if (px >= l && px <= right && py >= top && py <= bottom) return true;
            }
            return false;
        });
    };

    type ExtendedRoutedEdge = RoutedEdge & { requiresAvoidance: boolean };
    const routedEdges: ExtendedRoutedEdge[] = [];

    edges.forEach(edge => {
      const src = meta[edge.sourceId];
      const tgt = meta[edge.targetId];
      if (!src || !tgt) return;

      let sourceSide: Side = 'right';
      let targetSide: Side = 'left';

      const isForward = tgt.col > src.col;
      const isBackward = tgt.col < src.col;
      const sameCol = tgt.col === src.col;
      const targetBelow = tgt.row > src.row;

      // Usar lados naturais para simplificar visualmente
      const isDecision = edge.sourceId.startsWith('decision-');

      if (isBackward) {
        if (isDecision) {
          sourceSide = targetBelow ? 'bottom' : 'top';
        } else {
          sourceSide = 'left';
        }
        targetSide = 'right';
      } else if (sameCol) {
        if (targetBelow) {
          sourceSide = 'bottom';
          targetSide = 'top';
        } else {
          sourceSide = 'top';
          targetSide = 'bottom';
        }
      } else if (isForward) {
        sourceSide = 'right';
        targetSide = 'left';
      }

      // Detecção de obstáculo para desvio pelas curvas (Bezier)
      const sx = src.rect.left + src.rect.width / 2;
      const sy = src.rect.top + src.rect.height / 2;
      const tx = tgt.rect.left + tgt.rect.width / 2;
      const ty = tgt.rect.top + tgt.rect.height / 2;

      const requiresAvoidance = isIntersecting(sx, sy, tx, ty, edge.sourceId, edge.targetId);

      initPorts(edge.sourceId);
      initPorts(edge.targetId);

      const routed: ExtendedRoutedEdge = { 
        ...edge, sourceSide, targetSide, sourceRect: src.rect, targetRect: tgt.rect, requiresAvoidance 
      };
      routedEdges.push(routed);
      ports[edge.sourceId].out[sourceSide].push(routed);
      ports[edge.targetId].inc[targetSide].push(routed);
    });

    // -- Phase 4: Compute attachment coordinates --
    // Outgoing and incoming get separate slots on the same side (space-evenly, not overlapping)
    const getCoord = (
      rect: DOMRect,
      side: Side,
      isOut: boolean,
      actionId: string
    ) => {
      const p = ports[actionId];
      const hasOut = p.out[side].length > 0;
      const hasInc = p.inc[side].length > 0;

      let fraction = 0.5;
      if (hasOut && hasInc) {
        fraction = isOut ? 0.35 : 0.65;
      }

      if (side === 'left')   return { x: rect.left,  y: rect.top + rect.height * fraction };
      if (side === 'right')  return { x: rect.right, y: rect.top + rect.height * fraction };
      if (side === 'top')    return { x: rect.left + rect.width * fraction, y: rect.top };
      if (side === 'bottom') return { x: rect.left + rect.width * fraction, y: rect.bottom };
      return { x: 0, y: 0 };
    };

    const newPaths = routedEdges.map(edge => {
      const start = getCoord(edge.sourceRect, edge.sourceSide, true, edge.sourceId);
      const end   = getCoord(edge.targetRect, edge.targetSide, false, edge.targetId);

      const x0 = (start.x - contentRect.left) / activeZoom;
      const y0 = (start.y - contentRect.top) / activeZoom;
      const x3 = (end.x - contentRect.left) / activeZoom;
      const y3 = (end.y - contentRect.top) / activeZoom;

      const stub = 8;
      let x1 = x0, y1 = y0;
      if (edge.sourceSide === 'right')  x1 += stub;
      if (edge.sourceSide === 'left')   x1 -= stub;
      if (edge.sourceSide === 'top')    y1 -= stub;
      if (edge.sourceSide === 'bottom') y1 += stub;

      let x2 = x3, y2 = y3;
      if (edge.targetSide === 'right')  x2 += stub;
      if (edge.targetSide === 'left')   x2 -= stub;
      if (edge.targetSide === 'top')    y2 -= stub;
      if (edge.targetSide === 'bottom') y2 += stub;

      const distX = Math.abs(x2 - x1);
      const distY = Math.abs(y2 - y1);
      
      const dx = Math.max(distX / 3, 20);
      const dy = Math.max(distY / 3, 20);

      let cp1X = x1, cp1Y = y1, cp2X = x2, cp2Y = y2;

      // Direções base das tangentes
      if (edge.sourceSide === 'right')  cp1X = x1 + dx;
      if (edge.sourceSide === 'left')   cp1X = x1 - dx;
      if (edge.sourceSide === 'top')    cp1Y = y1 - dy;
      if (edge.sourceSide === 'bottom') cp1Y = y1 + dy;

      if (edge.targetSide === 'right')  cp2X = x2 + dx;
      if (edge.targetSide === 'left')   cp2X = x2 - dx;
      if (edge.targetSide === 'top')    cp2Y = y2 - dy;
      if (edge.targetSide === 'bottom') cp2Y = y2 + dy;

      // Aplica "barriga" na curva para desviar de blocos (sem trocar as portas)
      if (edge.requiresAvoidance) {
        const avoidanceOffset = Math.max(45, distX * 0.15);
        if (edge.targetRect.top < edge.sourceRect.top - 40) {
           cp1Y -= avoidanceOffset;
           cp2Y -= avoidanceOffset;
        } else {
           cp1Y += avoidanceOffset;
           cp2Y += avoidanceOffset;
        }
      }

      const d = `M ${x0} ${y0} L ${x1} ${y1} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${x2} ${y2} L ${x3} ${y3}`;

      return { id: `${edge.sourceId}-${edge.targetId}-${edge.index}`, sourceId: edge.sourceId, targetId: edge.targetId, d, color: edge.color, x1: x0, y1: y0, x2: x3, y2: y3 };
    });
    setPaths(newPaths);
  };

  useEffect(() => {
    // Handler nativo de eventos de scroll (necessário para preventDefault sem warning no Chrome)
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      // Bloqueia a rolagem padrão da tareda (eixo Y e X)
      e.preventDefault();
      
      const zoomChange = e.deltaY > 0 ? -0.1 : 0.1;
      setZoomLevel(prev => Math.min(2, Math.max(0.2, prev + zoomChange)));
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, []);

  useEffect(() => {
    // Força uma atualização para garantir que as linhas SVG sejam recalculadas
    const timer = setTimeout(updateConnections, 100);
    window.addEventListener('resize', updateConnections);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateConnections);
    };
  }, [flowData, expandedCards, isExporting, zoomLevel]);

  if (!flowData) {
    return (
      <div className="empty-state">
        <LayoutTemplate size={64} opacity={0.3} />
        <h2>Nenhum fluxo carregado</h2>
        <p>Importe um arquivo JSON na barra lateral para começar.</p>
      </div>
    );
  }

  // Obter lista única de atores a partir das ações
  const actors = Array.from(new Set(flowData.actions.map(action => action.who)));

  return (
    <div style={{ padding: "0.5rem", height: "100%", display: "flex", flexDirection: "column" }}>
      <header style={{ marginBottom: "0.5rem", paddingLeft: "0.5rem", display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        <input 
          value={flowData.name}
          onChange={(e) => onChangeName?.(e.target.value)}
          style={{
            fontSize: "1.2rem",
            color: "#fff",
            margin: 0,
            background: "transparent",
            border: "1px solid transparent",
            borderBottom: "1px dashed rgba(255,255,255,0.3)",
            fontWeight: "bold",
            padding: "0.1rem 0",
            width: "350px",
            fontFamily: "inherit",
            cursor: "text"
          }}
          placeholder="Nome do Fluxograma"
          title="Clique para renomear"
        />
        <Edit2 size={16} opacity={0.5} color="var(--accent-color)" />
      </header>
      <div style={{ flex: 1, position: 'relative', display: 'flex', overflow: 'hidden', border: "1px solid var(--border-color)", borderRadius: "12px", background: "var(--panel-bg)", backdropFilter: "blur(10px)" }}>
      <div 
        ref={containerRef}
        className="swimlane-viewer" 
        style={{ 
          flex: 1, 
          overflow: 'auto', 
          backgroundColor: 'var(--bg-color)', 
          zIndex: 0,
          cursor: isDragging ? 'grabbing' : 'grab',
          userSelect: isDragging ? 'none' : 'auto'
        }}
        onClick={() => selectedActionId && onSelectAction(null)}
        onMouseDown={(e) => {
          // Ignore right/middle clicks
          if (e.button !== 0) return;
          setIsDragging(true);
          setDragStart({
            x: e.pageX,
            y: e.pageY,
            scrollLeft: e.currentTarget.scrollLeft,
            scrollTop: e.currentTarget.scrollTop
          });
        }}
        onMouseMove={(e) => {
          if (!isDragging) return;
          e.preventDefault();
          const dx = e.pageX - dragStart.x;
          const dy = e.pageY - dragStart.y;
          e.currentTarget.scrollLeft = dragStart.scrollLeft - dx;
          e.currentTarget.scrollTop = dragStart.scrollTop - dy;
        }}
        onMouseUp={() => setIsDragging(false)}
        onMouseLeave={() => setIsDragging(false)}
      >
        <div 
          ref={(el) => {
            // @ts-ignore
            contentRef.current = el;
            if (exportRef) {
              // @ts-ignore
              exportRef.current = el;
            }
          }}
          style={{ zoom: activeZoom, width: "max-content", minWidth: "100%", minHeight: "100%", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "0.25rem", position: "relative", backgroundColor: isExporting ? "var(--bg-color)" : "transparent" }}
        >
          
          <svg style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 0 }}>
            <defs>
              <marker id="arrowhead-simple" markerWidth="6" markerHeight="4" refX="5.5" refY="2" orient="auto">
                <polygon points="0 0, 6 2, 0 4" fill="rgba(255,255,255,0.7)" />
              </marker>
              <marker id="arrowhead-conditional" markerWidth="6" markerHeight="4" refX="5.5" refY="2" orient="auto">
                <polygon points="0 0, 6 2, 0 4" fill="#FDBD13" />
              </marker>
              <marker id="arrowhead-positive" markerWidth="6" markerHeight="4" refX="5.5" refY="2" orient="auto">
                <polygon points="0 0, 6 2, 0 4" fill="#45B64A" />
              </marker>
              <marker id="arrowhead-negative" markerWidth="6" markerHeight="4" refX="5.5" refY="2" orient="auto">
                <polygon points="0 0, 6 2, 0 4" fill="#D91A21" />
              </marker>
              <marker id="arrowhead-bifurcation" markerWidth="6" markerHeight="4" refX="5.5" refY="2" orient="auto">
                <polygon points="0 0, 6 2, 0 4" fill="#016295" />
              </marker>
              {paths.map(p => {
                const isSimple = p.color === '#ffffff';
                const startOp = isSimple ? "0.15" : "0.2";
                const endOp = isSimple ? "0.7" : "1";
                return (
                  <linearGradient 
                    key={`grad-${p.id}`} 
                    id={`grad-${p.id}`} 
                    gradientUnits="userSpaceOnUse"
                    x1={p.x1} y1={p.y1} x2={p.x2} y2={p.y2}
                  >
                    <stop offset="0%" stopColor={p.color} stopOpacity={startOp} />
                    <stop offset="100%" stopColor={p.color} stopOpacity={endOp} />
                  </linearGradient>
                );
              })}
            </defs>
            {paths.map(p => {
              const isHovered = hoveredNode === p.sourceId || hoveredNode === p.targetId || p.sourceId === `decision-${hoveredNode}`;
              const isFaded = hoveredNode !== null && !isHovered;
              return (
              <path 
                key={p.id} 
                d={p.d} 
                fill="none" 
                stroke={`url(#grad-${p.id})`} 
                strokeWidth={isHovered ? "4" : "2.5"} 
                strokeOpacity={isHovered ? "1" : (isFaded ? "0.15" : "1")}
                style={{ transition: "stroke-width 0.2s ease, stroke-opacity 0.2s ease" }}
                markerEnd={
                  p.color === '#45B64A' ? "url(#arrowhead-positive)" :
                  p.color === '#D91A21' ? "url(#arrowhead-negative)" :
                  p.color === '#016295' ? "url(#arrowhead-bifurcation)" :
                  "url(#arrowhead-simple)"
                }
              />
              );
            })}
          </svg>

          {actors.map(actor => (
            <div key={actor} className="swimlane-row" style={{ 
              display: "flex", 
              minHeight: "60px",
              border: "1px solid var(--border-color)",
              borderRadius: "8px",
              background: "rgba(0,0,0,0.2)",
              overflow: "visible"
            }}>
              {/* Header do ator */}
              <div style={getActorStyle(actor)}>
                {actor}
              </div>
              <div style={{ flex: 1, padding: "0.5rem", display: "grid", gridTemplateColumns: `repeat(${maxLevel + 3}, 100px)`, gap: "0", alignItems: "flex-start", position: "relative", zIndex: 1, paddingBottom: "0.75rem" }}>
                {flowData.actions.filter(a => a.who === actor).map(action => {
                  const isExpanded = isExporting || expandedCards.has(action.id);
                  const level = actionLevels[action.id] || 0;
                  return (
                  <div 
                    key={action.id}
                    style={{ 
                      gridColumn: Math.floor(level) + 1,
                      marginLeft: `${(level - Math.floor(level)) * 100}px`,
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      width: 'max-content'
                    }}
                  >
                  <div 
                    id={`action-${action.id}`}
                    style={{ 
                      flex: 1,
                      minWidth: "110px", 
                      maxWidth: "150px",
                      background: "var(--bg-color)", 
                      border: action.id === selectedActionId ? "2px solid var(--accent-color)" : "1px solid var(--border-color)", 
                      borderRadius: "6px", 
                      padding: "0.25rem",
                      boxShadow: action.id === selectedActionId ? "0 0 0 2px rgba(69, 182, 74, 0.3)" : "0 4px 6px rgba(0,0,0,0.2)",
                      transition: "transform 0.2s ease, borderColor 0.2s ease, boxShadow 0.2s ease",
                      display: "flex",
                      flexDirection: "column",
                      cursor: "pointer",
                      gap: "0"
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      // Prevent toggle selection if clicking the expand button
                      if ((e.target as HTMLElement).closest('button')) return;
                      onSelectAction(action.id === selectedActionId ? null : action.id);
                    }}
                    onMouseEnter={(e) => {
                      setHoveredNode(action.id);
                      if (action.id !== selectedActionId) {
                        e.currentTarget.style.transform = "translateY(-4px)";
                        e.currentTarget.style.borderColor = "var(--accent-color)";
                        e.currentTarget.style.boxShadow = "0 8px 16px rgba(0,0,0,0.3)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      setHoveredNode(null);
                      if (action.id !== selectedActionId) {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.borderColor = "var(--border-color)";
                        e.currentTarget.style.boxShadow = "0 4px 6px rgba(0,0,0,0.2)";
                      }
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "flex-start", alignItems: "flex-start" }}>
                      <strong style={{ color: "#fff", display: "block", fontSize: "0.85rem", marginBottom: "0", wordWrap: "break-word", lineHeight: 1.2 }}>
                        <span style={{ color: "var(--text-secondary)", fontWeight: "600", marginRight: "0.15rem" }}>#{action.id}:</span>
                        {action.what}
                      </strong>
                    </div>
                    
                    {isExpanded && (
                      <div style={{ padding: "0.3rem 0.15rem", background: "rgba(0,0,0,0.2)", borderRadius: "4px", marginTop: "0.2rem", marginBottom: "0.2rem" }}>
                        <p style={{ fontSize: "0.75rem", color: "var(--text-primary)", margin: "0 0 0.3rem 0", lineHeight: 1.3, wordWrap: "break-word" }}>{action.how}</p>
                        {action.reference && (
                          <div>
                            <span style={{ 
                              fontSize: "0.6rem", 
                              padding: "0.1rem 0.2rem", 
                              background: "rgba(69, 182, 74, 0.15)", 
                              color: "var(--accent-color)", 
                              borderRadius: "4px" 
                            }}>
                              Ref: {action.reference}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", marginTop: "0.2rem", paddingTop: "0.1rem", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleExpand(e, action.id);
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = "#fff";
                          e.currentTarget.style.transform = "scale(1.03)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = "var(--accent-color)";
                          e.currentTarget.style.transform = "scale(1)";
                        }}
                        style={{ 
                          background: "transparent", border: "none", color: "var(--accent-color)", 
                          cursor: "pointer", fontSize: "0.65rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.15rem", padding: "0",
                          fontWeight: "500", width: "100%",
                          transition: "color 0.2s ease, transform 0.2s ease"
                        }}
                      >
                        {isExpanded ? <><ChevronUp size={12} /> Menos Detalhes</> : <><ChevronDown size={12} /> Mostrar Detalhes</>}
                      </button>
                    </div>
                  </div>

                  {action.connection.type === 'conditional' && (
                     <div 
                       id={`decision-${action.id}`}
                       onMouseEnter={(e) => {
                         setHoveredNode(`decision-${action.id}`);
                         e.currentTarget.style.borderColor = '#fff';
                         e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.3)';
                       }}
                       onMouseLeave={(e) => {
                         setHoveredNode(null);
                         e.currentTarget.style.borderColor = '#FDBD13';
                         e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.2)';
                       }}
                       style={{ 
                          position: 'absolute',
                          top: '50%',
                          left: '100%',
                          marginLeft: '0.8rem',
                          marginTop: '-1.8rem',
                          width: '3.6rem',
                          height: '3.6rem',
                          background: 'var(--panel-bg)',
                          border: '2px solid #FDBD13',
                          transform: 'rotate(45deg)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          zIndex: 2,
                          boxShadow: "0 4px 6px rgba(0,0,0,0.2)",
                          cursor: "pointer",
                          transition: "border-color 0.2s ease, box-shadow 0.2s ease"
                       }}
                     >
                       <div style={{ transform: 'rotate(-45deg)', fontSize: '0.5rem', fontWeight: '600', color: '#fff', textAlign: 'center', width: '4.8rem', wordWrap: 'break-word', padding: '0.1rem', lineHeight: 1.1 }}>
                          {(action.connection as any).text}
                       </div>
                     </div>
                  )}

                  </div>
                )})}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Zoom Controls */}
      <div style={{ position: 'absolute', bottom: '24px', right: '24px', display: 'flex', gap: '8px', background: 'var(--bg-color)', padding: '8px', borderRadius: '8px', border: '1px solid var(--border-color)', boxShadow: '0 4px 12px rgba(0,0,0,0.5)', zIndex: 100 }}>
        <button onClick={() => setZoomLevel(z => Math.max(0.3, z - 0.1))} className="icon-btn" title="Reduzir Tela"><ZoomOut size={18} /></button>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '45px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{Math.round(zoomLevel * 100)}%</div>
        <button onClick={() => setZoomLevel(z => Math.min(2.0, z + 0.1))} className="icon-btn" title="Ampliar Tela"><ZoomIn size={18} /></button>
        <button onClick={() => setZoomLevel(1)} className="icon-btn" title="Restaurar Tela (100%)"><Maximize size={18} /></button>
      </div>
    </div>
    </div>
  );
};
