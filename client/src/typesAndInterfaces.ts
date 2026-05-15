export interface VendorFromQuery {
  businessName: string;
  email: string;
  riskLevel: string;
  phone: string;
}

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

export interface VirtualAccountRequest {
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
