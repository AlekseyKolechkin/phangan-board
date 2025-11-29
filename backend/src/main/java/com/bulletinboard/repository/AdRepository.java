package com.bulletinboard.repository;

import com.bulletinboard.domain.Ad;
import com.bulletinboard.domain.AdStatus;
import com.bulletinboard.generated.tables.records.AdsRecord;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static com.bulletinboard.generated.Tables.ADS;

@Repository
public class AdRepository {

    private final DSLContext dsl;

    public AdRepository(DSLContext dsl) {
        this.dsl = dsl;
    }

    public Ad save(Ad ad) {
        LocalDateTime now = LocalDateTime.now();
        if (ad.getId() == null) {
            AdsRecord record = dsl.insertInto(ADS)
                    .set(ADS.TITLE, ad.getTitle())
                    .set(ADS.DESCRIPTION, ad.getDescription())
                    .set(ADS.PRICE, ad.getPrice())
                    .set(ADS.CATEGORY_ID, ad.getCategoryId())
                    .set(ADS.USER_ID, ad.getUserId())
                    .set(ADS.STATUS, ad.getStatus().name())
                    .set(ADS.CREATED_AT, now)
                    .set(ADS.UPDATED_AT, now)
                    .returning()
                    .fetchOne();
            return mapToAd(record);
        } else {
            dsl.update(ADS)
                    .set(ADS.TITLE, ad.getTitle())
                    .set(ADS.DESCRIPTION, ad.getDescription())
                    .set(ADS.PRICE, ad.getPrice())
                    .set(ADS.CATEGORY_ID, ad.getCategoryId())
                    .set(ADS.USER_ID, ad.getUserId())
                    .set(ADS.STATUS, ad.getStatus().name())
                    .set(ADS.UPDATED_AT, now)
                    .where(ADS.ID.eq(ad.getId()))
                    .execute();
            ad.setUpdatedAt(now);
            return ad;
        }
    }

    public Optional<Ad> findById(Long id) {
        AdsRecord record = dsl.selectFrom(ADS)
                .where(ADS.ID.eq(id))
                .fetchOne();
        return Optional.ofNullable(record).map(this::mapToAd);
    }

    public List<Ad> findAll() {
        return dsl.selectFrom(ADS)
                .fetch()
                .map(this::mapToAd);
    }

    public List<Ad> findByStatus(AdStatus status) {
        return dsl.selectFrom(ADS)
                .where(ADS.STATUS.eq(status.name()))
                .fetch()
                .map(this::mapToAd);
    }

    public List<Ad> findByCategoryId(Long categoryId) {
        return dsl.selectFrom(ADS)
                .where(ADS.CATEGORY_ID.eq(categoryId))
                .fetch()
                .map(this::mapToAd);
    }

    public List<Ad> findByUserId(Long userId) {
        return dsl.selectFrom(ADS)
                .where(ADS.USER_ID.eq(userId))
                .fetch()
                .map(this::mapToAd);
    }

    public List<Ad> findByCategoryIdAndStatus(Long categoryId, AdStatus status) {
        return dsl.selectFrom(ADS)
                .where(ADS.CATEGORY_ID.eq(categoryId))
                .and(ADS.STATUS.eq(status.name()))
                .fetch()
                .map(this::mapToAd);
    }

    public List<Ad> findByUserIdAndStatus(Long userId, AdStatus status) {
        return dsl.selectFrom(ADS)
                .where(ADS.USER_ID.eq(userId))
                .and(ADS.STATUS.eq(status.name()))
                .fetch()
                .map(this::mapToAd);
    }

    public boolean existsById(Long id) {
        return dsl.fetchExists(
                dsl.selectFrom(ADS)
                        .where(ADS.ID.eq(id))
        );
    }

    public void deleteById(Long id) {
        dsl.deleteFrom(ADS)
                .where(ADS.ID.eq(id))
                .execute();
    }

    private Ad mapToAd(AdsRecord record) {
        Ad ad = new Ad();
        ad.setId(record.getId());
        ad.setTitle(record.getTitle());
        ad.setDescription(record.getDescription());
        ad.setPrice(record.getPrice());
        ad.setCategoryId(record.getCategoryId());
        ad.setUserId(record.getUserId());
        ad.setStatus(AdStatus.valueOf(record.getStatus()));
        ad.setCreatedAt(record.getCreatedAt());
        ad.setUpdatedAt(record.getUpdatedAt());
        return ad;
    }
}
