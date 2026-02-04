import React, { useState, useEffect } from "react";
import { getFacilityByCode, getNextCaseNumber } from "../../../services/PDOServices/carListApi";
import type { AddCarFormData } from "../../../services/PDOServices/carListApi";

interface Props {
  show: boolean;
  onClose: () => void;
  onSave: (data: AddCarFormData) => Promise<void>;
}

// Province code mapping
const PROVINCE_CODES: { [key: string]: string } = {
  'CAVITE': 'CAV',
  'LAGUNA': 'LAG',
  'BATANGAS': 'BAT',
  'RIZAL': 'RIZ',
  'QUEZON': 'QUE',
};

export const AddDocumentModal: React.FC<Props> = ({
  show,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<any>({});
  const [isLoadingFacility, setIsLoadingFacility] = useState(false);
  const [facilityError, setFacilityError] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingCaseNo, setIsGeneratingCaseNo] = useState(false);

  // Auto-fill current date/time when modal opens
  useEffect(() => {
    if (show) {
      const now = new Date();
      const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
      
      setFormData((prev: any) => ({
        ...prev,
        endorsedDate: localDateTime,
      }));
    }
  }, [show]);

  // Facility code lookup with debounce
  useEffect(() => {
    if (!show) return;

    const facilityCode = formData.facilityCode;

    if (!facilityCode || facilityCode.length < 2) {
      setFormData((prev: any) => ({
        ...prev,
        facilityName: "",
        city: "",
        province: "",
        caseNo: "", // Clear case number when facility code is cleared
      }));
      setFacilityError("");
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoadingFacility(true);
      setFacilityError("");

      try {
        const facility = await getFacilityByCode(facilityCode);

        if (facility) {
          const province = facility.province?.toUpperCase().trim();
          const provinceCode = PROVINCE_CODES[province] || '';

          setFormData((prev: any) => ({
            ...prev,
            facilityName: facility.facilityname,
            city: facility.city,
            province: facility.province,
          }));
          setFacilityError("");

          // Generate case number if we have a valid province code
          if (provinceCode) {
            await generateCaseNumber(provinceCode);
          } else {
            setFacilityError(`Unknown province code for: ${facility.province}`);
            setFormData((prev: any) => ({
              ...prev,
              caseNo: "",
            }));
          }
        } else {
          setFormData((prev: any) => ({
            ...prev,
            facilityName: "",
            city: "",
            province: "",
            caseNo: "",
          }));
          setFacilityError("Facility not found");
        }
      } catch (error) {
        console.error("Error fetching facility:", error);
        setFacilityError("Error loading facility details");
        setFormData((prev: any) => ({
          ...prev,
          facilityName: "",
          city: "",
          province: "",
          caseNo: "",
        }));
      } finally {
        setIsLoadingFacility(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [show, formData.facilityCode]);

  // Generate case number based on province code
  const generateCaseNumber = async (provinceCode: string) => {
    setIsGeneratingCaseNo(true);
    try {
      // Get current year (last 2 digits)
      const year = new Date().getFullYear().toString().slice(-2);

      // Call API to get next case number
      const data = await getNextCaseNumber(provinceCode, year);

      if (data.success) {
        const caseNumber = data.preview;

        setFormData((prev: any) => ({
          ...prev,
          caseNo: caseNumber,
        }));
      } else {
        console.error("Failed to generate case number:", data.message);
        setFacilityError("Failed to generate case number");
      }
    } catch (error) {
      console.error("Error generating case number:", error);
      setFacilityError("Error generating case number");
    } finally {
      setIsGeneratingCaseNo(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, files } = e.target as any;
    setFormData((prev: any) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSaving(true);
    try {
      await onSave(formData);
      setFormData({});
      onClose();
    } catch (error) {
      console.error("Error saving document:", error);
      alert("Failed to save document. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // Prevent Enter key from submitting the form (except for textarea and the submit button)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
      e.preventDefault();
    }
  };

  if (!show) return null;

  const input =
    "mt-1 w-full rounded border border-gray-300 px-2 py-1.5 text-sm text-black focus:outline-none focus:ring-1 focus:ring-teal-500";
  const select = input;
  const label = "text-sm text-gray-700";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div
        className="relative w-full max-w-6xl bg-white rounded shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b">
          <h5 className="text-base font-medium">Add Document</h5>
          <button onClick={onClose} className="text-gray-500 text-xl leading-none">
            ×
          </button>
        </div>

        {/* Body */}
        <form
          id="documentForm"
          onSubmit={handleSubmit}
          onKeyDown={handleKeyDown}
          className="px-4 py-3 max-h-[70vh] overflow-y-auto text-sm"
        >
          <div className="grid grid-cols-12 gap-3">
            {/* Case No - AUTO GENERATED & DISABLED */}
            <div className="col-span-12 md:col-span-3">
              <label className={label}>
                Case No. <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  name="caseNo"
                  className={`${input} bg-gray-100 cursor-not-allowed`}
                  required
                  disabled
                  value={formData.caseNo || ""}
                  placeholder="Auto-generated"
                />
                {isGeneratingCaseNo && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
            </div>

            {/* Date Endorsed - AUTO FILLED with current date/time */}
            <div className="col-span-12 md:col-span-3">
              <label className={label}>
                Date Endorsed <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                name="endorsedDate"
                className={input}
                required
                onChange={handleChange}
                value={formData.endorsedDate || ""}
              />
              <p className="text-xs text-gray-500 mt-0.5">Auto-filled with current time</p>
            </div>

            {/* Endorsed By */}
            <div className="col-span-12 md:col-span-3">
              <label className={label}>Endorsed By</label>
              <select
                name="endorsedBy"
                className={select}
                onChange={handleChange}
                value={formData.endorsedBy || ""}
              >
                <option value=""> -- Select -- </option>
                <option>Abigail Morfe</option>
                <option>Angelica B. Brutas</option>
                <option>Gretel E. Yedra</option>
                <option>Jay Arr M. Apelado</option>
                <option>Dra. Kresnerfe Sta. Rosa-Abueg</option>
                <option>Marc Kevin U. Estolas</option>
                <option>Mary Rose R. Gomez</option>
                <option>Mia Carla Garcia, RN</option>
                <option>Shirleen O. Micosa, RN, LPT</option>
                <option>Vivien Marie M. Wagan</option>
              </select>
            </div>

            {/* Facility Code */}
            <div className="col-span-12 md:col-span-3">
              <label className={label}>
                Facility Code <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  name="facilityCode"
                  className={input}
                  required
                  onChange={handleChange}
                  value={formData.facilityCode || ""}
                  placeholder="Enter facility code"
                />
                {isLoadingFacility && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
              {facilityError && (
                <p className="text-xs text-red-500 mt-1">{facilityError}</p>
              )}
            </div>

            {/* Facility Name */}
            <div className="col-span-12 md:col-span-4">
              <label className={label}>Facility Name</label>
              <input
                name="facilityName"
                className={`${input} bg-gray-100`}
                readOnly
                value={formData.facilityName || ""}
              />
            </div>

            {/* City */}
            <div className="col-span-12 md:col-span-4">
              <label className={label}>City</label>
              <input
                name="city"
                className={`${input} bg-gray-100`}
                readOnly
                value={formData.city || ""}
              />
            </div>

            {/* Province */}
            <div className="col-span-12 md:col-span-4">
              <label className={label}>Province</label>
              <input
                name="province"
                className={`${input} bg-gray-100`}
                readOnly
                value={formData.province || ""}
              />
            </div>

            {/* Lab/Repeat/Status/Number of Samples */}
            {[
              ["labNo", "Laboratory Number"],
              ["repeat", "Repeat"],
            ].map(([name, labelText]) => (
              <div key={name} className="col-span-12 md:col-span-3">
                <label className={label}>{labelText}</label>
                <input
                  name={name}
                  className={input}
                  onChange={handleChange}
                  value={formData[name] || ""}
                />
              </div>
            ))}

            <div className="col-span-12 md:col-span-3">
              <label className={label}>Status</label>
              <select
                name="status"
                className={select}
                onChange={handleChange}
                value={formData.status || ""}
              >
                <option value=""> -- Select -- </option>
                <option value="open">Open</option>
                <option value="closed">Closed</option>
                <option value="pending">Pending</option>
              </select>
            </div>

            <div className="col-span-12 md:col-span-3">
              <label className={label}>Number of Samples</label>
              <select
                name="numSamples"
                className={select}
                onChange={handleChange}
                value={formData.numSamples || ""}
              >
                <option value=""> -- Select -- </option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
              </select>
            </div>

            {/* Sub Codes */}
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="col-span-12 md:col-span-3">
                <label className={label}>Sub Code {n}</label>
                <select
                  name={`subCode${n}`}
                  className={select}
                  onChange={handleChange}
                  value={formData[`subCode${n}`] || ""}
                >
                  <option value=""> -- Select -- </option>
                  <option>BORROWING OF FILTER CARDS</option>
                  <option>CONTAMINATED CLOTTED</option>
                  <option>CONTAMINATED FUNGAL GROWTH</option>
                  <option>CONTAMINATED INSECT BITES</option>
                  <option>CONTAMINATED LAYERING</option>
                  <option>CONTAMINATED NO ELUATE</option>
                  <option>INSUFFICIENT</option>
                  <option>LATE SAMPLE</option>
                  <option>MISSING SAMPLE</option>
                  <option>NO DATA</option>
                  <option>OTHERS (PLEASE SPECIFY AT REMARKS)</option>
                </select>
              </div>
            ))}

            {/* Remarks */}
            <div className="col-span-12 md:col-span-6">
              <label className={label}>Remarks</label>
              <textarea
                name="remarks"
                className={`${input} h-20`}
                onChange={handleChange}
                value={formData.remarks || ""}
              />
            </div>

            {/* Case Code */}
            <div className="col-span-12 md:col-span-6">
              <label className={label}>Case Code</label>
              <select
                name="caseCode"
                className={select}
                onChange={handleChange}
                value={formData.caseCode || ""}
              >
                <option value=""> -- Select -- </option>
                <option>UNSAT</option>
                <option>OTHERS</option>
              </select>
            </div>

            {/* FRC / WRC / Prepared By */}
            <div className="col-span-12 md:col-span-4">
              <label className={label}>FRC</label>
              <input
                name="frc"
                className={input}
                onChange={handleChange}
                value={formData.frc || ""}
              />
            </div>

            <div className="col-span-12 md:col-span-4">
              <label className={label}>WRC</label>
              <input
                name="wrc"
                className={input}
                onChange={handleChange}
                value={formData.wrc || ""}
              />
            </div>

            <div className="col-span-12 md:col-span-4">
              <label className={label}>Prepared By</label>
              <select
                name="preparedBy"
                className={select}
                onChange={handleChange}
                value={formData.preparedBy || ""}
              >
                <option value=""> -- Select -- </option>
                <option>Erika Jane U. Tarray, RPM</option>
                <option>Mancy F. Barrago, RN</option>
                <option>Marc Kevin U. Estolas, RMT</option>
                <option>Patrick Charls O. Reyes</option>
                <option>Shirleen O. Micosa, RN, LPT</option>
              </select>
            </div>

            {/* Dates */}
            {["followupOn", "reviewedOn", "closedOn"].map((d) => (
              <div key={d} className="col-span-12 md:col-span-2">
                <label className={label}>{d.replace(/([A-Z])/g, " $1")}</label>
                <input
                  type="datetime-local"
                  name={d}
                  className={input}
                  onChange={handleChange}
                  value={formData[d] || ""}
                />
              </div>
            ))}

            {/* Attachment */}
            <div className="col-span-12 md:col-span-6">
              <label className="text-sm text-gray-700">Attachment</label>
              <div className="mt-1 flex items-center gap-2">
                <input
                  id="attachment"
                  type="file"
                  name="attachment"
                  className="hidden"
                  onChange={handleChange}
                />
                <label
                  htmlFor="attachment"
                  className="cursor-pointer px-3 py-1.5 text-sm border border-gray-300 rounded bg-gray-50 hover:bg-gray-100"
                >
                  Choose File
                </label>
                <span className="text-sm text-gray-500 truncate max-w-[220px]">
                  {formData.attachment?.name || "No file chosen"}
                </span>
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-4 py-2 border-t">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-sm border rounded disabled:opacity-50"
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="documentForm"
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            disabled={isSaving}
          >
            {isSaving && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            )}
            {isSaving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};