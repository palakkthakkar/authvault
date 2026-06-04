package com.palak.authvault.config;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

public class DotenvEnvironmentPostProcessor implements EnvironmentPostProcessor {

    private static final String DOTENV_FILE = ".env";
    private static final String PROPERTY_SOURCE_NAME = "dotenvProperties";

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        Path dotenvPath = Path.of(DOTENV_FILE).toAbsolutePath().normalize();
        if (!Files.exists(dotenvPath)) {
            return;
        }

        try {
            List<String> lines = Files.readAllLines(dotenvPath, StandardCharsets.UTF_8);
            Map<String, Object> properties = parseDotenv(lines);
            if (!properties.isEmpty()) {
                environment.getPropertySources().addLast(new MapPropertySource(PROPERTY_SOURCE_NAME, properties));
            }
        } catch (IOException ex) {
            // Ignore missing or unreadable .env file; application can still use other property sources.
        }
    }

    private Map<String, Object> parseDotenv(List<String> lines) {
        Map<String, Object> properties = new LinkedHashMap<>();
        for (String rawLine : lines) {
            if (rawLine == null) {
                continue;
            }
            String line = rawLine.trim();
            if (line.isEmpty() || line.startsWith("#") || line.startsWith("export ")) {
                continue;
            }
            int equalsIndex = line.indexOf('=');
            if (equalsIndex <= 0) {
                continue;
            }
            String key = line.substring(0, equalsIndex).trim();
            String value = line.substring(equalsIndex + 1).trim();
            if ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'"))) {
                value = value.substring(1, value.length() - 1);
            }
            properties.put(key, value);
        }
        return properties;
    }
}
