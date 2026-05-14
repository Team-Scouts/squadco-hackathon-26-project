import { useState } from "react";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  FileUp,
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

const inputClass =
  "w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all";

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
          `${import.meta.env.VITE_SERVER_BASE_URL}/vendors/${vendorID} `,
          {
            credentials: "include",
          },
        );
        const response = await request.json();
        return response;
      }
    },
  });

  const vendorCreateMutation = useMutation({
    mutationFn: async (body: {
      businessName: string;
      email: string;
      phone: string;
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
      updateVendorID(response.data.id);
      return response;
    },
    onSuccess: async (response) => {
      updateFormStage(2);

      const vendorId = response.data.id || vendorID;

      const fp = await FingerprintJS.load();
      const result = await fp.get();

      await fetch(`${import.meta.env.VITE_SERVER_BASE_URL}/devices`, {
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
      });
    },
  });

  const uploadDocumentsMutation = useMutation({
    mutationFn: async (body: FormData) => {
      const postRequest = await fetch(
        `${import.meta.env.VITE_SERVER_BASE_URL}/documents/upload`,
        {
          method: "POST",
          body: body,
          credentials: "include",
        },
      );
      const postResponse = await postRequest.json();
      return postResponse;
    },
    onSuccess: () => {
      navigate(`/dashboard/vendors/${vendorID}`);
    },
  });

  const handleDocumentSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("vendorId", vendorID);
    if (file) {
      formData.append("file", file);
    }
    formData.append("documentType", "CAC");
    await uploadDocumentsMutation.mutateAsync(formData);
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
      email: form.contactEmail,
      phone: form.contactPhone,
    });
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Link
            to="/dashboard/vendors"
            className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to vendors
          </Link>
          <h1 className="text-3xl font-black text-white tracking-tight">
            Create New Vendor
          </h1>
          <p className="text-sm text-gray-400 mt-1 max-w-2xl">
            Capture the identity, document, bank, and Squad payment signals
            needed to start a VeriSphere risk review.
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
        <div className="glass-panel rounded-2xl p-4 border-emerald-500/30 bg-emerald-500/5 flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
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
            <section className="glass-panel rounded-2xl p-6">
              <p>Your Vendor ID: {data.data.id}</p>
              <p>Your Vendor Details: {data.data.businessName}</p>
              <div className="border-b border-white/10 pb-5 mb-6 flex items-start gap-4">
                <div className="h-11 w-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    Business Identity
                  </h2>
                  <p className="text-sm text-gray-400 mt-1">
                    Core registration details used for document extraction and
                    identity mismatch checks.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <label className="block">
                  <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                    Legal business name
                  </span>
                  <input
                    required
                    defaultValue={data.data.businessName}
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

                <label className="flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-black/30 p-5 text-center hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-colors">
                  <FileUp className="h-8 w-8 text-emerald-400 mb-3" />
                  <span className="text-sm font-bold text-white">
                    Upload vendor documents
                  </span>
                  <span className="text-xs text-gray-500 mt-1">
                    PDF, JPG, or PNG files
                  </span>
                  <input
                    type="file"
                    className="sr-only"
                    name="file"
                    onChange={handleFile}
                  />
                </label>
              </div>
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-emerald-500 text-gray-950 rounded-xl text-sm font-black shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:bg-emerald-400 transition-all hover:-translate-y-0.5"
              >
                <Send className="h-4 w-4" />
                Upload Docs
              </button>
            </section>
          </form>
        )}

        {formStage === 2 && uploadDocumentsMutation.isPending && (
          <UploadingDocumentSkeleton />
        )}

        {formStage === 1 && (
          <section className="glass-panel rounded-2xl p-6">
            <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6">
              <div className="border-b border-white/10 pb-5 mb-6 items-start gap-4">
                <div className="h-11 w-11 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                  <User className="h-5 w-5 text-cyan-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    Step 1: Contact & Location
                  </h2>
                  <p className="text-sm text-gray-400 mt-1">
                    Add basic contact information for the entity being uploaded
                    to the VeriSphere Database.
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
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-emerald-500 text-gray-950 rounded-xl text-sm font-black shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:bg-emerald-400 transition-all hover:-translate-y-0.5"
                >
                  <Send className="h-4 w-4" />
                  Create vendor
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
            <ShieldCheck className="h-5 w-5 text-cyan-400" />
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
                  <CreditCard className="h-4 w-4 text-cyan-400" />
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
