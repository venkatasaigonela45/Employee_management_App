package com.assessment.employee.security;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;

class JwtServiceTest {

    private JwtService jwtService;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService(
                "unit-test-secret-key-must-be-32-bytes!!",
                3_600_000L,
                7_200_000L);
    }

    @Test
    void generateAndValidateAccessToken() {
        UserDetails user = User.builder()
                .username("admin")
                .password("password")
                .authorities(List.of(new SimpleGrantedAuthority("ROLE_ADMIN")))
                .build();

        String token = jwtService.generateToken(user);

        assertEquals("admin", jwtService.extractUsername(token));
        assertTrue(jwtService.isTokenValid(token, user));
        assertFalse(jwtService.isRefreshToken(token));
    }

    @Test
    void generateAndValidateRefreshToken() {
        UserDetails user = User.builder()
                .username("admin")
                .password("password")
                .authorities(List.of(new SimpleGrantedAuthority("ROLE_ADMIN")))
                .build();

        String refresh = jwtService.generateRefreshToken(user);

        assertTrue(jwtService.isRefreshToken(refresh));
        assertTrue(jwtService.isRefreshTokenValid(refresh, user));
        assertEquals("ROLE_ADMIN", jwtService.extractRole(refresh));
    }
}
