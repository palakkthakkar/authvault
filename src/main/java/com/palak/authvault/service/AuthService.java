package com.palak.authvault.service;

import com.palak.authvault.repository.UserRepository;
import com.palak.authvault.entity.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BCryptPasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    public String register(String email, String password)
    {

        if(userRepository.findByEmail(email)
                .isPresent())
        {
            return "Email already exists";
        }

        User user = new User();
        user.setEmail(email);
        user.setPassword(
                passwordEncoder.encode(password)
        );

        userRepository.save(user);
        return "User registered";
    }

    public String login(String email, String password)
    {
        User user = userRepository
        .findByEmail(email)
        .orElse(null);

        if(user == null){
            return "User not found";
        }

        if(!passwordEncoder.matches(password, user.getPassword())){
            return "Invalid password";
        }

        return jwtService.generateToken(
            user.getEmail()
        );
    }
}