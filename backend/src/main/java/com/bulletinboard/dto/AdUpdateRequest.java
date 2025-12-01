package com.bulletinboard.dto;

import com.bulletinboard.domain.AdStatus;
import com.bulletinboard.domain.Area;
import com.bulletinboard.domain.PricePeriod;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public class AdUpdateRequest {

    @Size(min = 3, max = 255, message = "Title must be between 3 and 255 characters")
    private String title;

    @Size(max = 5000, message = "Description must not exceed 5000 characters")
    private String description;

    @Positive(message = "Price must be positive")
    private BigDecimal price;

    private Long categoryId;

    private AdStatus status;

    private Area area;

    private PricePeriod pricePeriod;

    public AdUpdateRequest() {
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

    public AdStatus getStatus() {
        return status;
    }

    public void setStatus(AdStatus status) {
        this.status = status;
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
}
