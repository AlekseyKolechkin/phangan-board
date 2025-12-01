package com.bulletinboard.controller;

import com.bulletinboard.domain.AdStatus;
import com.bulletinboard.dto.AdResponse;
import com.bulletinboard.dto.AdminStatusUpdateRequest;
import com.bulletinboard.service.AdminService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/ads")
    public ResponseEntity<List<AdResponse>> getAllAds(
            @RequestParam(required = false) AdStatus status) {
        List<AdResponse> ads;
        if (status != null) {
            ads = adminService.getAdsByStatus(status);
        } else {
            ads = adminService.getAllAds();
        }
        return ResponseEntity.ok(ads);
    }

    @PutMapping("/ads/{id}/status")
    public ResponseEntity<AdResponse> updateAdStatus(
            @PathVariable Long id,
            @Valid @RequestBody AdminStatusUpdateRequest request) {
        return ResponseEntity.ok(adminService.updateAdStatus(id, request.getStatus()));
    }

    @DeleteMapping("/ads/{id}")
    public ResponseEntity<Void> deleteAd(@PathVariable Long id) {
        adminService.deleteAd(id);
        return ResponseEntity.noContent().build();
    }
}
