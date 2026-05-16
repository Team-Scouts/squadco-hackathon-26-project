import { useState } from "react";
import {
  ArrowLeft,
  AlertTriangle,
  Building2,
  CheckCircle2,
  FileUp,
  Fingerprint,
  Mail,
  Phone,
  Send,
  User,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { UploadingDocumentSkeleton } from "../Skeletons";
import FingerprintJS from "@fingerprintjs/fingerprintjs";

type FormState = {
  businessName: string;
  registrationNumber: string;
  vendorType: string;
  sector: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  country: string;
  state: string;
  address: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  verificationFee: string;
  payoutLimit: string;
  deviceConsent: boolean;
  runDocumentCheck: boolean;
  initiatePayment: boolean;
  notes: string;
};

type KycDocumentType =
  | "CAC_REGISTRATION"
  | "TAX_ID"
  | "OWNER_ID"
  | "ADDRESS_PROOF";

type UploadedDocumentSummary = {
  id: string;
  documentType: KycDocumentType;
  fileName: string;
  verificationStatus?: string;
  duplicateDetected?: boolean;
  duplicateVendorCount?: number;
};

const kycDocumentTypes: Array<{
  type: KycDocumentType;
  label: string;
  description: string;
}> = [
  {
    type: "CAC_REGISTRATION",
    label: "CAC registration",
    description: "Company incorporation certificate or CAC registration proof.",
  },
  {
    type: "TAX_ID",
    label: "Tax ID",
    description: "TIN/FIRS registration evidence for tax identity checks.",
  },
  {
    type: "OWNER_ID",
    label: "Owner ID",
    description: "Government ID for the owner, director, or principal contact.",
  },
  {
    type: "ADDRESS_PROOF",
    label: "Address proof",
    description:
      "Utility bill, tenancy document, or other business address proof.",
  },
];

const inputClass = "field-control";

const selectClass = `${inputClass} appearance-none`;

const initialForm: FormState = {
  businessName: "",
  registrationNumber: "",
  vendorType: "Supplier",
  sector: "",
  contactName: "",
  contactEmail: "",
  contactPhone: "",
  country: "Nigeria",
  state: "Lagos",
  address: "",
  bankName: "",
  accountNumber: "",
  accountName: "",
  verificationFee: "15000",
  payoutLimit: "500000",
  deviceConsent: true,
  runDocumentCheck: true,
  initiatePayment: true,
  notes: "",
};

export default function CreateVendor() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [submitted, setSubmitted] = useState(false);
  const [vendorID, updateVendorID] = useState("");
  const [formStage, updateFormStage] = useState(1);
  const [file, updateFile] = useState<File | null>();
  const [selectedDocumentType, setSelectedDocumentType] =
    useState<KycDocumentType>("CAC_REGISTRATION");
  const [uploadedDocuments, setUploadedDocuments] = useState<
    UploadedDocumentSummary[]
  >([]);
  const [uploadError, setUploadError] = useState("");
  const [deviceCaptureWarning, setDeviceCaptureWarning] = useState("");
  const navigate = useNavigate();
  const browser = navigator.userAgent;
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const updateField = <K extends keyof FormState>(
    field: K,
    value: FormState[K],
  ) => {
    setSubmitted(false);
    setForm((current) => ({ ...current, [field]: value }));
  };

  const { data, isSuccess } = useQuery({
    queryKey: ["vendor_details", vendorID],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      if (vendorID.length > 1) {
        const request = await fetch(
          `${import.meta.env.VITE_SERVER_BASE_URL}/vendors/${vendorID}`,
          {
            credentials: "include",
          },
        );
        const response = await request.json();
        return response;
      }
    },
  });

  const contactNameParts = form.contactName.trim().split(/\s+/);
  const firstName = contactNameParts[0] ?? "";
  const lastName = contactNameParts.slice(1).join(" ") || firstName;

  const vendorCreateMutation = useMutation({
    mutationFn: async (body: {
      businessName: string;
      registrationNumber: string;
      vendorType: string;
      sector: string;
      contactName: string;
      email: string;
      phone: string;
      country: string;
      state: string;
      address: string;
      firstName: string;
      lastName: string;
    }) => {
      const request = await fetch(
        `${import.meta.env.VITE_SERVER_BASE_URL}/vendors`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          credentials: "include",
        },
      );
      const response = await request.json();

      if (!request.ok || !response.success) {
        throw new Error(response.message ?? "Vendor creation failed.");
      }

      updateVendorID(response.data.id);
      return response;
    },
    onSuccess: async (response) => {
      updateFormStage(2);

      const vendorId = response.data.id || vendorID;

      if (!form.deviceConsent) {
        return;
      }

      try {
        const fp = await FingerprintJS.load();
        const result = await fp.get();
        const response = await fetch(
          `${import.meta.env.VITE_SERVER_BASE_URL}/devices`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({
              vendorId,
              deviceHash: result.visitorId,
              browser,
              timezone,
            }),
          },
        );

        if (!response.ok) {
          throw new Error(
            `Device capture failed with status ${response.status}`,
          );
        }
      } catch (error) {
        console.warn("Device fingerprint capture failed", error);
        setDeviceCaptureWarning(
          "Vendor was created, but device fingerprint capture failed.",
        );
      }
    },
  });

  const uploadDocumentsMutation = useMutation({
    mutationFn: async ({
      body,
      fileName,
      documentType,
    }: {
      body: FormData;
      fileName: string;
      documentType: KycDocumentType;
    }) => {
      const postRequest = await fetch(
        `${import.meta.env.VITE_SERVER_BASE_URL}/documents/upload`,
        {
          method: "POST",
          body: body,
          credentials: "include",
        },
      );
      const postResponse = await postRequest.json();

      if (!postRequest.ok || !postResponse.success) {
        throw new Error(postResponse.message ?? "Document upload failed.");
      }

      return { ...postResponse, fileName, documentType };
    },
    onSuccess: (response) => {
      setUploadError("");
      updateFile(null);
      setUploadedDocuments((current) => {
        const nextDocument: UploadedDocumentSummary = {
          id: response.data.id,
          documentType: response.documentType,
          fileName: response.fileName,
          verificationStatus: response.data.verificationStatus,
          duplicateDetected:
            response.duplicateSummary?.duplicateDetected ??
            response.data.duplicateDetected,
          duplicateVendorCount:
            response.duplicateSummary?.duplicateVendorCount ??
            response.data.duplicateVendorCount,
        };

        return [
          ...current.filter(
            (document) => document.documentType !== response.documentType,
          ),
          nextDocument,
        ];
      });
    },
    onError: (error) => {
      setUploadError(
        error instanceof Error ? error.message : "Document upload failed.",
      );
    },
  });

  const handleDocumentSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("vendorId", vendorID);
    if (!file) {
      setUploadError("Choose a file before uploading this KYC document.");
      return;
    }

    formData.append("file", file);
    formData.append("documentType", selectedDocumentType);
    await uploadDocumentsMutation.mutateAsync({
      body: formData,
      fileName: file.name,
      documentType: selectedDocumentType,
    });
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      updateFile(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    vendorCreateMutation.mutateAsync({
      businessName: form.businessName,
      registrationNumber: form.registrationNumber,
      vendorType: form.vendorType,
      sector: form.sector,
      contactName: form.contactName,
      email: form.contactEmail,
      phone: form.contactPhone,
      country: form.country,
      state: form.state,
      address: form.address,
      firstName,
      lastName,
    });
  };

  const uploadedDocumentTypes = new Set(
    uploadedDocuments.map((document) => document.documentType),
  );
  const selectedDocumentLabel =
    kycDocumentTypes.find((document) => document.type === selectedDocumentType)
      ?.label ?? "KYC document";
  const allRequiredKycUploaded =
    uploadedDocumentTypes.size === kycDocumentTypes.length;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Link
            to="/dashboard/vendors"
            className="mb-4 inline-flex items-center gap-2 text-xs font-bold text-zinc-500 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to vendors
          </Link>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-zinc-500">
            Vendor intake
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-white">
            Create New Vendor
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
            Capture the identity, document, bank, and Squad payment signals
            needed to start a FraudLens risk review.
          </p>
        </div>

        {/* <div className="glass-panel rounded-2xl p-4 min-w-64">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Intake readiness
            </span>
            <span className="text-sm font-black text-white">{completion}%</span>
          </div>
          <div className="h-2 rounded-full bg-black/40 overflow-hidden border border-white/5">
            <div
              className="h-full bg-emerald-500 transition-all"
              style={{ width: `${completion}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-3">
            Required fields feed the document, device, financial, and graph risk
            checks.
          </p>
        </div> */}
      </div>

      {submitted && (
        <div className="glass-panel flex items-start gap-3 rounded-2xl border-green-500/30 bg-green-500/5 p-4">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-300" />
          <div>
            <p className="text-sm font-bold text-white">
              Vendor intake staged for review
            </p>
            <p className="text-xs text-gray-400 mt-1">
              In the full workflow this would create the vendor profile, capture
              the device fingerprint, upload documents, and initiate the Squad
              verification fee.
            </p>
          </div>
        </div>
      )}

      <div className="xl:col-span-2 space-y-6">
        {formStage === 2 && isSuccess && (
          <form onSubmit={handleDocumentSubmit}>
            <section className="panel-card p-6">
              <div className="mb-6 grid gap-4 lg:grid-cols-[1fr_18rem]">
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                    Vendor created
                  </p>
                  <p className="mt-2 font-mono text-xs text-zinc-400 break-all">
                    {data.data.id}
                  </p>
                  <p className="mt-1 text-sm font-bold text-white">
                    {data.data.businessName}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    Registration:{" "}
                    <span className="text-zinc-300">
                      {data.data.registrationNumber ?? form.registrationNumber}
                    </span>
                  </p>
                </div>
                <div
                  className={`rounded-2xl border p-4 ${
                    allRequiredKycUploaded
                      ? "border-green-500/30 bg-green-500/10"
                      : "border-white/10 bg-black/30"
                  }`}
                >
                  <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                    KYC progress
                  </p>
                  <p className="mt-2 text-2xl font-black text-white">
                    {uploadedDocumentTypes.size}/{kycDocumentTypes.length}
                  </p>
                  <p className="text-xs text-zinc-500">
                    Required documents uploaded
                  </p>
                </div>
              </div>

              <div className="mb-6 flex items-start gap-4 border-b border-white/10 pb-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-green-500/20 bg-green-500/10">
                  <Building2 className="h-5 w-5 text-green-300" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    Required KYC Documents
                  </h2>
                  <p className="text-sm text-gray-400 mt-1">
                    Upload each required document type. CAC registration will be
                    compared against the saved registration number.
                  </p>
                </div>
              </div>

              <div className="grid gap-5 lg:grid-cols-[1fr_18rem]">
                <div className="space-y-4">
                  <label className="block">
                    <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                      Document type
                    </span>
                    <select
                      value={selectedDocumentType}
                      onChange={(event) =>
                        setSelectedDocumentType(
                          event.target.value as KycDocumentType,
                        )
                      }
                      className={selectClass}
                    >
                      {kycDocumentTypes.map((document) => (
                        <option key={document.type} value={document.type}>
                          {document.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-black/30 p-5 text-center transition-colors hover:border-white/40 hover:bg-white/5">
                    <FileUp className="mb-3 h-8 w-8 text-zinc-200" />
                    <span className="text-sm font-bold text-white">
                      {file ? file.name : `Upload ${selectedDocumentLabel}`}
                    </span>
                    <span className="text-xs text-gray-500 mt-1">
                      PDF, JPG, or PNG files
                    </span>
                    <input
                      type="file"
                      className="sr-only"
                      name="file"
                      accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                      onChange={handleFile}
                    />
                  </label>

                  {uploadError && (
                    <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-100">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>{uploadError}</span>
                    </div>
                  )}

                  {uploadedDocuments.length > 0 && (
                    <div className="rounded-2xl border border-green-500/20 bg-green-500/10 p-4">
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-300" />
                        <div>
                          <p className="text-sm font-bold text-white">
                            Document upload saved
                          </p>
                          <p className="mt-1 text-xs text-green-100/80">
                            Latest upload:{" "}
                            {uploadedDocuments[uploadedDocuments.length - 1]
                              ?.fileName ?? "KYC document"}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <button
                      type="submit"
                      disabled={uploadDocumentsMutation.isPending}
                      className="button-primary disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Send className="h-4 w-4" />
                      {uploadDocumentsMutation.isPending
                        ? "Uploading..."
                        : "Upload document"}
                    </button>

                    <button
                      type="button"
                      onClick={() => navigate(`/dashboard/vendors/${vendorID}`)}
                      className="button-secondary"
                    >
                      Continue to vendor review
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {kycDocumentTypes.map((document) => {
                    const uploadedDocument = uploadedDocuments.find(
                      (uploaded) => uploaded.documentType === document.type,
                    );

                    return (
                      <div
                        key={document.type}
                        className={`rounded-2xl border p-4 ${
                          uploadedDocument
                            ? "border-green-500/25 bg-green-500/10"
                            : "border-white/10 bg-black/30"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <CheckCircle2
                            className={`mt-0.5 h-4 w-4 shrink-0 ${
                              uploadedDocument
                                ? "text-green-300"
                                : "text-zinc-600"
                            }`}
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-white">
                              {document.label}
                            </p>
                            <p className="mt-1 text-xs leading-5 text-zinc-500">
                              {uploadedDocument
                                ? uploadedDocument.fileName
                                : document.description}
                            </p>
                            {uploadedDocument?.duplicateDetected && (
                              <p className="mt-2 text-xs font-bold text-amber-200">
                                Duplicate detected across{" "}
                                {uploadedDocument.duplicateVendorCount}{" "}
                                vendor(s)
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          </form>
        )}

        {formStage === 2 && uploadDocumentsMutation.isPending && (
          <UploadingDocumentSkeleton />
        )}

        {formStage === 1 && (
          <section className="panel-card p-6">
            <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6">
              <div className="border-b border-white/10 pb-5 mb-6 items-start gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-sky-300/20 bg-sky-300/10">
                  <User className="h-5 w-5 text-sky-200" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    Step 1: Contact & Location
                  </h2>
                  <p className="text-sm text-gray-400 mt-1">
                    Add basic contact information for the entity being uploaded
                    to the FraudLens Database.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <label className="block md:col-span-2">
                  <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                    Primary contact
                  </span>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <input
                      required
                      value={form.contactName}
                      onChange={(event) =>
                        updateField("contactName", event.target.value)
                      }
                      placeholder="Full name"
                      className={`${inputClass} pl-10`}
                    />
                  </div>
                </label>

                <label className="block">
                  <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                    Legal business name
                  </span>
                  <input
                    required
                    value={form.businessName}
                    onChange={(event) =>
                      updateField("businessName", event.target.value)
                    }
                    placeholder="Adenike Supplies Ltd"
                    className={inputClass}
                  />
                </label>

                <label className="block">
                  <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                    CAC / registration number
                  </span>
                  <input
                    required
                    value={form.registrationNumber}
                    onChange={(event) =>
                      updateField("registrationNumber", event.target.value)
                    }
                    placeholder="RC 1234567"
                    className={inputClass}
                  />
                </label>

                <label className="block">
                  <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                    Vendor type
                  </span>
                  <select
                    value={form.vendorType}
                    onChange={(event) =>
                      updateField("vendorType", event.target.value)
                    }
                    className={selectClass}
                  >
                    <option>Supplier</option>
                    <option>Contractor</option>
                    <option>Consultant</option>
                    <option>Grant Applicant</option>
                    <option>Service Provider</option>
                  </select>
                </label>

                <label className="block">
                  <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                    Sector
                  </span>
                  <input
                    required
                    value={form.sector}
                    onChange={(event) =>
                      updateField("sector", event.target.value)
                    }
                    placeholder="Logistics, agriculture, construction..."
                    className={inputClass}
                  />
                </label>

                <label className="block">
                  <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                    Email address
                  </span>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <input
                      required
                      type="email"
                      value={form.contactEmail}
                      onChange={(event) =>
                        updateField("contactEmail", event.target.value)
                      }
                      placeholder="owner@company.com"
                      className={`${inputClass} pl-10`}
                    />
                  </div>
                </label>

                <label className="block">
                  <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                    Phone number
                  </span>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <input
                      required
                      value={form.contactPhone}
                      onChange={(event) =>
                        updateField("contactPhone", event.target.value)
                      }
                      placeholder="+234 801 234 5678"
                      maxLength={11}
                      className={`${inputClass} pl-10`}
                    />
                  </div>
                </label>

                <label className="block">
                  <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                    Country
                  </span>
                  <input value={form.country} readOnly className={inputClass} />
                </label>

                <label className="block">
                  <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                    State
                  </span>
                  <input
                    value={form.state}
                    onChange={(event) =>
                      updateField("state", event.target.value)
                    }
                    className={inputClass}
                  />
                </label>

                <label className="block md:col-span-2">
                  <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                    Business address
                  </span>
                  <textarea
                    required
                    value={form.address}
                    onChange={(event) =>
                      updateField("address", event.target.value)
                    }
                    placeholder="Street, area, city"
                    rows={3}
                    className={`${inputClass} resize-none`}
                  />
                </label>

                <label className="flex items-start gap-3 rounded-xl border border-white/10 bg-black/30 p-4 md:col-span-2">
                  <input
                    type="checkbox"
                    checked={form.deviceConsent}
                    onChange={(event) =>
                      updateField("deviceConsent", event.target.checked)
                    }
                    className="mt-1 h-4 w-4 accent-white"
                  />
                  <span>
                    <span className="flex items-center gap-2 text-sm font-bold text-white">
                      <Fingerprint className="h-4 w-4 text-sky-200" />
                      Capture device fingerprint
                    </span>
                    <span className="block text-xs text-gray-500 mt-1">
                      Link this vendor to shared-device fraud checks.
                    </span>
                  </span>
                </label>

                {deviceCaptureWarning && (
                  <p className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-100 md:col-span-2">
                    {deviceCaptureWarning}
                  </p>
                )}

                {vendorCreateMutation.isError && (
                  <p className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-100 md:col-span-2">
                    {vendorCreateMutation.error instanceof Error
                      ? vendorCreateMutation.error.message
                      : "Vendor creation failed."}
                  </p>
                )}

                {/* <label className="block md:col-span-2">
                <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Business address
                </span>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3.5 h-4 w-4 text-gray-500" />
                  <textarea
                    required
                    value={form.address}
                    onChange={(event) =>
                      updateField("address", event.target.value)
                    }
                    placeholder="Street, city, state"
                    rows={3}
                    className={`${inputClass} pl-10 resize-none`}
                  />
                </div>
              </label> */}
              </div>
              <div className="flex justify-end p-2">
                <button
                  type="submit"
                  disabled={vendorCreateMutation.isPending}
                  className="button-primary disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Send className="h-4 w-4" />
                  {vendorCreateMutation.isPending
                    ? "Creating vendor..."
                    : "Create vendor"}
                </button>
              </div>
            </form>
          </section>
        )}
        {/* <section className="glass-panel rounded-2xl p-6">
            <div className="border-b border-white/10 pb-5 mb-6 flex items-start gap-4">
              <div className="h-11 w-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <Banknote className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  Bank & Squad Verification
                </h2>
                <p className="text-sm text-gray-400 mt-1">
                  Financial signals catch reused accounts, payment anomalies,
                  and name mismatch risks.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <label className="block">
                <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Bank name
                </span>
                <input
                  required
                  value={form.bankName}
                  onChange={(event) =>
                    updateField("bankName", event.target.value)
                  }
                  placeholder="Access Bank"
                  className={inputClass}
                />
              </label>

              <label className="block">
                <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Account number
                </span>
                <input
                  required
                  inputMode="numeric"
                  value={form.accountNumber}
                  onChange={(event) =>
                    updateField("accountNumber", event.target.value)
                  }
                  placeholder="0123456789"
                  className={inputClass}
                />
              </label>

              <label className="block md:col-span-2">
                <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Account name from lookup
                </span>
                <input
                  required
                  value={form.accountName}
                  onChange={(event) =>
                    updateField("accountName", event.target.value)
                  }
                  placeholder="ADENIKE SUPPLIES LTD"
                  className={inputClass}
                />
              </label>

              <label className="block">
                <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Verification fee (NGN)
                </span>
                <input
                  inputMode="numeric"
                  value={form.verificationFee}
                  onChange={(event) =>
                    updateField("verificationFee", event.target.value)
                  }
                  className={inputClass}
                />
              </label>

              <label className="block">
                <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Expected payout limit (NGN)
                </span>
                <input
                  inputMode="numeric"
                  value={form.payoutLimit}
                  onChange={(event) =>
                    updateField("payoutLimit", event.target.value)
                  }
                  className={inputClass}
                />
              </label>
            </div>
          </section> */}
      </div>

      {/* <aside className="space-y-6">
        <section className="glass-panel rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <FileCheck2 className="h-5 w-5 text-emerald-400" />
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider">
              Documents
            </h2>
          </div>

          <div className="mt-5 space-y-3">
            {documentRequirements.map((requirement) => (
              <div key={requirement} className="flex items-start gap-3">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-xs text-gray-400 leading-relaxed">
                  {requirement}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="glass-panel rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <ShieldCheck className="h-5 w-5 text-emerald-300" />
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider">
              Risk Workflow
            </h2>
          </div>

          <div className="space-y-4">
            <label className="flex items-start gap-3 p-3 rounded-xl bg-black/30 border border-white/5">
              <input
                type="checkbox"
                checked={form.deviceConsent}
                onChange={(event) =>
                  updateField("deviceConsent", event.target.checked)
                }
                className="mt-1 h-4 w-4 accent-emerald-500"
              />
              <span>
                <span className="flex items-center gap-2 text-sm font-bold text-white">
                  <Fingerprint className="h-4 w-4 text-emerald-400" />
                  Capture device fingerprint
                </span>
                <span className="block text-xs text-gray-500 mt-1">
                  Link this application to device velocity and shared-device
                  checks.
                </span>
              </span>
            </label>

            <label className="flex items-start gap-3 p-3 rounded-xl bg-black/30 border border-white/5">
              <input
                type="checkbox"
                checked={form.runDocumentCheck}
                onChange={(event) =>
                  updateField("runDocumentCheck", event.target.checked)
                }
                className="mt-1 h-4 w-4 accent-emerald-500"
              />
              <span>
                <span className="flex items-center gap-2 text-sm font-bold text-white">
                  <FileCheck2 className="h-4 w-4 text-emerald-400" />
                  Run OCR and hash checks
                </span>
                <span className="block text-xs text-gray-500 mt-1">
                  Extract document text and compare image hashes across the
                  trust graph.
                </span>
              </span>
            </label>

            <label className="flex items-start gap-3 p-3 rounded-xl bg-black/30 border border-white/5">
              <input
                type="checkbox"
                checked={form.initiatePayment}
                onChange={(event) =>
                  updateField("initiatePayment", event.target.checked)
                }
                className="mt-1 h-4 w-4 accent-emerald-500"
              />
              <span>
                <span className="flex items-center gap-2 text-sm font-bold text-white">
                  <CreditCard className="h-4 w-4 text-sky-200" />
                  Initiate Squad fee
                </span>
                <span className="block text-xs text-gray-500 mt-1">
                  Send a verification payment request with vendor metadata.
                </span>
              </span>
            </label>
          </div>
        </section>

        <section className="glass-panel rounded-2xl p-6">
          <div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 mb-5">
            <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />
            <p className="text-xs text-amber-100/80 leading-relaxed">
              Reused accounts, duplicate documents, device clustering, and
              payment failures can move this vendor into review immediately.
            </p>
          </div>

          <label className="block">
            <span className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
              <Info className="h-4 w-4" />
              Reviewer notes
            </span>
            <textarea
              value={form.notes}
              onChange={(event) => updateField("notes", event.target.value)}
              placeholder="Optional context for the risk team..."
              rows={4}
              className={`${inputClass} resize-none`}
            />
          </label>

          <div className="mt-6 grid grid-cols-1 gap-3">
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white text-sm font-bold transition-colors"
            >
              <Save className="h-4 w-4 text-gray-400" />
              Save draft
            </button>
          </div>
        </section>
      </aside> */}
    </div>
  );
}
