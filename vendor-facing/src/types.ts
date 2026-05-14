export type VendorEntityFromVendorsList = {
  id: string | null;
  businessName: string | null;
  email: string | null;
  phone: string | null;
  status: string | null;
  overallRiskScore: number | null;
  riskLevel: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
};

export type Doc = {
  id: string;
  documentType: string;
  vendorId: string;
  fileUrl: string;
  documentHash: string;
};

export type IndividualVendorDetails = VendorEntityFromVendorsList & {
  documents: Doc[];
  devices: unknown[];
  transactions: unknown[];
  alerts: unknown[];
};
