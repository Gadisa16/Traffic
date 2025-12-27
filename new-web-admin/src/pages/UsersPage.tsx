import { useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, Search, Shield, UserCheck, UserX, Clock, 
  CheckCircle2, XCircle, Eye
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UserWithRole {
  id: string;
  email: string;
  name: string;
  created_at: string;
  role: string | null;
}

export default function UsersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, name, created_at')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      const rolesMap = new Map(roles?.map(r => [r.user_id, r.role]));

      return profiles?.map(p => ({
        ...p,
        role: rolesMap.get(p.id) || null,
      })) as UserWithRole[];
    },
  });

  const filteredUsers = users?.filter(user => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matches = 
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query);
      if (!matches) return false;
    }

    if (activeTab === 'admins') return user.role === 'admin';
    if (activeTab === 'inspectors') return user.role === 'inspector';
    if (activeTab === 'unassigned') return !user.role;
    return true;
  }) ?? [];

  const getRoleBadge = (role: string | null) => {
    switch (role) {
      case 'admin':
        return <Badge variant="default" className="bg-primary"><Shield className="h-3 w-3 mr-1" />Admin</Badge>;
      case 'inspector':
        return <Badge variant="secondary"><UserCheck className="h-3 w-3 mr-1" />Inspector</Badge>;
      default:
        return <Badge variant="outline" className="text-muted-foreground"><Clock className="h-3 w-3 mr-1" />Unassigned</Badge>;
    }
  };

  const counts = {
    all: users?.length ?? 0,
    admins: users?.filter(u => u.role === 'admin').length ?? 0,
    inspectors: users?.filter(u => u.role === 'inspector').length ?? 0,
    unassigned: users?.filter(u => !u.role).length ?? 0,
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
          <TabsTrigger value="unassigned" className="gap-2">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">Pending</span>
            <Badge variant="secondary" className="ml-1">{counts.unassigned}</Badge>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Search */}
      <Card variant="default" className="mb-6">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
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
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-foreground">{user.name}</h3>
                      {getRoleBadge(user.role)}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Joined {new Date(user.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon-sm">
                      <Eye className="h-4 w-4" />
                    </Button>
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
