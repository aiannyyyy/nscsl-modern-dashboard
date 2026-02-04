// ========================================
// PATIENT DETAILS TYPES - COMPLETE
// ========================================

// Patient Interfaces
export interface CompletePatientDetails {
    LABNO: string;
    LABID: string;
    FNAME: string;
    LNAME: string;
    BIRTHDT?: string;
    BIRTHTM?: string;
    DTCOLL?: string;
    TMCOLL?: string;
    DTRECV?: string;
    DTRPTD?: string;
    RELEASEDT?: string;
    SPECTYPE?: string;
    MILKTYPE?: string;
    SEX?: string;
    BIRTHWT?: string;
    TRANSFUS?: string;
    GESTAGE?: string;
    AGECOLL?: string;
    CLINSTAT?: string;
    PHYSID?: string;
    BIRTHHOSP?: string;
    PROVIDER_DESCR1?: string;
    SUBMID?: string;
    DISORDER_NAME?: string;
    MNEMONIC?: string;
    DESCR1?: string;
    DISORDERRESULTTEXT?: string;
    GROUP_NAME?: string;
    NOTES?: string;
    [key: string]: any;
}

export interface DisorderResult {
    LABNO: string;
    DISORDER_NAME: string;
    MNEMONIC: string;
    DESCR1: string;
    DISORDERRESULTTEXT: string;
    GROUP_NAME: string;
}

export interface NotebookEntry {
    LABNO: string;
    LNAME: string;
    FNAME: string;
    NOTES: string | null;
    LASTMOD: string;
    USER_ID: string;
    CREATE_DT: string;
    CREATETIME: string;
}

// ✅ Frontend interface (lowercase) matching backend response
export interface PatientDetails {
    labno: string;
    labid: string;
    fname: string;
    lname: string;
    birthdt?: string;
    birthtm?: string;
    dtcoll?: string;
    tmcoll?: string;
    spectype?: string;
    milktype?: string;
    sex: string;
    birthwt: string;
    transfus?: string;
    gestage?: string;
    agecoll?: string;
    dtrecv?: string;
    dtrptd?: string;
    releasedt?: string;
    clinstat?: string;
    physid?: string;
    birthhosp?: string;          // ✅ Birth hospital status (Inborn/Outborn/Unknown)
    submid: string;
    provider_descr1?: string;    // ✅ Hospital/Provider name
    notes?: string;
    disorderResults?: DisorderResult[];
    [key: string]: any;
}

// Constants
export const SPECIMEN_TYPES: Record<string, string> = {
    "1": "NBS-5 test",
    "2": "Repeat Unsat",
    "3": "Repeat Abnormal",
    "4": "Repeat Normal",
    "5": "Monitoring",
    "6": "ARCHIVED",
    "8": "QC (G6PD)",
    "9": "PT Samples (CDC)",
    "18": "NBS 5 +LEU",
    "20": "ENBS",
    "21": "Other Disorders",
    "22": "Rpt-ENBS",
    "87": "Unfit",
    "96": "Serum"
};

export const TECH_MAPPING: Record<string, string> = {
    "222": "AAMORFE",
    "202": "ABBRUTAS",
    "223": "ATDELEON",
    "148": "GEYEDRA",
    "87": "MCDIMAILIG",
    "145": "KGSTAROSA",
    "210": "MRGOMEZ",
    "86": "VMWAGAN",
    "129": "JMAPELADO"
};

// Helper Functions
export function getSpecimenType(code: string | undefined): string {
    if (!code) return 'N/A';
    return SPECIMEN_TYPES[code] || code;
}

export function getTechName(id: string | undefined): string {
    if (!id) return 'N/A';
    return TECH_MAPPING[id] || id;
}

export function formatSex(sex: string | undefined): string {
    if (!sex) return 'N/A';
    if (sex === "1") return "Male";
    if (sex === "2") return "Female";
    return sex;
}

export function formatYesNo(value: string | undefined): string {
    if (!value) return 'No';
    return value.toLowerCase() === 'yes' || value === '1' ? 'Yes' : 'No';
}

export function calculateSpecimenAge(dtrecv: string | undefined, dtcoll: string | undefined): string {
    if (!dtrecv || !dtcoll) return 'N/A';
    try {
        const receivedDate = new Date(dtrecv);
        const collectionDate = new Date(dtcoll);
        const diffTime = Math.abs(receivedDate.getTime() - collectionDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return `${diffDays} days`;
    } catch {
        return 'N/A';
    }
}

export function formatDateTime(dateStr: string | undefined, timeStr?: string | undefined): string {
    if (!dateStr) return 'N/A';
    try {
        const date = new Date(dateStr);
        const formattedDate = date.toLocaleDateString();
        if (timeStr) {
            return `${formattedDate} ${timeStr}`;
        }
        return formattedDate;
    } catch {
        return dateStr;
    }
}