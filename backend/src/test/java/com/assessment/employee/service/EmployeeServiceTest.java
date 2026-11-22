package com.assessment.employee.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.assessment.employee.dto.EmployeeRequest;
import com.assessment.employee.dto.EmployeeResponse;
import com.assessment.employee.entity.Employee;
import com.assessment.employee.entity.EmployeeStatus;
import com.assessment.employee.entity.EmploymentType;
import com.assessment.employee.exception.ApiException;
import com.assessment.employee.repository.EmployeeRepository;
import com.assessment.employee.repository.UserRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

@ExtendWith(MockitoExtension.class)
class EmployeeServiceTest {

    @Mock
    private EmployeeRepository employeeRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private EmployeeService employeeService;

    @BeforeEach
    void setAdminSecurityContext() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        "admin",
                        "n/a",
                        List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))));
    }

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void create_persistsNewEmployee() {
        EmployeeRequest request = new EmployeeRequest(
                "EMP100",
                "Ada",
                "Lovelace",
                "ada@example.com",
                "555-0100",
                "Engineering",
                EmployeeStatus.ACTIVE,
                EmploymentType.FULL_TIME,
                LocalDate.of(2024, 1, 10),
                null,
                null,
                "Founding engineer");

        when(employeeRepository.existsByEmployeeCodeAndDeletedFalse("EMP100")).thenReturn(false);
        when(employeeRepository.existsByEmailAndDeletedFalse("ada@example.com")).thenReturn(false);
        when(employeeRepository.save(any(Employee.class))).thenAnswer(invocation -> {
            Employee saved = invocation.getArgument(0);
            saved.setId(42L);
            return saved;
        });

        EmployeeResponse response = employeeService.create(request);

        assertEquals(42L, response.id());
        assertEquals(EmploymentType.FULL_TIME, response.employmentType());
        assertNull(response.employmentEndDate());

        ArgumentCaptor<Employee> captor = ArgumentCaptor.forClass(Employee.class);
        verify(employeeRepository).save(captor.capture());
        assertEquals(false, captor.getValue().isDeleted());
    }

    @Test
    void create_WhenInactiveMissingReason_ThrowsBadRequest() {
        EmployeeRequest request = new EmployeeRequest(
                "EMP102",
                "Sofia",
                "Nguyen",
                "sofia2@example.com",
                null,
                "Sales",
                EmployeeStatus.INACTIVE,
                EmploymentType.FULL_TIME,
                LocalDate.of(2019, 5, 4),
                null,
                LocalDate.of(2024, 1, 1),
                null);

        ApiException ex = assertThrows(ApiException.class, () -> employeeService.create(request));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        verify(employeeRepository, never()).save(any());
    }

    @Test
    void create_WhenInactiveContract_UsesContractEndAsEmploymentEnd() {
        EmployeeRequest request = new EmployeeRequest(
                "EMP103",
                "Sofia",
                "Nguyen",
                "sofia3@example.com",
                null,
                "Sales",
                EmployeeStatus.INACTIVE,
                EmploymentType.CONTRACT,
                LocalDate.of(2024, 1, 10),
                LocalDate.of(2024, 6, 30),
                null,
                "Contract completed - did not renew");

        when(employeeRepository.existsByEmployeeCodeAndDeletedFalse("EMP103")).thenReturn(false);
        when(employeeRepository.existsByEmailAndDeletedFalse("sofia3@example.com")).thenReturn(false);
        when(employeeRepository.save(any(Employee.class))).thenAnswer(invocation -> {
            Employee saved = invocation.getArgument(0);
            saved.setId(103L);
            return saved;
        });

        EmployeeResponse response = employeeService.create(request);

        assertEquals(LocalDate.of(2024, 6, 30), response.contractEndDate());
        assertEquals(LocalDate.of(2024, 6, 30), response.employmentEndDate());
    }

    @Test
    void create_WhenContractMissingEndDate_ThrowsBadRequest() {
        EmployeeRequest request = new EmployeeRequest(
                "EMP101",
                "Grace",
                "Hopper",
                "grace@example.com",
                null,
                "Engineering",
                EmployeeStatus.ACTIVE,
                EmploymentType.CONTRACT,
                LocalDate.of(2024, 1, 10),
                null,
                null,
                null);

        ApiException ex = assertThrows(ApiException.class, () -> employeeService.create(request));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        verify(employeeRepository, never()).save(any());
    }

    @Test
    void softDelete_MarksEmployeeDeleted() {
        Employee existing = Employee.builder()
                .id(7L)
                .employeeCode("EMP007")
                .firstName("Olivia")
                .lastName("Singh")
                .email("olivia@example.com")
                .department("Marketing")
                .status(EmployeeStatus.ACTIVE)
                .employmentType(EmploymentType.FULL_TIME)
                .hireDate(LocalDate.of(2022, 9, 30))
                .deleted(false)
                .build();

        when(employeeRepository.findByIdAndDeletedFalse(7L)).thenReturn(Optional.of(existing));
        when(employeeRepository.save(any(Employee.class))).thenAnswer(invocation -> invocation.getArgument(0));

        employeeService.softDelete(7L);

        ArgumentCaptor<Employee> captor = ArgumentCaptor.forClass(Employee.class);
        verify(employeeRepository).save(captor.capture());
        assertEquals(true, captor.getValue().isDeleted());
    }
}
