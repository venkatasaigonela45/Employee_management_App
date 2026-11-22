package com.assessment.employee.controller;

import com.assessment.employee.dto.EmployeeResponse;
import com.assessment.employee.dto.ReportFilter;
import com.assessment.employee.dto.ReportSummaryResponse;
import com.assessment.employee.entity.EmployeeStatus;
import com.assessment.employee.service.ReportService;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/employees")
    public Page<EmployeeResponse> employees(
            @RequestParam(required = false) EmployeeStatus status,
            @RequestParam(required = false) String department,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @PageableDefault(size = 10, sort = "hireDate", direction = Sort.Direction.DESC) Pageable pageable) {
        return reportService.getReport(new ReportFilter(status, department, fromDate, toDate), pageable);
    }

    @GetMapping("/employees/summary")
    public ReportSummaryResponse summary(
            @RequestParam(required = false) EmployeeStatus status,
            @RequestParam(required = false) String department,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {
        return reportService.getSummary(new ReportFilter(status, department, fromDate, toDate));
    }

    @GetMapping("/departments")
    public List<String> departments() {
        return reportService.getDepartments();
    }

    @GetMapping("/employees/export/excel")
    public ResponseEntity<byte[]> exportExcel(
            @RequestParam(required = false) EmployeeStatus status,
            @RequestParam(required = false) String department,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {
        byte[] bytes = reportService.exportExcel(new ReportFilter(status, department, fromDate, toDate));
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + exportFilename("xlsx"))
                .contentType(MediaType.parseMediaType(
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(bytes);
    }

    @GetMapping("/employees/export/pdf")
    public ResponseEntity<byte[]> exportPdf(
            @RequestParam(required = false) EmployeeStatus status,
            @RequestParam(required = false) String department,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {
        byte[] bytes = reportService.exportPdf(new ReportFilter(status, department, fromDate, toDate));
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + exportFilename("pdf"))
                .contentType(MediaType.APPLICATION_PDF)
                .body(bytes);
    }

    private String exportFilename(String extension) {
        String stamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        return "employee-report-" + stamp + "." + extension;
    }
}
