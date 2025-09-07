import { ReactNode } from 'react';

interface WebappLayoutProps {
  children: ReactNode;
}

export default function WebappLayout({ children }: WebappLayoutProps) {
  return <>{children}</>;
}
