import { useEffect, useMemo, useRef, useState } from "react";
import type { AppRoute } from "../App";
import AppLayout from "../components/AppLayout";
import Field from "../components/Field";
import IconBadge from "../components/IconBadge";
import {
  StageTransitionSkeleton,
  UploadProcessingSkeleton,
} from "../Skeletons";
import { useQuery, useMutation } from "@tanstack/react-query";
import { LoaderCircle } from "lucide-react";
import type { IndividualVendorDetails } from "../types";
import FingerprintJS from "@fingerprintjs/fingerprintjs";

type VendorOnboardingProps = {
  navigate: (path: AppRoute) => void;
};

type FormState = {
  contactName: string;
  businessName: string;
  contactEmail: string;
  contactPhone: string;
  country: string;
  state: string;
  registrationNumber: string;
  vendorType: string;
  sector: string;
  address: string;
  documentName: string;
  deviceConsent: boolean;
  notes: string;
};

const initialForm: FormState = {
  contactName: "",
  businessName: "",
  contactEmail: "",
  contactPhone: "",
  country: "Nigeria",
  state: "Lagos",
  registrationNumber: "",
  vendorType: "Supplier",
  sector: "",
  address: "",
  documentName: "",
  deviceConsent: true,
  notes: "",
};

const stages = [
  {
    title: "Contact & location",
    body: "Start with the person and business the review team should contact.",
  },
  {
    title: "Business identity",
    body: "Add registration details and attach a business document.",
  },
  {
    title: "Review & submit",
    body: "Check the information before sending it for verification.",
  },
];

export default function VendorOnboarding({ navigate }: VendorOnboardingProps) {
  const [form, setForm] = useState<FormState>(initialForm);
  const [stage, setStage] = useState(1);
  const [pendingStage, setPendingStage] = useState<number | null>(null);
  const [isReadingFile, setIsReadingFile] = useState(false);
  const [file, updateFile] = useState<File | null>();
  const stageTimer = useRef<number | null>(null);
  const fileTimer = useRef<number | null>(null);
  const [vendorID, updateVendorID] = useState("");
  const [deviceCaptureWarning, setDeviceCaptureWarning] = useState("");

  useEffect(() => {
    return () => {
      if (stageTimer.current) {
        window.clearTimeout(stageTimer.current);
      }
      if (fileTimer.current) {
        window.clearTimeout(fileTimer.current);
      }
    };
  }, []);

  const updateField = <K extends keyof FormState>(
    field: K,
    value: FormState[K],
  ) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const completion = useMemo(() => {
    const required = [
      form.contactName,
      form.businessName,
      form.contactEmail,
      form.contactPhone,
      form.registrationNumber,
      form.vendorType,
      form.sector,
      form.documentName,
    ];

    return Math.round(
      (required.filter((value) => value.trim().length > 0).length /
        required.length) *
        100,
    );
  }, [form]);

  const {
    data: vendorDetails,
    isSuccess: gottenVendor,
    isLoading: gettingVendor,
  } = useQuery<{
    data: IndividualVendorDetails;
  }>({
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

  const {
    isPending: creatingVendor,
    isSuccess: created,
    mutateAsync: createVendor,
  } = useMutation({
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
      const vendorId = response.data.id;
      if (form.deviceConsent) {
        try {
          const fp = await FingerprintJS.load();
          const result = await fp.get();
          const captureResponse = await fetch(
            `${import.meta.env.VITE_SERVER_BASE_URL}/devices`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                vendorId,
                deviceHash: result.visitorId,
                browser: navigator.userAgent,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
              }),
              credentials: "include",
            },
          );

          if (!captureResponse.ok) {
            throw new Error(
              `Device capture failed with status ${captureResponse.status}`,
            );
          }
        } catch (error) {
          console.warn("Device fingerprint capture failed", error);
          setDeviceCaptureWarning(
            "Your application was created, but device fingerprint capture failed.",
          );
        }
      }
      moveToStage(2);
    },
  });

  const {
    isPending: isUploading,
    mutateAsync: upload,
    isSuccess: uploaded,
  } = useMutation({
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
  });

  const moveToStage = (nextStage: number) => {
    if (stageTimer.current) {
      window.clearTimeout(stageTimer.current);
    }

    setPendingStage(nextStage);
    window.scrollTo({ top: 0, behavior: "smooth" });
    stageTimer.current = window.setTimeout(() => {
      setStage(nextStage);
      setPendingStage(null);
    }, 420);
  };

  const handleContactSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    createVendor({
      businessName: form.businessName,
      email: form.contactEmail,
      phone: form.contactPhone,
    });
    if (created) {
      moveToStage(2);
    }
  };

  const handleIdentitySubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    moveToStage(3);
  };

  const handleFinalSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData();
    formData.append("vendorId", vendorID);
    formData.append("documentType", "CAC_REGISTRATION");
    if (file) {
      formData.append("file", file);
    }
    await upload(formData);
    if (uploaded) {
      moveToStage(4);
    }
  };

  const handleFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    updateFile(selectedFile);
    setIsReadingFile(true);

    if (fileTimer.current) {
      window.clearTimeout(fileTimer.current);
    }

    fileTimer.current = window.setTimeout(() => {
      updateField("documentName", selectedFile?.name ?? "");
      setIsReadingFile(false);
    }, 360);
  };

  return (
    <AppLayout navigate={navigate}>
      <main className="onboarding-page">
        <div className="content-wrap">
          <div className="form-header">
            <span className="eyebrow">
              <span className="status-dot" />
              Guided application
            </span>
            <h1>Vendor profile submission</h1>
            <p>
              Complete each step using the business information you already
              have. You can review everything before the final submit screen.
            </p>
          </div>

          {pendingStage ? (
            <div className="form-layout">
              <section>
                <StageTransitionSkeleton
                  label={
                    pendingStage === 4
                      ? "Submitting your profile..."
                      : "Preparing the next step..."
                  }
                />
              </section>
              <aside className="sidebar">
                <ProgressCard stage={stage} completion={completion} />
                <HelpCard />
              </aside>
            </div>
          ) : stage === 4 ? (
            <CompletionPanel navigate={navigate} />
          ) : (
            <div className="form-layout">
              <section>
                {stage === 1 && (
                  <ContactStage
                    form={form}
                    onChange={updateField}
                    onSubmit={handleContactSubmit}
                    isProcessing={creatingVendor}
                    deviceCaptureWarning={deviceCaptureWarning}
                  />
                )}
                {stage === 2 && gottenVendor && (
                  <BusinessStage
                    form={form}
                    vendorDetails={vendorDetails?.data}
                    isReadingFile={isReadingFile}
                    onBack={() => moveToStage(1)}
                    onChange={updateField}
                    onFile={handleFile}
                    onSubmit={handleIdentitySubmit}
                  />
                )}
                {stage === 2 && gettingVendor && <StageTransitionSkeleton />}
                {stage === 3 && (
                  <ReviewStage
                    form={form}
                    isSending={isUploading}
                    onBack={() => moveToStage(2)}
                    onSubmit={handleFinalSubmit}
                  />
                )}
              </section>

              <aside className="sidebar">
                <ProgressCard stage={stage} completion={completion} />
                <HelpCard />
              </aside>
            </div>
          )}
        </div>
      </main>
    </AppLayout>
  );
}

type StageProps = {
  form: FormState;
  onChange: <K extends keyof FormState>(field: K, value: FormState[K]) => void;
};

function ContactStage({
  form,
  onChange,
  onSubmit,
  isProcessing,
  deviceCaptureWarning,
}: StageProps & {
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  isProcessing: boolean;
  deviceCaptureWarning: string;
}) {
  return (
    <form className="form-card glass-panel" onSubmit={onSubmit}>
      <FormCardHeader
        icon="1"
        title="Step 1: Contact & location"
        body="Tell us who should receive review updates and which business is applying."
      />
      <div className="form-grid">
        <Field className="field-full" label="Primary contact">
          <input
            className="input"
            required
            value={form.contactName}
            onChange={(event) => onChange("contactName", event.target.value)}
            placeholder="Full name"
          />
        </Field>
        <Field label="Legal business name">
          <input
            className="input"
            required
            value={form.businessName}
            onChange={(event) => onChange("businessName", event.target.value)}
            placeholder="Adenike Supplies Ltd"
          />
        </Field>
        <Field label="Email address">
          <input
            className="input"
            required
            type="email"
            value={form.contactEmail}
            onChange={(event) => onChange("contactEmail", event.target.value)}
            placeholder="owner@company.com"
          />
        </Field>
        <Field label="Phone number">
          <input
            className="input"
            required
            inputMode="tel"
            maxLength={11}
            value={form.contactPhone}
            onChange={(event) => onChange("contactPhone", event.target.value)}
            placeholder="+234 801 234 5678"
          />
        </Field>
        <Field label="Country">
          <input
            className="input"
            readOnly
            value={form.country}
            onChange={(event) => onChange("country", event.target.value)}
          />
        </Field>
        <Field label="State">
          <input
            className="input"
            value={form.state}
            onChange={(event) => onChange("state", event.target.value)}
            placeholder="Lagos"
          />
        </Field>
        <label className="field field-full">
          <span className="field-label">Device intelligence consent</span>
          <span className="flex items-start gap-3 rounded-xl border border-white/10 bg-black/20 p-4">
            <input
              type="checkbox"
              checked={form.deviceConsent}
              onChange={(event) =>
                onChange("deviceConsent", event.target.checked)
              }
              className="mt-1 h-4 w-4 accent-emerald-500"
            />
            <span className="text-sm text-slate-300">
              Allow VeriSphere to capture a browser fingerprint for shared-device
              fraud checks.
            </span>
          </span>
        </label>
        {deviceCaptureWarning && (
          <p className="field field-full rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-100">
            {deviceCaptureWarning}
          </p>
        )}
      </div>
      <div className="form-actions">
        <button className="button button-primary flex gap-x-4" type="submit">
          {isProcessing && <LoaderCircle />}
          <span>{isProcessing ? "Creating..." : "Continue"}</span>
        </button>
      </div>
    </form>
  );
}

function BusinessStage({
  form,
  onBack,
  onChange,
  onFile,
  isReadingFile,
  vendorDetails,
  onSubmit,
}: StageProps & {
  onBack: () => void;
  onFile: (event: React.ChangeEvent<HTMLInputElement>) => void;
  isReadingFile: boolean;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  vendorDetails: IndividualVendorDetails;
  ready?: boolean;
}) {
  return (
    <form className="form-card glass-panel" onSubmit={onSubmit}>
      <FormCardHeader
        icon="2"
        title="Step 2: Business identity"
        body="Add registration details and upload the document your organization uses for verification."
      />
      <p>Your Vendor Details </p>
      <p>Business Name: {vendorDetails.businessName}</p>
      <p>Vendor ID: {vendorDetails.id}</p>
      <div className="form-grid">
        <Field label="CAC / registration number">
          <input
            className="input"
            required
            value={form.registrationNumber}
            onChange={(event) =>
              onChange("registrationNumber", event.target.value)
            }
            placeholder="RC 1234567"
          />
        </Field>
        <Field label="Vendor type">
          <select
            className="select"
            value={form.vendorType}
            onChange={(event) => onChange("vendorType", event.target.value)}
          >
            <option>Supplier</option>
            <option>Contractor</option>
            <option>Consultant</option>
            <option>Grant Applicant</option>
            <option>Service Provider</option>
          </select>
        </Field>
        <Field label="Sector">
          <input
            className="input"
            required
            value={form.sector}
            onChange={(event) => onChange("sector", event.target.value)}
            placeholder="Logistics, agriculture, construction..."
          />
        </Field>
        <Field label="Business address">
          <input
            className="input"
            value={form.address}
            onChange={(event) => onChange("address", event.target.value)}
            placeholder="Street, city, state"
          />
        </Field>
        <label className="field field-full">
          <span>Business document</span>
          <span className="upload-box">
            <IconBadge>UP</IconBadge>
            <strong>
              {form.documentName || "Upload CAC or registration document"}
            </strong>
            <span>PDF, JPG, or PNG files</span>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={onFile}
            />
          </span>
          {isReadingFile && <UploadProcessingSkeleton />}
        </label>
        <Field className="field-full" label="Additional notes">
          <textarea
            className="textarea"
            value={form.notes}
            onChange={(event) => onChange("notes", event.target.value)}
            placeholder="Anything the review team should know?"
          />
        </Field>
      </div>
      <div className="form-actions">
        <button
          className="button button-secondary"
          type="button"
          onClick={onBack}
        >
          Back
        </button>
        <button className="button button-primary" type="submit">
          Review
        </button>
      </div>
    </form>
  );
}

function ReviewStage({
  form,
  onBack,
  onSubmit,
  isSending,
}: {
  form: FormState;
  isSending: boolean;
  onBack: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}) {
  const reviewItems = [
    ["Contact", form.contactName],
    ["Business", form.businessName],
    ["Email", form.contactEmail],
    ["Phone", form.contactPhone],
    ["Location", `${form.state}, ${form.country}`],
    ["Registration", form.registrationNumber],
    ["Vendor type", form.vendorType],
    ["Sector", form.sector],
    ["Document", form.documentName || "No document selected"],
  ];

  return (
    <form className="form-card glass-panel" onSubmit={onSubmit}>
      <FormCardHeader
        icon="3"
        title="Step 3: Review & submit"
        body="Make sure these details look right before sending them to the review team."
      />
      <div className="summary-list">
        {reviewItems.map(([label, value]) => (
          <div className="document-row" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
      <div className="form-actions">
        <button
          className="button button-secondary"
          type="button"
          onClick={onBack}
        >
          Back
        </button>
        <button className="button button-primary flex gap-x-4" type="submit">
          {isSending && <LoaderCircle />}
          <span>{isSending ? "Completing..." : "Complete"}</span>
        </button>
      </div>
    </form>
  );
}

function FormCardHeader({
  icon,
  title,
  body,
}: {
  icon: string;
  title: string;
  body: string;
}) {
  return (
    <div className="form-card-header">
      <IconBadge>{icon}</IconBadge>
      <div>
        <h2>{title}</h2>
        <p>{body}</p>
      </div>
    </div>
  );
}

function ProgressCard({
  stage,
  completion,
}: {
  stage: number;
  completion: number;
}) {
  return (
    <div className="summary-card glass-panel">
      <h3>Application progress</h3>
      <p>{completion}% of the required information is filled.</p>
      <div className="summary-list">
        {stages.map((item, index) => {
          const stageNumber = index + 1;
          return (
            <div
              className={`stage-pill ${
                stage === stageNumber ? "stage-pill-active" : ""
              }`}
              key={item.title}
            >
              <span className="stage-number">{stageNumber}</span>
              <span>
                <strong>{item.title}</strong>
                <p>{item.body}</p>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function HelpCard() {
  return (
    <div className="summary-card glass-panel">
      <h3>Before you start</h3>
      <p>Keep these nearby so the process is quick.</p>
      <div className="summary-list">
        <div>
          <span>Contact email</span>
          <strong>Required</strong>
        </div>
        <div>
          <span>Registration number</span>
          <strong>Required</strong>
        </div>
        <div>
          <span>Business document</span>
          <strong>Required</strong>
        </div>
      </div>
    </div>
  );
}

function CompletionPanel({ navigate }: { navigate: (path: AppRoute) => void }) {
  return (
    <section className="success-panel glass-panel">
      <div>
        <span className="success-mark">OK</span>
        <h2>Your profile is ready for review.</h2>
        <p>
          Your Vendor Profile has been created at VeriSphere and you will be
          notified as soon as it's ready for your use
        </p>
        <div className="hero-actions w-full justify-center">
          <button
            className="button button-primary"
            type="button"
            onClick={() => navigate("/")}
          >
            Back Home
          </button>
          <button
            className="button button-secondary"
            type="button"
            onClick={() => window.location.reload()}
          >
            Start Another Profile
          </button>
        </div>
      </div>
    </section>
  );
}
