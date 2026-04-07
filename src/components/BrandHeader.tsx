import React from 'react';

interface Props {
  appName: string;
}

export const BrandHeader: React.FC<Props> = ({ appName }) => {
  return (
    <header className="brand-header">
      <a 
        href="https://www.cloudpedagogy.com/" 
        target="_blank" 
        rel="noopener noreferrer" 
        className="brand-name"
      >
        CloudPedagogy
      </a>
      <h1 className="app-title">{appName}</h1>
    </header>
  );
};
