import React from 'react';

export type Crumb = {
  id: string;
  label: string;
};

type BreadcrumbsProps = {
  trail: Crumb[];
  onSelect: (id: string) => void;
};

export function Breadcrumbs({ trail, onSelect }: BreadcrumbsProps) {
  if (!trail.length) return null;

  return (
    <div className="breadcrumbs">
      {trail.map((crumb, index) => (
        <React.Fragment key={crumb.id}>
          <button
            type="button"
            className="breadcrumbs__item"
            onClick={() => onSelect(crumb.id)}
          >
            {crumb.label}
          </button>
          {index < trail.length - 1 ? <span className="breadcrumbs__sep">/</span> : null}
        </React.Fragment>
      ))}
    </div>
  );
}
