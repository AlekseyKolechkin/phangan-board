package com.bulletinboard.service;

import com.bulletinboard.domain.Ad;
import com.bulletinboard.domain.AdStatus;
import com.bulletinboard.domain.Category;
import com.bulletinboard.domain.User;
import com.bulletinboard.dto.AdResponse;
import com.bulletinboard.exception.ResourceNotFoundException;
import com.bulletinboard.repository.AdRepository;
import com.bulletinboard.repository.CategoryRepository;
import com.bulletinboard.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AdminService {

    private final AdRepository adRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;

    public AdminService(AdRepository adRepository, CategoryRepository categoryRepository, UserRepository userRepository) {
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

    public AdResponse updateAdStatus(Long id, AdStatus status) {
        Ad ad = adRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ad", id));
        
        ad.setStatus(status);
        Ad updated = adRepository.save(ad);
        return toAdResponse(updated);
    }

    public void deleteAd(Long id) {
        Ad ad = adRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ad", id));
        
        ad.setStatus(AdStatus.DELETED);
        adRepository.save(ad);
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
