'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RoleGuard } from '@/components/role-guard';
import { Permission } from '@/lib/permissions';
import { apiFetch } from '@/lib/api-config';
import { useAuth } from '@/lib/hooks/useAuth';
import { isUnassigned } from '@/lib/rbac';
import { RefreshCw, Search, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';

interface UserRow {
  id: string;
  name: string;
  email: string;
  image: string | null;
  roles: string[];
  isRemoved?: boolean;
}

export default function AdminUsersPage() {
  const { userProfile, loading: authLoading } = useAuth();
  const router = useRouter();

  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [userToRemove, setUserToRemove] = useState<UserRow | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && userProfile && isUnassigned(userProfile)) {
      router.push('/welcome');
    }
  }, [authLoading, userProfile, router]);

  const loadUsers = useCallback(async (term = '') => {
    try {
      setLoading(true);
      const query = term ? `?search=${encodeURIComponent(term)}` : '';
      const res = await apiFetch(`/api/users${query}`, {
        cache: 'no-store',
        credentials: 'include',
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 403) {
          router.push('/welcome');
          return;
        }
        throw new Error(data.error || 'Failed to load users');
      }

      const data = await res.json();
      setUsers((data.users || []).map((user: UserRow) => ({ ...user, isRemoved: false })));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load users';
      toast.error(message);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (!authLoading && userProfile && !isUnassigned(userProfile)) {
      void loadUsers('');
    }
  }, [authLoading, userProfile, loadUsers]);

  const handleSearch = async (event: React.FormEvent) => {
    event.preventDefault();
    const nextTerm = searchInput.trim();
    setSearchTerm(nextTerm);
    await loadUsers(nextTerm);
  };

  const handleRemoveClick = (user: UserRow) => {
    setUserToRemove(user);
    setConfirmOpen(true);
  };

  const handleRemove = async () => {
    if (!userToRemove) return;

    const originalUser = users.find((user) => user.id === userToRemove.id);
    setRemovingId(userToRemove.id);
    setUsers((current) =>
      current.map((user) =>
        user.id === userToRemove.id ? { ...user, isRemoved: true, roles: [] } : user,
      ),
    );
    setConfirmOpen(false);

    try {
      const res = await apiFetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userToRemove.id }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to remove user');
      }

      toast.success('User removed');
      await loadUsers(searchTerm);
    } catch (error) {
      if (originalUser) {
        setUsers((current) =>
          current.map((user) => (user.id === originalUser.id ? originalUser : user)),
        );
      }
      const message = error instanceof Error ? error.message : 'Failed to remove user';
      toast.error(message);
    } finally {
      setRemovingId(null);
      setUserToRemove(null);
    }
  };

  if (authLoading || !userProfile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900" />
      </div>
    );
  }

  if (isUnassigned(userProfile)) return null;

  return (
    <RoleGuard
      requirePermission={Permission.MANAGE_USERS}
      accessDeniedMessage="You need the Manage Users permission to view this page."
    >
      <div className="container mx-auto space-y-6 px-4 py-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Users</h1>
            <p className="text-muted-foreground mt-1">
              View, search, and manage the people in your organization.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => void loadUsers(searchTerm)}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="bg-primary/10 mb-3 flex h-12 w-12 items-center justify-center rounded-lg">
                  <Users className="text-primary h-6 w-6" />
                </div>
                <CardTitle>People</CardTitle>
                <CardDescription>
                  Search users by name or email and remove access by marking their roles inactive.
                </CardDescription>
              </div>
              <form onSubmit={handleSearch} className="flex w-full max-w-sm items-center gap-2">
                <Input
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Search by name or email"
                />
                <Button type="submit" size="sm">
                  <Search className="mr-2 h-4 w-4" />
                  Search
                </Button>
              </form>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-muted-foreground py-8 text-center">Loading users...</div>
            ) : users.length === 0 ? (
              <div className="text-muted-foreground py-8 text-center">
                No users found for this search.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Roles</TableHead>
                    <TableHead className="w-20 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={user.image || undefined} alt={user.name} />
                            <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                              {user.name
                                .split(' ')
                                .map((piece) => piece[0])
                                .join('')
                                .slice(0, 2)
                                .toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{user.name}</span>
                              {user.isRemoved && <Badge variant="secondary">Removed</Badge>}
                            </div>
                            <div className="text-muted-foreground text-sm">{user.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          {user.roles.length > 0 ? (
                            user.roles.map((role) => (
                              <Badge key={role} variant="outline">
                                {role}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-muted-foreground text-sm">No active roles</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => handleRemoveClick(user)}
                          disabled={user.isRemoved || removingId === user.id}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove user access?</AlertDialogTitle>
              <AlertDialogDescription>
                This will mark all active roles for {userToRemove?.name || 'this user'} as removed.
                Their profile will stay intact, but they will no longer have active roles.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={removingId !== null}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleRemove}
                disabled={removingId !== null}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {removingId ? 'Removing...' : 'Remove'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </RoleGuard>
  );
}
