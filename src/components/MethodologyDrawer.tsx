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
    <div className={`drawer ${isOpen ? 'open' : ''}`} style={{ borderLeft: '1.5px solid var(--text-primary)' }}>
      <button 
        className="btn btn-secondary" 
        onClick={onClose}
        style={{ position: 'absolute', top: '1rem', right: '1.5rem', padding: '0.4rem 0.8rem' }}
      >
        ✕ Close
      </button>

      <div style={{ marginTop: '2rem' }}>
        <h2 style={{ fontWeight: 700, marginBottom: '1.5rem', fontSize: '1.5rem' }}>Methodology & Governance</h2>
        
        {/* PRINCIPLES SECTION */}
        <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
          <h4 style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem', color: 'var(--text-primary)' }}>Repository Architecture</h4>
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
        <div className="card" style={{ padding: '1.5rem', marginBottom: '2.5rem', borderLeft: '4px solid var(--border-color)' }}>
          <h4 style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem', color: 'var(--text-primary)' }}>Governance Scope</h4>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            To maintain its integrity as a system of record, this tool operates strictly at the **Registry Layer**.
          </p>
          <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>OPERATIONAL CONSTRAINTS:</span>
            <ul style={{ fontSize: '0.8rem', marginTop: '0.5rem', color: 'var(--text-secondary)', listStyleType: 'circle', paddingLeft: '1.2rem' }}>
              <li>Perform pedagogical alignment analysis.</li>
              <li>Simulate student pathways or success.</li>
              <li>Automate update propagation or version updates.</li>
              <li>Apply performance-based scoring or institutional evaluative metrics.</li>
            </ul>
          </div>
        </div>

        {/* INTEGRITY SECTION */}
        <h3 className="section-title" style={{ marginTop: '3rem', marginBottom: '1rem' }}>Registry Integrity Signals</h3>
        
        {issues.length === 0 ? (
          <div style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            All Structural Integrity Checks Passed
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* WARNINGS */}
            {warnings.length > 0 && (
              <div className="dependency-section" style={{ marginTop: 0 }}>
                <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#111', marginBottom: '0.75rem' }}>Critical Signals ({warnings.length})</h4>
                {warnings.map(issue => (
                  <div key={issue.id} className="card" style={{ padding: '0.8rem', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>{issue.category}</span>
                      <span style={{ fontSize: '0.65rem', color: '#777' }}>⚠</span>
                    </div>
                    <p style={{ fontSize: '0.85rem', fontWeight: 600, margin: '0.4rem 0' }}>{issue.message}</p>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Context: {issue.location}</span>
                  </div>
                ))}
              </div>
            )}

            {/* INFO */}
            {infoItems.length > 0 && (
              <div className="dependency-section" style={{ marginTop: 0 }}>
                <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#111', marginBottom: '0.75rem' }}>Operational Notes ({infoItems.length})</h4>
                {infoItems.map(issue => (
                  <div key={issue.id} className="card" style={{ padding: '0.8rem', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>{issue.category}</span>
                    </div>
                    <p style={{ fontSize: '0.85rem', margin: '0.2rem 0' }}>{issue.message}</p>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Context: {issue.location}</span>
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
