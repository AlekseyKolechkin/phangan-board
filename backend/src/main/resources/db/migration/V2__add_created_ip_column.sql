-- Add created_ip column to ads table for anti-spam tracking
ALTER TABLE ads ADD COLUMN created_ip VARCHAR(45);

-- Create index for efficient IP-based queries
CREATE INDEX idx_ads_created_ip ON ads(created_ip);

-- Create index for IP rate limiting queries (IP + created_at)
CREATE INDEX idx_ads_ip_created_at ON ads(created_ip, created_at);
