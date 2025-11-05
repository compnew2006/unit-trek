import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ArrowRightLeft,
  History,
  Warehouse,
  Users,
  Shield,
  Download,
  FileText,
  Barcode,
  BarChart3,
  X,
} from 'lucide-react';
import { useLocale } from '../hooks/useLocale';
import { useAuth } from '../hooks/useAuth';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { t } = useLocale();
  const { user: _user } = useAuth();

  const navItems = [
    { icon: LayoutDashboard, label: t('nav.dashboard'), path: '/', permission: 'view_dashboard' },
    { icon: Package, label: t('nav.inventory'), path: '/inventory', permission: 'view_inventory' },
    { icon: ArrowRightLeft, label: t('nav.movement'), path: '/movement', permission: 'view_movement' },
    { icon: History, label: t('nav.history'), path: '/history', permission: 'view_history' },
    { icon: Warehouse, label: t('nav.warehouses'), path: '/warehouses', permission: 'view_warehouses' },
    { icon: Warehouse, label: t('nav.all_warehouses'), path: '/all-warehouses', permission: 'view_warehouses' },
    { icon: Users, label: t('nav.users'), path: '/users', permission: 'view_users' },
    { icon: Shield, label: t('nav.permissions'), path: '/permissions', permission: 'view_permissions' },
    { icon: Download, label: t('nav.import_export'), path: '/import-export', permission: 'import_data' },
    { icon: FileText, label: t('nav.reports'), path: '/reports', permission: 'view_dashboard' },
    { icon: BarChart3, label: t('nav.analytics'), path: '/analytics', permission: 'view_dashboard' },
    { icon: Barcode, label: t('nav.barcode_tools'), path: '/barcode-tools', permission: 'view_inventory' },
  ];

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full w-64 border-r bg-card transition-transform duration-300 md:sticky md:top-0',
          isOpen ? 'translate-x-0' : 'ltr:-translate-x-full rtl:translate-x-full md:translate-x-0'
        )}
      >
        <div className="flex h-16 items-center justify-between border-b px-6">
          <div>
            <h1 className="text-lg font-bold text-primary">{t('app.title')}</h1>
            <p className="text-xs text-muted-foreground">{t('app.tagline')}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="space-y-1 p-4">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => {
                // Only close sidebar on mobile
                if (window.innerWidth < 768) {
                  onClose();
                }
              }}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )
              }
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
};
