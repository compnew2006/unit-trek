import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useLocale } from '../hooks/useLocale';
import { usePagination } from '../hooks/usePagination';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { User, Role } from '../types';
import { api } from '../services/apiService';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { DataPagination } from '../components/DataPagination';
import { useConfirmDialog, ConfirmDialog } from '../components/ConfirmDialog';
import { logger } from '../utils/logger';

export const Users: React.FC = () => {
  const { t } = useLocale();
  const [users, setUsers] = useState<User[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const { isOpen, config, confirm, close } = useConfirmDialog();

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'user' as Role,
  });

  const {
    currentPage,
    totalPages,
    paginatedData,
    setCurrentPage,
    canGoNext,
    canGoPrevious,
    startIndex,
    endIndex,
    totalItems,
  } = usePagination({ data: users, itemsPerPage });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await api.users.getAll();
      setUsers(data);
    } catch (error) {
      logger.error('Failed to load users', error instanceof Error ? error : new Error(String(error)));
    }
  };

  const openDialog = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        username: user.username,
        email: user.email || '',
        password: '',
        role: user.role,
      });
    } else {
      setEditingUser(null);
      setFormData({
        username: '',
        email: '',
        password: '',
        role: 'user',
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingUser) {
        const updates: Partial<User> = {
          username: formData.username,
          email: formData.email || undefined,
          role: formData.role,
        };
        if (formData.password) {
          updates.password = formData.password;
        }
        await api.users.update(editingUser.id, updates);
        toast.success(t('users.userUpdated'));
      } else {
        // User creation should be done through Supabase Auth
        // For admin user creation, use the Auth page or a backend API
        toast.error('User creation must be done through the signup process. Please use the Auth page.');
        throw new Error('User creation must be done through Supabase Auth. Use the Auth page signup instead.');
      }
      setIsDialogOpen(false);
      loadUsers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Operation failed');
    }
  };

  const handleDelete = async (user: User) => {
    confirm({
      title: t('users.confirmDelete'),
      description: `${t('users.confirmDelete')}: ${user.username}`,
      confirmLabel: t('common.delete'),
      cancelLabel: t('common.cancel'),
      variant: 'danger',
      onConfirm: async () => {
        try {
          await api.users.delete(user.id);
          toast.success(t('users.userDeleted'));
          loadUsers();
        } catch (error) {
          toast.error(error instanceof Error ? error.message : 'Failed to delete user');
        }
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t('users.title')}</h1>
        <Button onClick={() => openDialog()}>
          <Plus className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
          {t('users.addUser')}
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('users.username')}</TableHead>
              <TableHead>{t('users.email')}</TableHead>
              <TableHead>{t('users.role')}</TableHead>
              <TableHead>{t('users.createdAt')}</TableHead>
              <TableHead className="text-right">{t('users.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  {t('users.noUsers')}
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.username}</TableCell>
                  <TableCell>{user.email || '-'}</TableCell>
                  <TableCell>
                    <span className="capitalize font-medium">{t(`users.${user.role}`)}</span>
                  </TableCell>
                  <TableCell>{format(new Date(user.createdAt), 'PP')}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openDialog(user)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(user)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <DataPagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        canGoNext={canGoNext}
        canGoPrevious={canGoPrevious}
        startIndex={startIndex}
        endIndex={endIndex}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
        onItemsPerPageChange={setItemsPerPage}
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingUser ? t('users.editUser') : t('users.createUser')}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">{t('users.username')} *</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{t('users.email')}</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">
                {t('users.password')} {editingUser ? '(leave blank to keep current)' : '*'}
              </Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required={!editingUser}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">{t('users.role')} *</Label>
              <Select value={formData.role} onValueChange={(value: Role) => setFormData({ ...formData, role: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">{t('users.admin')}</SelectItem>
                  <SelectItem value="manager">{t('users.manager')}</SelectItem>
                  <SelectItem value="user">{t('users.user')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button type="submit">{t('common.save')}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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

export default Users;
