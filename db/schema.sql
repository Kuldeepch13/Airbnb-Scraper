CREATE DATABASE IF NOT EXISTS airbnb_scraper;
USE airbnb_scraper;

CREATE TABLE IF NOT EXISTS properties (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  room_id VARCHAR(32) NOT NULL,
  title VARCHAR(512) NULL,
  price VARCHAR(64) NULL,
  rating VARCHAR(16) NULL,
  property_url VARCHAR(2048) NOT NULL,
  images JSON NULL,
  scraped_at DATETIME NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_properties_url (property_url(512))
);

CREATE TABLE IF NOT EXISTS listings (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  title VARCHAR(512) NOT NULL,
  price VARCHAR(128) NULL,
  link VARCHAR(2048) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_listings_link (link(512))
);
