export interface ReportSummary {
  totalRecords: number;
  byStatus: Record<string, number>;
  byDepartment: Record<string, number>;
}

export interface ReportQuery {
  status?: string;
  department?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  size?: number;
  sort?: string;
  direction?: 'asc' | 'desc';
}
