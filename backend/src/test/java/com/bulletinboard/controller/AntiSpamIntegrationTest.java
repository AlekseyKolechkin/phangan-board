package com.bulletinboard.controller;

import com.bulletinboard.dto.AdCreateRequest;
import com.bulletinboard.dto.CategoryRequest;
import com.bulletinboard.dto.UserRequest;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.math.BigDecimal;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
class AntiSpamIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15")
            .withDatabaseName("testdb")
            .withUsername("test")
            .withPassword("test");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.flyway.enabled", () -> "true");
        registry.add("antispam.rate-limit.max-ads-per-hour", () -> "3");
        registry.add("antispam.min-title-length", () -> "5");
        registry.add("antispam.min-description-length", () -> "10");
    }

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private Long categoryId;
    private Long userId;

    @BeforeEach
    void setUp() throws Exception {
        CategoryRequest categoryRequest = new CategoryRequest();
        categoryRequest.setName("AntiSpam Test Category " + System.currentTimeMillis());
        categoryRequest.setDescription("Test Description");

        MvcResult categoryResult = mockMvc.perform(post("/api/categories")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(categoryRequest)))
                .andExpect(status().isCreated())
                .andReturn();

        String categoryResponse = categoryResult.getResponse().getContentAsString();
        categoryId = objectMapper.readTree(categoryResponse).get("id").asLong();

        UserRequest userRequest = new UserRequest();
        userRequest.setName("AntiSpam Test User");
        userRequest.setEmail("antispamtest" + System.currentTimeMillis() + "@example.com");
        userRequest.setPhone("+1234567890");

        MvcResult userResult = mockMvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(userRequest)))
                .andExpect(status().isCreated())
                .andReturn();

        String userResponse = userResult.getResponse().getContentAsString();
        userId = objectMapper.readTree(userResponse).get("id").asLong();
    }

    @Test
    void createAd_shouldEnforceRateLimit() throws Exception {
        String testIp = "192.168.1." + System.currentTimeMillis() % 255;
        
        for (int i = 0; i < 3; i++) {
            createTestAdWithIp("Rate Limit Test " + i, "This is a test description for rate limiting", 
                    new BigDecimal("100.00"), testIp);
        }
        
        AdCreateRequest request = new AdCreateRequest();
        request.setTitle("Rate Limit Exceeded");
        request.setDescription("This should fail due to rate limit");
        request.setPrice(new BigDecimal("100.00"));
        request.setCategoryId(categoryId);
        request.setUserId(userId);

        mockMvc.perform(post("/api/ads")
                        .header("X-Forwarded-For", testIp)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isTooManyRequests());
    }

    @Test
    void createAd_shouldAllowDifferentIPs() throws Exception {
        String testIp1 = "10.0.0." + System.currentTimeMillis() % 255;
        String testIp2 = "10.0.1." + System.currentTimeMillis() % 255;
        
        for (int i = 0; i < 3; i++) {
            createTestAdWithIp("IP1 Test " + i, "This is a test description for IP1", 
                    new BigDecimal("100.00"), testIp1);
        }
        
        AdCreateRequest request = new AdCreateRequest();
        request.setTitle("Different IP Test");
        request.setDescription("This should succeed from different IP");
        request.setPrice(new BigDecimal("100.00"));
        request.setCategoryId(categoryId);
        request.setUserId(userId);

        mockMvc.perform(post("/api/ads")
                        .header("X-Forwarded-For", testIp2)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());
    }

    @Test
    void createAd_shouldValidateMinTitleLength() throws Exception {
        AdCreateRequest request = new AdCreateRequest();
        request.setTitle("Ab");
        request.setDescription("This is a valid description");
        request.setPrice(new BigDecimal("100.00"));
        request.setCategoryId(categoryId);
        request.setUserId(userId);

        mockMvc.perform(post("/api/ads")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void createAd_shouldValidateMinDescriptionLength() throws Exception {
        AdCreateRequest request = new AdCreateRequest();
        request.setTitle("Valid Title");
        request.setDescription("Short");
        request.setPrice(new BigDecimal("100.00"));
        request.setCategoryId(categoryId);
        request.setUserId(userId);

        mockMvc.perform(post("/api/ads")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void createAd_shouldAcceptValidRequest() throws Exception {
        AdCreateRequest request = new AdCreateRequest();
        request.setTitle("Valid Title Here");
        request.setDescription("This is a valid description that meets the minimum length requirement");
        request.setPrice(new BigDecimal("100.00"));
        request.setCategoryId(categoryId);
        request.setUserId(userId);

        mockMvc.perform(post("/api/ads")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());
    }

    private void createTestAdWithIp(String title, String description, BigDecimal price, String ip) throws Exception {
        AdCreateRequest request = new AdCreateRequest();
        request.setTitle(title);
        request.setDescription(description);
        request.setPrice(price);
        request.setCategoryId(categoryId);
        request.setUserId(userId);

        mockMvc.perform(post("/api/ads")
                        .header("X-Forwarded-For", ip)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());
    }
}
