package com.bulletinboard.controller;

import com.bulletinboard.domain.AdStatus;
import com.bulletinboard.domain.Area;
import com.bulletinboard.domain.PricePeriod;
import com.bulletinboard.dto.*;
import com.bulletinboard.service.AdImageService;
import com.bulletinboard.service.AdService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/ads")
public class AdController {

    private final AdService adService;
    private final AdImageService adImageService;

    public AdController(AdService adService, AdImageService adImageService) {
        this.adService = adService;
        this.adImageService = adImageService;
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

    @GetMapping("/search")
    public ResponseEntity<PageResponse<AdResponse>> searchAds(
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) AdStatus status,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false, name = "q") String search,
            @RequestParam(required = false) Area area,
            @RequestParam(required = false) PricePeriod pricePeriod,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDirection) {

        AdSearchRequest request = new AdSearchRequest();
        request.setCategoryId(categoryId);
        request.setUserId(userId);
        request.setStatus(status);
        request.setMinPrice(minPrice);
        request.setMaxPrice(maxPrice);
        request.setSearch(search);
        request.setArea(area);
        request.setPricePeriod(pricePeriod);
        request.setPage(page);
        request.setSize(size);
        request.setSortBy(sortBy);
        request.setSortDirection(sortDirection);

        return ResponseEntity.ok(adService.searchAds(request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AdResponse> getAdById(@PathVariable Long id) {
        return ResponseEntity.ok(adService.getAdById(id));
    }

    @PostMapping("/{id}/images")
    public ResponseEntity<List<AdImageResponse>> uploadImages(
            @PathVariable long id,
            @RequestPart("files") List<MultipartFile> files,
            @RequestHeader("X-Edit-Token") String editToken
    ) {
        List<AdImageResponse> responses = adImageService.uploadImages(id, files, editToken);
        return ResponseEntity.status(HttpStatus.CREATED).body(responses);
    }

    @DeleteMapping("/{adId}/images/{imageId}")
    public ResponseEntity<Void> deleteImage(
            @PathVariable long adId,
            @PathVariable long imageId,
            @RequestHeader("X-Edit-Token") String editToken
    ) {
        adImageService.deleteImage(adId, imageId, editToken);
        return ResponseEntity.noContent().build();
    }

    @PostMapping
    public ResponseEntity<AdResponse> createAd(@Valid @RequestBody AdCreateRequest request, HttpServletRequest httpRequest) {
        String clientIp = getClientIp(httpRequest);
        AdResponse created = adService.createAd(request, clientIp);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isBlank()) {
            return xForwardedFor.split(",")[0].trim();
        }
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isBlank()) {
            return xRealIp;
        }
        return request.getRemoteAddr();
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

    @GetMapping("/edit/{token}")
    public ResponseEntity<AdResponse> getAdByEditToken(@PathVariable String token) {
        return ResponseEntity.ok(adService.getAdByEditToken(token));
    }

    @PutMapping("/edit/{token}")
    public ResponseEntity<AdResponse> updateAdByEditToken(
            @PathVariable String token,
            @Valid @RequestBody AdUpdateRequest request) {
        return ResponseEntity.ok(adService.updateAdByEditToken(token, request));
    }

    @DeleteMapping("/edit/{token}")
    public ResponseEntity<Void> deleteAdByEditToken(@PathVariable String token) {
        adService.deleteAdByEditToken(token);
        return ResponseEntity.noContent().build();
    }
}
