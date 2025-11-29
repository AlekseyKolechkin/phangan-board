package com.bulletinboard.repository;

import com.bulletinboard.domain.User;
import com.bulletinboard.generated.tables.records.UsersRecord;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static com.bulletinboard.generated.Tables.USERS;

@Repository
public class UserRepository {

    private final DSLContext dsl;

    public UserRepository(DSLContext dsl) {
        this.dsl = dsl;
    }

    public User save(User user) {
        if (user.getId() == null) {
            LocalDateTime now = LocalDateTime.now();
            UsersRecord record = dsl.insertInto(USERS)
                    .set(USERS.NAME, user.getName())
                    .set(USERS.EMAIL, user.getEmail())
                    .set(USERS.PHONE, user.getPhone())
                    .set(USERS.CREATED_AT, now)
                    .returning()
                    .fetchOne();
            return mapToUser(record);
        } else {
            dsl.update(USERS)
                    .set(USERS.NAME, user.getName())
                    .set(USERS.EMAIL, user.getEmail())
                    .set(USERS.PHONE, user.getPhone())
                    .where(USERS.ID.eq(user.getId()))
                    .execute();
            return user;
        }
    }

    public Optional<User> findById(Long id) {
        UsersRecord record = dsl.selectFrom(USERS)
                .where(USERS.ID.eq(id))
                .fetchOne();
        return Optional.ofNullable(record).map(this::mapToUser);
    }

    public Optional<User> findByEmail(String email) {
        UsersRecord record = dsl.selectFrom(USERS)
                .where(USERS.EMAIL.eq(email))
                .fetchOne();
        return Optional.ofNullable(record).map(this::mapToUser);
    }

    public List<User> findAll() {
        return dsl.selectFrom(USERS)
                .fetch()
                .map(this::mapToUser);
    }

    public boolean existsByEmail(String email) {
        return dsl.fetchExists(
                dsl.selectFrom(USERS)
                        .where(USERS.EMAIL.eq(email))
        );
    }

    public boolean existsById(Long id) {
        return dsl.fetchExists(
                dsl.selectFrom(USERS)
                        .where(USERS.ID.eq(id))
        );
    }

    public void deleteById(Long id) {
        dsl.deleteFrom(USERS)
                .where(USERS.ID.eq(id))
                .execute();
    }

    private User mapToUser(UsersRecord record) {
        User user = new User();
        user.setId(record.getId());
        user.setName(record.getName());
        user.setEmail(record.getEmail());
        user.setPhone(record.getPhone());
        user.setCreatedAt(record.getCreatedAt());
        return user;
    }
}
