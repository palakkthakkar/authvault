package com.palak.authvault.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public class MfaRequest {

    @Email
    @NotBlank
    private String email;

    @NotBlank
    private String secret;

    public MfaRequest() {}

    public MfaRequest(String email, String secret) {
        this.email = email;
        this.secret = secret;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getSecret() {
        return secret;
    }

    public void setSecret(String secret) {
        this.secret = secret;
    }
}
