package com.bulletinboard.repository;

import com.bulletinboard.domain.Ad;
import com.bulletinboard.domain.AdStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AdRepository extends JpaRepository<Ad, Long> {
    Page<Ad> findByStatus(AdStatus status, Pageable pageable);
    Page<Ad> findByCategoryId(Long categoryId, Pageable pageable);
    Page<Ad> findByUserId(Long userId, Pageable pageable);
    Page<Ad> findByCategoryIdAndStatus(Long categoryId, AdStatus status, Pageable pageable);
    List<Ad> findByUserIdAndStatus(Long userId, AdStatus status);
}
