import React from 'react';
import { ValidationIssue } from '../lib/validation/validator';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  issues: ValidationIssue[];
}

export const MethodologyDrawer: React.FC<Props> = ({ isOpen, onClose, issues }) => {
  const warnings = issues.filter(i => i.type === 'warning');
  const infoItems = issues.filter(i => i.type === 'info');

  return (
    <div className={`drawer ${isOpen ? 'open' : ''}`} style={{ borderLeft: '4px solid var(--accent-primary)' }}>
      <button 
        className="btn btn-secondary" 
        onClick={onClose}
        style={{ position: 'absolute', top: '1rem', right: '1.5rem', padding: '0.4rem 0.8rem' }}
      >
        ✕ Close
      </button>

      <div style={{ marginTop: '2rem' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: '1.5rem' }}>Methodology & Scope</h2>
        
        {/* PRINCIPLES SECTION */}
        <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
          <h4 style={{ color: 'var(--accent-primary)', marginBottom: '1rem' }}>Repository Architecture</h4>
          <p style={{ fontSize: '0.9rem', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
            The **Shared Module Repository System (SMRS)** is designed as a structural registry for reusable curriculum assets.
          </p>
          <ul style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '1rem', paddingLeft: '1.2rem' }}>
            <li style={{ marginBottom: '0.5rem' }}>**Module as Atom**: Curriculum is composed of versioned, reusable modules.</li>
            <li style={{ marginBottom: '0.5rem' }}>**Decoupled Composition**: Programmes reference specific module releases by ID and Version, ensuring stability and traceability.</li>
            <li style={{ marginBottom: '0.5rem' }}>**Visibility vs Automation**: The system provides signals for version lag and dependencies to support human oversight.</li>
          </ul>
        </div>

        {/* SCOPE SECTION */}
        <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2.5rem', borderLeft: '4px solid var(--accent-secondary)' }}>
          <h4 style={{ color: 'var(--accent-secondary)', marginBottom: '1rem' }}>Operational Scope</h4>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            To maintain its integrity as a reliable system of record, this tool operates strictly at the **Repository Layer**.
          </p>
          <div style={{ padding: '0.8rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--accent-secondary)' }}>WHAT THIS TOOL DOES NOT DO:</span>
            <ul style={{ fontSize: '0.8rem', marginTop: '0.5rem', color: 'var(--text-secondary)' }}>
              <li>Perform pedagogical alignment analysis.</li>
              <li>Simulate student pathways or success.</li>
              <li>Automate update propagation or version updates.</li>
              <li>Apply performance-based scoring or institutional evaluative metrics.</li>
            </ul>
          </div>
        </div>

        {/* INTEGRITY SECTION */}
        <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: '1rem' }}>Repository Integrity</h3>
        
        {issues.length === 0 ? (
          <div className="badge badge-success" style={{ display: 'block', padding: '1rem', textAlign: 'center' }}>
            ✅ All Structural Integrity Checks Passed
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* WARNINGS */}
            {warnings.length > 0 && (
              <div className="dependency-section" style={{ marginTop: 0 }}>
                <h4 style={{ color: '#ef4444' }}>Warnings ({warnings.length})</h4>
                {warnings.map(issue => (
                  <div key={issue.id} className="summary-card" style={{ padding: '0.8rem', border: '1px solid rgba(239, 68, 68, 0.2)', background: 'rgba(239, 68, 68, 0.03)' }}>
                    <span className="badge badge-error" style={{ fontSize: '0.65rem' }}>{issue.category}</span>
                    <p style={{ fontSize: '0.85rem', fontWeight: 600, margin: '0.4rem 0' }}>{issue.message}</p>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Location: {issue.location}</span>
                  </div>
                ))}
              </div>
            )}

            {/* INFO */}
            {infoItems.length > 0 && (
              <div className="dependency-section" style={{ marginTop: 0 }}>
                <h4 style={{ color: 'var(--accent-primary)' }}>Information ({infoItems.length})</h4>
                {infoItems.map(issue => (
                  <div key={issue.id} className="summary-card" style={{ padding: '0.8rem', border: '1px solid rgba(99, 102, 241, 0.1)', background: 'rgba(99, 102, 241, 0.02)' }}>
                    <span className="badge badge-version" style={{ fontSize: '0.65rem' }}>{issue.category}</span>
                    <p style={{ fontSize: '0.85rem', margin: '0.2rem 0' }}>{issue.message}</p>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Location: {issue.location}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
