export type EmployeeStatus = 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE';
export type EmploymentType = 'FULL_TIME' | 'CONTRACT' | 'INTERN';

export interface Employee {
  id: number;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  department: string;
  status: EmployeeStatus;
  employmentType: EmploymentType;
  hireDate: string;
  contractEndDate?: string | null;
  employmentEndDate?: string | null;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface EmployeeRequest {
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  department: string;
  status: EmployeeStatus;
  employmentType: EmploymentType;
  hireDate: string;
  contractEndDate?: string | null;
  employmentEndDate?: string | null;
  notes?: string | null;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}
