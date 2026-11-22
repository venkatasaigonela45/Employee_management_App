package com.assessment.employee.service;

import com.assessment.employee.dto.EmployeeRequest;
import com.assessment.employee.dto.EmployeeResponse;
import com.assessment.employee.entity.Employee;
import com.assessment.employee.entity.EmployeeStatus;
import com.assessment.employee.entity.EmploymentType;
import com.assessment.employee.entity.User;
import com.assessment.employee.exception.ApiException;
import com.assessment.employee.repository.EmployeeRepository;
import com.assessment.employee.repository.UserRepository;
import com.assessment.employee.security.SecurityUtils;
import java.time.LocalDate;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public Page<EmployeeResponse> list(String search, Pageable pageable) {
        // Self-service employees only see their own row; admin + viewer see everyone
        if (SecurityUtils.isSelfServiceEmployee()) {
            return listOwnProfile(search, pageable);
        }
        return employeeRepository.searchActive(search, pageable).map(EmployeeResponse::from);
    }

    @Transactional(readOnly = true)
    public EmployeeResponse getById(Long id) {
        Employee employee = findActive(id);
        assertCanView(employee.getId());
        return EmployeeResponse.from(employee);
    }

    @Transactional
    public EmployeeResponse create(EmployeeRequest request) {
        requireAdmin();
        validateUniqueness(request.employeeCode(), request.email(), null);
        validateEmployment(request);

        Employee employee = Employee.builder()
                .employeeCode(request.employeeCode().trim())
                .firstName(request.firstName().trim())
                .lastName(request.lastName().trim())
                .email(request.email().trim().toLowerCase())
                .phone(blankToNull(request.phone()))
                .department(request.department().trim())
                .status(request.status())
                .employmentType(request.employmentType())
                .hireDate(request.hireDate())
                .contractEndDate(resolveContractEndDate(request))
                .employmentEndDate(resolveEmploymentEndDate(request))
                .notes(blankToNull(request.notes()))
                .deleted(false)
                .build();

        return EmployeeResponse.from(employeeRepository.save(employee));
    }

    @Transactional
    public EmployeeResponse update(Long id, EmployeeRequest request) {
        requireAdmin();
        Employee employee = findActive(id);
        validateUniqueness(request.employeeCode(), request.email(), id);
        validateEmployment(request);

        employee.setEmployeeCode(request.employeeCode().trim());
        employee.setFirstName(request.firstName().trim());
        employee.setLastName(request.lastName().trim());
        employee.setEmail(request.email().trim().toLowerCase());
        employee.setPhone(blankToNull(request.phone()));
        employee.setDepartment(request.department().trim());
        employee.setStatus(request.status());
        employee.setEmploymentType(request.employmentType());
        employee.setHireDate(request.hireDate());
        employee.setContractEndDate(resolveContractEndDate(request));
        employee.setEmploymentEndDate(resolveEmploymentEndDate(request));
        employee.setNotes(blankToNull(request.notes()));

        return EmployeeResponse.from(employeeRepository.save(employee));
    }

    @Transactional
    public void softDelete(Long id) {
        requireAdmin();
        Employee employee = findActive(id);
        employee.setDeleted(true);
        employeeRepository.save(employee);
    }

    private Page<EmployeeResponse> listOwnProfile(String search, Pageable pageable) {
        Employee mine = findActive(requireLinkedEmployeeId());
        if (search != null && !search.isBlank()) {
            String q = search.trim().toLowerCase();
            boolean matches =
                    contains(mine.getFirstName(), q)
                            || contains(mine.getLastName(), q)
                            || contains(mine.getEmail(), q)
                            || contains(mine.getEmployeeCode(), q)
                            || contains(mine.getDepartment(), q);
            if (!matches) {
                return Page.empty(pageable);
            }
        }
        return new PageImpl<>(List.of(EmployeeResponse.from(mine)), pageable, 1);
    }

    private void assertCanView(Long employeeId) {
        if (SecurityUtils.isAdmin() || SecurityUtils.isViewer()) {
            return;
        }
        if (!SecurityUtils.isSelfServiceEmployee()) {
            throw new ApiException("Forbidden", HttpStatus.FORBIDDEN);
        }
        Long linked = requireLinkedEmployeeId();
        if (!linked.equals(employeeId)) {
            throw new ApiException("You can only view your own employee profile", HttpStatus.FORBIDDEN);
        }
    }

    private Long requireLinkedEmployeeId() {
        User user = userRepository
                .findByUsername(SecurityUtils.currentUsername())
                .orElseThrow(() -> new ApiException("User not found", HttpStatus.UNAUTHORIZED));
        if (user.getEmployeeId() == null) {
            throw new ApiException("No employee profile is linked to this account", HttpStatus.FORBIDDEN);
        }
        return user.getEmployeeId();
    }

    private void requireAdmin() {
        if (!SecurityUtils.isAdmin()) {
            throw new ApiException("Only administrators can modify employees", HttpStatus.FORBIDDEN);
        }
    }

    private boolean contains(String value, String query) {
        return value != null && value.toLowerCase().contains(query);
    }

    private Employee findActive(Long id) {
        return employeeRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new ApiException("Employee not found", HttpStatus.NOT_FOUND));
    }

    private void validateEmployment(EmployeeRequest request) {
        boolean termBased = request.employmentType() == EmploymentType.CONTRACT
                || request.employmentType() == EmploymentType.INTERN;

        if (request.employmentType() == EmploymentType.CONTRACT
                || (termBased && request.status() == EmployeeStatus.INACTIVE)) {
            if (request.contractEndDate() == null) {
                String label = request.employmentType() == EmploymentType.INTERN
                        ? "Internship end date"
                        : "Contract end date";
                throw new ApiException(label + " is required", HttpStatus.BAD_REQUEST);
            }
            if (request.contractEndDate().isBefore(request.hireDate())) {
                throw new ApiException("Contract/internship end date must be on or after hire date", HttpStatus.BAD_REQUEST);
            }
        }

        if (request.status() == EmployeeStatus.INACTIVE) {
            if (request.notes() == null || request.notes().isBlank()) {
                throw new ApiException("Reason/notes are required for inactive employees", HttpStatus.BAD_REQUEST);
            }

            if (request.employmentType() == EmploymentType.FULL_TIME) {
                if (request.employmentEndDate() == null) {
                    throw new ApiException("Employment end date is required for inactive full-time employees", HttpStatus.BAD_REQUEST);
                }
                if (request.employmentEndDate().isBefore(request.hireDate())) {
                    throw new ApiException("Employment end date must be on or after hire date", HttpStatus.BAD_REQUEST);
                }
            }
        }
    }

    private LocalDate resolveContractEndDate(EmployeeRequest request) {
        if (request.employmentType() == EmploymentType.FULL_TIME) {
            return null;
        }
        return request.contractEndDate();
    }

    private LocalDate resolveEmploymentEndDate(EmployeeRequest request) {
        if (request.status() != EmployeeStatus.INACTIVE) {
            return null;
        }
        if (request.employmentType() == EmploymentType.FULL_TIME) {
            return request.employmentEndDate();
        }
        return request.contractEndDate() != null ? request.contractEndDate() : request.employmentEndDate();
    }

    private void validateUniqueness(String employeeCode, String email, Long excludeId) {
        boolean codeExists = excludeId == null
                ? employeeRepository.existsByEmployeeCodeAndDeletedFalse(employeeCode)
                : employeeRepository.existsByEmployeeCodeAndIdNotAndDeletedFalse(employeeCode, excludeId);
        if (codeExists) {
            throw new ApiException("Employee code already exists", HttpStatus.CONFLICT);
        }

        boolean emailExists = excludeId == null
                ? employeeRepository.existsByEmailAndDeletedFalse(email)
                : employeeRepository.existsByEmailAndIdNotAndDeletedFalse(email, excludeId);
        if (emailExists) {
            throw new ApiException("Email already exists", HttpStatus.CONFLICT);
        }
    }

    private String blankToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
