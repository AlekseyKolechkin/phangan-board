package com.bulletinboard.dto;

import com.bulletinboard.domain.AdStatus;
import jakarta.validation.constraints.NotNull;

public class AdminStatusUpdateRequest {

    @NotNull(message = "Status is required")
    private AdStatus status;

    public AdminStatusUpdateRequest() {
    }

    public AdminStatusUpdateRequest(AdStatus status) {
        this.status = status;
    }

    public AdStatus getStatus() {
        return status;
    }

    public void setStatus(AdStatus status) {
        this.status = status;
    }
}
