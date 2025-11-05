import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLocale } from '../hooks/useLocale';
import { Permission, Role } from '../types';
import { api } from '../services/apiService';
import { toast } from 'sonner';
import { Shield, RotateCcw } from 'lucide-react';
import { DEFAULT_PERMISSIONS } from '../constants';
import { useConfirmDialog, ConfirmDialog } from '../components/ConfirmDialog';
import { logger } from '../utils/logger';

export const Permissions: React.FC = () => {
  const { t } = useLocale();
  const { isOpen, config, confirm, close } = useConfirmDialog();
  const [permissions, setPermissions] = useState<Record<Role, Permission[]>>({
    admin: [],
    manager: [],
    user: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPermissions();
  }, []);

  const loadPermissions = async () => {
    setLoading(true);
    try {
      const data = await api.permissions.getAll();
      setPermissions(data);
    } catch (error) {
      logger.error('Failed to load permissions', error instanceof Error ? error : new Error(String(error)));
    } finally {
      setLoading(false);
    }
  };

  const allPermissions: Permission[] = [
    'view_dashboard',
    'view_inventory',
    'create_item',
    'edit_item',
    'delete_item',
    'view_movement',
    'record_movement',
    'edit_quantity',
    'view_history',
    'view_warehouses',
    'create_warehouse',
    'edit_warehouse',
    'delete_warehouse',
    'view_users',
    'create_user',
    'edit_user',
    'delete_user',
    'view_permissions',
    'edit_permissions',
    'import_data',
    'export_data',
  ];

  const togglePermission = (role: Role, permission: Permission) => {
    setPermissions((prev) => {
      const rolePerms = prev[role];
      const hasPermission = rolePerms.includes(permission);

      return {
        ...prev,
        [role]: hasPermission
          ? rolePerms.filter((p) => p !== permission)
          : [...rolePerms, permission],
      };
    });
  };

  const handleSave = async () => {
    try {
      await Promise.all([
        api.permissions.update('admin', permissions.admin),
        api.permissions.update('manager', permissions.manager),
        api.permissions.update('user', permissions.user),
      ]);
      toast.success(t('permissions.permissionsUpdated'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update permissions');
    }
  };

  const handleReset = async () => {
    confirm({
      title: t('permissions.reset'),
      description: 'Are you sure you want to reset permissions to defaults?',
      confirmLabel: t('common.yes'),
      cancelLabel: t('common.no'),
      variant: 'warning',
      onConfirm: async () => {
        try {
          await api.permissions.reset();
          toast.success(t('permissions.permissionsReset'));
          loadPermissions();
        } catch (error) {
          toast.error(error instanceof Error ? error.message : 'Failed to reset permissions');
        }
      },
    });
  };

  const roles: Role[] = ['admin', 'manager', 'user'];

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-muted-foreground">{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8" />
            {t('permissions.title')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t('permissions.subtitle')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
            {t('permissions.reset')}
          </Button>
          <Button onClick={handleSave}>
            {t('permissions.save')}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {roles.map((role) => (
          <Card key={role}>
            <CardHeader>
              <CardTitle className="capitalize">{t(`permissions.${role}`)}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {allPermissions.map((permission) => (
                <div key={permission} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${role}-${permission}`}
                    checked={permissions[role].includes(permission)}
                    onCheckedChange={() => togglePermission(role, permission)}
                  />
                  <label
                    htmlFor={`${role}-${permission}`}
                    className="text-sm leading-none cursor-pointer select-none"
                  >
                    {t(`permissions.${permission}`)}
                  </label>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      {config && (
        <ConfirmDialog
          open={isOpen}
          onOpenChange={close}
          title={config.title}
          description={config.description}
          confirmLabel={config.confirmLabel}
          cancelLabel={config.cancelLabel}
          variant={config.variant || 'danger'}
          onConfirm={config.onConfirm}
        />
      )}
    </div>
  );
};

export default Permissions;
