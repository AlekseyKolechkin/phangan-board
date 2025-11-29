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
import com.bulletinboard.exception.ResourceNotFoundException;
import com.bulletinboard.repository.AdRepository;
import com.bulletinboard.repository.CategoryRepository;
import com.bulletinboard.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AdService {

    private final AdRepository adRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;

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

    public AdResponse createAd(AdCreateRequest request) {
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

        Ad saved = adRepository.save(ad);
        return toAdResponse(saved);
    }

    public AdResponse updateAd(Long id, AdUpdateRequest request) {
        Ad ad = adRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ad", id));

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
}
