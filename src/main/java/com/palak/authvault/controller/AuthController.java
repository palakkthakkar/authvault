package com.palak.authvault.controller;

import com.palak.authvault.dto.RegisterRequest;
import com.palak.authvault.dto.LoginRequest;
import com.palak.authvault.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
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
    public String register(@Valid @RequestBody RegisterRequest request)
    {
        return authService.register(
                request.getEmail(),
                request.getPassword()
        );
    }

    @PostMapping("/login")
    public String login(@Valid @RequestBody LoginRequest request)
    {
        return authService.login(
                request.getEmail(),
                request.getPassword()
        );
    }
}