import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { MunicipioData, ScoreWeights } from '../../types/prospeccao';
import { STATUS_LABELS } from '../../types/prospeccao';

interface MapaMunicipalProps {
  municipios: MunicipioData[];
  weights: ScoreWeights;
  selectedMunicipio: string | null;
  onSelect: (nome: string) => void;
}

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[-'\s]+/g, ' ')
    .trim();
}

function getMunicipioColor(m: MunicipioData | undefined): { fillColor: string; fillOpacity: number } {
  if (!m) return { fillColor: 'rgba(40,45,52,1)', fillOpacity: 0.6 };

  // Gradiente navy-escuro → ciano — Ilha do Maranhão (4 municípios excluídos do ranking)
  // rank 0 (Raposa, menor pop) → navy `rgb(8,28,70)` | rank 1 (São Luís) → ciano `rgb(6,182,212)`
  if (m.isCapital) {
    const rank = m.capitalRank ?? 1;
    const cr = Math.round(8   + rank * (6   - 8));
    const cg = Math.round(28  + rank * (182 - 28));
    const cb = Math.round(70  + rank * (212 - 70));
    const co = 0.5 + rank * 0.45; // 0.50 (escuro) → 0.95 (ciano saturado)
    return { fillColor: `rgb(${cr},${cg},${cb})`, fillOpacity: co };
  }

  // Verde → REURB concluído com títulos
  if (m.statusReurb === 'concluido' || m.statusReurb === 'em_andamento_titulos') {
    return { fillColor: 'rgba(34,197,94,0.85)', fillOpacity: 0.85 };
  }

  // Roxo → REURB em Análise no SICARF (sem títulos)
  if (m.statusReurb === 'em_andamento') {
    return { fillColor: 'rgba(168,85,247,0.8)', fillOpacity: 0.8 };
  }

  // Candidatos sem REURB: preto (0) → amarelo ITERMA #FDBD13 (100)
  // Gamma 0.6 espalha o contraste — municípios de score médio ficam claramente distintos
  const t = Math.pow(m.scoreTotal / 100, 0.6);
  const r = Math.round(15  + t * (253 - 15));
  const g = Math.round(10  + t * (189 - 10));
  const b = Math.round(10  + t * (19  - 10));
  const opacity = 0.35 + t * 0.6; // 0.35 (quase invisível) → 0.95 (amarelo saturado)
  return { fillColor: `rgb(${r},${g},${b})`, fillOpacity: opacity };
}

export const MapaMunicipal: React.FC<MapaMunicipalProps> = ({
  municipios,
  weights: _weights,
  selectedMunicipio,
  onSelect,
}) => {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<L.GeoJSON | null>(null);
  const municipioIndexRef = useRef<Map<string, MunicipioData>>(new Map());

  // Build municipio index
  useEffect(() => {
    const idx = new Map<string, MunicipioData>();
    for (const m of municipios) idx.set(normalizeName(m.nome), m);
    municipioIndexRef.current = idx;
  }, [municipios]);

  // Init map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      center: [-5.5, -44.5],
      zoom: 7,
      zoomControl: true,
      attributionControl: false,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '© CartoDB',
      subdomains: 'abcd',
      maxZoom: 14,
    }).addTo(map);

    // Small attribution
    L.control.attribution({ position: 'bottomright', prefix: '© CartoDB' }).addTo(map);

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Load GeoJSON + style + events
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (layerRef.current) {
      layerRef.current.remove();
      layerRef.current = null;
    }

    const baseUrl = import.meta.env.BASE_URL ?? '/';

    fetch(`${baseUrl}maranhao-municipios.geojson`)
      .then((r) => r.json())
      .then((geojson) => {
        const layer = L.geoJSON(geojson, {
          style: (feature) => {
            const name = feature?.properties?.name as string ?? '';
            const m = municipioIndexRef.current.get(normalizeName(name));
            const { fillColor, fillOpacity } = getMunicipioColor(m);
            return {
              fillColor,
              fillOpacity,
              color: '#111',
              weight: 0.6,
            };
          },
          onEachFeature: (feature, lyr) => {
            const name = feature?.properties?.name as string ?? '';
            const m = municipioIndexRef.current.get(normalizeName(name));

            lyr.on('click', () => {
              if (m) onSelect(m.nome);
            });

            lyr.on('mouseover', function (e) {
              const target = e.target as L.Path;
              target.setStyle({ weight: 2, color: '#fff', fillOpacity: 1 });
              if (m) {
                const scoreColor = m.statusReurb === 'sem_reurb' ? '#fb923c' : m.statusReurb === 'em_andamento' ? '#a855f7' : '#22c55e';
                const statusLabel = STATUS_LABELS[m.statusReurb];
                const scoreHtml = m.statusReurb === 'sem_reurb'
                  ? `Score: <strong style="color:${scoreColor}">${m.scoreTotal}</strong><br/>`
                  : '';
                target.bindTooltip(
                  `<div style="font-size:11px;line-height:1.6;padding:2px 4px">
                    <strong>${m.nome}</strong><br/>
                    <span style="color:${scoreColor}">${statusLabel}</span><br/>
                    ${scoreHtml}
                    Votos: ${m.pctVotosCarlos.toFixed(1)}%<br/>
                    ${m.populacaoFavelas != null ? `Pop. Favelas: ${m.populacaoFavelas.toLocaleString('pt-BR')}` : 'Sem dados de favelas'}
                  </div>`,
                  { sticky: true, className: 'iterma-tooltip' }
                ).openTooltip();
              } else {
                target.bindTooltip(
                  `<div style="font-size:11px;padding:2px 4px"><strong>${name}</strong><br/><em>Sem dados no CSV</em></div>`,
                  { sticky: true }
                ).openTooltip();
              }
            });

            lyr.on('mouseout', function (e) {
              layer.resetStyle(e.target as L.Path);
              (e.target as L.Path).closeTooltip();
            });
          },
        });

        layer.addTo(map);
        layerRef.current = layer;
      })
      .catch((err) => console.error('Erro ao carregar GeoJSON:', err));
  }, [municipios, onSelect]);

  // Highlight selected municipio
  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;

    layer.eachLayer((lyr) => {
      const geoLyr = lyr as L.Path & { feature?: GeoJSON.Feature };
      const name = geoLyr.feature?.properties?.name as string ?? '';
      const m = municipioIndexRef.current.get(normalizeName(name));
      if (m?.nome === selectedMunicipio) {
        geoLyr.setStyle({ weight: 3, color: '#FDBD13', fillOpacity: 1 });
      }
    });
  }, [selectedMunicipio]);

  return (
    <div style={{ position: 'relative', height: '100%', borderRadius: '10px', overflow: 'hidden' }}>
      <div ref={containerRef} style={{ height: '100%', width: '100%' }} />

      {/* Legend */}
      <div style={{
        position: 'absolute',
        bottom: '24px',
        left: '10px',
        background: 'rgba(13,17,23,0.88)',
        backdropFilter: 'blur(6px)',
        borderRadius: '8px',
        padding: '0.55rem 0.75rem',
        zIndex: 1000,
        fontSize: '0.63rem',
        color: '#ccc',
        border: '1px solid rgba(255,255,255,0.1)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.28rem',
        minWidth: '155px',
      }}>
        <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.65rem', marginBottom: '0.1rem' }}>Legenda</div>

        {/* ── Gradiente Candidato (preto → amarelo ITERMA) ── */}
        <div>
          <div style={{ color: '#bbb', marginBottom: '0.18rem', lineHeight: 1 }}>Prioridade</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <span style={{ fontSize: '0.58rem', color: '#888', whiteSpace: 'nowrap' }}>Baixa</span>
            <div style={{
              flex: 1,
              height: '9px',
              borderRadius: '3px',
              background: 'linear-gradient(to right, rgb(15,10,10), rgb(140,90,10), rgb(253,189,19))',
              border: '1px solid rgba(255,255,255,0.12)',
            }} />
            <span style={{ fontSize: '0.58rem', color: '#888', whiteSpace: 'nowrap' }}>Alta</span>
          </div>
        </div>

        {/* ── Gradiente Ilha do Maranhão (navy → ciano) ── */}
        <div>
          <div style={{ color: '#bbb', marginBottom: '0.18rem', lineHeight: 1 }}>Prioridade Grande Ilha</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <span style={{ fontSize: '0.58rem', color: '#888', whiteSpace: 'nowrap' }}>Baixa</span>
            <div style={{
              flex: 1,
              height: '9px',
              borderRadius: '3px',
              background: 'linear-gradient(to right, rgb(8,28,70), rgb(6,100,160), rgb(6,182,212))',
              border: '1px solid rgba(255,255,255,0.12)',
            }} />
            <span style={{ fontSize: '0.58rem', color: '#888', whiteSpace: 'nowrap' }}>Alta</span>
          </div>
        </div>

        {/* ── Swatches discretos ── */}
        {[
          { color: 'rgba(34,197,94,0.85)',  label: 'REURB concluído' },
          { color: 'rgba(168,85,247,0.8)',  label: 'REURB em Análise' },
          { color: 'rgba(40,45,52,0.7)',    label: 'Sem dados no CSV' },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <div style={{ width: '11px', height: '11px', borderRadius: '2px', background: color, flexShrink: 0, border: '1px solid rgba(255,255,255,0.15)' }} />
            <span>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
