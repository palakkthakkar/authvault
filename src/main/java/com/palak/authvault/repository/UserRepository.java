package com.palak.authvault.repository;

import com.palak.authvault.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRepository
       extends JpaRepository<User, Long> {
}