export interface VendorFromQuery {
  businessName: string;
  registrationNumber?: string | null;
  vendorType?: string | null;
  sector?: string | null;
  contactName?: string | null;
  email: string;
  riskLevel: string;
  phone: string;
  country?: string | null;
  state?: string | null;
  address?: string | null;
}

export type VendorEntityFromVendorsList = {
  id: string | null;
  businessName: string | null;
  registrationNumber?: string | null;
  vendorType?: string | null;
  sector?: string | null;
  contactName?: string | null;
  email: string | null;
  phone: string | null;
  country?: string | null;
  state?: string | null;
  address?: string | null;
  status: string | null;
  overallRiskScore: number | null;
  riskLevel: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
};

export interface VirtualAccountRequest {
  vendorId?: string;
  customer_identifier: string;
  first_name: string;
  last_name: string;
  mobile_num: string;
  email: string;
  bvn: string;
  dob: string;
  address: string;
  gender: string;
  beneficiary_account: string;
}

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
  transfers: unknown[];
  alerts: unknown[];
};

export type GraphNode = {
  id: string;
  type: string;
  label: string;
  data: Record<string, unknown>;
};

export type GraphEdge = {
  id: string;
  source: string;
  target: string;
  label: string;
  type: string;
};

export type GraphResponse = {
  nodes: GraphNode[];
  edges: GraphEdge[];
};
