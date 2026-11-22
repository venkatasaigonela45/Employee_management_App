package com.assessment.employee.dto;

import java.util.Map;

public record ReportSummaryResponse(
        long totalRecords,
        Map<String, Long> byStatus,
        Map<String, Long> byDepartment
) {
}
