package com.bulletinboard.controller;

import com.bulletinboard.domain.AdStatus;
import com.bulletinboard.dto.AdCreateRequest;
import com.bulletinboard.dto.AdminStatusUpdateRequest;
import com.bulletinboard.dto.CategoryRequest;
import com.bulletinboard.dto.UserRequest;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.math.BigDecimal;

import static org.hamcrest.Matchers.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.httpBasic;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
class AdminControllerIntegrationTest {

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
        registry.add("admin.username", () -> "admin");
        registry.add("admin.password", () -> "admin123");
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
        categoryRequest.setName("Admin Test Category " + System.currentTimeMillis());
        categoryRequest.setDescription("Test Description");

        MvcResult categoryResult = mockMvc.perform(post("/api/categories")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(categoryRequest)))
                .andExpect(status().isCreated())
                .andReturn();

        String categoryResponse = categoryResult.getResponse().getContentAsString();
        categoryId = objectMapper.readTree(categoryResponse).get("id").asLong();

        UserRequest userRequest = new UserRequest();
        userRequest.setName("Admin Test User");
        userRequest.setEmail("admintest" + System.currentTimeMillis() + "@example.com");
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
    void adminEndpoint_shouldRequireAuthentication() throws Exception {
        mockMvc.perform(get("/api/admin/ads"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void adminEndpoint_shouldAllowAccessWithValidCredentials() throws Exception {
        mockMvc.perform(get("/api/admin/ads")
                        .with(httpBasic("admin", "admin123")))
                .andExpect(status().isOk());
    }

    @Test
    void adminEndpoint_shouldDenyAccessWithInvalidCredentials() throws Exception {
        mockMvc.perform(get("/api/admin/ads")
                        .with(httpBasic("admin", "wrongpassword")))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void getAllAds_shouldReturnAllAdsIncludingNonActive() throws Exception {
        Long adId = createTestAd("Admin Test Ad", "Test description for admin", new BigDecimal("100.00"));
        
        mockMvc.perform(get("/api/admin/ads")
                        .with(httpBasic("admin", "admin123")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(1))));
    }

    @Test
    void getAllAds_shouldFilterByStatus() throws Exception {
        createTestAd("Active Ad", "Active ad description", new BigDecimal("100.00"));
        
        mockMvc.perform(get("/api/admin/ads")
                        .param("status", "ACTIVE")
                        .with(httpBasic("admin", "admin123")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].status", everyItem(equalTo("ACTIVE"))));
    }

    @Test
    void updateAdStatus_shouldChangeStatusToBlocked() throws Exception {
        Long adId = createTestAd("Ad to Block", "This ad will be blocked", new BigDecimal("100.00"));
        
        AdminStatusUpdateRequest request = new AdminStatusUpdateRequest(AdStatus.BLOCKED);
        
        mockMvc.perform(put("/api/admin/ads/" + adId + "/status")
                        .with(httpBasic("admin", "admin123"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("BLOCKED"));
    }

    @Test
    void updateAdStatus_shouldChangeStatusToActive() throws Exception {
        Long adId = createTestAd("Ad to Activate", "This ad will be activated", new BigDecimal("100.00"));
        
        AdminStatusUpdateRequest blockRequest = new AdminStatusUpdateRequest(AdStatus.BLOCKED);
        mockMvc.perform(put("/api/admin/ads/" + adId + "/status")
                        .with(httpBasic("admin", "admin123"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(blockRequest)))
                .andExpect(status().isOk());
        
        AdminStatusUpdateRequest activateRequest = new AdminStatusUpdateRequest(AdStatus.ACTIVE);
        mockMvc.perform(put("/api/admin/ads/" + adId + "/status")
                        .with(httpBasic("admin", "admin123"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(activateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACTIVE"));
    }

    @Test
    void deleteAd_shouldSoftDeleteAd() throws Exception {
        Long adId = createTestAd("Ad to Delete", "This ad will be deleted", new BigDecimal("100.00"));
        
        mockMvc.perform(delete("/api/admin/ads/" + adId)
                        .with(httpBasic("admin", "admin123")))
                .andExpect(status().isNoContent());
        
        mockMvc.perform(get("/api/admin/ads")
                        .param("status", "DELETED")
                        .with(httpBasic("admin", "admin123")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id == " + adId + ")].status").value("DELETED"));
    }

    @Test
    void updateAdStatus_shouldReturn404ForNonExistentAd() throws Exception {
        AdminStatusUpdateRequest request = new AdminStatusUpdateRequest(AdStatus.BLOCKED);
        
        mockMvc.perform(put("/api/admin/ads/999999/status")
                        .with(httpBasic("admin", "admin123"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound());
    }

    private Long createTestAd(String title, String description, BigDecimal price) throws Exception {
        AdCreateRequest request = new AdCreateRequest();
        request.setTitle(title);
        request.setDescription(description);
        request.setPrice(price);
        request.setCategoryId(categoryId);
        request.setUserId(userId);

        MvcResult result = mockMvc.perform(post("/api/ads")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn();

        return objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asLong();
    }
}
