import React from 'react';

const STATUS_CONFIG = {
  'Pending': {
    bg: '#FEF3C7',
    text: '#92400E',
    label: 'Pending',
  },
  'Approved by Leader': {
    bg: '#DBEAFE',
    text: '#1E3A8A',
    label: 'Approved by Leader',
  },
  'Approved': {
    bg: '#DCFCE7',
    text: '#14532D',
    label: 'Approved',
  },
  'Rejected': {
    bg: '#FEE2E2',
    text: '#991B1B',
    label: 'Rejected',
  },
  'Cancelled': {
    bg: '#E5E7EB',
    text: '#374151',
    label: 'Cancelled',
  },
};

export default function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || {
    bg: '#E5E7EB',
    text: '#374151',
    label: status || 'Unknown',
  };

  return (
    <span
      className="inline-block px-2.5 py-1 text-xs font-semibold rounded"
      style={{ backgroundColor: config.bg, color: config.text }}
    >
      {config.label}
    </span>
  );
}
