package com.palak.authvault.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class GoogleTokenVerifierService {

    private final String clientId;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newHttpClient();

    public GoogleTokenVerifierService(@Value("${google.client-id}") String clientId) {
        this.clientId = clientId;
    }

    public String verifyToken(String idToken) {
        try {
            String encodedToken = URLEncoder.encode(idToken, StandardCharsets.UTF_8);
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://oauth2.googleapis.com/tokeninfo?id_token=" + encodedToken))
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) {
                throw new IllegalArgumentException("Google token validation failed");
            }

            JsonNode payload = objectMapper.readTree(response.body());
            String audience = payload.path("aud").asText();
            String email = payload.path("email").asText();
            String emailVerified = payload.path("email_verified").asText();

            if (!clientId.equals(audience)) {
                throw new IllegalArgumentException("Invalid Google token audience");
            }
            if (!"true".equalsIgnoreCase(emailVerified)) {
                throw new IllegalArgumentException("Google email is not verified");
            }
            if (email == null || email.isBlank()) {
                throw new IllegalArgumentException("Google token did not contain an email");
            }

            return email;
        } catch (IOException | InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Failed to verify Google token", exception);
        }
    }
}
