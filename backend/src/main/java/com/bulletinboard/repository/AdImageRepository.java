package com.bulletinboard.repository;

import com.bulletinboard.domain.AdImage;
import com.bulletinboard.generated.tables.records.AdImagesRecord;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

import static com.bulletinboard.generated.Tables.AD_IMAGES;

@Repository
public class AdImageRepository {

    private final DSLContext dsl;

    public AdImageRepository(DSLContext dsl) {
        this.dsl = dsl;
    }

    public AdImage save(AdImage image) {
        if (image.getId() == null) {
            AdImagesRecord record = dsl.insertInto(AD_IMAGES)
                    .set(AD_IMAGES.AD_ID, image.getAdId())
                    .set(AD_IMAGES.URL, image.getUrl())
                    .set(AD_IMAGES.POSITION, image.getPosition())
                    .returning()
                    .fetchOne();
            return map(record);
        } else {
            dsl.update(AD_IMAGES)
                    .set(AD_IMAGES.URL, image.getUrl())
                    .set(AD_IMAGES.POSITION, image.getPosition())
                    .where(AD_IMAGES.ID.eq(image.getId()))
                    .execute();
            return image;
        }
    }

    public List<AdImage> findByAdId(Long adId) {
        return dsl.selectFrom(AD_IMAGES)
                .where(AD_IMAGES.AD_ID.eq(adId))
                .orderBy(AD_IMAGES.POSITION.asc())
                .fetch()
                .map(this::map);
    }

    public Optional<AdImage> findById(Long id) {
        AdImagesRecord record = dsl.selectFrom(AD_IMAGES)
                .where(AD_IMAGES.ID.eq(id))
                .fetchOne();
        return Optional.ofNullable(record).map(this::map);
    }

    public void deleteById(Long id) {
        dsl.deleteFrom(AD_IMAGES)
                .where(AD_IMAGES.ID.eq(id))
                .execute();
    }

    public List<AdImage> findByAdIdOrderByPositionAsc(Long adId) {
        return dsl.selectFrom(AD_IMAGES)
                .where(AD_IMAGES.AD_ID.eq(adId))
                .orderBy(AD_IMAGES.POSITION.asc())
                .fetch(this::map);
    }

    public List<AdImage> findByAdIdInOrderByPositionAsc(List<Long> adIds) {
        if (adIds == null || adIds.isEmpty()) {
            return List.of();
        }

        return dsl.selectFrom(AD_IMAGES)
                .where(AD_IMAGES.AD_ID.in(adIds))
                .orderBy(AD_IMAGES.AD_ID.asc(), AD_IMAGES.POSITION.asc())
                .fetch(this::map);
    }


    private AdImage map(AdImagesRecord r) {
        AdImage img = new AdImage();
        img.setId(r.getId());
        img.setAdId(r.getAdId());
        img.setUrl(r.getUrl());
        img.setPosition(r.getPosition());
        img.setCreatedAt(r.getCreatedAt());
        return img;
    }
}
