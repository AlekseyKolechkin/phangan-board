package com.bulletinboard.dto;

import com.bulletinboard.domain.Ad;
import com.bulletinboard.domain.AdStatus;
import com.bulletinboard.domain.Area;
import com.bulletinboard.domain.PricePeriod;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class AdResponse {

    private Long id;
    private String title;
    private String description;
    private BigDecimal price;
    private Long categoryId;
    private String categoryName;
    private Long userId;
    private String userName;
    private AdStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Area area;
    private PricePeriod pricePeriod;
    private String editToken;
    private List<AdImageResponse> images;

    public AdResponse() {
    }

    public static AdResponse fromAd(Ad ad) {
        AdResponse response = new AdResponse();
        response.setId(ad.getId());
        response.setTitle(ad.getTitle());
        response.setDescription(ad.getDescription());
        response.setPrice(ad.getPrice());
        response.setCategoryId(ad.getCategoryId());
        response.setUserId(ad.getUserId());
        response.setStatus(ad.getStatus());
        response.setCreatedAt(ad.getCreatedAt());
        response.setUpdatedAt(ad.getUpdatedAt());
        response.setArea(ad.getArea());
        response.setPricePeriod(ad.getPricePeriod());
        return response;
    }

    public static AdResponse fromAdWithToken(Ad ad, String categoryName, String userName) {
        AdResponse response = fromAd(ad, categoryName, userName);
        response.setEditToken(ad.getEditToken());
        return response;
    }

    public static AdResponse fromAd(Ad ad, String categoryName, String userName) {
        AdResponse response = fromAd(ad);
        response.setCategoryName(categoryName);
        response.setUserName(userName);
        return response;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public Long getCategoryId() {
        return categoryId;
    }

    public void setCategoryId(Long categoryId) {
        this.categoryId = categoryId;
    }

    public String getCategoryName() {
        return categoryName;
    }

    public void setCategoryName(String categoryName) {
        this.categoryName = categoryName;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public AdStatus getStatus() {
        return status;
    }

    public void setStatus(AdStatus status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public Area getArea() {
        return area;
    }

    public void setArea(Area area) {
        this.area = area;
    }

    public PricePeriod getPricePeriod() {
        return pricePeriod;
    }

    public void setPricePeriod(PricePeriod pricePeriod) {
        this.pricePeriod = pricePeriod;
    }

    public String getEditToken() {
        return editToken;
    }

    public void setEditToken(String editToken) {
        this.editToken = editToken;
    }

    public List<AdImageResponse> getImages() {
        return images;
    }

    public void setImages(List<AdImageResponse> images) {
        this.images = images;
    }
}
