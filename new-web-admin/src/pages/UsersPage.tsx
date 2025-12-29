import { AdminLayout } from '@/components/AdminLayout';
import { EmptyState } from '@/components/EmptyState';
import { PageHeader } from '@/components/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import * as Api from '@/lib/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle2,
  Clock,
  MoreVertical,
  Search, Shield, UserCheck,
  Users,
  UserX,
  XCircle
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface User {
  id: number;
  username: string;
  email: string | null;
  phone: string | null;
  role: string;
  status: string;
  email_verified: number;
  phone_verified: number;
  created_at: string | null;
  updated_at: string | null;
}

export default function UsersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => Api.getUsers(),
  });

  const assignRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: number; role: string }) =>
      Api.assignUserRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Role assigned successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to assign role');
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ userId, status }: { userId: number; status: string }) =>
      Api.updateUserStatus(userId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Status updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update status');
    },
  });

  const activateUserMutation = useMutation({
    mutationFn: (userId: number) => Api.activateUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('User activated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to activate user');
    },
  });

  const filteredUsers = users?.filter(user => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matches =
        user.username.toLowerCase().includes(query) ||
        (user.email?.toLowerCase().includes(query) ?? false) ||
        (user.phone?.includes(query) ?? false);
      if (!matches) return false;
    }

    if (activeTab === 'admins') return user.role === 'admin' || user.role === 'super_admin';
    if (activeTab === 'inspectors') return user.role === 'inspector';
    if (activeTab === 'pending') return user.status === 'pending_verification' || user.status === 'pending';
    return true;
  }) ?? [];

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'super_admin':
        return <Badge variant="default" className="bg-purple-600"><Shield className="h-3 w-3 mr-1" />Super Admin</Badge>;
      case 'admin':
        return <Badge variant="default" className="bg-primary"><Shield className="h-3 w-3 mr-1" />Admin</Badge>;
      case 'inspector':
        return <Badge variant="secondary"><UserCheck className="h-3 w-3 mr-1" />Inspector</Badge>;
      case 'public':
        return <Badge variant="outline"><Users className="h-3 w-3 mr-1" />Public</Badge>;
      default:
        return <Badge variant="outline" className="text-muted-foreground"><Clock className="h-3 w-3 mr-1" />Unknown</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-600"><CheckCircle2 className="h-3 w-3 mr-1" />Active</Badge>;
      case 'pending_verification':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      case 'disabled':
        return <Badge variant="outline" className="text-muted-foreground"><UserX className="h-3 w-3 mr-1" />Disabled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const counts = {
    all: users?.length ?? 0,
    admins: users?.filter(u => u.role === 'admin' || u.role === 'super_admin').length ?? 0,
    inspectors: users?.filter(u => u.role === 'inspector').length ?? 0,
    pending: users?.filter(u => u.status === 'pending_verification' || u.status === 'pending').length ?? 0,
  };

  return (
    <AdminLayout>
      <PageHeader
        title="User Management"
        description="Manage system users and their roles"
      />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="all" className="gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">All</span>
            <Badge variant="secondary" className="ml-1">{counts.all}</Badge>
          </TabsTrigger>
          <TabsTrigger value="admins" className="gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Admins</span>
            <Badge variant="secondary" className="ml-1">{counts.admins}</Badge>
          </TabsTrigger>
          <TabsTrigger value="inspectors" className="gap-2">
            <UserCheck className="h-4 w-4" />
            <span className="hidden sm:inline">Inspectors</span>
            <Badge variant="secondary" className="ml-1">{counts.inspectors}</Badge>
          </TabsTrigger>
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">Pending</span>
            <Badge variant="secondary" className="ml-1">{counts.pending}</Badge>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Search */}
      <Card variant="default" className="mb-6">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by username, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <p className="text-sm text-muted-foreground mb-4">
        {isLoading ? 'Loading...' : `Showing ${filteredUsers.length} users`}
      </p>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : filteredUsers.length > 0 ? (
        <div className="space-y-3">
          {filteredUsers.map((user, index) => (
            <Card
              key={user.id}
              variant="interactive"
              className="animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-primary font-semibold text-lg">
                      {user.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-foreground">{user.username}</h3>
                      {getRoleBadge(user.role)}
                      {getStatusBadge(user.status)}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {user.email || user.phone || 'No contact info'}
                    </p>
                    {user.created_at && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Joined {new Date(user.created_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => assignRoleMutation.mutate({ userId: user.id, role: 'public' })}
                        >
                          Set as Public User
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => assignRoleMutation.mutate({ userId: user.id, role: 'inspector' })}
                        >
                          Set as Inspector
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => assignRoleMutation.mutate({ userId: user.id, role: 'admin' })}
                        >
                          Set as Admin
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {user.status !== 'active' && (
                          <DropdownMenuItem
                            onClick={() => activateUserMutation.mutate(user.id)}
                            className="text-green-600"
                          >
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Activate User
                          </DropdownMenuItem>
                        )}
                        {user.status === 'active' && (
                          <DropdownMenuItem
                            onClick={() => updateStatusMutation.mutate({ userId: user.id, status: 'disabled' })}
                            className="text-orange-600"
                          >
                            <UserX className="h-4 w-4 mr-2" />
                            Disable User
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => updateStatusMutation.mutate({ userId: user.id, status: 'rejected' })}
                          className="text-destructive"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Users}
          title="No users found"
          description="No users match your search criteria."
        />
      )}
    </AdminLayout>
  );
}
