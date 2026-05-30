package com.palak.authvault.repository;

import com.palak.authvault.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface UserRepository
       extends JpaRepository<User, Long> {
              Optional<User> findByEmail(String email); //maybe user exists or not (Optional)
}