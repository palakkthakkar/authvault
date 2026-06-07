package com.palak.authvault.controller;

import com.palak.authvault.dto.GoogleLoginRequest;
import com.palak.authvault.dto.LoginRequest;
import com.palak.authvault.dto.RegisterRequest;
import com.palak.authvault.dto.OtpRequest;
import com.palak.authvault.service.AuthService;
import jakarta.validation.Valid;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<Map<String, String>> register(@Valid @RequestBody RegisterRequest request) {
        authService.register(request.getEmail(), request.getPassword());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("message", "User registered successfully"));
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@Valid @RequestBody LoginRequest request) {
        Map<String, Object> response = authService.login(request.getEmail(), request.getPassword(), request.getOtp());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/send-otp")
    public ResponseEntity<Map<String, String>> sendOtp(@Valid @RequestBody LoginRequest request) {
        authService.initiateOtp(request.getEmail(), request.getPassword());
        return ResponseEntity.ok(Map.of("message", "OTP sent to email"));
    }

    @PostMapping("/google")
    public ResponseEntity<Map<String, String>> googleLogin(@RequestBody GoogleLoginRequest request) {
        String token = authService.loginWithGoogle(request.getIdToken());
        return ResponseEntity.ok(Map.of("token", token));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<Map<String, String>> verifyOtp(@Valid @RequestBody OtpRequest request) {
        String token = authService.verifyOtp(request.getEmail(), request.getOtp());
        return ResponseEntity.ok(Map.of("token", token));
    }

    @PostMapping("/mfa/setup")
    public ResponseEntity<Map<String, String>> setupMfa(@Valid @RequestBody LoginRequest request) {
        System.out.println("MFA setup endpoint reached");

        String qrCodeData = authService.setupMfa(request.getEmail(), request.getPassword());
        return ResponseEntity.ok(Map.of("qrCodeData", qrCodeData));
    }

    @PostMapping("/mfa/verify-setup")
    public ResponseEntity<Map<String, String>> verifyMfaSetup(@Valid @RequestBody OtpRequest request) {
        String token = authService.verifyMfaSetup(request.getEmail(), request.getOtp());
        return ResponseEntity.ok(Map.of("token", token));
    }

    @PostMapping("/mfa/disable")
    public ResponseEntity<Map<String, String>> disableMfa(@Valid @RequestBody LoginRequest request) {
        authService.disableMfa(request.getEmail(), request.getPassword());
        return ResponseEntity.ok(Map.of("message", "MFA disabled successfully"));
    }

    @PostMapping("/mfa/status")
    public ResponseEntity<Map<String, Object>> mfaStatus(@Valid @RequestBody LoginRequest request) {
        boolean enabled = authService.isMfaEnabled(request.getEmail(), request.getPassword());
        return ResponseEntity.ok(Map.of("mfaEnabled", enabled));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleBadRequest(IllegalArgumentException exception) {
        return ResponseEntity.badRequest().body(Map.of("error", exception.getMessage()));
    }
}
