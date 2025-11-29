package com.bulletinboard.repository;

import com.bulletinboard.domain.Category;
import com.bulletinboard.generated.tables.records.CategoriesRecord;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

import static com.bulletinboard.generated.Tables.CATEGORIES;

@Repository
public class CategoryRepository {

    private final DSLContext dsl;

    public CategoryRepository(DSLContext dsl) {
        this.dsl = dsl;
    }

    public Category save(Category category) {
        if (category.getId() == null) {
            CategoriesRecord record = dsl.insertInto(CATEGORIES)
                    .set(CATEGORIES.NAME, category.getName())
                    .set(CATEGORIES.DESCRIPTION, category.getDescription())
                    .returning()
                    .fetchOne();
            return mapToCategory(record);
        } else {
            dsl.update(CATEGORIES)
                    .set(CATEGORIES.NAME, category.getName())
                    .set(CATEGORIES.DESCRIPTION, category.getDescription())
                    .where(CATEGORIES.ID.eq(category.getId()))
                    .execute();
            return category;
        }
    }

    public Optional<Category> findById(Long id) {
        CategoriesRecord record = dsl.selectFrom(CATEGORIES)
                .where(CATEGORIES.ID.eq(id))
                .fetchOne();
        return Optional.ofNullable(record).map(this::mapToCategory);
    }

    public Optional<Category> findByName(String name) {
        CategoriesRecord record = dsl.selectFrom(CATEGORIES)
                .where(CATEGORIES.NAME.eq(name))
                .fetchOne();
        return Optional.ofNullable(record).map(this::mapToCategory);
    }

    public List<Category> findAll() {
        return dsl.selectFrom(CATEGORIES)
                .fetch()
                .map(this::mapToCategory);
    }

    public boolean existsByName(String name) {
        return dsl.fetchExists(
                dsl.selectFrom(CATEGORIES)
                        .where(CATEGORIES.NAME.eq(name))
        );
    }

    public boolean existsById(Long id) {
        return dsl.fetchExists(
                dsl.selectFrom(CATEGORIES)
                        .where(CATEGORIES.ID.eq(id))
        );
    }

    public void deleteById(Long id) {
        dsl.deleteFrom(CATEGORIES)
                .where(CATEGORIES.ID.eq(id))
                .execute();
    }

    private Category mapToCategory(CategoriesRecord record) {
        Category category = new Category();
        category.setId(record.getId());
        category.setName(record.getName());
        category.setDescription(record.getDescription());
        return category;
    }
}
