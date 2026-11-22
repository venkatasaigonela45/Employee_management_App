package com.assessment.employee.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

public final class SecurityUtils {

    private SecurityUtils() {}

    public static Authentication requireAuthentication() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new IllegalStateException("No authenticated user");
        }
        return authentication;
    }

    public static String currentUsername() {
        return requireAuthentication().getName();
    }

    public static boolean hasRole(String role) {
        return requireAuthentication().getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(role::equals);
    }

    public static boolean isAdmin() {
        return hasRole("ROLE_ADMIN");
    }

    /** Read-only company-wide viewer (can see all employees + reports). */
    public static boolean isViewer() {
        return hasRole("ROLE_USER");
    }

    /** Self-service employee (own profile only). */
    public static boolean isSelfServiceEmployee() {
        return hasRole("ROLE_EMPLOYEE");
    }
}
