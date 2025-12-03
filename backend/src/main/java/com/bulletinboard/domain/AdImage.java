package com.bulletinboard.domain;

import java.time.LocalDateTime;

public class AdImage {
    private Long id;
    private Long adId;
    private String url;
    private Integer position;
    private LocalDateTime createdAt;

    public AdImage() {
    }

    public AdImage(Long id, Long adId, String url, Integer position, LocalDateTime createdAt) {
        this.id = id;
        this.adId = adId;
        this.url = url;
        this.position = position;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getAdId() {
        return adId;
    }

    public void setAdId(Long adId) {
        this.adId = adId;
    }

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }

    public Integer getPosition() {
        return position;
    }

    public void setPosition(Integer position) {
        this.position = position;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
