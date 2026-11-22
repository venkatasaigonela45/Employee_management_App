package com.assessment.employee.config;

import com.assessment.employee.entity.Employee;
import com.assessment.employee.entity.EmployeeStatus;
import com.assessment.employee.entity.EmploymentType;
import com.assessment.employee.entity.User;
import com.assessment.employee.repository.EmployeeRepository;
import com.assessment.employee.repository.UserRepository;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final EmployeeRepository employeeRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (!userRepository.existsByUsername("admin")) {
            userRepository.save(User.builder()
                    .username("admin")
                    .password(passwordEncoder.encode("admin123"))
                    .role("ROLE_ADMIN")
                    .active(true)
                    .build());
            log.info("Seeded default user: admin / admin123");
        }

        // Read-only viewer: sees all employees + reports, cannot CUD
        userRepository.findByUsername("user").ifPresentOrElse(existing -> {
            existing.setActive(true);
            existing.setRole("ROLE_USER");
            existing.setEmployeeId(null);
            existing.setPassword(passwordEncoder.encode("user123"));
            userRepository.save(existing);
            log.info("Ensured viewer account: user / user123 (read-only company-wide)");
        }, () -> {
            userRepository.save(User.builder()
                    .username("user")
                    .password(passwordEncoder.encode("user123"))
                    .role("ROLE_USER")
                    .active(true)
                    .build());
            log.info("Seeded viewer account: user / user123 (read-only company-wide)");
        });

        // Self-service login for employee Ava Patel (EMP001) — own profile only
        userRepository.findByUsername("ava.patel").ifPresentOrElse(existing -> {
            existing.setActive(true);
            existing.setRole("ROLE_EMPLOYEE");
            userRepository.save(existing);
            log.info("Ensured self-service account: ava.patel / ava123");
        }, () -> {
            userRepository.save(User.builder()
                    .username("ava.patel")
                    .password(passwordEncoder.encode("ava123"))
                    .role("ROLE_EMPLOYEE")
                    .active(true)
                    .build());
            log.info("Seeded self-service user: ava.patel / ava123 (linked to EMP001)");
        });

        // Backfill employment type for existing rows after schema update
        employeeRepository.findAll().stream()
                .filter(emp -> emp.getEmploymentType() == null)
                .forEach(emp -> {
                    emp.setEmploymentType(EmploymentType.FULL_TIME);
                    employeeRepository.save(emp);
                });

        if (employeeRepository.count() == 0) {
            LocalDate today = LocalDate.now();
            YearMonth current = YearMonth.from(today);
            List<Employee> seed = List.of(
                    employee("EMP001", "Ava", "Patel", "ava.patel@example.com", "Engineering", EmployeeStatus.ACTIVE, EmploymentType.FULL_TIME, current.atDay(1), null, null, null),
                    employee("EMP002", "Noah", "Kim", "noah.kim@example.com", "Engineering", EmployeeStatus.ACTIVE, EmploymentType.CONTRACT, current.atDay(Math.min(5, current.lengthOfMonth())), today.plusMonths(6), null, "6-month contract"),
                    employee("EMP003", "Mia", "Garcia", "mia.garcia@example.com", "HR", EmployeeStatus.ON_LEAVE, EmploymentType.FULL_TIME, current.atDay(Math.min(10, current.lengthOfMonth())), null, null, "On parental leave"),
                    employee("EMP004", "Liam", "Chen", "liam.chen@example.com", "Finance", EmployeeStatus.ACTIVE, EmploymentType.FULL_TIME, today, null, null, null),
                    employee("EMP005", "Sofia", "Nguyen", "sofia.nguyen@example.com", "Sales", EmployeeStatus.INACTIVE, EmploymentType.CONTRACT, today.minusMonths(2), today.minusDays(5), today.minusDays(5), "Contract completed - did not renew"),
                    employee("EMP006", "Ethan", "Brooks", "ethan.brooks@example.com", "Sales", EmployeeStatus.ACTIVE, EmploymentType.FULL_TIME, today.minusMonths(1), null, null, null),
                    employee("EMP007", "Olivia", "Singh", "olivia.singh@example.com", "Marketing", EmployeeStatus.ACTIVE, EmploymentType.INTERN, today.minusMonths(3), today.plusMonths(3), null, "Summer internship"),
                    employee("EMP008", "Lucas", "Martinez", "lucas.martinez@example.com", "Engineering", EmployeeStatus.ACTIVE, EmploymentType.FULL_TIME, today.minusMonths(4), null, null, null),
                    employee("EMP009", "Emma", "Wilson", "emma.wilson@example.com", "HR", EmployeeStatus.ACTIVE, EmploymentType.FULL_TIME, today.minusMonths(6), null, null, null),
                    employee("EMP010", "James", "Taylor", "james.taylor@example.com", "Finance", EmployeeStatus.ON_LEAVE, EmploymentType.CONTRACT, today.minusMonths(8), today.plusMonths(2), null, "Renewable contract"),
                    employee("EMP011", "Amelia", "Davis", "amelia.davis@example.com", "Marketing", EmployeeStatus.ACTIVE, EmploymentType.FULL_TIME, today.minusYears(1), null, null, null),
                    employee("EMP012", "Benjamin", "Lee", "benjamin.lee@example.com", "Engineering", EmployeeStatus.INACTIVE, EmploymentType.FULL_TIME, today.minusYears(2), null, today.minusMonths(3), "Resigned - relocated out of state")
            );
            employeeRepository.saveAll(seed);
            log.info("Seeded {} sample employees", seed.size());
            linkSelfServiceUser();
            return;
        }

        // Backfill inactive employees missing end date / reason
        LocalDate today = LocalDate.now();
        employeeRepository.findAll().stream()
                .filter(emp -> emp.getStatus() == EmployeeStatus.INACTIVE)
                .filter(emp -> emp.getEmploymentEndDate() == null || emp.getNotes() == null || emp.getNotes().isBlank())
                .forEach(emp -> {
                    if (emp.getEmploymentEndDate() == null) {
                        LocalDate end = emp.getContractEndDate() != null
                                ? emp.getContractEndDate()
                                : today.minusDays(5);
                        emp.setEmploymentEndDate(end);
                    }
                    if (emp.getNotes() == null || emp.getNotes().isBlank()) {
                        emp.setNotes(emp.getEmploymentType() == EmploymentType.CONTRACT
                                ? "Contract completed - did not renew"
                                : "Employment ended");
                    }
                    employeeRepository.save(emp);
                });

        YearMonth current = YearMonth.now();
        List<Employee> thisMonth = employeeRepository.findAllForReport(
                null, null, current.atDay(1), current.atEndOfMonth());
        if (thisMonth.isEmpty()) {
            employeeRepository.findAll().stream().limit(4).forEach(emp -> {
                emp.setHireDate(current.atDay(Math.min((int) (emp.getId() == null ? 1 : emp.getId()), current.lengthOfMonth())));
                emp.setDeleted(false);
                if (emp.getEmploymentType() == null) {
                    emp.setEmploymentType(EmploymentType.FULL_TIME);
                }
                employeeRepository.save(emp);
            });
            log.info("Adjusted sample hire dates into current month for report demos");
        }

        linkSelfServiceUser();
    }

    /** Link ava.patel login to Ava Patel (EMP001) for self-service read-only demo. */
    private void linkSelfServiceUser() {
        userRepository.findByUsername("ava.patel").ifPresent(user -> {
            employeeRepository.findByEmployeeCodeAndDeletedFalse("EMP001").ifPresent(emp -> {
                if (emp.getId().equals(user.getEmployeeId())) {
                    return;
                }
                user.setEmployeeId(emp.getId());
                userRepository.save(user);
                log.info("Linked ava.patel -> employee {} ({})", emp.getEmployeeCode(), emp.getId());
            });
        });
    }

    private Employee employee(
            String code,
            String first,
            String last,
            String email,
            String department,
            EmployeeStatus status,
            EmploymentType employmentType,
            LocalDate hireDate,
            LocalDate contractEndDate,
            LocalDate employmentEndDate,
            String notes) {
        return Employee.builder()
                .employeeCode(code)
                .firstName(first)
                .lastName(last)
                .email(email)
                .phone("+1-555-0100")
                .department(department)
                .status(status)
                .employmentType(employmentType)
                .hireDate(hireDate)
                .contractEndDate(employmentType == EmploymentType.CONTRACT || employmentType == EmploymentType.INTERN
                        ? contractEndDate
                        : null)
                .employmentEndDate(status == EmployeeStatus.INACTIVE ? employmentEndDate : null)
                .notes(notes)
                .deleted(false)
                .build();
    }
}
