import React from 'react';

export const Card = ({ children, className = '' }) => (
  <div className={`bg-white shadow-md ${className}`}>{children}</div>
);

export const CardContent = ({ children, className = '' }) => (
  <div className={`p-4 ${className}`}>{children}</div>
);
