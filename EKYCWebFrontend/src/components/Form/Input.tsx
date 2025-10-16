/**
 * REQUIREMENT TRACEABILITY - Module: components/Form/Input.tsx
 * REQ IDs: REQ-VAL-001 (clear validation messages, guidance), Usability/Accessibility
 * Acceptance Criteria:
 * - AC-01: Inputs show inline errors and help text
 * - AC-02: A11y attributes set (aria-invalid, role="alert")
 * GxP Impact: YES — improves data quality via user guidance
 * Risk Level: LOW
 */
import React from 'react';
import { ariaError } from '../../accessibility/aria-helpers';

// PUBLIC_INTERFACE
export const Input: React.FC<{
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  helpText?: string;
  error?: string | null;
  required?: boolean;
}> = ({ id, label, type = 'text', value, onChange, helpText, error, required }) => {
  const errId = `${id}-err`;
  const helpId = `${id}-help`;
  const hasError = !!error;
  return (
    <div className="form-field" style={{ marginBottom: 12 }}>
      <label htmlFor={id}>{label}{required ? ' *' : ''}</label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        {...ariaError(errId, hasError)} {/* TRACE: AC-02 */}
        aria-labelledby={helpText ? helpId : undefined}
        style={{ display: 'block', width: '100%', padding: '8px', borderColor: hasError ? '#c00' : '#ccc' }}
      />
      {helpText && <div id={helpId} style={{ fontSize: 12, color: '#555' }}>{helpText}</div>}
      {hasError && <div id={errId} role="alert" style={{ color: '#c00', fontSize: 12 }}>{error}</div>}{/* TRACE: AC-01/AC-02 */}
    </div>
  );
};
