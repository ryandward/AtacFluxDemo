import { epigenomeLayers } from '../../data';
import { useSelectionStore } from '../../stores';
import sharedStyles from '../../styles/shared.module.css';
import styles from './EpigenomePage.module.css';

export function EpigenomePage() {
  const { selectedLayer, selectLayer } = useSelectionStore();

  return (
    <div className={styles.container}>
        {/* Layer Stack */}
        <div className={styles.layerStack}>
          {epigenomeLayers.map((layer, i) => {
            const isSelected = selectedLayer === layer.source;
            return (
              <div key={layer.name}>
                <div
                  className={`${styles.layerCard} ${sharedStyles.selectable} ${isSelected ? sharedStyles.selected : ''}`}
                  style={{ borderLeftColor: layer.color }}
                  onClick={() => selectLayer(layer.source)}
                >
                  <div className={styles.layerContent}>
                    <div>
                      <div className={styles.layerName}>{layer.name}</div>
                      <div className={styles.layerQuestion}>{layer.question}</div>
                    </div>
                    <div
                      className={styles.layerBadge}
                      style={{ background: `${layer.color}20`, color: layer.color }}
                    >
                      {layer.source}
                    </div>
                  </div>
                </div>
                {i < epigenomeLayers.length - 1 && <div className={styles.arrow}>↓</div>}
              </div>
            );
          })}

          <div className={styles.arrow}>↓</div>

          <div className={styles.convergence}>
            <div className={styles.convergenceLabel}>CONVERGENCE</div>
            <div className={styles.convergenceTitle}>Regulatory Score per Gene</div>
            <div className={styles.convergenceCode}>
              <span className="mono" style={{ fontSize: 12, color: '#94a3b8' }}>
                GPR: <span style={{ color: '#60a5fa' }}>OR → max(scores)</span>,{' '}
                <span style={{ color: '#a78bfa' }}>AND → min(scores)</span>
              </span>
            </div>
            <div className={styles.convergenceSubtitle}>
              Multi-omic integration → Reaction flux weights
            </div>
          </div>
        </div>
      </div>
  );
}
