import React from 'react';
import * as LucideIcons from 'lucide-react';

interface CategoryIconProps {
  name: string;
  className?: string;
  color?: string;
  size?: number;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({ name, className = 'w-5 h-5', color, size }) => {
  // Safe lookup in Lucide icons
  const IconComponent = (LucideIcons as Record<string, any>)[name] || LucideIcons.CircleDot;
  return <IconComponent className={className} style={{ color }} size={size} />;
};
