package com.palak.authvault.service;

import com.palak.authvault.dto.UserResponseDto;
import com.palak.authvault.entity.User;
import com.palak.authvault.repository.UserRepository;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    public User createUser(User user){
        return userRepository.save(user);
    }

    public List<UserResponseDto> getUsers(){
        List<User> users = userRepository.findAll();
        return users.stream()
                .map(user -> new UserResponseDto(user.getId(), user.getEmail()))
                .toList();
    }

    public void deleteUser(Long id) {
        userRepository.deleteById(id);
    }
}