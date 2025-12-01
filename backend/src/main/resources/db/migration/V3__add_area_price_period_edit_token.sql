ALTER TABLE ads ADD COLUMN area VARCHAR(50);
ALTER TABLE ads ADD COLUMN price_period VARCHAR(20);
ALTER TABLE ads ADD COLUMN edit_token VARCHAR(64) UNIQUE;

CREATE INDEX idx_ads_area ON ads(area);
CREATE INDEX idx_ads_price_period ON ads(price_period);
CREATE INDEX idx_ads_edit_token ON ads(edit_token);
