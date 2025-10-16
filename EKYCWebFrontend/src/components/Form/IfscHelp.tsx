import React from 'react';

// PUBLIC_INTERFACE
export const IfscHelp: React.FC = () => (
  <div style={{ fontSize: 12, color: '#555' }}>
    IFSC format: 4 letters + 0 + 6 alphanumeric (e.g., HDFC0ABC123). You can find IFSC on your cheque/passbook.
  </div>
);
