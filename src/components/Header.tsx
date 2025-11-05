import React from 'react';
import { Moon, Sun, Globe, LogOut, Menu } from 'lucide-react';
import { Button } from './ui/button';
import { useTheme } from '../hooks/useTheme';
import { useLocale } from '../hooks/useLocale';
import { useAuth } from '../hooks/useAuth';
import { useWarehouse } from '../hooks/useWarehouse';
import { NotificationBell } from './NotificationBell';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

interface HeaderProps {
  onMenuClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const { theme, toggleTheme } = useTheme();
  const { locale, setLocale, t } = useLocale();
  const { user, signOut } = useAuth();
  const { warehouses, selectedWarehouse, setSelectedWarehouse } = useWarehouse();

  return (
    <header className="border-b bg-card">
      <div className="flex h-16 items-center gap-4 px-4 md:px-6">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </Button>

        <div className="flex-1">
          <Select
            value={selectedWarehouse?.id || ''}
            onValueChange={(value) => {
              const warehouse = warehouses.find(w => w.id === value);
              setSelectedWarehouse(warehouse || null);
            }}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder={t('common.selectWarehouse')} />
            </SelectTrigger>
            <SelectContent>
              {warehouses.map((warehouse) => (
                <SelectItem key={warehouse.id} value={warehouse.id}>
                  {warehouse.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Select value={locale} onValueChange={setLocale}>
            <SelectTrigger className="w-[100px]">
              <Globe className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="ar">العربية</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </Button>

          <NotificationBell />

          <div className="hidden md:flex items-center gap-3 ltr:ml-3 rtl:mr-3 ltr:pl-3 rtl:pr-3 border-l ltr:border-l rtl:border-r">
            <div className="text-sm">
              <div className="font-medium">{user?.email}</div>
            </div>
            <Button variant="ghost" size="icon" onClick={signOut} title={t('auth.logout')}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};
