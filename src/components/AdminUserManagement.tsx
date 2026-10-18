import React, { useState } from 'react';
import { Skater, UserProfile, UserRole, AccountStatus } from '../types';
import { useAuth } from '../context/AuthContext';
import { INITIAL_COACHES, INITIAL_SKATERS } from '../services/mockDataService';
import {
  Users,
  Shield,
  CheckCircle,
  XCircle,
  Link,
  Unlink,
  UserCheck,
  Search,
  Plus
} from 'lucide-react';

interface AdminUserManagementProps {
  skaters: Skater[];
  onSkatersChange: (skaters: Skater[]) => void;
}

export const AdminUserManagement: React.FC<AdminUserManagementProps> = ({
  skaters,
  onSkatersChange
}) => {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';

  const [users, setUsers] = useState<UserProfile[]>([
    ...INITIAL_COACHES,
    {
      uid: 'parent_low_family',
      email: 'low.family@example.com',
      displayName: 'Mrs. Low (Parent)',
      role: 'parent',
      status: 'approved',
      skaterIds: ['skater_1', 'skater_5'],
      createdAt: '2026-10-15T00:00:00Z',
      updatedAt: '2026-10-15T00:00:00Z'
    },
    {
      uid: 'athlete_skater_1',
      email: 'gabby@example.com',
      displayName: 'Gabriella Low (Athlete)',
      role: 'athlete',
      status: 'approved',
      skaterIds: ['skater_1'],
      createdAt: '2026-10-15T00:00:00Z',
      updatedAt: '2026-10-15T00:00:00Z'
    },
    {
      uid: 'pending_parent_darin',
      email: 'darin.parent@example.com',
      displayName: 'Mr. Azra (Parent of Darin)',
      role: 'parent',
      status: 'pending',
      skaterIds: [],
      createdAt: '2026-10-18T00:00:00Z',
      updatedAt: '2026-10-18T00:00:00Z'
    }
  ]);

  const [activeTab, setActiveTab] = useState<'skaters' | 'users'>('skaters');
  const [searchTerm, setSearchTerm] = useState('');
  const [bindingModal, setBindingModal] = useState<{
    open: boolean;
    user: UserProfile | null;
  }>({ open: false, user: null });

  const handleApproveUser = (uid: string) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.uid === uid
          ? {
              ...u,
              status: 'approved',
              approvedBy: profile?.uid || 'admin',
              approvedAt: new Date().toISOString()
            }
          : u
      )
    );
  };

  const handleDisableUser = (uid: string) => {
    setUsers((prev) =>
      prev.map((u) => (u.uid === uid ? { ...u, status: 'disabled' } : u))
    );
  };

  const handleRoleChange = (uid: string, role: UserRole) => {
    setUsers((prev) => prev.map((u) => (u.uid === uid ? { ...u, role } : u)));
  };

  const handleToggleSkaterBinding = (skaterId: string) => {
    if (!bindingModal.user) return;
    const currentSkaterIds = bindingModal.user.skaterIds || [];
    const newSkaterIds = currentSkaterIds.includes(skaterId)
      ? currentSkaterIds.filter((id) => id !== skaterId)
      : [...currentSkaterIds, skaterId];

    const updatedUser = {
      ...bindingModal.user,
      skaterIds: newSkaterIds
    };

    setUsers((prev) => prev.map((u) => (u.uid === updatedUser.uid ? updatedUser : u)));
    setBindingModal({ open: true, user: updatedUser });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            Team Roster & Account Administration
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage athlete roster (40 registered skaters), user account approvals, roles and family bindings
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('skaters')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'skaters' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            Skaters Roster ({skaters.length})
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'users' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            User Accounts ({users.length})
          </button>
        </div>
      </div>

      {/* Skaters View */}
      {activeTab === 'skaters' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <input
              type="text"
              placeholder="Search skater by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs w-64"
            />
            <span className="text-xs font-bold text-slate-500">
              Total registered squad: {skaters.length}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-black uppercase text-slate-500 border-b border-slate-200">
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">Full Name</th>
                  <th className="py-3 px-4">Nickname</th>
                  <th className="py-3 px-4">Squad</th>
                  <th className="py-3 px-4">Code of Conduct</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {skaters
                  .filter((s) => s.fullName.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map((s, idx) => (
                    <tr key={s.id} className="hover:bg-slate-50/60">
                      <td className="py-2.5 px-4 font-mono text-slate-400">{idx + 1}</td>
                      <td className="py-2.5 px-4 font-bold text-slate-900">{s.fullName}</td>
                      <td className="py-2.5 px-4 text-slate-500">{s.nickname || '—'}</td>
                      <td className="py-2.5 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-slate-100 text-slate-800">
                          {s.squad}
                        </span>
                      </td>
                      <td className="py-2.5 px-4">
                        {s.signedCodeOfConduct ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            Signed ✓
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-4">
                        <span className="text-slate-600 font-medium">{s.status}</span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Users & Approvals View */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-black uppercase text-slate-500 border-b border-slate-200">
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Linked Skaters</th>
                  {isAdmin && <th className="py-3 px-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => {
                  const boundNames = (u.skaterIds || [])
                    .map((id) => skaters.find((s) => s.id === id)?.fullName)
                    .filter(Boolean);

                  return (
                    <tr key={u.uid} className="hover:bg-slate-50/60">
                      <td className="py-3 px-4 font-bold text-slate-900">{u.displayName}</td>
                      <td className="py-3 px-4 font-mono text-slate-500">{u.email}</td>
                      <td className="py-3 px-4">
                        {isAdmin && u.email !== 'chiachengwei@gmail.com' ? (
                          <select
                            value={u.role}
                            onChange={(e) => handleRoleChange(u.uid, e.target.value as UserRole)}
                            className="p-1 rounded border border-slate-200 bg-white font-bold"
                          >
                            <option value="athlete">Athlete</option>
                            <option value="parent">Parent</option>
                            <option value="coach">Coach</option>
                            <option value="admin">Admin</option>
                          </select>
                        ) : (
                          <span className="font-bold uppercase text-slate-800">{u.role}</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                            u.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : u.status === 'pending'
                              ? 'bg-amber-100 text-amber-900'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {u.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {boundNames.length > 0 ? (
                          <span className="text-slate-700 font-medium">
                            {boundNames.join(', ')}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">None</span>
                        )}
                        {isAdmin && (u.role === 'parent' || u.role === 'athlete') && (
                          <button
                            onClick={() => setBindingModal({ open: true, user: u })}
                            className="ml-2 text-blue-700 hover:text-blue-900 font-bold text-[11px]"
                          >
                            [Edit Binding]
                          </button>
                        )}
                      </td>
                      {isAdmin && (
                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center space-x-1.5">
                            {u.status === 'pending' && (
                              <button
                                onClick={() => handleApproveUser(u.uid)}
                                className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                              >
                                Approve
                              </button>
                            )}
                            {u.status === 'approved' && u.email !== 'chiachengwei@gmail.com' && (
                              <button
                                onClick={() => handleDisableUser(u.uid)}
                                className="px-2 py-1 rounded bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-medium"
                              >
                                Disable
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Parent / Athlete Skater Binding Modal */}
      {bindingModal.open && bindingModal.user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 space-y-4 max-h-[80vh] flex flex-col">
            <h3 className="text-base font-black text-slate-900">
              Bind Skaters to {bindingModal.user.displayName}
            </h3>
            <p className="text-xs text-slate-500">
              Select which children / skaters this account is authorized to view and check-in for.
            </p>

            <div className="overflow-y-auto space-y-1.5 flex-1 p-1">
              {skaters.map((s) => {
                const isBound = (bindingModal.user?.skaterIds || []).includes(s.id);
                return (
                  <button
                    key={s.id}
                    onClick={() => handleToggleSkaterBinding(s.id)}
                    className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between text-xs transition ${
                      isBound
                        ? 'bg-blue-50 border-blue-300 text-blue-950 font-bold'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>
                      {s.fullName} ({s.squad.toUpperCase()})
                    </span>
                    <span>{isBound ? '✓ Bound' : '+ Link'}</span>
                  </button>
                );
              })}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setBindingModal({ open: false, user: null })}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-700 hover:bg-blue-800"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
