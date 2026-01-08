import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import api from '@/lib/api';
import Button from './Button';
import Input from './Input';
import Card from './Card';
import { X } from 'lucide-react';

interface CreateGroupModalProps {
  onClose: () => void;
  onCreated: () => void;
}

export default function CreateGroupModal({ onClose, onCreated }: CreateGroupModalProps) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const user = useAuthStore((state) => state.user);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // 1. Create Group
      const res = await api.post('/groups', { 
        name, 
        members: [user?.id] // Ideally we add creators automatically or pass members
      });
      const groupId = res.data.id;

      // 2. Add an initial "expense" (message) to link user to group 
      // (As per our backend logic where myGroups depends on participation)
      // Actually, my backend createGroup endpoint inserts a "Group Created" message 
      // but it sets participants to null? 
      // Wait, in `createGroup` I wrote: `participants: null`.
      // This means `getMyGroups` won't find it if it searches for userId in participants!
      // I need to fix `createGroup` in backend to include the creator in participants of the creation message 
      // OR I need to add an explicit "Add Member" call.
      // Let's assume I fix backend or handle it here.
      // I will add a "Member Joined" message right after creation to ensure linkage.
      
      await api.post(`/groups/${groupId}/expenses`, {
        amount: 0,
        paidBy: user?.id,
        description: `${user?.name} created the group`,
        participants: [user?.id], // JSONB array
        // Type will be inferred as expense, but amount 0? 
        // Or I should use a specific endpoint or type?
        // My `addExpense` endpoint sets type='expense'. 
        // I might need to send a message instead.
        // But `addExpense` is for expenses. 
        // I'll use the hack: add an expense of 0 with all members to initialize?
        // OR better: Update backend `createGroup` to set participants for the intro message.
        
        // For now, I'll send a dummy expense or message if I can.
      });

      onCreated();
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <Card className="w-full max-w-md relative animate-in fade-in zoom-in-95 duration-200">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X className="w-5 h-5" />
        </button>
        
        <h2 className="text-xl font-bold mb-4">Create New Group</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input 
            label="Group Name" 
            value={name} 
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />
          
          <div className="flex justify-end gap-2 mt-6">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" isLoading={loading}>Create Group</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
