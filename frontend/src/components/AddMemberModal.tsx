import { useState } from 'react';
import api from '@/lib/api';
import Button from './Button';
import Input from './Input';
import Card from './Card';
import { X } from 'lucide-react';

interface AddMemberModalProps {
  groupId: string;
  onClose: () => void;
}

export default function AddMemberModal({ groupId, onClose }: AddMemberModalProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    
    try {
      await api.post(`/groups/${groupId}/members`, { email });
      setMessage('Member added successfully!');
      setEmail('');
      setTimeout(() => {
          onClose();
      }, 1000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add member');
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
        
        <h2 className="text-xl font-bold mb-4">Add Member</h2>
        <p className="text-sm text-gray-500 mb-4">Enter the email address of the user you want to add.</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input 
            label="Email Address" 
            type="email"
            value={email} 
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
          />
          
          {error && <p className="text-danger text-sm">{error}</p>}
          {message && <p className="text-success text-sm">{message}</p>}
          
          <div className="flex justify-end gap-2 mt-6">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" isLoading={loading}>Add Member</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
