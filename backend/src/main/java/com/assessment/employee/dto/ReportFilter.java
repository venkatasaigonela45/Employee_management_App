package com.assessment.employee.dto;

import com.assessment.employee.entity.EmployeeStatus;
import java.time.LocalDate;

public record ReportFilter(
        EmployeeStatus status,
        String department,
        LocalDate fromDate,
        LocalDate toDate
) {
}
