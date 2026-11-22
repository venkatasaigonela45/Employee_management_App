package com.assessment.employee.repository;

import com.assessment.employee.entity.Employee;
import com.assessment.employee.entity.EmployeeStatus;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface EmployeeRepository extends JpaRepository<Employee, Long> {

    boolean existsByEmployeeCodeAndDeletedFalse(String employeeCode);

    boolean existsByEmailAndDeletedFalse(String email);

    boolean existsByEmployeeCodeAndIdNotAndDeletedFalse(String employeeCode, Long id);

    boolean existsByEmailAndIdNotAndDeletedFalse(String email, Long id);

    Optional<Employee> findByIdAndDeletedFalse(Long id);

    Optional<Employee> findByEmployeeCodeAndDeletedFalse(String employeeCode);

    @Query("""
            SELECT e FROM Employee e
            WHERE e.deleted = false
              AND (
                   :search IS NULL OR :search = '' OR
                   LOWER(e.firstName) LIKE LOWER(CONCAT('%', :search, '%')) OR
                   LOWER(e.lastName) LIKE LOWER(CONCAT('%', :search, '%')) OR
                   LOWER(e.email) LIKE LOWER(CONCAT('%', :search, '%')) OR
                   LOWER(e.employeeCode) LIKE LOWER(CONCAT('%', :search, '%')) OR
                   LOWER(e.department) LIKE LOWER(CONCAT('%', :search, '%'))
              )
            """)
    Page<Employee> searchActive(@Param("search") String search, Pageable pageable);

    @Query("""
            SELECT e FROM Employee e
            WHERE e.deleted = false
              AND (:status IS NULL OR e.status = :status)
              AND (:department IS NULL OR :department = '' OR LOWER(e.department) = LOWER(:department))
              AND (:fromDate IS NULL OR e.hireDate >= :fromDate)
              AND (:toDate IS NULL OR e.hireDate <= :toDate)
            """)
    Page<Employee> findForReport(
            @Param("status") EmployeeStatus status,
            @Param("department") String department,
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate,
            Pageable pageable);

    @Query("""
            SELECT e FROM Employee e
            WHERE e.deleted = false
              AND (:status IS NULL OR e.status = :status)
              AND (:department IS NULL OR :department = '' OR LOWER(e.department) = LOWER(:department))
              AND (:fromDate IS NULL OR e.hireDate >= :fromDate)
              AND (:toDate IS NULL OR e.hireDate <= :toDate)
            """)
    List<Employee> findAllForReport(
            @Param("status") EmployeeStatus status,
            @Param("department") String department,
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate);

    long countByDeletedFalse();

    long countByDeletedFalseAndStatus(EmployeeStatus status);

    @Query("""
            SELECT e.status, COUNT(e)
            FROM Employee e
            WHERE e.deleted = false
              AND (:status IS NULL OR e.status = :status)
              AND (:department IS NULL OR :department = '' OR LOWER(e.department) = LOWER(:department))
              AND (:fromDate IS NULL OR e.hireDate >= :fromDate)
              AND (:toDate IS NULL OR e.hireDate <= :toDate)
            GROUP BY e.status
            """)
    List<Object[]> countGroupedByStatus(
            @Param("status") EmployeeStatus status,
            @Param("department") String department,
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate);

    @Query("""
            SELECT e.department, COUNT(e)
            FROM Employee e
            WHERE e.deleted = false
              AND (:status IS NULL OR e.status = :status)
              AND (:department IS NULL OR :department = '' OR LOWER(e.department) = LOWER(:department))
              AND (:fromDate IS NULL OR e.hireDate >= :fromDate)
              AND (:toDate IS NULL OR e.hireDate <= :toDate)
            GROUP BY e.department
            ORDER BY e.department
            """)
    List<Object[]> countGroupedByDepartment(
            @Param("status") EmployeeStatus status,
            @Param("department") String department,
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate);

    @Query("SELECT DISTINCT e.department FROM Employee e WHERE e.deleted = false ORDER BY e.department")
    List<String> findDistinctDepartments();
}
