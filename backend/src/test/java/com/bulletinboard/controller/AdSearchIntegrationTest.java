package com.bulletinboard.controller;

import com.bulletinboard.domain.AdStatus;
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

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
class AdSearchIntegrationTest {

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
        registry.add("antispam.rate-limit.max-ads-per-hour", () -> "1000");
        registry.add("antispam.min-title-length", () -> "1");
        registry.add("antispam.min-description-length", () -> "1");
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
        categoryRequest.setName("Test Category " + System.currentTimeMillis());
        categoryRequest.setDescription("Test Description");

        MvcResult categoryResult = mockMvc.perform(post("/api/categories")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(categoryRequest)))
                .andExpect(status().isCreated())
                .andReturn();

        String categoryResponse = categoryResult.getResponse().getContentAsString();
        categoryId = objectMapper.readTree(categoryResponse).get("id").asLong();

        UserRequest userRequest = new UserRequest();
        userRequest.setName("Test User");
        userRequest.setEmail("test" + System.currentTimeMillis() + "@example.com");
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
    void searchAds_shouldReturnPaginatedResults() throws Exception {
        createTestAd("iPhone 15", "Brand new iPhone", new BigDecimal("999.99"));
        createTestAd("Samsung Galaxy", "Latest Samsung phone", new BigDecimal("899.99"));
        createTestAd("MacBook Pro", "Apple laptop", new BigDecimal("1999.99"));

        mockMvc.perform(get("/api/ads/search")
                        .param("status", "ACTIVE")
                        .param("page", "0")
                        .param("size", "2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(2)))
                .andExpect(jsonPath("$.page").value(0))
                .andExpect(jsonPath("$.size").value(2))
                .andExpect(jsonPath("$.totalElements", greaterThanOrEqualTo(3)))
                .andExpect(jsonPath("$.totalPages", greaterThanOrEqualTo(2)));
    }

    @Test
    void searchAds_shouldReturnSecondPage() throws Exception {
        createTestAd("Product 1", "Description 1", new BigDecimal("100.00"));
        createTestAd("Product 2", "Description 2", new BigDecimal("200.00"));
        createTestAd("Product 3", "Description 3", new BigDecimal("300.00"));

        mockMvc.perform(get("/api/ads/search")
                        .param("status", "ACTIVE")
                        .param("page", "1")
                        .param("size", "2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.page").value(1))
                .andExpect(jsonPath("$.size").value(2));
    }

    @Test
    void searchAds_shouldSortByPriceAsc() throws Exception {
        createTestAd("Cheap Item", "Low price", new BigDecimal("50.00"));
        createTestAd("Expensive Item", "High price", new BigDecimal("5000.00"));
        createTestAd("Medium Item", "Medium price", new BigDecimal("500.00"));

        mockMvc.perform(get("/api/ads/search")
                        .param("status", "ACTIVE")
                        .param("sortBy", "price")
                        .param("sortDirection", "asc")
                        .param("categoryId", categoryId.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].price").value(50.00))
                .andExpect(jsonPath("$.content[1].price").value(500.00))
                .andExpect(jsonPath("$.content[2].price").value(5000.00));
    }

    @Test
    void searchAds_shouldSortByPriceDesc() throws Exception {
        createTestAd("Cheap Product", "Low price product", new BigDecimal("100.00"));
        createTestAd("Expensive Product", "High price product", new BigDecimal("1000.00"));

        mockMvc.perform(get("/api/ads/search")
                        .param("status", "ACTIVE")
                        .param("sortBy", "price")
                        .param("sortDirection", "desc")
                        .param("categoryId", categoryId.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].price").value(1000.00))
                .andExpect(jsonPath("$.content[1].price").value(100.00));
    }

    @Test
    void searchAds_shouldFilterByPriceRange() throws Exception {
        createTestAd("Budget Phone", "Affordable phone", new BigDecimal("199.99"));
        createTestAd("Mid-range Phone", "Good value phone", new BigDecimal("499.99"));
        createTestAd("Premium Phone", "Flagship phone", new BigDecimal("999.99"));

        mockMvc.perform(get("/api/ads/search")
                        .param("status", "ACTIVE")
                        .param("minPrice", "300")
                        .param("maxPrice", "600")
                        .param("categoryId", categoryId.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].title").value("Mid-range Phone"));
    }

    @Test
    void searchAds_shouldFilterByMinPrice() throws Exception {
        createTestAd("Cheap Gadget", "Budget gadget", new BigDecimal("50.00"));
        createTestAd("Expensive Gadget", "Premium gadget", new BigDecimal("500.00"));

        mockMvc.perform(get("/api/ads/search")
                        .param("status", "ACTIVE")
                        .param("minPrice", "100")
                        .param("categoryId", categoryId.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].title").value("Expensive Gadget"));
    }

    @Test
    void searchAds_shouldFilterByMaxPrice() throws Exception {
        createTestAd("Affordable Item", "Budget item", new BigDecimal("75.00"));
        createTestAd("Luxury Item", "Premium item", new BigDecimal("750.00"));

        mockMvc.perform(get("/api/ads/search")
                        .param("status", "ACTIVE")
                        .param("maxPrice", "100")
                        .param("categoryId", categoryId.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].title").value("Affordable Item"));
    }

    @Test
    void searchAds_shouldSearchByTextInTitle() throws Exception {
        createTestAd("iPhone 15 Pro Max", "Latest Apple phone", new BigDecimal("1199.99"));
        createTestAd("Samsung Galaxy S24", "Latest Samsung phone", new BigDecimal("999.99"));

        mockMvc.perform(get("/api/ads/search")
                        .param("status", "ACTIVE")
                        .param("q", "iphone")
                        .param("categoryId", categoryId.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].title").value("iPhone 15 Pro Max"));
    }

    @Test
    void searchAds_shouldSearchByTextInDescription() throws Exception {
        createTestAd("Wireless Earbuds", "Apple AirPods Pro 2nd generation", new BigDecimal("249.99"));
        createTestAd("Bluetooth Speaker", "JBL portable speaker", new BigDecimal("149.99"));

        mockMvc.perform(get("/api/ads/search")
                        .param("status", "ACTIVE")
                        .param("q", "apple")
                        .param("categoryId", categoryId.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].title").value("Wireless Earbuds"));
    }

    @Test
    void searchAds_shouldSearchCaseInsensitive() throws Exception {
        createTestAd("UPPERCASE TITLE", "lowercase description", new BigDecimal("100.00"));

        mockMvc.perform(get("/api/ads/search")
                        .param("status", "ACTIVE")
                        .param("q", "uppercase")
                        .param("categoryId", categoryId.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].title").value("UPPERCASE TITLE"));
    }

    @Test
    void searchAds_shouldCombineFilters() throws Exception {
        createTestAd("iPhone 15", "Apple smartphone", new BigDecimal("999.99"));
        createTestAd("iPhone 12", "Older Apple phone", new BigDecimal("599.99"));
        createTestAd("Samsung Galaxy", "Android phone", new BigDecimal("799.99"));

        mockMvc.perform(get("/api/ads/search")
                        .param("status", "ACTIVE")
                        .param("q", "iphone")
                        .param("minPrice", "700")
                        .param("maxPrice", "1100")
                        .param("categoryId", categoryId.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].title").value("iPhone 15"));
    }

    @Test
    void searchAds_shouldFilterByCategory() throws Exception {
        CategoryRequest anotherCategory = new CategoryRequest();
        anotherCategory.setName("Another Category " + System.currentTimeMillis());
        anotherCategory.setDescription("Another Description");

        MvcResult result = mockMvc.perform(post("/api/categories")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(anotherCategory)))
                .andExpect(status().isCreated())
                .andReturn();

        Long anotherCategoryId = objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asLong();

        createTestAd("Item in Category 1", "Description", new BigDecimal("100.00"));
        createTestAdWithCategory("Item in Category 2", "Description", new BigDecimal("200.00"), anotherCategoryId);

        mockMvc.perform(get("/api/ads/search")
                        .param("status", "ACTIVE")
                        .param("categoryId", categoryId.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[*].categoryId", everyItem(equalTo(categoryId.intValue()))));
    }

    @Test
    void searchAds_shouldReturnEmptyForNoMatches() throws Exception {
        mockMvc.perform(get("/api/ads/search")
                        .param("status", "ACTIVE")
                        .param("q", "nonexistentproduct12345"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(0)))
                .andExpect(jsonPath("$.totalElements").value(0))
                .andExpect(jsonPath("$.totalPages").value(0));
    }

    @Test
    void searchAds_shouldUseDefaultPagination() throws Exception {
        mockMvc.perform(get("/api/ads/search")
                        .param("status", "ACTIVE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.page").value(0))
                .andExpect(jsonPath("$.size").value(20));
    }

    @Test
    void searchAds_shouldSortByCreatedAtDescByDefault() throws Exception {
        createTestAd("First Ad", "Created first", new BigDecimal("100.00"));
        Thread.sleep(100);
        createTestAd("Second Ad", "Created second", new BigDecimal("200.00"));

        mockMvc.perform(get("/api/ads/search")
                        .param("status", "ACTIVE")
                        .param("categoryId", categoryId.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].title").value("Second Ad"))
                .andExpect(jsonPath("$.content[1].title").value("First Ad"));
    }

    private void createTestAd(String title, String description, BigDecimal price) throws Exception {
        createTestAdWithCategory(title, description, price, categoryId);
    }

    private void createTestAdWithCategory(String title, String description, BigDecimal price, Long catId) throws Exception {
        AdCreateRequest request = new AdCreateRequest();
        request.setTitle(title);
        request.setDescription(description);
        request.setPrice(price);
        request.setCategoryId(catId);
        request.setUserId(userId);

        mockMvc.perform(post("/api/ads")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());
    }
}
