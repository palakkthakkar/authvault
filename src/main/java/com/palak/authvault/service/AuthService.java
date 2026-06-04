package com.palak.authvault.service;

import com.palak.authvault.entity.User;
import com.palak.authvault.repository.UserRepository;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import com.palak.authvault.entity.OtpVerification;
import com.palak.authvault.repository.OtpRepository;
import com.palak.authvault.service.OtpService;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BCryptPasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private GoogleTokenVerifierService googleTokenVerifierService;

    @Autowired
    private OtpService otpService;

    @Autowired
    private OtpRepository otpRepository;

    public void register(String email, String password) {
        if (userRepository.findByEmail(email).isPresent()) {
            throw new IllegalArgumentException("Email already exists");
        }

        User user = new User();
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password));
        userRepository.save(user);
    }

    public String login(String email, String password) {
        User user = userRepository.findByEmail(email).orElseThrow(
            () -> new IllegalArgumentException("User not found")
        );

        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new IllegalArgumentException("Invalid password");
        }

        return jwtService.generateToken(user.getEmail());
    }

    public String loginWithGoogle(String idToken) {
        String email = googleTokenVerifierService.verifyToken(idToken);

        Optional<User> existingUser = userRepository.findByEmail(email);
        if (existingUser.isEmpty()) {
            User user = new User();
            user.setEmail(email);
            user.setPassword("");
            userRepository.save(user);
        }

        return jwtService.generateToken(email);
    }

    public void initiateOtp(String email, String password) {
        User user = userRepository.findByEmail(email).orElseThrow(
            () -> new IllegalArgumentException("User not found")
        );

        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new IllegalArgumentException("Invalid password");
        }

        String otp = otpService.generateOtp();

        OtpVerification verification = otpRepository.findByEmail(email).orElse(new OtpVerification());
        verification.setEmail(email);
        verification.setOtp(otp);
        verification.setExpiryTime(LocalDateTime.now().plusMinutes(5));
        otpRepository.save(verification);

        otpService.sendOtp(email, otp);
    }

    public String verifyOtp(String email, String otp) {
        OtpVerification verification = otpRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("OTP not found"));

        if (verification.getExpiryTime() == null || verification.getExpiryTime().isBefore(LocalDateTime.now())) {
            otpRepository.delete(verification);
            throw new IllegalArgumentException("OTP expired");
        }

        if (!verification.getOtp().equals(otp)) {
            throw new IllegalArgumentException("Invalid OTP");
        }

        otpRepository.delete(verification);
        return jwtService.generateToken(email);
    }
}
