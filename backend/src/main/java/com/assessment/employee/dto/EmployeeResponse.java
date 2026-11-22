package com.assessment.employee.dto;

import com.assessment.employee.entity.Employee;
import com.assessment.employee.entity.EmployeeStatus;
import com.assessment.employee.entity.EmploymentType;
import java.time.Instant;
import java.time.LocalDate;

public record EmployeeResponse(
        Long id,
        String employeeCode,
        String firstName,
        String lastName,
        String email,
        String phone,
        String department,
        EmployeeStatus status,
        EmploymentType employmentType,
        LocalDate hireDate,
        LocalDate contractEndDate,
        LocalDate employmentEndDate,
        String notes,
        Instant createdAt,
        Instant updatedAt
) {
    public static EmployeeResponse from(Employee employee) {
        return new EmployeeResponse(
                employee.getId(),
                employee.getEmployeeCode(),
                employee.getFirstName(),
                employee.getLastName(),
                employee.getEmail(),
                employee.getPhone(),
                employee.getDepartment(),
                employee.getStatus(),
                employee.getEmploymentType() == null ? EmploymentType.FULL_TIME : employee.getEmploymentType(),
                employee.getHireDate(),
                employee.getContractEndDate(),
                employee.getEmploymentEndDate(),
                employee.getNotes(),
                employee.getCreatedAt(),
                employee.getUpdatedAt());
    }
}
