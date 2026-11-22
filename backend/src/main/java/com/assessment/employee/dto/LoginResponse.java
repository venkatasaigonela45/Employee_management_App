package com.assessment.employee.dto;

public record LoginResponse(
        String token,
        String refreshToken,
        String username,
        String role,
        Long employeeId,
        long expiresInMs
) {
}
