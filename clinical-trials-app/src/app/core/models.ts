
export type TrialStatus =
  | 'Recruiting'
  | 'Completed'
  | 'Terminated'
  | 'Not yet recruiting'
  | string;

export interface TrialSummary {
  nctId: string;
  title: string;
  phase: string;
  status: string;
  condition: string;
}

export interface TrialDetail {
  nctId: string;
  title: string;
  status: string;
  phase: string;
  condition: string;
  description: string;
  eligibility: string;
  locations: any[];
  sponsor: string;
}

export interface Filters {
  q?: string;
  status?: string;
  phase?: string;
  pageSize?: number;
}
