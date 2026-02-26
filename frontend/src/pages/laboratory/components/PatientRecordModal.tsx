import React, { useState, useEffect } from 'react';
import {
  X, User, ZoomIn, Image as ImageIcon,
  ClipboardList, Download, Mail, FileText, BookOpen,
} from 'lucide-react';
import { getPatientDetail, PISDetailRecord, getPatientResults, PISResultRecord } from '../services/pisService';

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

const v = (x?: string | number | null, fallback = '—') =>
  x != null && String(x).trim() !== '' ? String(x).trim() : fallback;

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
  <div className="px-2 py-1 bg-blue-600 text-white text-[9px] font-bold uppercase tracking-widest flex-shrink-0">
    {title}
  </div>
);

// Matches screenshot: label left ~130px, value right, very compact rows
const DemoRow: React.FC<{
  label: string;
  value: string;
  accent?: boolean;
  green?: boolean;
  yellow?: boolean;
}> = ({ label, value, accent, green, yellow }) => (
  <div style={{ display: 'flex', alignItems: 'baseline', borderBottom: '1px solid #f3f4f6', paddingTop: '2px', paddingBottom: '2px' }}>
    <span style={{ flexShrink: 0, width: '155px', fontSize: '10px', lineHeight: '1.3', whiteSpace: 'nowrap', color: '#6b7280' }}>
      {label}
    </span>
    <span style={{
      fontSize: '10px', lineHeight: '1.3', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0,
      color: accent ? '#2563eb' : green ? '#059669' : yellow ? '#d97706' : '#111827',
      fontWeight: accent || green ? 600 : 400,
    }}>
      {value}
    </span>
  </div>
);

const ActionBtn: React.FC<{ icon: React.ReactNode; label: string; onClick?: () => void }> = ({ icon, label, onClick }) => (
  <button
    onClick={onClick}
    className="w-full flex items-center gap-1.5 px-2 py-1 text-[10px] font-medium rounded
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
  const [zoom,    setZoom]    = useState(300);
  const [detail,  setDetail]  = useState<PISDetailRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [results,  setResults]  = useState<PISResultRecord[]>([]);
  const [resLoading, setResLoading] = useState(false);

  // Fetch full detail when modal opens
  useEffect(() => {
    if (!record?.LABNO) return;

    setDetail(null);
    setError(null);
    setLoading(true);

    getPatientDetail(record.LABNO)
      .then((res) => {
        const grouped = res.data[record.LABNO];
        if (grouped && grouped.length > 0) {
          setDetail(grouped[0]);
        } else {
          setError('No detail record found.');
        }
      })
      .catch(() => setError('Failed to load patient detail.'))
      .finally(() => setLoading(false));
  }, [record?.LABNO]);

  // Fetch results when modal opens
  useEffect(() => {
    if (!record?.LABNO) return;
    setResults([]);
    setResLoading(true);
    getPatientResults(record.LABNO)
      .then((res) => setResults(res.data))
      .catch(() => setResults([]))
      .finally(() => setResLoading(false));
  }, [record?.LABNO]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!record) return null;

  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  // Use detail data if loaded, fallback to row data from search results
  const d = detail;

  const labno    = v(d?.LABNO    ?? record.LABNO);
  const labid    = v(d?.LABID    ?? record.LABID);
  const lname    = v(d?.LNAME    ?? record.LNAME);
  const fname    = v(d?.FNAME    ?? record.FNAME);
  const birthdt  = v(d?.BIRTHDT  ?? record.BIRTHDT);
  const birthtm  = fmt12h(d?.BIRTHTM ?? record.BIRTHTM);
  const dtcoll   = v(d?.DTCOLL   ?? record.DTCOLL);
  const tmcoll   = fmt12h(d?.TMCOLL ?? record.TMCOLL);
  const dtrecv   = v(d?.DTRECV   ?? record.DTRECV);
  const tmrecv   = fmt12h(d?.TMRECV ?? record.TMRECV);
  const dtrptd   = v(d?.DTRPTD   ?? record.DTRPTD);
  const status   = dtrptd && dtrptd !== '—' ? 'MAILED' : 'UNMAILED';
  const gestage  = v(d?.GESTAGE  ?? record.GESTAGE);
  const agecoll  = v(d?.AGECOLL  ?? record.AGECOLL);
  const sex      = sexLabel(d?.SEX ?? record.SEX);

  // Detail-only fields
  const spectype    = v(d?.SPECTYPE);
  const milktype    = v(d?.MILKTYPE);
  const birthwt     = d?.BIRTHWT   ? `${v(d.BIRTHWT)} gms`   : '—';
  const twin        = v(d?.TWIN);
  const transfus    = v(d?.TRANSFUS);
  const dtxfus      = v(d?.DTXFUS);
  const specimenAge = d?.SPECIMEN_AGE_DAYS != null ? `${d.SPECIMEN_AGE_DAYS} day(s)` : v(record.AGECOLL) ? `${record.AGECOLL} day(s)` : '—';
  const clinstat    = v(d?.CLINSTAT);
  const demcode     = v(d?.DEMCODE);
  const physid      = v(d?.PHYSID);
  const birthhosp   = v(d?.BIRTHHOSP);
  const releasedt   = v(d?.RELEASEDT);
  const initTech    = v(d?.INIT_TECH_NAME);
  const verTech     = v(d?.VER_TECH_NAME);

  // Provider fields
  const providerid  = v(d?.PROVIDERID);
  const descr1      = v(d?.DESCR1);   // Birth Hospital Name & Facility Name
  const street1     = v(d?.STREET1);
  const street2     = v(d?.STREET2);
  const city        = v(d?.CITY);
  const county      = v(d?.COUNTY);
  const phone       = v(d?.PHONE);
  const fax         = v(d?.FAX);
  const mobile      = v(d?.DESCR7);
  const email       = v(d?.EMAIL);
  const coordinator = [d?.DESCR4, d?.DESCR5, d?.DESCR6].filter(Boolean).join(' ').trim() || '—';

  // Disposition fields
  const disposition  = v(d?.DISPOSITION);
  const dispdate     = v(d?.DISPDATE);
  const closedBy     = v(d?.CLOSED_BY_NAME);

  const fullName = `${lname}, ${fname}`;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10000, display: 'flex', flexDirection: 'column', backgroundColor: '#f9fafb', overflow: 'hidden' }}>
        {/* ── Header ── */}
        <div className="bg-gradient-to-r from-blue-700 to-blue-600 px-5 py-2.5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <User size={16} className="text-white" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-white leading-tight">Patient Information</h2>
              <p className="text-blue-200 text-[10px] mt-0.5">
                Lab No: <span className="font-mono font-semibold">{labno}</span>
                <span className="mx-1.5 opacity-50">·</span>
                {fullName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-6 h-6 rounded-lg bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-colors"
          >
            <X size={13} />
          </button>
        </div>

        {/* ── Body ── */}
        <div style={{ display: "flex", flex: 1, overflow: "hidden", minHeight: 0 }}>

          {/* ── LEFT: Demographics Panel ── */}
          <div style={{ width: '400px', minWidth: '400px', flexShrink: 0, backgroundColor: 'white', borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <SectionBar title="Demographics" />

            {loading && (
              <div className="flex items-center justify-center flex-1">
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {error && !loading && (
              <div className="flex items-center justify-center flex-1 px-3">
                <p className="text-[10px] text-red-500 text-center">{error}</p>
              </div>
            )}

            {!loading && !error && (
              <div style={{ fontSize: '10px', overflowY: 'auto', flex: 1, padding: '2px 8px', minHeight: 0 }}>
                <DemoRow label="Lab No"              value={labno}                        accent />
                <DemoRow label="Form No"             value={labid} />
                <DemoRow label="Last Name"           value={lname} />
                <DemoRow label="First Name"          value={fname} />
                <DemoRow label="Birth"               value={`${birthdt} @ ${birthtm}`} />
                <DemoRow label="Collection"          value={`${dtcoll} @ ${tmcoll}`} />
                <DemoRow label="Specimen Type"       value={spectype} />
                <DemoRow label="Milk Type"           value={milktype} />
                <DemoRow label="Sex"                 value={sex} />
                <DemoRow label="Birth Weight"        value={birthwt} />
                <DemoRow label="Birth Order"         value={twin} />
                <DemoRow label="Blood Transfused"    value={transfus} />
                <DemoRow label="Transfused Date"     value={dtxfus} />
                <DemoRow label="Gestation Age"       value={gestage ? `${gestage} Weeks` : '—'} />
                <DemoRow label="Specimen Age"        value={specimenAge} />
                <DemoRow label="Age at Collection"   value={agecoll ? `${agecoll} day(s)` : '—'} />
                <DemoRow label="Date Received"       value={`${dtrecv}${tmrecv !== '—' ? ` @ ${tmrecv}` : ''}`} />
                <DemoRow label="Date Reported"       value={dtrptd} />
                <DemoRow label="Clinical Status"     value={clinstat} />
                <DemoRow label="Demog Acceptable"    value={demcode} />
                <DemoRow label="Physician ID"        value={physid} />
                <DemoRow label="Birth Hospital ID"   value={birthhosp} />
                <DemoRow label="Birth Hospital Name" value={descr1} />
                <DemoRow label="Facility Code"       value={providerid} />
                <DemoRow label="Facility Name"       value={descr1} />
                <DemoRow label="Address 1"           value={street1} />
                <DemoRow label="Address 2"           value={street2} />
                <DemoRow label="City"                value={city} />
                <DemoRow label="Province"            value={county} />
                <DemoRow label="Phone"               value={phone} />
                <DemoRow label="Fax"                 value={fax} />
                <DemoRow label="Mobile"              value={mobile} />
                <DemoRow label="Email"               value={email} />
                <DemoRow label="Coordinator"         value={coordinator}  green />
                <DemoRow label="Demog Release"       value={releasedt}    accent />
                <DemoRow label="Initial Entry"       value={initTech}     green />
                <DemoRow label="Verification Entry"  value={verTech} />
                <DemoRow label="Second Copy Date"    value="—" />
                <DemoRow label="Outside Lab"         value="—" />
                <DemoRow label="Status"              value={status} accent />
                <DemoRow label="Disposition"         value={disposition} />
                <DemoRow label="Disposition Date"    value={dispdate} />
                <DemoRow label="Closed By"           value={closedBy} />
              </div>
            )}
          </div>

          {/* ── RIGHT PANEL ── */}
          <div className="flex-1 flex flex-col overflow-hidden min-w-0">

            {/* ── TOP: Results/Mailers + Test Sequence ── */}
            <div className="flex border-b border-gray-200 dark:border-gray-700 flex-shrink-0" style={{ height: '240px' }}>

              {/* Results / Mailers */}
              <div className="flex-1 flex flex-col overflow-hidden min-w-0">
                <SectionBar title="Results / Mailers" />
                <div className="overflow-auto flex-1">
                  <table className="w-full border-collapse min-w-max">
                    <thead className="sticky top-0 z-10 bg-gray-100 dark:bg-gray-800">
                      <tr>
                        {['TEST','CODE','MNEMONIC','VALUE','RESULT','TEXT','REFERENCE RANGE','INSTRUCT'].map(h => (
                          <th key={h} className="px-2 py-1 text-left font-bold text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 whitespace-nowrap" style={{ fontSize: '9px' }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {resLoading ? (
                        <tr>
                          <td colSpan={8} className="px-2 py-6 text-center" style={{ fontSize: '10px' }}>
                            <div className="flex items-center justify-center gap-2 text-gray-400">
                              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                              Loading results...
                            </div>
                          </td>
                        </tr>
                      ) : results.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="px-2 py-6 text-center text-gray-300 dark:text-gray-600" style={{ fontSize: '10px' }}>
                            No results found
                          </td>
                        </tr>
                      ) : results.map((row, i) => (
                        <tr key={i}
                          className={`border-b border-gray-100 dark:border-gray-800 hover:bg-blue-50/60 dark:hover:bg-blue-900/20 transition-colors ${
                            i % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50/60 dark:bg-gray-800/40'
                          }`}
                        >
                          <td className="px-2 py-[2px] font-semibold text-gray-800 dark:text-gray-100 whitespace-nowrap" style={{ fontSize: '10px' }}>{row.ABBREV   || '—'}</td>
                          <td className="px-2 py-[2px] font-mono text-gray-500 dark:text-gray-400 whitespace-nowrap"     style={{ fontSize: '10px' }}>{row.TESTCODE || '—'}</td>
                          <td className="px-2 py-[2px] text-gray-500 dark:text-gray-400 whitespace-nowrap"               style={{ fontSize: '10px' }}>{row.MNEMONIC || '—'}</td>
                          <td className="px-2 py-[2px] font-semibold text-blue-600 dark:text-blue-400 tabular-nums"      style={{ fontSize: '10px' }}>{row.VALUE    || '—'}</td>
                          <td className="px-2 py-[2px]">
                            <span className="px-1 py-0.5 rounded font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" style={{ fontSize: '9px' }}>
                              Normal
                            </span>
                          </td>
                          <td className="px-2 py-[2px] text-gray-500 dark:text-gray-400 whitespace-nowrap" style={{ fontSize: '10px' }}>{row.DISORDERRESULTTEXT || '—'}</td>
                          <td className="px-2 py-[2px] text-gray-500 dark:text-gray-400 font-mono whitespace-nowrap"     style={{ fontSize: '10px' }}>{row.EXPECTED  || '—'}</td>
                          <td className="px-2 py-[2px] text-gray-400 dark:text-gray-500 whitespace-nowrap"               style={{ fontSize: '10px' }}>{row.INSTRUCT  || '—'}</td>
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
                  <table className="w-full border-collapse">
                    <thead className="sticky top-0 bg-gray-100 dark:bg-gray-800">
                      <tr>
                        {['SEQ','MNC','RFLAG','VALUE'].map(h => (
                          <th key={h} className="px-2 py-1 text-left font-bold text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 whitespace-nowrap" style={{ fontSize: '9px' }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td colSpan={4} className="px-2 py-8 text-center text-gray-300 dark:text-gray-600" style={{ fontSize: '10px' }}>
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
                  <ImageIcon size={48} className="mx-auto mb-2 opacity-20" />
                  <p className="opacity-40" style={{ fontSize: '10px' }}>Specimen scan image</p>
                  <p className="opacity-30 mt-0.5 font-mono" style={{ fontSize: '9px' }}>Zoom: {zoom}%</p>
                </div>
              </div>

              {/* ── Right Sidebar ── */}
              <div className="w-36 flex-shrink-0 border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex flex-col overflow-y-auto">

                {/* Zoom Control */}
                <div className="px-2 py-2 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
                  <p className="font-semibold text-gray-500 dark:text-gray-400 text-center mb-1.5" style={{ fontSize: '9px' }}>
                    Zoom Percentage
                  </p>
                  <div className="flex items-center justify-between gap-1">
                    <button
                      onClick={() => setZoom(z => Math.max(50, z - 50))}
                      className="w-6 h-6 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-bold flex items-center justify-center hover:bg-blue-100 dark:hover:bg-blue-900/40 hover:text-blue-600 transition-colors"
                      style={{ fontSize: '12px' }}
                    >−</button>
                    <span className="font-mono font-bold text-gray-800 dark:text-gray-100 tabular-nums" style={{ fontSize: '11px' }}>{zoom}</span>
                    <button
                      onClick={() => setZoom(z => Math.min(600, z + 50))}
                      className="w-6 h-6 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-bold flex items-center justify-center hover:bg-blue-100 dark:hover:bg-blue-900/40 hover:text-blue-600 transition-colors"
                      style={{ fontSize: '12px' }}
                    >+</button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-1 px-1.5 py-1.5 flex-shrink-0">
                  <ActionBtn icon={<ZoomIn        size={10} />} label="Full Image" />
                  <ActionBtn icon={<ClipboardList size={10} />} label="Audit Trail" />
                  <ActionBtn icon={<Download      size={10} />} label="Download Image" />
                  <ActionBtn icon={<User          size={10} />} label="Include Patient Info" />
                  <ActionBtn icon={<Mail          size={10} />} label="Email" />
                  <ActionBtn icon={<FileText      size={10} />} label="Show Notes" />
                  <ActionBtn icon={<BookOpen      size={10} />} label="Show Letters" />
                </div>

                {/* Patient Filter Cards */}
                <div className="mt-auto border-t border-gray-200 dark:border-gray-700 px-1.5 py-1.5 flex-shrink-0">
                  <p className="font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1" style={{ fontSize: '9px' }}>
                    Patient Filter Cards
                  </p>
                  <div className="rounded border border-gray-200 dark:border-gray-700 overflow-hidden" style={{ fontSize: '9px' }}>
                    <div className="flex bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                      <span className="flex-1 px-1.5 py-0.5 font-bold text-gray-600 dark:text-gray-300 border-r border-gray-200 dark:border-gray-700">Labno</span>
                      <span className="flex-1 px-1.5 py-0.5 font-bold text-gray-600 dark:text-gray-300">Status</span>
                    </div>
                    <div className="flex bg-white dark:bg-gray-900">
                      <span className="flex-1 px-1.5 py-0.5 font-mono text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-700 truncate">{labno}</span>
                      <span className="flex-1 px-1.5 py-0.5 font-semibold text-blue-600 dark:text-blue-400">
                        {status}
                      </span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="px-4 py-1.5 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between flex-shrink-0 bg-white dark:bg-gray-900">
          <span className="text-gray-400 dark:text-gray-500" style={{ fontSize: '10px' }}>
            Record:{' '}
            <span className="font-mono text-gray-600 dark:text-gray-300">{labno}</span>
            <span className="mx-2 opacity-40">·</span>
            {fullName}
          </span>
          <button
            onClick={onClose}
            className="h-6 px-3 font-semibold rounded border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            style={{ fontSize: '10px' }}
          >
            Close
          </button>
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