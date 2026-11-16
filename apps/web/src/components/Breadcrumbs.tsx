import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items }) => {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center space-x-2 text-xs font-medium text-gray-500 mb-4">
      <Link
        to="/"
        className="flex items-center gap-1 text-gray-500 hover:text-gray-900 transition-colors"
        title="Portal Gateway Home"
      >
        <Home className="w-3.5 h-3.5" />
        <span>DinePulse</span>
      </Link>

      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <React.Fragment key={index}>
            <ChevronRight className="w-3 h-3 text-gray-400 shrink-0" />
            {isLast || !item.path ? (
              <span className="text-gray-900 font-semibold" aria-current="page">
                {item.label}
              </span>
            ) : (
              <Link to={item.path} className="text-gray-500 hover:text-gray-900 transition-colors">
                {item.label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
