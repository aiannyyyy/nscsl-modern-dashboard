import React, { useState, useEffect } from 'react';
import {
  X, User, ZoomIn, Image as ImageIcon,
  ClipboardList, Download, Mail, FileText, BookOpen,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SampleRecord {
  LABNO: string;
  LABID: string;
  LNAME: string;
  FNAME: string;
  SUBMID: string;
  BIRTHDT: string;
  BIRTHTM: string;
  DTCOLL: string;
  TMCOLL: string;
  DTRECV: string;
  TMRECV: string;
  DTRPTD: string;
  GESTAGE: string;
  AGECOLL: string;
  SEX: string;
}

interface PatientRecordModalProps {
  record: SampleRecord | null;
  onClose: () => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt12h = (time?: string): string => {
  if (!time?.trim()) return '—';
  const digits = time.trim().replace(/:/g, '');
  if (digits.length < 4) return time;
  const hh     = parseInt(digits.slice(0, 2), 10);
  const mm     = digits.slice(2, 4);
  const period = hh >= 12 ? 'PM' : 'AM';
  const h12    = hh % 12 === 0 ? 12 : hh % 12;
  return `${String(h12).padStart(2, '0')}:${mm} ${period}`;
};

const sexLabel = (s: string): string => {
  switch (s?.toUpperCase()) {
    case '1': case 'M': return 'Male';
    case '2': case 'F': return 'Female';
    case 'A':           return 'Ambiguous';
    default:            return s || '—';
  }
};

const v = (x?: string | null, fallback = '—') => x?.trim() || fallback;

// ── Mock Results/Mailers rows ─────────────────────────────────────────────────

const MOCK_RESULTS = [
  { test: '17OHP',         code: '00109', mnemonic: 'NFT', value: '3.82',   result: 'Normal', text: 'Within Normal Limits', ref: '<40 nmol/L',       instruct: 'Normal result for the screened disorder.' },
  { test: 'ALA',           code: '10172', mnemonic: 'NFT', value: '393.69', result: 'Normal', text: 'Within Normal Limits', ref: '< 525.66 μmol/L',  instruct: 'Normal result for the screened disorder.' },
  { test: 'ARG',           code: '10159', mnemonic: 'NFT', value: '8',      result: 'Normal', text: 'Within Normal Limits', ref: '—',                instruct: 'Normal result for the screened disorder.' },
  { test: 'BTND',          code: '00201', mnemonic: 'NFT', value: '100',    result: 'Normal', text: 'Within Normal Limits', ref: '>=58.5',            instruct: 'Normal result for the screened disorder.' },
  { test: 'C0',            code: '10152', mnemonic: 'NFT', value: '39.63',  result: 'Normal', text: 'Within Normal Limits', ref: '—',                instruct: 'Normal result for the screened disorder.' },
  { test: 'C0 low',        code: '10154', mnemonic: 'NFT', value: '39.63',  result: 'Normal', text: 'Within Normal Limits', ref: '—',                instruct: 'Normal result for the screened disorder.' },
  { test: 'C0/(C16+C18)',  code: '10173', mnemonic: 'NFT', value: '5.51',   result: 'Normal', text: 'Within Normal Limits', ref: '—',                instruct: 'Normal result for the screened disorder.' },
  { test: 'C0/(C16+C18)',  code: '10170', mnemonic: 'NFT', value: '5.51',   result: 'Normal', text: 'Within Normal Limits', ref: '—',                instruct: 'Normal result for the screened disorder.' },
  { test: 'C10',           code: '10174', mnemonic: 'NFT', value: '0.28',   result: 'Normal', text: 'Within Normal Limits', ref: '—',                instruct: 'Normal result for the screened disorder.' },
  { test: 'C10 low',       code: '10162', mnemonic: 'NFT', value: '0.28',   result: 'Normal', text: 'Within Normal Limits', ref: '—',                instruct: 'Normal result for the screened disorder.' },
];

// ── Sub-components ────────────────────────────────────────────────────────────

const SectionBar: React.FC<{ title: string }> = ({ title }) => (
  <div className="px-3 py-1.5 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-widest flex-shrink-0">
    {title}
  </div>
);

const DemoRow: React.FC<{
  label: string;
  value: string;
  accent?: boolean;
  green?: boolean;
}> = ({ label, value, accent, green }) => (
  <div className="flex items-baseline border-b border-gray-100 dark:border-gray-800 py-[3.5px]">
    <span className="w-36 flex-shrink-0 text-[11px] text-gray-500 dark:text-gray-400">{label}</span>
    <span className={`text-[11px] break-all ${
      accent ? 'text-blue-600 dark:text-blue-400 font-semibold'
      : green ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
      : 'text-gray-800 dark:text-gray-200'
    }`}>
      {value}
    </span>
  </div>
);

const ActionBtn: React.FC<{ icon: React.ReactNode; label: string; onClick?: () => void }> = ({ icon, label, onClick }) => (
  <button
    onClick={onClick}
    className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[11px] font-medium rounded-lg
      bg-gray-50 dark:bg-gray-800
      hover:bg-blue-50 dark:hover:bg-blue-900/30
      text-gray-700 dark:text-gray-300
      hover:text-blue-600 dark:hover:text-blue-400
      border border-gray-200 dark:border-gray-700
      hover:border-blue-300 dark:hover:border-blue-700
      transition-all duration-150"
  >
    {icon}
    {label}
  </button>
);

// ── Main Modal ────────────────────────────────────────────────────────────────

export const PatientRecordModal: React.FC<PatientRecordModalProps> = ({ record, onClose }) => {
  const [zoom, setZoom] = useState(300);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!record) return null;

  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  // Fields — use actual data, fallback to mock reference values
  const labno   = v(record.LABNO,    '20260020001');
  const labid   = v(record.LABID,    '34672308');
  const lname   = v(record.LNAME,    'FLORES');
  const fname   = v(record.FNAME,    'MA ANGELYN');
  const submid  = v(record.SUBMID,   '1996');
  const birthdt = v(record.BIRTHDT,  '12/27/2025');
  const birthtm = fmt12h(record.BIRTHTM || '2222');
  const dtcoll  = v(record.DTCOLL,   '12/29/2025');
  const tmcoll  = fmt12h(record.TMCOLL  || '1040');
  const dtrecv  = v(record.DTRECV,   '01/02/2026');
  const dtrptd  = v(record.DTRPTD,   '01/06/2026');
  const gestage = v(record.GESTAGE,  '39');
  const agecoll = v(record.AGECOLL,  '4');
  const sex     = sexLabel(record.SEX) || 'Male';
  const fullName = `${lname}, ${fname}`;

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-3 bg-black/50 backdrop-blur-sm"
      onClick={handleBackdrop}
    >
      <div
        className="bg-gray-50 dark:bg-gray-900 rounded-xl shadow-2xl flex flex-col overflow-hidden border border-blue-200 dark:border-blue-900/50"
        style={{
          animation: 'pisModalIn 0.22s cubic-bezier(0.34,1.56,0.64,1)',
          width: '1180px',
          maxWidth: '98vw',
          height: '90vh',
        }}
      >
        {/* ── Header ── */}
        <div className="bg-gradient-to-r from-blue-700 to-blue-600 px-5 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <User size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white leading-tight">Patient Information</h2>
              <p className="text-blue-200 text-[11px] mt-0.5">
                Lab No: <span className="font-mono font-semibold">{labno}</span>
                <span className="mx-1.5 opacity-50">·</span>
                {fullName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="flex flex-1 overflow-hidden min-h-0">

          {/* ── LEFT: Demographics Panel ── */}
          <div className="w-56 flex-shrink-0 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">
            <SectionBar title="Demographics" />
            <div className="px-3 py-1.5 overflow-y-auto flex-1 text-gray-800 dark:text-gray-200">
              <DemoRow label="Lab No"             value={labno}                                accent />
              <DemoRow label="Form No"            value={labid} />
              <DemoRow label="Last Name"          value={lname} />
              <DemoRow label="First Name"         value={fname} />
              <DemoRow label="Birth"              value={`${birthdt} @ ${birthtm}`} />
              <DemoRow label="Collection"         value={`${dtcoll} @ ${tmcoll}`} />
              <DemoRow label="Specimen Type"      value="ENBS" />
              <DemoRow label="Milk Type"          value="Breast" />
              <DemoRow label="Sex"                value={sex} />
              <DemoRow label="Birth Weight"       value="3700 gms" />
              <DemoRow label="Birth Order"        value="0" />
              <DemoRow label="Blood Transfused"   value="N" />
              <DemoRow label="Transfused Date"    value="—" />
              <DemoRow label="Gestation Age"      value={`${gestage} Weeks`} />
              <DemoRow label="Specimen Age"       value={`${agecoll} day(s)`} />
              <DemoRow label="Age at Collection"  value="1 day(s) and 12 hour(s)" />
              <DemoRow label="Date Received"      value={dtrecv} />
              <DemoRow label="Date Reported"      value={dtrptd} />
              <DemoRow label="Clinical Status"    value="—" />
              <DemoRow label="Demog Acceptable"   value="Y" />
              <DemoRow label="Physician ID"       value="GAMEZ" />
              <DemoRow label="Birth Hospital ID"  value="1996" />
              <DemoRow label="Birth Hospital"     value="METRO BALAYAN MEDICAL CENTER" />
              <DemoRow label="Facility Code"      value={submid} />
              <DemoRow label="Facility Name"      value="METRO BALAYAN MEDICAL CENTER" />
              <DemoRow label="Address 1"          value="NATIONAL HI-WAY" />
              <DemoRow label="Address 2"          value="BRGY. CALOOCAN" />
              <DemoRow label="City"               value="BALAYAN" />
              <DemoRow label="Province"           value="BATANGAS" />
              <DemoRow label="Phone"              value="(43)-740-1350" />
              <DemoRow label="Fax"                value="(43)-740-1349" />
              <DemoRow label="Mobile"             value="09974617710" />
              <DemoRow label="Email"              value="metrobalayanmedicalcenter@yahoo.com.ph" />
              <DemoRow label="Coordinator"        value="RMT MARIA JENNIFER L. LAGUS" green />
              <DemoRow label="Demog Release"      value="1/2/2026"                    accent />
              <DemoRow label="Initial Entry"      value="BRUTAS, ANGELICA"            green />
              <DemoRow label="Verification Entry" value="APELADO, JAY ARR" />
              <DemoRow label="Second Copy Date"   value="—" />
              <DemoRow label="Outside Lab"        value="—" />
              <DemoRow label="Status"             value="MAILED"                      accent />
              <DemoRow label="Disposition"        value="—" />
              <DemoRow label="Disposition Date"   value="—" />
              <DemoRow label="Closed By"          value="—" />
            </div>
          </div>

          {/* ── RIGHT PANEL ── */}
          <div className="flex-1 flex flex-col overflow-hidden min-w-0">

            {/* ── TOP: Results/Mailers + Test Sequence ── */}
            <div className="flex border-b border-gray-200 dark:border-gray-700 flex-shrink-0" style={{ height: '215px' }}>

              {/* Results / Mailers */}
              <div className="flex-1 flex flex-col overflow-hidden min-w-0">
                <SectionBar title="Results / Mailers" />
                <div className="overflow-auto flex-1">
                  <table className="w-full text-[10px] border-collapse min-w-max">
                    <thead className="sticky top-0 z-10 bg-gray-100 dark:bg-gray-800">
                      <tr>
                        {['TEST','CODE','MNEMONIC','VALUE','RESULT','TEXT','REFERENCE RANGE','INSTRUCT'].map(h => (
                          <th key={h} className="px-2 py-1.5 text-left font-bold text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {MOCK_RESULTS.map((row, i) => (
                        <tr key={i}
                          className={`border-b border-gray-100 dark:border-gray-800 hover:bg-blue-50/60 dark:hover:bg-blue-900/20 transition-colors ${
                            i % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50/60 dark:bg-gray-800/40'
                          }`}
                        >
                          <td className="px-2 py-1 font-semibold text-gray-800 dark:text-gray-100 whitespace-nowrap">{row.test}</td>
                          <td className="px-2 py-1 font-mono text-gray-500 dark:text-gray-400">{row.code}</td>
                          <td className="px-2 py-1 text-gray-500 dark:text-gray-400">{row.mnemonic}</td>
                          <td className="px-2 py-1 font-semibold text-blue-600 dark:text-blue-400 tabular-nums">{row.value}</td>
                          <td className="px-2 py-1">
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                              {row.result}
                            </span>
                          </td>
                          <td className="px-2 py-1 text-gray-500 dark:text-gray-400 whitespace-nowrap">{row.text}</td>
                          <td className="px-2 py-1 text-gray-500 dark:text-gray-400 font-mono whitespace-nowrap">{row.ref}</td>
                          <td className="px-2 py-1 text-gray-400 dark:text-gray-500 whitespace-nowrap">{row.instruct}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Test Sequence / Analytes */}
              <div className="w-48 flex-shrink-0 border-l border-gray-200 dark:border-gray-700 flex flex-col">
                <SectionBar title="Test Sequence / Analytes" />
                <div className="overflow-auto flex-1">
                  <table className="w-full text-[10px] border-collapse">
                    <thead className="sticky top-0 bg-gray-100 dark:bg-gray-800">
                      <tr>
                        {['SEQ','MNC','RFLAG','VALUE'].map(h => (
                          <th key={h} className="px-2 py-1.5 text-left font-bold text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td colSpan={4} className="px-2 py-8 text-center text-gray-300 dark:text-gray-600 text-[10px]">
                          No sequence data
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* ── BOTTOM: Specimen Image + Actions sidebar ── */}
            <div className="flex flex-1 overflow-hidden min-h-0">

              {/* Specimen Image Area */}
              <div className="flex-1 bg-gray-200 dark:bg-gray-800 flex items-center justify-center relative overflow-hidden">
                <div className="text-center text-gray-400 dark:text-gray-600 select-none">
                  <ImageIcon size={56} className="mx-auto mb-2 opacity-20" />
                  <p className="text-xs opacity-40">Specimen scan image</p>
                  <p className="text-[10px] opacity-30 mt-0.5 font-mono">Zoom: {zoom}%</p>
                </div>
              </div>

              {/* ── Right Sidebar: Zoom + Actions + Patient Filter Cards ── */}
              <div className="w-40 flex-shrink-0 border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex flex-col overflow-y-auto">

                {/* Zoom Control */}
                <div className="px-3 py-2.5 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
                  <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 text-center mb-2">
                    Zoom Percentage
                  </p>
                  <div className="flex items-center justify-between gap-1">
                    <button
                      onClick={() => setZoom(z => Math.max(50, z - 50))}
                      className="w-7 h-7 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-bold text-sm flex items-center justify-center hover:bg-blue-100 dark:hover:bg-blue-900/40 hover:text-blue-600 transition-colors"
                    >−</button>
                    <span className="text-[12px] font-mono font-bold text-gray-800 dark:text-gray-100 tabular-nums">{zoom}</span>
                    <button
                      onClick={() => setZoom(z => Math.min(600, z + 50))}
                      className="w-7 h-7 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-bold text-sm flex items-center justify-center hover:bg-blue-100 dark:hover:bg-blue-900/40 hover:text-blue-600 transition-colors"
                    >+</button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-1.5 px-2 py-2 flex-shrink-0">
                  <ActionBtn icon={<ZoomIn size={11} />}       label="Full Image" />
                  <ActionBtn icon={<ClipboardList size={11} />} label="Audit Trail" />
                  <ActionBtn icon={<Download size={11} />}      label="Download Image" />
                  <ActionBtn icon={<User size={11} />}          label="Include Patient Info" />
                  <ActionBtn icon={<Mail size={11} />}          label="Email" />
                  <ActionBtn icon={<FileText size={11} />}      label="Show Notes" />
                  <ActionBtn icon={<BookOpen size={11} />}      label="Show Letters" />
                </div>

                {/* Patient Filter Cards */}
                <div className="mt-auto border-t border-gray-200 dark:border-gray-700 px-2 py-2 flex-shrink-0">
                  <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5">
                    Patient Filter Cards
                  </p>
                  <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden text-[10px]">
                    <div className="flex bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                      <span className="flex-1 px-2 py-1 font-bold text-gray-600 dark:text-gray-300 border-r border-gray-200 dark:border-gray-700">
                        Labno
                      </span>
                      <span className="flex-1 px-2 py-1 font-bold text-gray-600 dark:text-gray-300">
                        Status
                      </span>
                    </div>
                    <div className="flex bg-white dark:bg-gray-900">
                      <span className="flex-1 px-2 py-1 font-mono text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-700 truncate">
                        {labno}
                      </span>
                      <span className="flex-1 px-2 py-1 font-semibold text-blue-600 dark:text-blue-400">
                        MAILED
                      </span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="px-5 py-2 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between flex-shrink-0 bg-white dark:bg-gray-900">
          <span className="text-[11px] text-gray-400 dark:text-gray-500">
            Record:{' '}
            <span className="font-mono text-gray-600 dark:text-gray-300">{labno}</span>
            <span className="mx-2 opacity-40">·</span>
            {fullName}
          </span>
          <button
            onClick={onClose}
            className="h-7 px-4 text-xs font-semibold rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes pisModalIn {
          from { opacity: 0; transform: scale(0.97) translateY(10px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);    }
        }
      `}} />
    </div>
  );
};

export default PatientRecordModal;