import React, { useState, useEffect } from 'react';
import {
  Search, ChevronDown, X, ChevronLeft, ChevronRight,
  User, ZoomIn, Image as ImageIcon, ClipboardList,
  Download, Mail, FileText, BookOpen, FlaskConical,
} from 'lucide-react';
import { getPatientDetail, getPatientResults, getTestSequence, getPatientFilterCards } from '../../../services/LaboratoryServices/pisServices';

// ═══════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════

export interface SearchParams {
  lastName: string;
  firstName: string;
  patientNumber: string;
  formNumber: string;
  birthDate: string;
  collectionHospitalId: string;
  dateCollection: string;
  sex: string;
  labNumber: string;
  physicianId: string;
  dateReceived: string;
  outsideLab: string;
  contactLastName: string;
  contactFirstName: string;
  dateReported: string;
}

export interface SampleRecord {
  LABNO:   string;
  LABID:   string;
  LNAME:   string;
  FNAME:   string;
  SUBMID:  string;
  BIRTHDT: string;
  BIRTHTM: string;
  DTCOLL:  string;
  TMCOLL:  string;
  DTRECV:  string;
  TMRECV:  string;
  DTRPTD:  string;
  GESTAGE: string;
  AGECOLL: string;
  SEX:     string;
}

interface FilterCardRow {
  LABNO:  string;
  LNAME:  string;
  FNAME:  string;
  DTRPTD: string;
}

interface TestSeqRow {
  LABNO:    string;
  TESTSEQ:  string | number;
  MNEMONIC: string;
  VALUE:    string;
  RFLAG:    string;
  ABBREV:   string;
}

interface ResultRow {
  ABBREV:             string;
  VALUE:              string;
  TESTCODE:           string;
  EXPECTED:           string;
  MNEMONIC:           string;
  INSTRUCT:           string;
  DISORDERRESULTTEXT: string;
}

interface Props {
  onSearch:   (params: SearchParams) => void;
  results:    SampleRecord[];
  isLoading:  boolean;
  totalCount: number;
}

// ═══════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════

const SEX_OPTIONS         = ['', '1', '2', 'A', 'M', 'F'];
const OUTSIDE_LAB_OPTIONS = ['', '1', '2', '3', '4', '5', '6'];
const PAGE_SIZE           = 50;

const EMPTY_PARAMS: SearchParams = {
  lastName: '', firstName: '', patientNumber: '', formNumber: '',
  birthDate: '', collectionHospitalId: '', dateCollection: '', sex: '',
  labNumber: '', physicianId: '', dateReceived: '', outsideLab: '',
  contactLastName: '', contactFirstName: '', dateReported: '',
};

// ═══════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════

const fmt12h = (time?: unknown): string => {
  const t = time != null ? String(time).trim() : '';
  if (!t) return '—';
  const digits = t.replace(/:/g, '');
  if (digits.length < 4) return t;
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

const sexBadge = (s: string): { label: string; cls: string } => {
  switch (s?.toUpperCase()) {
    case '1': case 'M': return { label: 'Male',   cls: 'text-blue-600  bg-blue-50  border-blue-200  dark:text-blue-400  dark:bg-blue-900/30  dark:border-blue-700' };
    case '2': case 'F': return { label: 'Female', cls: 'text-pink-600  bg-pink-50  border-pink-200  dark:text-pink-400  dark:bg-pink-900/30  dark:border-pink-700' };
    case 'A':           return { label: 'Ambig.', cls: 'text-amber-600 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-900/30 dark:border-amber-700' };
    default:            return { label: s || '—', cls: 'text-gray-500  bg-gray-50  border-gray-200  dark:text-gray-400  dark:bg-gray-800    dark:border-gray-700' };
  }
};

const val = (x?: unknown): string =>
  x != null && String(x).trim() !== '' ? String(x).trim() : '—';

const formatAge = (raw?: string): string => {
  if (!raw || raw === '—') return '—';
  const totalHours = parseFloat(raw);
  if (isNaN(totalHours) || totalHours < 0) return raw;
  const days  = Math.floor(totalHours / 24);
  const hours = Math.round(totalHours % 24);
  if (days > 0 && hours > 0) return `${days} day(s) and ${hours} hour(s)`;
  if (days > 0)              return `${days} day(s)`;
  return `${hours} hour(s)`;
};

const pick = (detail?: unknown, row?: unknown): string =>
  val(detail) !== '—' ? val(detail) : val(row);

const formatDateTime = (date: string, time?: string): React.ReactNode => {
  if (!date || date === '—') return <span className="text-gray-300 dark:text-gray-600">—</span>;
  const t = fmt12h(time);
  return (
    <div className="flex flex-col leading-tight">
      <span className="font-medium text-gray-800 dark:text-gray-200">{date}</span>
      {t && t !== '—' && <span className="text-[10px] text-gray-400 dark:text-gray-500 tabular-nums">{t}</span>}
    </div>
  );
};

const formatPatientName = (lname: string, fname: string): React.ReactNode => {
  if (!lname && !fname) return <span className="text-gray-300 dark:text-gray-600">—</span>;
  return (
    <div className="flex flex-col leading-tight">
      <span className="font-semibold text-gray-900 dark:text-gray-100">{lname || '—'}</span>
      <span className="text-xs text-gray-500 dark:text-gray-400">{fname || '—'}</span>
    </div>
  );
};

// ═══════════════════════════════════════════════
// MODAL ATOMS
// ═══════════════════════════════════════════════

const PanelBar: React.FC<{ title: string }> = ({ title }) => (
  <div className="px-3 py-[5px] bg-blue-600 text-white text-[10px] font-bold uppercase tracking-widest flex-shrink-0 select-none">
    {title}
  </div>
);

// Row with explicit bg color — matches screenshot section grouping
const DR: React.FC<{
  label: string; value: string;
  bg?: string;
  labelColor?: string;
  valueColor?: string;
  bold?: boolean;
  first?: boolean; // first row of a section — draws gap above
}> = ({ label, value, bg = '#ffffff', labelColor = '#374151', valueColor = '#111827', bold = false, first = false }) => (
  <div style={{
    display: 'flex', alignItems: 'baseline',
    borderBottom: '1px solid #e5e7eb',
    borderTop: first ? '3px solid #cbd5e1' : 'none',
    marginTop: first ? '6px' : '0',
    paddingTop: '2.5px', paddingBottom: '2.5px',
    backgroundColor: bg,
  }}>
    <span style={{ flexShrink: 0, width: '175px', fontSize: '11px', lineHeight: '1.4', paddingLeft: '4px', color: labelColor, fontWeight: bold ? 700 : 400 }}>
      {label}
    </span>
    <span style={{ fontSize: '11px', lineHeight: '1.4', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: valueColor, fontWeight: bold ? 700 : 400 }}>
      {value}
    </span>
  </div>
);

const ABtn: React.FC<{ icon: React.ReactNode; label: string }> = ({ icon, label }) => (
  <button className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[11px] font-medium
    bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700
    text-gray-700 dark:text-gray-300
    hover:bg-blue-50 dark:hover:bg-blue-900/30
    hover:text-blue-600 dark:hover:text-blue-400
    hover:border-blue-300 dark:hover:border-blue-700
    transition-all duration-150">
    {icon}
    {label}
  </button>
);

// ═══════════════════════════════════════════════
// PATIENT RECORD MODAL
// ═══════════════════════════════════════════════

const PatientRecordModal: React.FC<{ record: SampleRecord | null; onClose: () => void }> = ({
  record, onClose,
}) => {
  const [zoom,       setZoom]       = useState(300);
  const [detail,     setDetail]     = useState<Record<string, any> | null>(null);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [results,    setResults]    = useState<ResultRow[]>([]);
  const [resLoading,  setResLoading]  = useState(false);
  const [testSeq,     setTestSeq]     = useState<TestSeqRow[]>([]);
  const [testSeqLoading, setTestSeqLoading] = useState(false);
  const [selectedRow,    setSelectedRow]    = useState<number | null>(null);
  const [filterCards,   setFilterCards]   = useState<FilterCardRow[]>([]);
  const [filterLoading, setFilterLoading] = useState(false);
  const [activeLabno,   setActiveLabno]   = useState<string>('');
  // activeRecord overrides external record when user clicks View PIS on a filter card
  const [activeRecord,  setActiveRecord]  = useState<SampleRecord | null>(null);
  const currentRecord = activeRecord ?? record;
  const currentLabno  = activeRecord?.LABNO ?? record?.LABNO ?? '';

  // ── Fetch detail ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!currentLabno) return;
    setDetail(null);
    setError(null);
    setLoading(true);
    setTestSeq([]);
    setSelectedRow(null);

    getPatientDetail(currentLabno)
      .then((res) => {
        const rows = res.data?.[currentLabno];
        if (rows?.length > 0) setDetail(rows[0]);
        else setError('No detail record found.');
      })
      .catch(() => setError('Failed to load patient detail.'))
      .finally(() => setLoading(false));
  }, [currentLabno]);

  // ── Fetch results (Results/Mailers table) ─────────────────────────────────
  useEffect(() => {
    if (!currentLabno) return;
    setResults([]);
    setResLoading(true);

    getPatientResults(currentLabno)
      .then((res) => setResults(res.data ?? []))
      .catch(() => setResults([]))
      .finally(() => setResLoading(false));
  }, [currentLabno]);

  // Fetch patient filter cards by fname + lname
  useEffect(() => {
    if (!record?.FNAME || !record?.LNAME) return;
    setFilterCards([]);
    setFilterLoading(true);
    setActiveLabno(record?.LABNO ?? '');
    getPatientFilterCards(record.FNAME, record.LNAME)
      .then((res) => setFilterCards(res.data ?? []))
      .catch(() => setFilterCards([]))
      .finally(() => setFilterLoading(false));
  }, [record?.LABNO, record?.FNAME, record?.LNAME]);

  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [onClose]);

  if (!record) return null;
  if (!currentRecord) return null;

  // Fetch test sequence for a clicked result row
  const handleResultClick = (abbrev: string, rowIndex: number) => {
    if (selectedRow === rowIndex) {
      // deselect if clicking same row
      setSelectedRow(null);
      setTestSeq([]);
      return;
    }
    setSelectedRow(rowIndex);
    setTestSeqLoading(true);
    setTestSeq([]);
    getTestSequence(currentLabno)
      .then((res) => {
        // Filter to only rows matching the clicked ABBREV
        const filtered = res.data.filter(r => r.ABBREV === abbrev);
        setTestSeq(filtered.length > 0 ? filtered : res.data);
      })
      .catch(() => setTestSeq([]))
      .finally(() => setTestSeqLoading(false));
  };

  const d = detail;

  const labno    = pick(d?.LABNO,   record.LABNO);
  const labid    = pick(d?.LABID,   record.LABID);
  const lname    = pick(d?.LNAME,   record.LNAME);
  const fname    = pick(d?.FNAME,   record.FNAME);
  const birthdt  = pick(d?.BIRTHDT, record.BIRTHDT);
  const birthtm  = fmt12h(d?.BIRTHTM  ?? record.BIRTHTM);
  const dtcoll   = pick(d?.DTCOLL,  record.DTCOLL);
  const tmcoll   = fmt12h(d?.TMCOLL   ?? record.TMCOLL);
  const dtrecv   = pick(d?.DTRECV,  record.DTRECV);
  const tmrecv   = fmt12h(d?.TMRECV   ?? record.TMRECV);
  const dtrptd   = pick(d?.DTRPTD,  record.DTRPTD);
  const gestage  = pick(d?.GESTAGE, record.GESTAGE);
  const agecoll  = pick(d?.AGECOLL, record.AGECOLL);
  const sex      = sexLabel(pick(d?.SEX, record.SEX));
  const status   = dtrptd !== '—' ? 'MAILED' : 'UNMAILED';
  const fullName = `${lname}, ${fname}`;

  const spectype    = val(d?.SPECTYPE);
  const milktype    = val(d?.MILKTYPE);
  const birthwt     = d?.BIRTHWT ? `${val(d.BIRTHWT)} gms` : '—';
  const twin        = val(d?.TWIN);
  const transfus    = val(d?.TRANSFUS);
  const dtxfus      = val(d?.DTXFUS);
  const clinstat    = val(d?.CLINSTAT);
  const demcode     = val(d?.DEMCODE);
  const physid      = val(d?.PHYSID);
  const birthhosp   = val(d?.BIRTHHOSP);
  const releasedt   = val(d?.RELEASEDT);
  const initTech    = val(d?.INIT_TECH_NAME);
  const verTech     = val(d?.VER_TECH_NAME);
  const providerid  = val(d?.PROVIDERID);
  const descr1      = val(d?.DESCR1);
  const street1     = val(d?.STREET1);
  const street2     = val(d?.STREET2);
  const city        = val(d?.CITY);
  const county      = val(d?.COUNTY);
  const phone       = val(d?.PHONE);
  const fax         = val(d?.FAX);
  const mobile      = val(d?.DESCR7);
  const email       = val(d?.EMAIL);
  const coord       = [d?.DESCR4, d?.DESCR5, d?.DESCR6].filter(Boolean).join(' ').trim() || '—';
  const specimenAge = d?.SPECIMEN_AGE_DAYS != null
    ? formatAge(String(d.SPECIMEN_AGE_DAYS * 24))
    : formatAge(agecoll);
  const disposition = val(d?.DISPOSITION);
  const dispdate    = val(d?.DISPDATE);
  const closedBy    = val(d?.CLOSED_BY_NAME);

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-3 bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="flex flex-col bg-gray-50 dark:bg-gray-950 rounded-xl shadow-2xl overflow-hidden border border-blue-200 dark:border-blue-900/60"
        style={{ animation: 'pisIn .22s cubic-bezier(.34,1.56,.64,1)', width: '98vw', maxWidth: '1600px', height: '95vh' }}
      >

        {/* ─── HEADER ─── */}
        <div className="flex-shrink-0 bg-gradient-to-r from-blue-700 to-blue-600 px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <User size={18} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-white leading-tight">Patient Information</p>
              <p className="text-[11px] text-blue-200 mt-0.5">
                Lab No:&nbsp;<span className="font-mono font-semibold">{labno}</span>
                <span className="mx-2 opacity-50">·</span>{fullName}
              </p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-colors">
            <X size={14} />
          </button>
        </div>

        {/* ─── BODY ─── */}
        <div className="flex flex-1 overflow-hidden min-h-0">

          {/* ── LEFT: Demographics ── */}
          <div className="flex-shrink-0 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col" style={{ width: '410px' }}>
            <PanelBar title="Demographics" />

            {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto" style={{ padding: '2px 6px 8px 6px' }}>

                {/* ── white: Patient IDs ── */}
                <DR label="Lab No"              value={labno}   bg="#ffffff" labelColor="#374151" valueColor="#1d4ed8" bold />
                <DR label="Form No"             value={labid}   bg="#ffffff" />
                <DR label="Last Name"           value={lname}   bg="#ffffff" />
                <DR label="First Name"          value={fname}   bg="#ffffff" />

                {/* ── light blue: Birth & Collection ── */}
                <DR label="Birth"               value={`${birthdt} @ ${birthtm}`} bg="#eff6ff" first />
                <DR label="Collection"          value={`${dtcoll} @ ${tmcoll}`}   bg="#eff6ff" />
                <DR label="Specimen Type"       value={spectype}                  bg="#eff6ff" />
                <DR label="Milk Type"           value={milktype}                  bg="#eff6ff" />

                {/* ── white: Demographics ── */}
                <DR label="Sex"                 value={sex}     bg="#ffffff" first />
                <DR label="Birth Weight"        value={birthwt} bg="#ffffff" />
                <DR label="Birth Order"         value={twin}    bg="#ffffff" />
                <DR label="Blood Transfused"    value={transfus} bg="#ffffff" />
                <DR label="Transfused Date"     value={dtxfus}  bg="#ffffff" />
                <DR label="Gestation Age"       value={gestage !== '—' ? `${gestage} Weeks` : '—'} bg="#ffffff" />
                <DR label="Specimen Age"        value={specimenAge}            bg="#ffffff" />
                <DR label="Age at Collection"   value={formatAge(agecoll)}     bg="#ffffff" />

                {/* ── light blue: Received / Reported ── */}
                <DR label="Date Received"       value={tmrecv !== '—' ? `${dtrecv} @ ${tmrecv}` : dtrecv} bg="#eff6ff" first />
                <DR label="Date Reported"       value={dtrptd}   bg="#eff6ff" />
                <DR label="Clinical Status"     value={clinstat} bg="#eff6ff" />
                <DR label="Demog Acceptable"    value={demcode}  bg="#eff6ff" />

                {/* ── light green: Physician / Hospital ── */}
                <DR label="Physician ID"        value={physid}    bg="#f0fdf4" valueColor="#15803d" bold first />
                <DR label="Birth Hospital ID"   value={birthhosp} bg="#f0fdf4" />
                <DR label="Birth Hospital Name" value={descr1}    bg="#f0fdf4" valueColor="#15803d" />

                {/* ── white: Facility / Provider ── */}
                <DR label="Facility Code"       value={providerid} bg="#ffffff" first />
                <DR label="Facility Name"       value={descr1}     bg="#ffffff" />
                <DR label="Address 1"           value={street1}    bg="#ffffff" />
                <DR label="Address 2"           value={street2}    bg="#ffffff" />
                <DR label="City"                value={city}       bg="#ffffff" />
                <DR label="Province"            value={county}     bg="#ffffff" />
                <DR label="Phone"               value={phone}      bg="#ffffff" />
                <DR label="Fax"                 value={fax}        bg="#ffffff" />
                <DR label="Mobile"              value={mobile}     bg="#ffffff" />
                <DR label="Email"               value={email}      bg="#ffffff" />

                {/* ── light green: Coordinator / Release ── */}
                <DR label="Coordinator"         value={coord}      bg="#f0fdf4" valueColor="#15803d" bold first />
                <DR label="Demog Release"       value={releasedt}  bg="#eff6ff" valueColor="#1d4ed8" bold />
                <DR label="Initial Entry"       value={initTech}   bg="#f0fdf4" valueColor="#15803d" bold />
                <DR label="Verification Entry"  value={verTech}    bg="#f0fdf4" valueColor="#15803d" />
                <DR label="Second Copy Date"    value={val(d?.SECONDCOPY)} bg="#ffffff" />
                <DR label="Outside Lab"         value={val(d?.OUTLAB)}     bg="#ffffff" />

                {/* ── blue highlight: Status ── */}
                <DR label="Status"              value={status}     bg="#dbeafe" valueColor="#1d4ed8" bold first />

                {/* ── orange highlight: Disposition ── */}
                <DR label="Disposition"      value={disposition} bg={disposition !== '—' ? '#fff7ed' : '#ffffff'} valueColor={disposition !== '—' ? '#c2410c' : '#374151'} bold={disposition !== '—'} first />
                <DR label="Disposition Date" value={dispdate}    bg={dispdate    !== '—' ? '#fff7ed' : '#ffffff'} valueColor={dispdate    !== '—' ? '#c2410c' : '#374151'} bold={dispdate    !== '—'} />
                <DR label="Closed By"        value={closedBy}    bg={closedBy    !== '—' ? '#fff7ed' : '#ffffff'} valueColor={closedBy    !== '—' ? '#c2410c' : '#374151'} bold={closedBy    !== '—'} />
              </div>
            )}
          </div>

          {/* ── RIGHT ── */}
          <div className="flex-1 flex flex-col overflow-hidden min-w-0">

            {/* TOP: Results/Mailers + Test Sequence */}
            <div className="flex flex-shrink-0 border-b border-gray-200 dark:border-gray-700" style={{ height: '260px' }}>

              {/* Results / Mailers */}
              <div className="flex-1 flex flex-col overflow-hidden min-w-0">
                <PanelBar title="Results / Mailers" />
                <div className="overflow-auto flex-1">
                  <table className="border-collapse" style={{ minWidth: '860px', width: '100%' }}>
                    <thead className="sticky top-0 z-10">
                      <tr className="bg-gray-100 dark:bg-gray-800">
                        {['TEST','CODE','MNEMONIC','VALUE','RESULT','TEXT','REFERENCE RANGE','INSTRUCT'].map(h => (
                          <th key={h} className="px-2 py-1.5 text-left text-[10px] font-bold text-gray-600 dark:text-gray-300 border-b border-r border-gray-200 dark:border-gray-700 whitespace-nowrap last:border-r-0">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {resLoading ? (
                        <tr>
                          <td colSpan={8} className="py-8 text-center" style={{ fontSize: '11px' }}>
                            <div className="flex items-center justify-center gap-2 text-gray-400">
                              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                              Loading results…
                            </div>
                          </td>
                        </tr>
                      ) : results.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-gray-300 dark:text-gray-600" style={{ fontSize: '11px' }}>
                            No results found
                          </td>
                        </tr>
                      ) : results.map((row, i) => {
                        const resultText = (row.DISORDERRESULTTEXT || '').toLowerCase();
                        const isNormal = resultText.includes('normal') || resultText === '' || resultText === '—';
                        const rowBg = isNormal
                          ? (i % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50/70 dark:bg-gray-800/50')
                          : 'bg-red-50 dark:bg-red-900/20';
                        return (
                        <tr key={i}
                          onClick={() => handleResultClick(row.ABBREV, i)}
                          className={`border-b border-gray-100 dark:border-gray-800 hover:bg-blue-50/70 dark:hover:bg-blue-900/20 transition-colors cursor-pointer ${selectedRow === i ? 'ring-2 ring-inset ring-blue-400' : ''} ${rowBg}`}>
                          <td className={`px-2 py-[3px] text-[11px] font-semibold whitespace-nowrap border-r border-gray-100 dark:border-gray-800 ${isNormal ? 'text-gray-800 dark:text-gray-100' : 'text-red-700 dark:text-red-300'}`}>{row.ABBREV || '—'}</td>
                          <td className="px-2 py-[3px] text-[11px] font-mono text-gray-600 dark:text-gray-400 border-r border-gray-100 dark:border-gray-800">{row.TESTCODE || '—'}</td>
                          <td className="px-2 py-[3px] text-[11px] text-gray-600 dark:text-gray-400 border-r border-gray-100 dark:border-gray-800">{row.MNEMONIC || '—'}</td>
                          <td className={`px-2 py-[3px] text-[11px] font-semibold tabular-nums border-r border-gray-100 dark:border-gray-800 ${isNormal ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>{row.VALUE || '—'}</td>
                          <td className="px-2 py-[3px] border-r border-gray-100 dark:border-gray-800">
                            {isNormal
                              ? <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">Normal</span>
                              : <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">Abnormal</span>
                            }
                          </td>
                          <td className={`px-2 py-[3px] text-[11px] whitespace-nowrap border-r border-gray-100 dark:border-gray-800 ${isNormal ? 'text-gray-500 dark:text-gray-400' : 'text-red-600 dark:text-red-400 font-medium'}`}>{row.DISORDERRESULTTEXT || '—'}</td>
                          <td className="px-2 py-[3px] text-[11px] text-gray-500 dark:text-gray-400 font-mono whitespace-nowrap border-r border-gray-100 dark:border-gray-800">{row.EXPECTED || '—'}</td>
                          <td className="px-2 py-[3px] text-[11px] text-gray-400 dark:text-gray-500 whitespace-nowrap">{row.INSTRUCT || '—'}</td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Test Sequence / Analytes */}
              <div className="flex-shrink-0 border-l border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden" style={{ width: '220px' }}>
                <PanelBar title={selectedRow !== null && results[selectedRow] ? `Test Seq: ${results[selectedRow].ABBREV}` : "Test Sequence / Analytes"} />
                <div className="overflow-auto flex-1">
                  <table className="w-full border-collapse">
                    <thead className="sticky top-0 bg-gray-100 dark:bg-gray-800">
                      <tr>
                        {['SEQ','MNC','RFLAG','VALUE'].map(h => (
                          <th key={h} className="px-2 py-1.5 text-left text-[10px] font-bold text-gray-600 dark:text-gray-300 border-b border-r border-gray-200 dark:border-gray-700 last:border-r-0 whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {testSeqLoading ? (
                        <tr>
                          <td colSpan={4} className="px-2 py-8 text-center" style={{ fontSize: '10px' }}>
                            <div className="flex items-center justify-center gap-1.5 text-gray-400">
                              <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                              Loading…
                            </div>
                          </td>
                        </tr>
                      ) : testSeq.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-2 py-8 text-center text-[10px] text-gray-300 dark:text-gray-600">
                            {selectedRow !== null ? 'No sequence data' : 'Click a result row'}
                          </td>
                        </tr>
                      ) : testSeq.map((s, i) => {
                        const isAbnormal = s.RFLAG && s.RFLAG.trim() !== '';
                        return (
                          <tr key={i} className={`border-b border-gray-100 dark:border-gray-800 ${isAbnormal ? 'bg-red-50 dark:bg-red-900/20' : i % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800/50'}`}>
                            <td className="px-2 py-[3px] text-[10px] font-mono text-gray-600 dark:text-gray-400 border-r border-gray-100">{s.TESTSEQ || '—'}</td>
                            <td className="px-2 py-[3px] text-[10px] text-gray-600 dark:text-gray-400 border-r border-gray-100 truncate max-w-[60px]">{s.MNEMONIC || '—'}</td>
                            <td className="px-2 py-[3px] text-[10px] border-r border-gray-100">
                              {isAbnormal
                                ? <span className="text-red-600 dark:text-red-400 font-bold">{s.RFLAG}</span>
                                : <span className="text-gray-300 dark:text-gray-600">—</span>
                              }
                            </td>
                            <td className={`px-2 py-[3px] text-[10px] font-semibold tabular-nums ${isAbnormal ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}`}>{s.VALUE || '—'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* BOTTOM: Specimen image + Sidebar */}
            <div className="flex flex-1 overflow-hidden min-h-0">
              <div className="flex-1 bg-gray-200 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
                <div className="text-center text-gray-400 dark:text-gray-600 select-none pointer-events-none">
                  <ImageIcon size={56} className="mx-auto mb-2 opacity-20" />
                  <p className="text-xs opacity-40">Specimen scan image</p>
                  <p className="text-[10px] opacity-30 mt-0.5 font-mono">Zoom: {zoom}%</p>
                </div>
              </div>

              {/* Right sidebar */}
              <div className="flex-shrink-0 border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex flex-col overflow-y-auto" style={{ width: '160px' }}>
                <div className="px-3 py-2.5 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
                  <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 text-center mb-2">Zoom Percentage</p>
                  <div className="flex items-center justify-center gap-1.5">
                    <button onClick={() => setZoom(z => Math.max(50,  z - 50))}
                      className="w-7 h-7 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold text-base flex items-center justify-center hover:bg-blue-100 dark:hover:bg-blue-900/40 hover:text-blue-600 transition-colors">−</button>
                    <span className="w-10 text-center text-[12px] font-mono font-bold text-gray-900 dark:text-gray-100 tabular-nums">{zoom}</span>
                    <button onClick={() => setZoom(z => Math.min(600, z + 50))}
                      className="w-7 h-7 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold text-base flex items-center justify-center hover:bg-blue-100 dark:hover:bg-blue-900/40 hover:text-blue-600 transition-colors">+</button>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 px-2 py-2 flex-shrink-0">
                  <ABtn icon={<ZoomIn        size={11} />} label="Full Image" />
                  <ABtn icon={<ClipboardList size={11} />} label="Audit Trail" />
                  <ABtn icon={<Download      size={11} />} label="Download Image" />
                  <ABtn icon={<User          size={11} />} label="Include Patient Info" />
                  <ABtn icon={<Mail          size={11} />} label="Email" />
                  <ABtn icon={<FileText      size={11} />} label="Show Notes" />
                  <ABtn icon={<BookOpen      size={11} />} label="Show Letters" />
                </div>
                <div className="mt-auto px-2 py-2 border-t border-gray-100 dark:border-gray-800 flex-shrink-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1.5">
                    Patient Filter Cards
                    {filterCards.length > 1 && (
                      <span className="ml-1 text-blue-500">({filterCards.length})</span>
                    )}
                  </p>
                  {filterLoading ? (
                    <div className="flex justify-center py-2">
                      <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : (
                    <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700" style={{ fontSize: '10px', maxHeight: '160px', overflowY: 'auto' }}>
                      <div className="flex bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0">
                        <span className="px-1.5 py-1 font-bold text-gray-600 dark:text-gray-300 border-r border-gray-200 dark:border-gray-700" style={{ width: '72px', flexShrink: 0 }}>Labno</span>
                        <span className="px-1.5 py-1 font-bold text-gray-600 dark:text-gray-300 border-r border-gray-200 dark:border-gray-700" style={{ width: '52px', flexShrink: 0 }}>Status</span>
                        <span className="flex-1 px-1.5 py-1 font-bold text-gray-600 dark:text-gray-300">View</span>
                      </div>
                      {filterCards.length === 0 ? (
                        <div className="flex items-center bg-white dark:bg-gray-900">
                          <span className="px-1.5 py-1 font-mono text-gray-700 dark:text-gray-200 border-r border-gray-200 dark:border-gray-700 truncate" style={{ width: '72px', flexShrink: 0 }}>{labno}</span>
                          <span className={`px-1.5 py-1 font-semibold border-r border-gray-200 dark:border-gray-700" style={{ width: '52px', flexShrink: 0 }} ${status === 'MAILED' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>{status}</span>
                          <span className="px-1 py-0.5 flex-shrink-0">
                            <button className="h-5 px-1.5 text-[9px] rounded font-semibold bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 transition-colors flex items-center gap-0.5">
                              <FlaskConical size={8} /> PIS
                            </button>
                          </span>
                        </div>
                      ) : filterCards.map((card, i) => {
                        const cardStatus = card.DTRPTD && card.DTRPTD.trim() ? 'MAILED' : 'UNMAILED';
                        const isActive = card.LABNO === activeLabno;
                        return (
                          <div key={i}
                            className={`flex items-center border-b border-gray-100 dark:border-gray-800 last:border-b-0 ${isActive ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-white dark:bg-gray-900'}`}>
                            <span className={`px-1.5 py-1 font-mono border-r border-gray-200 dark:border-gray-700 truncate ${isActive ? 'text-blue-700 dark:text-blue-300 font-bold' : 'text-gray-700 dark:text-gray-200'}`} style={{ width: '72px', flexShrink: 0 }}>
                              {card.LABNO}
                            </span>
                            <span className={`px-1.5 py-1 font-semibold border-r border-gray-200 dark:border-gray-700 ${cardStatus === 'MAILED' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`} style={{ width: '52px', flexShrink: 0 }}>
                              {cardStatus}
                            </span>
                            <span className="px-1 py-0.5 flex-shrink-0">
                              <button
                                onClick={() => {
                                  setActiveLabno(card.LABNO);
                                  setActiveRecord({ ...record!, LABNO: card.LABNO });
                                }}
                                className={`h-5 px-1.5 text-[9px] rounded font-semibold border transition-colors flex items-center gap-0.5 ${isActive ? 'bg-blue-600 text-white border-blue-600' : 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100'}`}>
                                <FlaskConical size={8} /> PIS
                              </button>
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── FOOTER ─── */}
        <div className="flex-shrink-0 px-5 py-2 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex items-center justify-between">
          <span className="text-[11px] text-gray-400 dark:text-gray-500">
            Record:&nbsp;<span className="font-mono text-gray-600 dark:text-gray-300">{labno}</span>
            <span className="mx-2 opacity-40">·</span>{fullName}
          </span>
          <button onClick={onClose}
            className="h-7 px-4 text-xs font-semibold rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            Close
          </button>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes pisIn {
          from { opacity:0; transform:scale(.97) translateY(10px); }
          to   { opacity:1; transform:scale(1)   translateY(0);    }
        }
      `}} />
    </div>
  );
};

// ═══════════════════════════════════════════════
// SEARCH FORM ATOMS
// ═══════════════════════════════════════════════

const Field: React.FC<{
  label: string; name: keyof SearchParams; value: string;
  onChange: (name: keyof SearchParams, value: string) => void;
  type?: string; disabled?: boolean;
}> = ({ label, name, value, onChange, type = 'text', disabled = false }) => (
  <div className="flex flex-col gap-1">
    <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">{label}</label>
    <input type={type} value={value} disabled={disabled} onChange={(e) => onChange(name, e.target.value)}
      className="h-9 px-3 text-sm rounded-lg border border-gray-300 dark:border-gray-700
        bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
        transition-all duration-150
        disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-gray-800/50"
    />
  </div>
);

const SelectField: React.FC<{
  label: string; name: keyof SearchParams; value: string;
  options: string[]; onChange: (name: keyof SearchParams, value: string) => void;
}> = ({ label, name, value, options, onChange }) => (
  <div className="flex flex-col gap-1">
    <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">{label}</label>
    <div className="relative">
      <select value={value} onChange={(e) => onChange(name, e.target.value)}
        className="h-9 w-full px-3 pr-8 text-sm rounded-lg border appearance-none
          border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800
          text-gray-900 dark:text-gray-100
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          transition-all duration-150">
        {options.map(o => <option key={o} value={o}>{o === '' ? '— All —' : o}</option>)}
      </select>
      <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
    </div>
  </div>
);

// ═══════════════════════════════════════════════
// SEARCH FORM
// ═══════════════════════════════════════════════

const SearchForm: React.FC<{
  params: SearchParams;
  onChange: (name: keyof SearchParams, value: string) => void;
  onSearch: () => void;
  onClear: () => void;
  isLoading: boolean;
}> = ({ params, onChange, onSearch, onClear, isLoading }) => (
  <div onKeyDown={(e) => { if (e.key === 'Enter') onSearch(); }}
    className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 shadow-sm">
    <div className="grid grid-cols-4 gap-4 mb-4">
      <Field label="Last Name"              name="lastName"             value={params.lastName}             onChange={onChange} />
      <Field label="First Name"             name="firstName"            value={params.firstName}            onChange={onChange} />
      <Field label="Patient Number"         name="patientNumber"        value={params.patientNumber}        onChange={onChange} disabled />
      <Field label="Form Number"            name="formNumber"           value={params.formNumber}           onChange={onChange} />
    </div>
    <div className="grid grid-cols-4 gap-4 mb-4">
      <Field label="Birth Date"             name="birthDate"            value={params.birthDate}            onChange={onChange} type="date" />
      <Field label="Collection Hospital ID" name="collectionHospitalId" value={params.collectionHospitalId} onChange={onChange} />
      <Field label="Date Collection"        name="dateCollection"       value={params.dateCollection}       onChange={onChange} type="date" />
      <SelectField label="Sex"              name="sex"                  value={params.sex}                  options={SEX_OPTIONS} onChange={onChange} />
    </div>
    <div className="grid grid-cols-4 gap-4 mb-4">
      <Field label="Lab Number"             name="labNumber"            value={params.labNumber}            onChange={onChange} />
      <Field label="Physician ID"           name="physicianId"          value={params.physicianId}          onChange={onChange} />
      <Field label="Date Received"          name="dateReceived"         value={params.dateReceived}         onChange={onChange} type="date" />
      <SelectField label="Outside Lab"      name="outsideLab"           value={params.outsideLab}           options={OUTSIDE_LAB_OPTIONS} onChange={onChange} />
    </div>
    <div className="grid grid-cols-4 gap-4 mb-5">
      <Field label="Contact's Last Name"    name="contactLastName"      value={params.contactLastName}      onChange={onChange} disabled />
      <Field label="Contact's First Name"   name="contactFirstName"     value={params.contactFirstName}     onChange={onChange} disabled />
      <Field label="Date Reported"          name="dateReported"         value={params.dateReported}         onChange={onChange} type="date" />
      <div />
    </div>
    <div className="flex items-center justify-end gap-3">
      <button onClick={onClear}
        className="h-9 px-4 text-sm rounded-lg border border-gray-300 dark:border-gray-600
          text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700
          flex items-center gap-2 transition-all duration-150">
        <X size={14} /> Clear
      </button>
      <button onClick={onSearch} disabled={isLoading}
        className="h-9 px-5 text-sm rounded-lg font-semibold
          bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20
          flex items-center gap-2 transition-all duration-150
          disabled:opacity-50 disabled:cursor-not-allowed">
        <Search size={14} />
        {isLoading ? 'Searching…' : 'Search'}
      </button>
    </div>
  </div>
);

// ═══════════════════════════════════════════════
// PAGINATION
// ═══════════════════════════════════════════════

const Pagination: React.FC<{
  currentPage: number; totalPages: number;
  totalCount: number; pageSize: number;
  onPageChange: (page: number) => void;
}> = ({ currentPage, totalPages, totalCount, pageSize, onPageChange }) => {
  if (totalPages <= 1) return null;
  const from  = (currentPage - 1) * pageSize + 1;
  const to    = Math.min(currentPage * pageSize, totalCount);
  const pages: (number | '...')[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push('...');
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i);
    if (currentPage < totalPages - 2) pages.push('...');
    pages.push(totalPages);
  }
  return (
    <div className="flex items-center justify-between mt-4 px-1">
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Showing <span className="font-semibold text-gray-700 dark:text-gray-300">{from}–{to}</span> of{' '}
        <span className="font-semibold text-gray-700 dark:text-gray-300">{totalCount}</span> records
      </p>
      <div className="flex items-center gap-1">
        <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}
          className="h-8 w-8 flex items-center justify-center rounded-lg border border-gray-300 dark:border-gray-600
            text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700
            disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          <ChevronLeft size={14} />
        </button>
        {pages.map((p, i) =>
          p === '...'
            ? <span key={`e-${i}`} className="h-8 w-8 flex items-center justify-center text-xs text-gray-400">…</span>
            : <button key={p} onClick={() => onPageChange(p as number)}
                className={`h-8 w-8 flex items-center justify-center rounded-lg border text-xs font-medium transition-colors ${
                  p === currentPage ? 'bg-blue-600 border-blue-600 text-white'
                  : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                {p}
              </button>
        )}
        <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}
          className="h-8 w-8 flex items-center justify-center rounded-lg border border-gray-300 dark:border-gray-600
            text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700
            disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════
// RESULTS TABLE
// ═══════════════════════════════════════════════

const ResultsTable: React.FC<{
  results: SampleRecord[]; totalCount: number;
  isLoading: boolean; onView: (record: SampleRecord) => void;
}> = ({ results = [], totalCount = 0, isLoading, onView }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const sorted        = [...results].sort((a, b) => String(b.LABNO).localeCompare(String(a.LABNO), undefined, { numeric: true }));
  const totalPages    = Math.ceil(sorted.length / PAGE_SIZE);
  const paginatedRows = sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => { setCurrentPage(1); }, [results]);

  if (isLoading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="mt-4">
      {totalCount > 0 && (
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Search Results</span>
          <span className="px-2 py-0.5 text-xs font-bold rounded-full
            bg-blue-50 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400
            border border-blue-200 dark:border-blue-500/30">
            {totalCount} record{totalCount !== 1 ? 's' : ''} found
          </span>
        </div>
      )}

      {results.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-500">
          <Search size={36} className="mb-3 opacity-25" />
          <p className="text-sm">No records found. Try adjusting your search filters.</p>
        </div>
      ) : (
        <>
          <div className="rounded-xl border overflow-hidden shadow-sm border-gray-200 dark:border-gray-700">
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-700">
                    {['Lab No','Lab ID','Patient Name','Facility Code','Birth Date','Date Coll.','Date Recv.','Date Rptd.','Gest. Age','Age Coll.','Sex','Status','Action'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest whitespace-nowrap text-gray-500 dark:text-gray-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginatedRows.map((row, i) => {
                    const sx = sexBadge(row.SEX);
                    return (
                      <tr key={`${row.LABNO}-${i}`}
                        className={`border-b border-gray-100 dark:border-gray-700/50 transition-colors duration-100
                          ${i % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50/50 dark:bg-gray-800/40'}
                          hover:bg-blue-50/50 dark:hover:bg-gray-700/50`}>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="font-mono text-xs font-semibold text-gray-700 dark:text-gray-300 tracking-tight">{row.LABNO || '—'}</span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="font-mono text-xs text-gray-500 dark:text-gray-400">{row.LABID || '—'}</span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0">
                              <User size={13} className="text-blue-500 dark:text-blue-400" />
                            </div>
                            {formatPatientName(row.LNAME, row.FNAME)}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {row.SUBMID
                            ? <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded font-mono bg-gray-100 dark:bg-gray-700/60 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600">{row.SUBMID}</span>
                            : <span className="text-gray-300 dark:text-gray-600">—</span>}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">{formatDateTime(row.BIRTHDT, row.BIRTHTM)}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">{formatDateTime(row.DTCOLL,  row.TMCOLL)}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">{formatDateTime(row.DTRECV,  row.TMRECV)}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">{formatDateTime(row.DTRPTD)}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                          {row.GESTAGE ? <span className="font-semibold text-gray-700 dark:text-gray-300">{row.GESTAGE}</span> : <span className="text-gray-300 dark:text-gray-600">—</span>}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                          {row.AGECOLL ? <span className="font-semibold text-gray-700 dark:text-gray-300">{formatAge(row.AGECOLL)}</span> : <span className="text-gray-300 dark:text-gray-600">—</span>}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${sx.cls}`}>{sx.label}</span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {row.DTRPTD?.trim()
                            ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-700">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" /> Mailed
                              </span>
                            : <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-700">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500 dark:bg-red-400" /> Unmailed
                              </span>}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <button onClick={() => onView(row)}
                            className="h-7 px-3 text-xs rounded-lg font-medium
                              bg-blue-50 dark:bg-blue-600/20 hover:bg-blue-100 dark:hover:bg-blue-600/40
                              text-blue-600 dark:text-blue-400
                              border border-blue-200 dark:border-blue-500/30 hover:border-blue-300 dark:hover:border-blue-400/60
                              flex items-center gap-1.5 transition-all duration-150">
                            <FlaskConical size={11} /> View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <Pagination currentPage={currentPage} totalPages={totalPages} totalCount={sorted.length} pageSize={PAGE_SIZE} onPageChange={setCurrentPage} />
        </>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════
// ROOT COMPONENT
// ═══════════════════════════════════════════════

export const PatientInformationSystem: React.FC<Props> = ({
  onSearch, results = [], isLoading, totalCount,
}) => {
  const [params,     setParams]     = useState<SearchParams>(EMPTY_PARAMS);
  const [viewRecord, setViewRecord] = useState<SampleRecord | null>(null);

  const handleChange = (name: keyof SearchParams, value: string) =>
    setParams(prev => ({ ...prev, [name]: value }));

  return (
    <div className="p-6 text-gray-900 dark:text-gray-100">
      <div className="mb-5 flex items-center gap-3">
        <div className="w-1 h-8 rounded-full bg-blue-500" />
        <div>
          <h1 className="text-lg font-bold tracking-tight text-gray-900 dark:text-white">Patient Information System</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">Search and manage patient sample records</p>
        </div>
      </div>

      <SearchForm params={params} onChange={handleChange} onSearch={() => onSearch(params)} onClear={() => setParams(EMPTY_PARAMS)} isLoading={isLoading} />

      <ResultsTable results={results} totalCount={totalCount} isLoading={isLoading} onView={(record) => setViewRecord(record)} />

      <PatientRecordModal record={viewRecord} onClose={() => setViewRecord(null)} />
    </div>
  );
};

export default PatientInformationSystem;