package com.palak.authvault.repository;

import org.springframework.stereotype.Repository;
import com.palak.authvault.entity.OtpVerification;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

@Repository
public interface OtpRepository
        extends JpaRepository<OtpVerification, Long> {
    Optional<OtpVerification> findByEmail(String email);
}
