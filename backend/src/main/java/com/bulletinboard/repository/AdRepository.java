package com.bulletinboard.repository;

import com.bulletinboard.domain.Ad;
import com.bulletinboard.domain.AdStatus;
import com.bulletinboard.domain.Area;
import com.bulletinboard.domain.PricePeriod;
import com.bulletinboard.dto.AdSearchRequest;
import com.bulletinboard.generated.tables.records.AdsRecord;
import org.jooq.Condition;
import org.jooq.DSLContext;
import org.jooq.SortField;
import org.jooq.impl.DSL;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.ArrayList;
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
            var insertStep = dsl.insertInto(ADS)
                    .set(ADS.TITLE, ad.getTitle())
                    .set(ADS.DESCRIPTION, ad.getDescription())
                    .set(ADS.PRICE, ad.getPrice())
                    .set(ADS.CATEGORY_ID, ad.getCategoryId())
                    .set(ADS.STATUS, ad.getStatus().name())
                    .set(ADS.CREATED_AT, now)
                    .set(ADS.UPDATED_AT, now)
                    .set(ADS.CREATED_IP, ad.getCreatedIp())
                    .set(ADS.AREA, ad.getArea() != null ? ad.getArea().name() : null)
                    .set(ADS.PRICE_PERIOD, ad.getPricePeriod() != null ? ad.getPricePeriod().name() : null)
                    .set(ADS.EDIT_TOKEN, ad.getEditToken());
            AdsRecord record = insertStep.returning().fetchOne();
            return mapToAd(record);
        } else {
            var updateStep = dsl.update(ADS)
                    .set(ADS.TITLE, ad.getTitle())
                    .set(ADS.DESCRIPTION, ad.getDescription())
                    .set(ADS.PRICE, ad.getPrice())
                    .set(ADS.CATEGORY_ID, ad.getCategoryId())
                    .set(ADS.STATUS, ad.getStatus().name())
                    .set(ADS.UPDATED_AT, now)
                    .set(ADS.AREA, ad.getArea() != null ? ad.getArea().name() : null)
                    .set(ADS.PRICE_PERIOD, ad.getPricePeriod() != null ? ad.getPricePeriod().name() : null);
            updateStep.where(ADS.ID.eq(ad.getId())).execute();
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

//    public List<Ad> findByUserId(Long userId) {
//        return dsl.selectFrom(ADS)
//                .where(ADS.USER_ID.eq(userId))
//                .fetch()
//                .map(this::mapToAd);
//    }

    public List<Ad> findByCategoryIdAndStatus(Long categoryId, AdStatus status) {
        return dsl.selectFrom(ADS)
                .where(ADS.CATEGORY_ID.eq(categoryId))
                .and(ADS.STATUS.eq(status.name()))
                .fetch()
                .map(this::mapToAd);
    }

//    public List<Ad> findByUserIdAndStatus(Long userId, AdStatus status) {
//        return dsl.selectFrom(ADS)
//                .where(ADS.USER_ID.eq(userId))
//                .and(ADS.STATUS.eq(status.name()))
//                .fetch()
//                .map(this::mapToAd);
//    }

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

    public Optional<Ad> findByEditToken(String editToken) {
        AdsRecord record = dsl.selectFrom(ADS)
                .where(ADS.EDIT_TOKEN.eq(editToken))
                .fetchOne();
        return Optional.ofNullable(record).map(this::mapToAd);
    }

    public long countByIpSince(String ip, LocalDateTime since) {
        return dsl.selectCount()
                .from(ADS)
                .where(ADS.CREATED_IP.eq(ip))
                .and(ADS.CREATED_AT.ge(since))
                .fetchOne(0, Long.class);
    }

    public List<Ad> searchAds(AdSearchRequest request) {
        List<Condition> conditions = buildSearchConditions(request);
        SortField<?> sortField = buildSortField(request.getSortBy(), request.getSortDirection());

        return dsl.selectFrom(ADS)
                .where(conditions)
                .orderBy(sortField)
                .limit(request.getSize())
                .offset(request.getPage() * request.getSize())
                .fetch()
                .map(this::mapToAd);
    }

    public long countAds(AdSearchRequest request) {
        List<Condition> conditions = buildSearchConditions(request);

        return dsl.selectCount()
                .from(ADS)
                .where(conditions)
                .fetchOne(0, Long.class);
    }

    private List<Condition> buildSearchConditions(AdSearchRequest request) {
        List<Condition> conditions = new ArrayList<>();

        if (request.getStatus() != null) {
            conditions.add(ADS.STATUS.eq(request.getStatus().name()));
        }

        if (request.getCategoryId() != null) {
            conditions.add(ADS.CATEGORY_ID.eq(request.getCategoryId()));
        }

//        if (request.getUserId() != null) {
//            conditions.add(ADS.USER_ID.eq(request.getUserId()));
//        }

        if (request.getMinPrice() != null) {
            conditions.add(ADS.PRICE.ge(request.getMinPrice()));
        }

        if (request.getMaxPrice() != null) {
            conditions.add(ADS.PRICE.le(request.getMaxPrice()));
        }

        if (request.getSearch() != null && !request.getSearch().isBlank()) {
            String searchPattern = "%" + request.getSearch().toLowerCase() + "%";
            conditions.add(
                    DSL.lower(ADS.TITLE).like(searchPattern)
                            .or(DSL.lower(ADS.DESCRIPTION).like(searchPattern))
            );
        }

        if (request.getArea() != null) {
            conditions.add(ADS.AREA.eq(request.getArea().name()));
        }

        if (request.getPricePeriod() != null) {
            conditions.add(ADS.PRICE_PERIOD.eq(request.getPricePeriod().name()));
        }

        if (conditions.isEmpty()) {
            conditions.add(DSL.trueCondition());
        }

        return conditions;
    }

    private SortField<?> buildSortField(String sortBy, String sortDirection) {
        boolean isAsc = "asc".equalsIgnoreCase(sortDirection);

        return switch (sortBy != null ? sortBy.toLowerCase() : "createdat") {
            case "price" -> isAsc ? ADS.PRICE.asc() : ADS.PRICE.desc();
            case "title" -> isAsc ? ADS.TITLE.asc() : ADS.TITLE.desc();
            case "updatedat" -> isAsc ? ADS.UPDATED_AT.asc() : ADS.UPDATED_AT.desc();
            default -> isAsc ? ADS.CREATED_AT.asc() : ADS.CREATED_AT.desc();
        };
    }

    private Ad mapToAd(AdsRecord record) {
        Ad ad = new Ad();
        ad.setId(record.getId());
        ad.setTitle(record.getTitle());
        ad.setDescription(record.getDescription());
        ad.setPrice(record.getPrice());
        ad.setCategoryId(record.getCategoryId());
//        ad.setUserId(record.getUserId());
        ad.setStatus(AdStatus.valueOf(record.getStatus()));
        ad.setCreatedAt(record.getCreatedAt());
        ad.setUpdatedAt(record.getUpdatedAt());
        ad.setCreatedIp(record.getCreatedIp());
        if (record.getArea() != null) {
            ad.setArea(Area.valueOf(record.getArea()));
        }
        if (record.getPricePeriod() != null) {
            ad.setPricePeriod(PricePeriod.valueOf(record.getPricePeriod()));
        }
        ad.setEditToken(record.getEditToken());
        return ad;
    }
}
