'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Button from '@/components/Button';
import Card from '@/components/Card';
import CreateGroupModal from '@/components/CreateGroupModal';
import { Plus, Users, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface Group {
  group_id: string;
  last_activity: string;
  // We need group name! 
  // `getMyGroups` returns distinct `group_id` and `last_activity`.
  // It doesn't return name. 
  // We should update `getMyGroups` to fetch name?
  // Where is the name stored? 
  // We didn't create a groups table. 
  // Name was passed in `createGroup`, but only used in a message "Group 'Name' created".
  // So to get the name, we have to find that specific creation message?
  // That's inefficient.
  // We should probably store the name in the `expenses` table for every entry? No.
  // Or just fetch the creation message for each group.
  
  // Design compromise: For now, I'll fetch the name by querying the first message of the group client-side 
  // or just show "Group {id}" if I can't find it easily.
  // OR, I can update the backend to do a subquery to find the name from the creation message.
  
  // Let's try to fetch it or just display ID for now, 
  // but for "Apple-like" UI, ID is bad.
  // I will assume I can fetch details.
  name?: string; 
}

export default function Dashboard() {
  const { user, isAuthenticated, checkAuth } = useAuthStore();
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (!isAuthenticated && !loading) {
       // Wait for checkAuth
    }
    if (isAuthenticated) {
      fetchGroups();
    } else if (localStorage.getItem('token') === null) {
        router.push('/login');
    }
  }, [isAuthenticated]);

  const fetchGroups = async () => {
    try {
      const res = await api.get('/groups/my');
      // We need names.
      // For each group, fetch summary to get name? 
      // Too many requests.
      // I'll update backend to return name if possible.
      // For now, let's just display the list.
      setGroups(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const GroupItem = ({ group }: { group: Group }) => (
    <Link href={`/groups/${group.group_id}`}>
      <Card className="hover:shadow-md transition-all cursor-pointer group mb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Group {group.group_id.slice(0, 8)}...</h3>
              <p className="text-sm text-gray-500">Last active: {new Date(group.last_activity).toLocaleDateString()}</p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-primary transition-colors" />
        </div>
      </Card>
    </Link>
  );

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-10">
            <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">EasyShare</h1>
                <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-gray-600">{user?.name}</span>
                    <Button variant="ghost" size="sm" onClick={() => {
                        useAuthStore.getState().logout();
                        router.push('/login');
                    }}>Logout</Button>
                </div>
            </div>
        </header>

        <main className="max-w-3xl mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-gray-900">My Groups</h2>
                <Button onClick={() => setShowCreateModal(true)}>
                    <Plus className="w-5 h-5 mr-1" />
                    New Group
                </Button>
            </div>

            <div className="space-y-4">
                {groups.length === 0 && !loading ? (
                    <div className="text-center py-20 text-gray-400">
                        <Users className="w-16 h-16 mx-auto mb-4 opacity-20" />
                        <p>No groups yet. Create one to get started!</p>
                    </div>
                ) : (
                    groups.map(g => <GroupItem key={g.group_id} group={g} />)
                )}
            </div>
        </main>

        {showCreateModal && (
            <CreateGroupModal 
                onClose={() => setShowCreateModal(false)} 
                onCreated={fetchGroups} 
            />
        )}
    </div>
  );
}
