package com.bulletinboard.service;

import com.bulletinboard.domain.Ad;
import com.bulletinboard.domain.AdStatus;
import com.bulletinboard.domain.Category;
import com.bulletinboard.domain.User;
import com.bulletinboard.domain.AdImage;
import com.bulletinboard.dto.*;
import com.bulletinboard.exception.RateLimitExceededException;
import com.bulletinboard.exception.ResourceNotFoundException;
import com.bulletinboard.repository.AdImageRepository;
import com.bulletinboard.repository.AdRepository;
import com.bulletinboard.repository.CategoryRepository;
import com.bulletinboard.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AdService {

    private final AdRepository adRepository;
    private final AdImageRepository adImageRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;

    @Value("${antispam.rate-limit.max-ads-per-hour:5}")
    private int maxAdsPerHour;

    @Value("${antispam.min-title-length:5}")
    private int minTitleLength;

    @Value("${antispam.min-description-length:10}")
    private int minDescriptionLength;

    public AdService(AdRepository adRepository, AdImageRepository adImageRepository, CategoryRepository categoryRepository, UserRepository userRepository) {
        this.adRepository = adRepository;
        this.adImageRepository = adImageRepository;
        this.categoryRepository = categoryRepository;
        this.userRepository = userRepository;
    }

    public List<AdResponse> getAllAds() {
        List<Ad> ads = adRepository.findAll();
        Map<Long, List<AdImageResponse>> imagesByAdId = loadImagesByAds(ads);

        return ads.stream()
                .map(ad -> toAdResponseWithImages(ad, imagesByAdId.getOrDefault(ad.getId(), List.of())))
                .toList();
    }

    public List<AdResponse> getAdsByStatus(AdStatus status) {
        List<Ad> ads = adRepository.findByStatus(status);
        Map<Long, List<AdImageResponse>> imagesByAdId = loadImagesByAds(ads);

        return ads.stream()
                .map(ad -> toAdResponseWithImages(ad, imagesByAdId.getOrDefault(ad.getId(), List.of())))
                .toList();
    }

    public List<AdResponse> getAdsByCategoryId(Long categoryId) {
        if (!categoryRepository.existsById(categoryId)) {
            throw new ResourceNotFoundException("Category", categoryId);
        }

        List<Ad> ads = adRepository.findByCategoryId(categoryId);
        Map<Long, List<AdImageResponse>> imagesByAdId = loadImagesByAds(ads);

        return ads.stream()
                .map(ad -> toAdResponseWithImages(ad, imagesByAdId.getOrDefault(ad.getId(), List.of())))
                .toList();
    }

    public List<AdResponse> getAdsByUserId(Long userId) {
        // Not supported yet; keep explicit for now
        throw new RuntimeException("Not supported");
    }

    public List<AdResponse> getActiveAds() {
        List<Ad> ads = adRepository.findByStatus(AdStatus.ACTIVE);
        Map<Long, List<AdImageResponse>> imagesByAdId = loadImagesByAds(ads);

        return ads.stream()
                .map(ad -> toAdResponseWithImages(ad, imagesByAdId.getOrDefault(ad.getId(), List.of())))
                .toList();
    }

    public PageResponse<AdResponse> searchAds(AdSearchRequest request) {
        List<Ad> ads = adRepository.searchAds(request);
        long totalElements = adRepository.countAds(request);

        Map<Long, List<AdImageResponse>> imagesByAdId = loadImagesByAds(ads);

        List<AdResponse> content = ads.stream()
                .map(ad -> toAdResponseWithImages(ad, imagesByAdId.getOrDefault(ad.getId(), List.of())))
                .toList();

        return new PageResponse<>(content, request.getPage(), request.getSize(), totalElements);
    }

    public AdResponse getAdById(Long id) {
        Ad ad = adRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ad", id));

        List<AdImageResponse> images = loadImagesForAd(ad.getId());
        return toAdResponseWithImages(ad, images);
    }

    public AdResponse createAd(AdCreateRequest request, String clientIp) {
        validateAntiSpam(request, clientIp);

        if (!categoryRepository.existsById(request.getCategoryId())) {
            throw new ResourceNotFoundException("Category", request.getCategoryId());
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

        // Newly created ad has no images yet
        AdResponse response = toAdResponseWithToken(saved);
        response.setImages(List.of());
        return response;
    }

    public AdResponse getAdByEditToken(String editToken) {
        Ad ad = adRepository.findByEditToken(editToken)
                .orElseThrow(() -> new ResourceNotFoundException("Ad not found with token: " + editToken));

        List<AdImageResponse> images = loadImagesForAd(ad.getId());
        AdResponse response = toAdResponseWithToken(ad);
        response.setImages(images);
        return response;
    }

    public AdResponse updateAdByEditToken(String editToken, AdUpdateRequest request) {
        Ad ad = adRepository.findByEditToken(editToken)
                .orElseThrow(() -> new ResourceNotFoundException("Ad not found with token: " + editToken));

        Ad updated = updateAdInternal(ad, request);
        List<AdImageResponse> images = loadImagesForAd(updated.getId());

        AdResponse response = toAdResponse(updated);
        response.setImages(images);
        return response;
    }

    public void deleteAdByEditToken(String editToken) {
        Ad ad = adRepository.findByEditToken(editToken)
                .orElseThrow(() -> new ResourceNotFoundException("Ad not found with token: " + editToken));
        adRepository.deleteById(ad.getId());
    }

    public AdResponse updateAd(Long id, AdUpdateRequest request) {
        Ad ad = adRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ad", id));

        Ad updated = updateAdInternal(ad, request);
        List<AdImageResponse> images = loadImagesForAd(updated.getId());

        AdResponse response = toAdResponse(updated);
        response.setImages(images);
        return response;
    }

    public void deleteAd(Long id) {
        if (!adRepository.existsById(id)) {
            throw new ResourceNotFoundException("Ad", id);
        }
        adRepository.deleteById(id);
    }

    // ----------------- Internal helpers -----------------

    private String generateEditToken() {
        // 64 hex-like chars, enough for your use-case
        return UUID.randomUUID().toString().replace("-", "") +
               UUID.randomUUID().toString().replace("-", "");
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
                        "Rate limit exceeded. Maximum " + maxAdsPerHour +
                        " ads per hour allowed from the same IP address.");
            }
        }
    }

    private Ad updateAdInternal(Ad ad, AdUpdateRequest request) {
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

        return adRepository.save(ad);
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

    private AdResponse toAdResponseWithImages(Ad ad, List<AdImageResponse> images) {
        AdResponse response = toAdResponse(ad);
        response.setImages(images);
        return response;
    }

    private List<AdImageResponse> loadImagesForAd(Long adId) {
        return adImageRepository.findByAdIdOrderByPositionAsc(adId).stream()
                .map(img -> new AdImageResponse(img.getId(), img.getUrl(), img.getPosition()))
                .toList();
    }

    private Map<Long, List<AdImageResponse>> loadImagesByAds(List<Ad> ads) {
        if (ads.isEmpty()) {
            return Collections.emptyMap();
        }

        List<Long> adIds = ads.stream()
                .map(Ad::getId)
                .filter(Objects::nonNull)
                .toList();

        if (adIds.isEmpty()) {
            return Collections.emptyMap();
        }

        List<AdImage> images = adImageRepository.findByAdIdInOrderByPositionAsc(adIds);

        return images.stream()
                .collect(Collectors.groupingBy(
                        AdImage::getAdId,
                        Collectors.mapping(
                                img -> new AdImageResponse(img.getId(), img.getUrl(), img.getPosition()),
                                Collectors.toList()
                        )
                ));
    }
}
