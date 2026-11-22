package com.assessment.employee.dto;

import com.assessment.employee.entity.EmployeeStatus;
import com.assessment.employee.entity.EmploymentType;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public record EmployeeRequest(
        @NotBlank @Size(max = 20) String employeeCode,
        @NotBlank @Size(max = 50) String firstName,
        @NotBlank @Size(max = 50) String lastName,
        @NotBlank @Email @Size(max = 100) String email,
        @Size(max = 20) @Pattern(regexp = "^$|^[+0-9\\-\\s()]{7,20}$", message = "Invalid phone number") String phone,
        @NotBlank @Size(max = 50) String department,
        @NotNull EmployeeStatus status,
        @NotNull EmploymentType employmentType,
        @NotNull LocalDate hireDate,
        LocalDate contractEndDate,
        LocalDate employmentEndDate,
        @Size(max = 500) String notes
) {
}
