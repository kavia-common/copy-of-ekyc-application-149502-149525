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
        {...ariaError(errId, hasError)}
        aria-labelledby={helpText ? helpId : undefined}
        style={{ display: 'block', width: '100%', padding: '8px', borderColor: hasError ? '#c00' : '#ccc' }}
      />
      {helpText && <div id={helpId} style={{ fontSize: 12, color: '#555' }}>{helpText}</div>}
      {hasError && <div id={errId} role="alert" style={{ color: '#c00', fontSize: 12 }}>{error}</div>}
    </div>
  );
};
