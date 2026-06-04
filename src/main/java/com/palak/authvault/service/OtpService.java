package com.palak.authvault.service;

import java.util.Random;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;

@Service
public class OtpService {

    @Autowired
        private JavaMailSender mailSender;
    
    public String generateOtp() {
        Random random = new Random();
        return String.format(
            "%06d",
            random.nextInt(1000000)
        );
    }

    public void sendOtp(String email, String otp) {
        try {
            SimpleMailMessage msg = new SimpleMailMessage();

            msg.setTo(email);
            msg.setSubject("Your OTP");

            msg.setText(
                "Your OTP is " + otp
            );

            mailSender.send(msg);
        } catch (Exception e) {
            System.err.println("Failed to send OTP email to " + email + ": " + e.getMessage());
            // Don't throw exception - OTP was saved to database, just couldn't email it
            // In production, log this properly
        }
    }

}
