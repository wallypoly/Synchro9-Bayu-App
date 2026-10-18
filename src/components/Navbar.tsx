import React from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import {
  Shield,
  CheckCircle,
  Clock,
  UserCheck,
  FileSpreadsheet,
  LogOut,
  Users,
  Calendar,
  Award,
  Layers,
  ChevronDown
} from 'lucide-react';

interface NavbarProps {
  currentTab: 'attendance' | 'assessment' | 'sessions' | 'members' | 'export';
  setCurrentTab: (tab: 'attendance' | 'assessment' | 'sessions' | 'members' | 'export') => void;
  onOpenCheckIn: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, setCurrentTab, onOpenCheckIn }) => {
  const { profile, logout, quickSwitchRole, claimInitialAdmin } = useAuth();
  const [demoMenuOpen, setDemoMenuOpen] = React.useState(false);

  const roleColors: Record<UserRole, string> = {
    admin: 'bg-amber-100 text-amber-900 border-amber-300',
    coach: 'bg-blue-100 text-blue-900 border-blue-300',
    parent: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    athlete: 'bg-purple-100 text-purple-900 border-purple-300'
  };

  const roleLabels: Record<UserRole, string> = {
    admin: 'Admin / Publisher (Coach CW)',
    coach: 'Coach (Shazfinas)',
    parent: 'Parent (Low Family)',
    athlete: 'Athlete (Gabriella)'
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
      {/* Brand & Demo Switcher Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setCurrentTab('attendance')}>
            <img
              src="/bayu-blades-logo-v3.svg"
              alt="Bayu Blades Logo"
              className="h-10 w-auto object-contain drop-shadow-sm"
              onError={(e) => {
                // Fallback to text logo if SVG fails
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-black text-lg tracking-tight text-[#0a1e3f]">
                  SYNCHRO<span className="text-amber-500">9</span>
                </span>
                <span className="text-xs font-semibold uppercase px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                  Bayu Blades
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-500 hidden sm:block">
                National Team Athlete Portal · Smart Attendance & Assessment
              </p>
            </div>
          </div>

          {/* Quick Actions & Role Switcher */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Self Check-in Trigger */}
            <button
              onClick={onOpenCheckIn}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider text-white bg-blue-700 hover:bg-blue-800 shadow-sm active:scale-95 transition-transform"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Self Check-In</span>
            </button>

            {/* Persona Switcher Dropdown (for testing all 5 roles instantly) */}
            <div className="relative">
              <button
                onClick={() => setDemoMenuOpen(!demoMenuOpen)}
                className={`inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold border transition ${
                  profile ? roleColors[profile.role] : 'bg-slate-100 text-slate-700'
                }`}
                title="Switch role persona for testing Coach / Lead / Admin / Parent / Athlete"
              >
                <Shield className="w-3.5 h-3.5" />
                <span className="hidden md:inline">{profile ? roleLabels[profile.role] : 'Select Persona'}</span>
                <span className="md:hidden">{profile?.role.toUpperCase()}</span>
                <ChevronDown className="w-3 h-3 ml-0.5" />
              </button>

              {demoMenuOpen && (
                <div
                  className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-50 text-left"
                  onClick={() => setDemoMenuOpen(false)}
                >
                  <div className="px-3 py-1.5 border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Switch Test Persona
                  </div>
                  <button
                    onClick={() => quickSwitchRole('admin')}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-amber-50 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-bold text-amber-950">Coach Cheng Wei</p>
                      <p className="text-[10px] text-amber-700">Admin & Publisher</p>
                    </div>
                    <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">Admin</span>
                  </button>

                  <button
                    onClick={() => quickSwitchRole('coach')}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-blue-50 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-bold text-blue-950">Coach Shazfinas</p>
                      <p className="text-[10px] text-blue-700">Team Manager / Session Lead</p>
                    </div>
                    <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">Lead</span>
                  </button>

                  <button
                    onClick={() => quickSwitchRole('parent')}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-emerald-50 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-bold text-emerald-950">Mrs. Low (Parent)</p>
                      <p className="text-[10px] text-emerald-700">Bound to Gabriella & Giovanna</p>
                    </div>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">Parent</span>
                  </button>

                  <button
                    onClick={() => quickSwitchRole('athlete')}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-purple-50 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-bold text-purple-950">Gabriella Low</p>
                      <p className="text-[10px] text-purple-700">Junior Squad Athlete</p>
                    </div>
                    <span className="text-[10px] bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded">Athlete</span>
                  </button>

                  <div className="border-t border-slate-100 mt-1 pt-1 px-3">
                    <button
                      onClick={claimInitialAdmin}
                      className="text-[11px] text-blue-700 hover:text-blue-900 font-semibold py-1 block w-full text-left"
                    >
                      👑 Claim Coach Cheng Wei Admin
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Logout / Reset button */}
            <button
              onClick={logout}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              title="Reset session"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav className="bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 sm:space-x-4 overflow-x-auto py-2 scrollbar-none">
            <button
              onClick={() => setCurrentTab('attendance')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                currentTab === 'attendance'
                  ? 'bg-blue-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Smart Attendance</span>
            </button>

            <button
              onClick={() => setCurrentTab('assessment')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                currentTab === 'assessment'
                  ? 'bg-blue-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Assessment (36-Metric)</span>
            </button>

            <button
              onClick={() => setCurrentTab('sessions')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                currentTab === 'sessions'
                  ? 'bg-blue-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Training Sessions</span>
            </button>

            <button
              onClick={() => setCurrentTab('members')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                currentTab === 'members'
                  ? 'bg-blue-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Skaters & Access</span>
            </button>

            <button
              onClick={() => setCurrentTab('export')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                currentTab === 'export'
                  ? 'bg-blue-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </nav>
    </header>
  );
};
