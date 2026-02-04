// API Service for Notebooks

// Vite uses import.meta.env instead of process.env
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface SearchCriteria {
    labno?: string;
    labid?: string;
    fname?: string;
    lname?: string;
    submid?: string;
}

export interface PatientSearchResult {
    LABNO: string;
    LABID: string;
    FNAME: string;
    LNAME: string;
    SEX: string;
    BIRTHDT: string;
    BIRTHWT: string;
    SUBMID: string;
    DESCR1?: string;
    NOTES?: string;
}

export interface PatientDetails {
    LABNO: string;
    LABID: string;
    FNAME: string;
    LNAME: string;
    SEX: string;
    BIRTHDT: string;
    DOC?: string;
    BIRTHWT: string;
    SUBMID: string;
    // Add other fields from SAMPLE_DEMOG_ARCHIVE/MASTER as needed
    [key: string]: any;
}

// Oracle notebook entry (from Oracle database)
export interface OracleNotebookEntry {
    LABNO: string;
    LABID: string;
    LNAME: string;
    FNAME: string;
    NOTES: string;
    LASTMOD: string;
    USER_ID: string;
    CREATE_DT: string;
    CREATETIME: string;
}

// MySQL notebook entry (from pdo_notebook table)
export interface MySQLNotebookEntry {
    labno: string;
    labid: string;
    lname: string;
    fname: string;
    notes: string;
    createDate: string;
    modDate?: string;
    techCreate: string;
    attachment_path?: string;
}

// Union type for notebook entries
export type NotebookEntry = OracleNotebookEntry | MySQLNotebookEntry;

/**
 * Search for patients based on criteria
 */
export const searchPatients = async (criteria: SearchCriteria): Promise<PatientSearchResult[]> => {
    try {
        const queryParams = new URLSearchParams();
        
        // Add only non-empty criteria to query params
        Object.entries(criteria).forEach(([key, value]) => {
            if (value && value.trim() !== '') {
                queryParams.append(key, value.trim());
            }
        });

        const response = await fetch(`${API_BASE_URL}/notebooks/search?${queryParams.toString()}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error searching patients:', error);
        throw error;
    }
};

/**
 * Get detailed patient information by lab number
 */
export const getPatientDetails = async (labno: string): Promise<PatientDetails> => {
    try {
        const response = await fetch(`${API_BASE_URL}/notebooks/patient/${labno}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching patient details:', error);
        throw error;
    }
};

/**
 * 🆕 Get patient notebooks by labno and optional labid
 * This uses the query from your old dashboard
 */
export const getPatientNotebooks = async (labno: string, labid?: string): Promise<OracleNotebookEntry[]> => {
    try {
        const queryParams = new URLSearchParams({
            labno: labno.trim(),
        });

        if (labid && labid.trim() !== '') {
            queryParams.append('labid', labid.trim());
        }

        const response = await fetch(`${API_BASE_URL}/notebooks/notebooks?${queryParams.toString()}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        return result.data || [];
    } catch (error) {
        console.error('Error fetching patient notebooks:', error);
        throw error;
    }
};

/**
 * 🆕 Get MySQL notebook entries (from pdo_notebook table)
 */
export const getMySQLNotebookEntries = async (labno: string, fname: string, lname: string): Promise<MySQLNotebookEntry[]> => {
    try {
        const queryParams = new URLSearchParams({
            labno: labno.trim(),
            fname: fname.trim(),
            lname: lname.trim(),
        });

        const response = await fetch(`${API_BASE_URL}/notebooks/mysql-entries?${queryParams.toString()}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        return result.data || [];
    } catch (error) {
        console.error('Error fetching MySQL notebook entries:', error);
        throw error;
    }
};

/**
 * 🆕 Add new notebook entry with attachments to MySQL
 * @param username - The actual logged-in username (🆕 UPDATED)
 */
export const addNotebookEntry = async (
    labno: string,
    labid: string,
    fname: string,
    lname: string,
    notes: string,
    files: File[],
    username: string // 🆕 Changed from techCreate to username for clarity
): Promise<any> => {
    try {
        const formData = new FormData();
        formData.append('labno', labno);
        formData.append('labid', labid);
        formData.append('fname', fname);
        formData.append('lname', lname);
        formData.append('notes', notes);
        formData.append('username', username); // 🆕 Send username instead of techCreate

        // Append all files
        files.forEach(file => {
            formData.append('files', file);
        });

        const response = await fetch(`${API_BASE_URL}/notebooks/add-notebook`, {
            method: 'POST',
            body: formData,
            // Don't set Content-Type header - browser will set it with boundary
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error adding notebook entry:', error);
        throw error;
    }
};

/**
 * 🆕 Fetch all notebook entries (combines Oracle and MySQL sources)
 */
export const getAllNotebookEntries = async (
    labno: string,
    labid: string,
    fname: string,
    lname: string
): Promise<NotebookEntry[]> => {
    try {
        // Fetch from both sources in parallel
        const [oracleEntries, mysqlEntries] = await Promise.all([
            getPatientNotebooks(labno, labid).catch(() => []),
            getMySQLNotebookEntries(labno, fname, lname).catch(() => [])
        ]);

        // Combine entries
        const allEntries: NotebookEntry[] = [...oracleEntries, ...mysqlEntries];
        
        console.log(`📊 Combined entries: ${oracleEntries.length} Oracle + ${mysqlEntries.length} MySQL = ${allEntries.length} total`);
        
        return allEntries;
    } catch (error) {
        console.error('Error fetching all notebook entries:', error);
        throw error;
    }
};