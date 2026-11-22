package com.assessment.employee.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.Map;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

@Service
public class JwtService {

    private static final String CLAIM_TYPE = "typ";
    private static final String TYPE_ACCESS = "access";
    private static final String TYPE_REFRESH = "refresh";

    private final SecretKey secretKey;
    private final long expirationMs;
    private final long refreshExpirationMs;

    public JwtService(
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.expiration-ms}") long expirationMs,
            @Value("${app.jwt.refresh-expiration-ms}") long refreshExpirationMs) {
        byte[] keyBytes = secret.getBytes(StandardCharsets.UTF_8);
        if (secret.matches("^[A-Za-z0-9+/=]+$") && secret.length() % 4 == 0 && secret.length() >= 44) {
            try {
                keyBytes = Decoders.BASE64.decode(secret);
            } catch (IllegalArgumentException ignored) {
                // keep UTF-8 bytes
            }
        }
        this.secretKey = Keys.hmacShaKeyFor(padKey(keyBytes));
        this.expirationMs = expirationMs;
        this.refreshExpirationMs = refreshExpirationMs;
    }

    public String generateToken(UserDetails userDetails) {
        return buildToken(userDetails, expirationMs, TYPE_ACCESS);
    }

    public String generateRefreshToken(UserDetails userDetails) {
        return buildToken(userDetails, refreshExpirationMs, TYPE_REFRESH);
    }

    public String extractUsername(String token) {
        return parseClaims(token).getSubject();
    }

    public String extractRole(String token) {
        Object role = parseClaims(token).get("role");
        return role == null ? null : role.toString();
    }

    public boolean isRefreshToken(String token) {
        return TYPE_REFRESH.equals(parseClaims(token).get(CLAIM_TYPE));
    }

    public boolean isTokenValid(String token, UserDetails userDetails) {
        String username = extractUsername(token);
        return username.equals(userDetails.getUsername()) && !isExpired(token);
    }

    public boolean isRefreshTokenValid(String token, UserDetails userDetails) {
        return isRefreshToken(token) && isTokenValid(token, userDetails);
    }

    public long getExpirationMs() {
        return expirationMs;
    }

    public long getRefreshExpirationMs() {
        return refreshExpirationMs;
    }

    private String buildToken(UserDetails userDetails, long ttlMs, String type) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + ttlMs);
        return Jwts.builder()
                .claims(Map.of(
                        "role", userDetails.getAuthorities().iterator().next().getAuthority(),
                        CLAIM_TYPE, type))
                .subject(userDetails.getUsername())
                .issuedAt(now)
                .expiration(expiry)
                .signWith(secretKey)
                .compact();
    }

    private boolean isExpired(String token) {
        return parseClaims(token).getExpiration().before(new Date());
    }

    private Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private static byte[] padKey(byte[] keyBytes) {
        if (keyBytes.length >= 32) {
            return keyBytes;
        }
        byte[] padded = new byte[32];
        System.arraycopy(keyBytes, 0, padded, 0, keyBytes.length);
        return padded;
    }
}
