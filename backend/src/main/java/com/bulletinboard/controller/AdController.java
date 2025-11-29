package com.bulletinboard.controller;

import com.bulletinboard.domain.AdStatus;
import com.bulletinboard.dto.AdCreateRequest;
import com.bulletinboard.dto.AdResponse;
import com.bulletinboard.dto.AdUpdateRequest;
import com.bulletinboard.service.AdService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ads")
public class AdController {

    private final AdService adService;

    public AdController(AdService adService) {
        this.adService = adService;
    }

    @GetMapping
    public ResponseEntity<List<AdResponse>> getAllAds(
            @RequestParam(required = false) AdStatus status,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Long userId) {

        List<AdResponse> ads;

        if (status != null) {
            ads = adService.getAdsByStatus(status);
        } else if (categoryId != null) {
            ads = adService.getAdsByCategoryId(categoryId);
        } else if (userId != null) {
            ads = adService.getAdsByUserId(userId);
        } else {
            ads = adService.getAllAds();
        }

        return ResponseEntity.ok(ads);
    }

    @GetMapping("/active")
    public ResponseEntity<List<AdResponse>> getActiveAds() {
        return ResponseEntity.ok(adService.getActiveAds());
    }

    @GetMapping("/{id}")
    public ResponseEntity<AdResponse> getAdById(@PathVariable Long id) {
        return ResponseEntity.ok(adService.getAdById(id));
    }

    @PostMapping
    public ResponseEntity<AdResponse> createAd(@Valid @RequestBody AdCreateRequest request) {
        AdResponse created = adService.createAd(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<AdResponse> updateAd(@PathVariable Long id, @Valid @RequestBody AdUpdateRequest request) {
        return ResponseEntity.ok(adService.updateAd(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAd(@PathVariable Long id) {
        adService.deleteAd(id);
        return ResponseEntity.noContent().build();
    }
}
