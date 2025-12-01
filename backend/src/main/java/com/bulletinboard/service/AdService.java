package com.bulletinboard.service;

import com.bulletinboard.domain.Ad;
import com.bulletinboard.domain.AdStatus;
import com.bulletinboard.domain.Category;
import com.bulletinboard.domain.User;
import com.bulletinboard.dto.AdCreateRequest;
import com.bulletinboard.dto.AdResponse;
import com.bulletinboard.dto.AdSearchRequest;
import com.bulletinboard.dto.AdUpdateRequest;
import com.bulletinboard.dto.PageResponse;
import com.bulletinboard.exception.RateLimitExceededException;
import com.bulletinboard.exception.ResourceNotFoundException;
import com.bulletinboard.repository.AdRepository;
import com.bulletinboard.repository.CategoryRepository;
import com.bulletinboard.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class AdService {

    private final AdRepository adRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;

    @Value("${antispam.rate-limit.max-ads-per-hour:5}")
    private int maxAdsPerHour;

    @Value("${antispam.min-title-length:5}")
    private int minTitleLength;

    @Value("${antispam.min-description-length:10}")
    private int minDescriptionLength;

    public AdService(AdRepository adRepository, CategoryRepository categoryRepository, UserRepository userRepository) {
        this.adRepository = adRepository;
        this.categoryRepository = categoryRepository;
        this.userRepository = userRepository;
    }

    public List<AdResponse> getAllAds() {
        return adRepository.findAll().stream()
                .map(this::toAdResponse)
                .toList();
    }

    public List<AdResponse> getAdsByStatus(AdStatus status) {
        return adRepository.findByStatus(status).stream()
                .map(this::toAdResponse)
                .toList();
    }

    public List<AdResponse> getAdsByCategoryId(Long categoryId) {
        if (!categoryRepository.existsById(categoryId)) {
            throw new ResourceNotFoundException("Category", categoryId);
        }
        return adRepository.findByCategoryId(categoryId).stream()
                .map(this::toAdResponse)
                .toList();
    }

    public List<AdResponse> getAdsByUserId(Long userId) {
        if (!userRepository.existsById(userId)) {
            throw new ResourceNotFoundException("User", userId);
        }
        return adRepository.findByUserId(userId).stream()
                .map(this::toAdResponse)
                .toList();
    }

    public List<AdResponse> getActiveAds() {
        return adRepository.findByStatus(AdStatus.ACTIVE).stream()
                .map(this::toAdResponse)
                .toList();
    }

    public PageResponse<AdResponse> searchAds(AdSearchRequest request) {
        List<Ad> ads = adRepository.searchAds(request);
        long totalElements = adRepository.countAds(request);

        List<AdResponse> content = ads.stream()
                .map(this::toAdResponse)
                .toList();

        return new PageResponse<>(content, request.getPage(), request.getSize(), totalElements);
    }

    public AdResponse getAdById(Long id) {
        Ad ad = adRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ad", id));
        return toAdResponse(ad);
    }

    public AdResponse createAd(AdCreateRequest request, String clientIp) {
        validateAntiSpam(request, clientIp);
        
        if (!categoryRepository.existsById(request.getCategoryId())) {
            throw new ResourceNotFoundException("Category", request.getCategoryId());
        }
        if (!userRepository.existsById(request.getUserId())) {
            throw new ResourceNotFoundException("User", request.getUserId());
        }

        Ad ad = new Ad();
        ad.setTitle(request.getTitle());
        ad.setDescription(request.getDescription());
        ad.setPrice(request.getPrice());
        ad.setCategoryId(request.getCategoryId());
        ad.setUserId(request.getUserId());
        ad.setStatus(AdStatus.ACTIVE);
        ad.setCreatedIp(clientIp);
        ad.setArea(request.getArea());
        ad.setPricePeriod(request.getPricePeriod());
        ad.setEditToken(generateEditToken());

        Ad saved = adRepository.save(ad);
        return toAdResponseWithToken(saved);
    }

    private String generateEditToken() {
        return UUID.randomUUID().toString().replace("-", "") + UUID.randomUUID().toString().replace("-", "").substring(0, 32);
    }

    public AdResponse getAdByEditToken(String editToken) {
        Ad ad = adRepository.findByEditToken(editToken)
                .orElseThrow(() -> new ResourceNotFoundException("Ad not found with token: " + editToken));
        return toAdResponse(ad);
    }

    public AdResponse updateAdByEditToken(String editToken, AdUpdateRequest request) {
        Ad ad = adRepository.findByEditToken(editToken)
                .orElseThrow(() -> new ResourceNotFoundException("Ad not found with token: " + editToken));
        return updateAdInternal(ad, request);
    }

    public void deleteAdByEditToken(String editToken) {
        Ad ad = adRepository.findByEditToken(editToken)
                .orElseThrow(() -> new ResourceNotFoundException("Ad not found with token: " + editToken));
        adRepository.deleteById(ad.getId());
    }

    private void validateAntiSpam(AdCreateRequest request, String clientIp) {
        if (request.getTitle() != null && request.getTitle().length() < minTitleLength) {
            throw new IllegalArgumentException("Title must be at least " + minTitleLength + " characters long");
        }
        
        if (request.getDescription() != null && request.getDescription().length() < minDescriptionLength) {
            throw new IllegalArgumentException("Description must be at least " + minDescriptionLength + " characters long");
        }
        
        if (clientIp != null && !clientIp.isBlank()) {
            LocalDateTime oneHourAgo = LocalDateTime.now().minusHours(1);
            long adsFromIp = adRepository.countByIpSince(clientIp, oneHourAgo);
            if (adsFromIp >= maxAdsPerHour) {
                throw new RateLimitExceededException(
                        "Rate limit exceeded. Maximum " + maxAdsPerHour + " ads per hour allowed from the same IP address.");
            }
        }
    }

    public AdResponse updateAd(Long id, AdUpdateRequest request) {
        Ad ad = adRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ad", id));
        return updateAdInternal(ad, request);
    }

    private AdResponse updateAdInternal(Ad ad, AdUpdateRequest request) {
        if (request.getTitle() != null) {
            ad.setTitle(request.getTitle());
        }
        if (request.getDescription() != null) {
            ad.setDescription(request.getDescription());
        }
        if (request.getPrice() != null) {
            ad.setPrice(request.getPrice());
        }
        if (request.getCategoryId() != null) {
            if (!categoryRepository.existsById(request.getCategoryId())) {
                throw new ResourceNotFoundException("Category", request.getCategoryId());
            }
            ad.setCategoryId(request.getCategoryId());
        }
        if (request.getStatus() != null) {
            ad.setStatus(request.getStatus());
        }
        if (request.getArea() != null) {
            ad.setArea(request.getArea());
        }
        if (request.getPricePeriod() != null) {
            ad.setPricePeriod(request.getPricePeriod());
        }

        Ad updated = adRepository.save(ad);
        return toAdResponse(updated);
    }

    public void deleteAd(Long id) {
        if (!adRepository.existsById(id)) {
            throw new ResourceNotFoundException("Ad", id);
        }
        adRepository.deleteById(id);
    }

    private AdResponse toAdResponse(Ad ad) {
        String categoryName = null;
        String userName = null;

        if (ad.getCategoryId() != null) {
            categoryName = categoryRepository.findById(ad.getCategoryId())
                    .map(Category::getName)
                    .orElse(null);
        }

        if (ad.getUserId() != null) {
            userName = userRepository.findById(ad.getUserId())
                    .map(User::getName)
                    .orElse(null);
        }

        return AdResponse.fromAd(ad, categoryName, userName);
    }

    private AdResponse toAdResponseWithToken(Ad ad) {
        String categoryName = null;
        String userName = null;

        if (ad.getCategoryId() != null) {
            categoryName = categoryRepository.findById(ad.getCategoryId())
                    .map(Category::getName)
                    .orElse(null);
        }

        if (ad.getUserId() != null) {
            userName = userRepository.findById(ad.getUserId())
                    .map(User::getName)
                    .orElse(null);
        }

        return AdResponse.fromAdWithToken(ad, categoryName, userName);
    }
}
