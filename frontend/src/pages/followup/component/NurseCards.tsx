import React, { useState } from 'react';

interface Nurse {
  id: number;
  name: string;
  role: string;
  avatar: string;
  activePatients: number;
  followupsDue: number;
  completedToday: number;
  status: 'available' | 'busy' | 'off-duty';
}

const nurses: Nurse[] = [
  {
    id: 1,
    name: 'Mia Garcia',
    role: 'Follow Up Nurse I',
    avatar: 'MG',
    activePatients: 14,
    followupsDue: 3,
    completedToday: 8,
    status: 'available',
  },
  {
    id: 2,
    name: 'Vivien Marie Wagan',
    role: 'Follow Up Nurse II',
    avatar: 'VM',
    activePatients: 9,
    followupsDue: 6,
    completedToday: 5,
    status: 'available',
  },
  {
    id: 3,
    name: 'Gretel Yedra',
    role: 'Follow Up Nurse III',
    avatar: 'GY',
    activePatients: 11,
    followupsDue: 1,
    completedToday: 12,
    status: 'available',
  },
  {
    id: 4,
    name: 'Milyne Macayanan',
    role: 'Follow Up Nurse IV',
    avatar: 'MM',
    activePatients: 7,
    followupsDue: 4,
    completedToday: 3,
    status: 'available',
  },
];

const statusConfig = {
  available: { label: 'Available', dot: 'bg-emerald-400', text: 'text-emerald-400' },
  busy: { label: 'On Shift', dot: 'bg-amber-400', text: 'text-amber-400' },
  'off-duty': { label: 'Off Duty', dot: 'bg-slate-400', text: 'text-slate-400' },
};

const avatarColors = [
  'from-violet-500 to-purple-600',
  'from-sky-500 to-blue-600',
  'from-rose-500 to-pink-600',
  'from-teal-500 to-cyan-600',
];

export const NurseCards: React.FC = () => {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <section>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 tracking-tight">
            Care Team
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Active nurses this shift</p>
        </div>
        <span className="text-xs font-medium bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-300 px-3 py-1 rounded-full">
          {nurses.filter((n) => n.status !== 'off-duty').length} on shift
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {nurses.map((nurse, i) => {
          const status = statusConfig[nurse.status];
          const isHovered = hovered === nurse.id;

          return (
            <div
              key={nurse.id}
              onMouseEnter={() => setHovered(nurse.id)}
              onMouseLeave={() => setHovered(null)}
              className={`relative rounded-2xl p-5 cursor-pointer transition-all duration-300 border
                ${
                  nurse.status === 'off-duty'
                    ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-700/50 opacity-70'
                    : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700/60'
                }
                ${isHovered ? 'shadow-xl -translate-y-1' : 'shadow-sm'}
              `}
            >
              {/* Top row */}
              <div className="flex items-start justify-between mb-4">
                <div
                  className={`w-11 h-11 rounded-xl bg-gradient-to-br ${avatarColors[i]} flex items-center justify-center text-white text-sm font-bold shadow-md`}
                >
                  {nurse.avatar}
                </div>
                <span className={`flex items-center gap-1.5 text-xs font-medium ${status.text}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${status.dot} animate-pulse`} />
                  {status.label}
                </span>
              </div>

              {/* Name & role */}
              <div className="mb-4">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-tight">
                  {nurse.name}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">{nurse.role}</p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center">
                  <p className="text-lg font-bold text-slate-800 dark:text-slate-100">
                    {nurse.activePatients}
                  </p>
                  <p className="text-[10px] text-slate-400 leading-tight">Patients</p>
                </div>
                <div className="text-center border-x border-slate-100 dark:border-slate-700">
                  <p className={`text-lg font-bold ${nurse.followupsDue > 4 ? 'text-rose-500' : 'text-amber-500'}`}>
                    {nurse.followupsDue}
                  </p>
                  <p className="text-[10px] text-slate-400 leading-tight">Due</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-emerald-500">{nurse.completedToday}</p>
                  <p className="text-[10px] text-slate-400 leading-tight">Done</p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-4">
                <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                  <span>Follow-up progress</span>
                  <span>
                    {Math.round(
                      (nurse.completedToday / (nurse.completedToday + nurse.followupsDue)) * 100
                    )}
                    %
                  </span>
                </div>
                <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-violet-500 to-purple-400 rounded-full transition-all duration-500"
                    style={{
                      width: `${(nurse.completedToday / (nurse.completedToday + nurse.followupsDue)) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};