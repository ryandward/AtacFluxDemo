import { motion, useSpring, useTransform } from 'framer-motion';
import { useEffect, useState } from 'react';
import { baselineChromatin, interventionChromatin, metabolites, pathwayEdges } from '../../data';
import { getChromatinColor, useFluxSolver, usePathwayLayout } from '../../hooks';
import sharedStyles from '../../styles/shared.module.css';
import styles from './FluxDynamicsPage.module.css';

// Inline enzyme pill with spring-animated bar
function InlineEnzyme({ gene, x, y, chromatin, interventions, nodeConfig, chromatinBarConfig, onToggle }) {
  // Spring animate the chromatin value
  const springChromatin = useSpring(chromatin, { stiffness: 180, damping: 12 });
  
  // Update spring target when chromatin prop changes
  useEffect(() => {
    springChromatin.set(chromatin);
  }, [chromatin, springChromatin]);
  
  if (!gene || gene === 'EXPORT') return null;
  
  const color = getChromatinColor(chromatin);
  const isActive = interventions[gene];
  const isBottleneck = !isActive && chromatin < 0.2;
  const { width, height, rx } = nodeConfig.enzyme;
  const barWidth = chromatinBarConfig.width;
  const barHeight = chromatinBarConfig.height;
  
  // Derived values from spring
  const barFillWidth = useTransform(springChromatin, v => barWidth * v);
  const glowOpacity = useTransform(springChromatin, v => Math.min(0.6, v * 0.8));
  const glowSize = useTransform(springChromatin, v => 4 + v * 8);
  
  return (
    <g 
      className={styles.enzymeInline} 
      onClick={(e) => { e.stopPropagation(); onToggle(gene); }}
      style={{ cursor: 'pointer' }}
    >
      {/* Outer glow ring */}
      <motion.rect
        x={x - width / 2 - 3}
        y={y - height / 2 - 3}
        width={width + 6}
        height={height + 6}
        rx={rx + 3}
        fill="none"
        stroke={color}
        strokeWidth={2}
        opacity={glowOpacity}
        className={chromatin > 0.5 ? styles.enzymeGlowPulse : ''}
        style={{ filter: useTransform(glowSize, s => `drop-shadow(0 0 ${s}px ${color})`) }}
      />
      
      {/* Pill background */}
      <rect
        x={x - width / 2}
        y={y - height / 2}
        width={width}
        height={height}
        rx={rx}
        className={`${styles.enzymePill} ${isActive ? styles.enzymeActive : ''} ${isBottleneck ? styles.enzymeBottleneck : ''}`}
        style={{ stroke: color, strokeWidth: 1.5 }}
      />
      
      {/* Gene name */}
      <text x={x} y={y - 2} className={styles.enzymeLabel} style={{ fill: color }}>
        {gene}
      </text>
      
      {/* Chromatin bar background */}
      <rect 
        x={x - barWidth / 2} 
        y={y + height / 2 - barHeight - 3} 
        width={barWidth} 
        height={barHeight} 
        rx={barHeight / 2} 
        fill="rgba(255,255,255,0.08)" 
      />
      {/* Chromatin bar fill - animated via spring */}
      <motion.rect 
        x={x - barWidth / 2} 
        y={y + height / 2 - barHeight - 3} 
        width={barFillWidth}
        height={barHeight} 
        rx={barHeight / 2} 
        fill={color}
      />
    </g>
  );
}

// Flow speed helper
function getFlowClass(chromatin, styles) {
  if (chromatin > 0.7) return styles.flowFast;
  if (chromatin > 0.3) return styles.flowMedium;
  return styles.flowSlow;
}

// Flow edge with inline enzyme - MUST be outside PathwayDiagram to preserve InlineEnzyme state
function FlowEdge({ edge, positions, geneStates, interventions, nodeConfig, arrowConfig, chromatinBarConfig, onToggle }) {
  const fromPos = positions[edge.from];
  const toPos = positions[edge.to];
  if (!fromPos || !toPos) return null;
  
  const chromatin = geneStates[edge.gene]?.chromatin || 0.5;
  const color = getChromatinColor(chromatin);
  const isActive = interventions[edge.gene];
  const thickness = isActive ? arrowConfig.mainThickness + 2 : arrowConfig.mainThickness;
  const nodeHeight = nodeConfig.metabolite.height;
  const padding = 12;
  
  // Vertical edge (main path) - straight through enzyme
  if (fromPos.x === toPos.x) {
    const x = fromPos.x;
    const y1 = fromPos.y + nodeHeight / 2 + padding;
    const y2 = toPos.y - nodeHeight / 2 - padding;
    const midY = (y1 + y2) / 2;
    
    return (
      <g>
        {/* Background track */}
        <line
          x1={x} y1={y1} x2={x} y2={y2}
          stroke="rgba(255,255,255,0.04)"
          strokeWidth={thickness + 4}
          strokeLinecap="round"
        />
        {/* Animated flow line */}
        <line
          x1={x} y1={y1} x2={x} y2={y2}
          stroke={color}
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray={arrowConfig.dashArray}
          className={getFlowClass(chromatin, styles)}
        />
        {/* Arrow head */}
        <polygon
          points={`${x},${y2 + 6} ${x - 5},${y2} ${x + 5},${y2}`}
          fill={color}
        />
        {/* Inline enzyme - rendered on top of flow */}
        <InlineEnzyme 
          gene={edge.gene} 
          x={x} 
          y={midY} 
          chromatin={chromatin}
          interventions={interventions}
          nodeConfig={nodeConfig}
          chromatinBarConfig={chromatinBarConfig}
          onToggle={onToggle}
        />
      </g>
    );
  }
  
  // Branch edge - L-path: down, horizontal, then down into top of target
  const x1 = fromPos.x;
  const y1 = fromPos.y + nodeHeight / 2 + padding;
  const x2 = toPos.x;
  const y2 = toPos.y - nodeHeight / 2 - padding; // stop at TOP edge of target
  const midY = (y1 + y2) / 2; // horizontal segment at midpoint
  const branchThickness = isActive ? arrowConfig.branchThickness + 2 : arrowConfig.branchThickness;
  const enzymeMidX = (x1 + x2) / 2;
  
  // Arrow head pointing DOWN into the node
  const arrowHead = `${x2},${y2 + 6} ${x2 - 5},${y2} ${x2 + 5},${y2}`;
  
  const branchPath = `M ${x1} ${y1} L ${x1} ${midY} L ${x2} ${midY} L ${x2} ${y2}`;
  
  return (
    <g>
      {/* L-shaped path background */}
      <path
        d={branchPath}
        fill="none"
        stroke="rgba(255,255,255,0.04)"
        strokeWidth={branchThickness + 4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Animated branch line */}
      <path
        d={branchPath}
        fill="none"
        stroke={color}
        strokeWidth={branchThickness}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={arrowConfig.dashArray}
        className={getFlowClass(chromatin, styles)}
      />
      {/* Arrow head */}
      <polygon points={arrowHead} fill={color} />
      {/* Inline enzyme for branch */}
      {edge.gene !== 'EXPORT' && (
        <InlineEnzyme 
          gene={edge.gene} 
          x={enzymeMidX} 
          y={midY}
          chromatin={chromatin}
          interventions={interventions}
          nodeConfig={nodeConfig}
          chromatinBarConfig={chromatinBarConfig}
          onToggle={onToggle}
        />
      )}
    </g>
  );
}

// SVG Pathway Diagram Component - Data-driven layout
function PathwayDiagram({ geneStates, fluxState, interventions, onToggle }) {
  const { 
    positions, 
    viewBoxWidth, 
    viewBoxHeight, 
    nodeConfig, 
    arrowConfig, 
    chromatinBarConfig,
    edges 
  } = usePathwayLayout();

  // Get variant class for metabolite
  const getVariant = (nodeId) => {
    const meta = metabolites[nodeId];
    if (meta.type === 'input') return 'input';
    if (meta.type === 'product') return interventions.ATF1 ? 'productActive' : 'product';
    if (meta.type === 'waste') return 'waste';
    return 'default';
  };

  // Get flux value for a node
  const getFlux = (nodeId) => {
    if (nodeId === 'leu') return 1.0;
    if (fluxState.nodeFlux[nodeId] !== undefined) return fluxState.nodeFlux[nodeId];
    // Find edge leading to this node
    const edge = pathwayEdges.find(e => e.to === nodeId);
    if (edge) {
      return fluxState.edgeFlux[`${edge.from}-${edge.to}`] || 0;
    }
    return 0;
  };

  // Metabolite node component
  const MetaboliteNode = ({ nodeId }) => {
    const pos = positions[nodeId];
    const meta = metabolites[nodeId];
    const flux = getFlux(nodeId);
    const variant = getVariant(nodeId);
    const { width, height, rx } = nodeConfig.metabolite;
    
    return (
      <g>
        <rect
          x={pos.x - width / 2}
          y={pos.y - height / 2}
          width={width}
          height={height}
          rx={rx}
          className={`${styles.metaboliteRect} ${styles[variant] || ''}`}
        />
        <text x={pos.x} y={pos.y - 2} className={styles.metaboliteText}>
          {meta.name}
        </text>
        <text x={pos.x} y={pos.y + 14} className={styles.fluxText}>
          {flux.toFixed(3)}
        </text>
      </g>
    );
  };

  return (
    <svg viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`} className={styles.pathwaySvg}>
      <defs>
        <linearGradient id="inputGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(59, 130, 246, 0.2)" />
          <stop offset="100%" stopColor="rgba(30, 41, 59, 0.9)" />
        </linearGradient>
        <linearGradient id="productGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={interventions.ATF1 ? "rgba(34, 197, 94, 0.25)" : "rgba(250, 204, 21, 0.2)"} />
          <stop offset="100%" stopColor="rgba(30, 41, 59, 0.9)" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      {/* Title */}
      <text x={viewBoxWidth / 2} y="40" className={styles.diagramTitle}>Ehrlich Pathway</text>

      {/* Render all edges with inline enzymes */}
      {pathwayEdges.map((edge, i) => (
        <FlowEdge 
          key={`${edge.from}-${edge.to}`} 
          edge={edge}
          positions={positions}
          geneStates={geneStates}
          interventions={interventions}
          nodeConfig={nodeConfig}
          arrowConfig={arrowConfig}
          chromatinBarConfig={chromatinBarConfig}
          onToggle={onToggle}
        />
      ))}

      {/* Render all metabolite nodes */}
      {Object.keys(positions).map(nodeId => (
        <MetaboliteNode key={nodeId} nodeId={nodeId} />
      ))}

      {/* Legend */}
      <g transform={`translate(${viewBoxWidth - 120}, 60)`}>
        <text x="0" y="0" className={styles.legendTitle}>Chromatin</text>
        <circle cx="10" cy="18" r="6" fill="#22c55e" />
        <text x="22" y="22" className={styles.legendText}>Open</text>
        <circle cx="10" cy="38" r="6" fill="#f97316" />
        <text x="22" y="42" className={styles.legendText}>Partial</text>
        <circle cx="10" cy="58" r="6" fill="#ef4444" />
        <text x="22" y="62" className={styles.legendText}>Closed</text>
      </g>
    </svg>
  );
}

function Toggle({ isOn }) {
  return (
    <div className={`${styles.toggle} ${isOn ? styles.on : ''}`}>
      <div className={styles.toggleKnob} />
    </div>
  );
}

export function FluxDynamicsPage() {
  const [interventions, setInterventions] = useState({
    BAT2: false,
    ARO10: false,
    ADH6: false,
    ATF1: false,
  });

  const { geneStates, fluxState, baselineFlux } = useFluxSolver(interventions);

  const toggleIntervention = (gene) => {
    setInterventions(prev => ({ ...prev, [gene]: !prev[gene] }));
  };

  const captureRate = fluxState.nodeFlux.iamac / (fluxState.nodeFlux.iamac + fluxState.nodeFlux.waste);
  const foldChange = fluxState.nodeFlux.iamac / baselineFlux.nodeFlux.iamac;

  const genes = ['BAT2', 'ARO10', 'ADH6', 'ATF1'];

  return (
    <div className={styles.container}>
        {/* Pathway Visualization */}
        <div className={`${styles.card} ${styles.pathwayCard}`}>
          <PathwayDiagram
            geneStates={geneStates}
            fluxState={fluxState}
            interventions={interventions}
            onToggle={toggleIntervention}
          />
        </div>

        {/* Control Panel */}
        <div className={styles.controlStack}>
          {/* Interventions */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.cardTitle}>Interventions</span>
            </div>
            <div className={styles.cardContent}>
              <div className={styles.interventionList}>
                {genes.map(gene => {
                  const delta = Math.round((interventionChromatin[gene] - baselineChromatin[gene]) * 100);
                  return (
                    <div 
                      key={gene}
                      className={`${styles.interventionRow} ${sharedStyles.selectable} ${interventions[gene] ? styles.active : ''}`}
                      onClick={() => toggleIntervention(gene)}
                    >
                      <div className={styles.interventionInfo}>
                        <span 
                          className={styles.interventionGene}
                          style={{ color: getChromatinColor(geneStates[gene].chromatin) }}
                        >
                          {gene}
                        </span>
                        <span className={styles.interventionMeta}>
                          {Math.round(baselineChromatin[gene] * 100)}% → <span>{Math.round(interventionChromatin[gene] * 100)}%</span> (+{delta}%)
                        </span>
                      </div>
                      <Toggle isOn={interventions[gene]} />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Results */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.cardTitle}>Flux Output</span>
            </div>
            <div className={styles.cardContent}>
              <div className={styles.resultsGrid}>
                <div className={styles.resultCard}>
                  <div className={styles.resultLabel}>Capture Rate</div>
                  <div 
                    className={styles.resultValue}
                    style={{ color: getChromatinColor(geneStates.ATF1.chromatin) }}
                  >
                    {Math.round(captureRate * 100)}%
                  </div>
                </div>
                <div className={styles.resultCard}>
                  <div className={styles.resultLabel}>vs Baseline</div>
                  <div 
                    className={styles.resultValue}
                    style={{ color: foldChange > 1.1 ? '#22c55e' : '#64748b' }}
                  >
                    {foldChange.toFixed(1)}×
                  </div>
                </div>
              </div>

              <div className={styles.captureSection}>
                <div className={styles.captureHeader}>
                  <span>Product vs Waste</span>
                  <span>{(fluxState.nodeFlux.iamac || 0).toFixed(3)} : {(fluxState.nodeFlux.waste || 0).toFixed(3)}</span>
                </div>
                <div className={styles.captureBar}>
                  <div 
                    className={styles.captureProduct}
                    style={{ width: `${captureRate * 100}%` }}
                  />
                  <div 
                    className={styles.captureWaste}
                    style={{ width: `${(1 - captureRate) * 100}%` }}
                  />
                </div>
              </div>
            </div>
            <div className={`${styles.insightBanner} ${interventions.ATF1 ? styles.success : ''}`}>
              {interventions.ATF1 
                ? '✓ ATF1 activation redirects flux to product'
                : '⚠ ATF1 is the bottleneck — most flux lost to waste'}
            </div>
          </div>
        </div>
      </div>
  );
}
