USE bookstore;
DROP TABLE IF EXISTS books;
CREATE TABLE IF NOT EXISTS books (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) UNIQUE NOT NULL,
    author VARCHAR(255) NOT NULL,
    ISBN VARCHAR(25) NOT NULL,
    publisher VARCHAR(255) NOT NULL,
    year_published VARCHAR(6) NOT NULL,
    bookGetDate Date NOT NULL,
    is_available boolean NOT NULL
);

INSERT INTO books (title, author, ISBN, publisher, year_published, bookGetDate, is_available) VALUES ('A Tale of Two Cities', 'Charles Dickens', '978-0-141-43960-0', 'Penguin Classics', '1859', NOW(), true);
INSERT INTO books (title, author, ISBN, publisher, year_published, bookGetDate, is_available) VALUES ('The Little Prince', 'Antoine de Saint-Exupéry', '978-0-15-601219-5', 'Harcourt', '1943', NOW(), true);
INSERT INTO books (title, author, ISBN, publisher, year_published, bookGetDate, is_available) VALUES ('ACCIDENTS DO NOT HAPPEN', 'Dr Sankar Rajeev', '978-81-933904-8-1', 'KY Publications', '2018', NOW(), true);
INSERT INTO books (title, author, ISBN, publisher, year_published, bookGetDate, is_available) VALUES ('An Eco-Critical Appraisal of the Selected Novels of Amitav Ghosh', 'Rabia Mukhtar', '978-81-933904-9-8', 'KY Publications', '2018', NOW(), true);
INSERT INTO books (title, author, ISBN, publisher, year_published, bookGetDate, is_available) VALUES ('The Great Gatsby', 'F. Scott Fitzgerald', '978-07-432735-6-5', 'Scribner', '2004', NOW(), true);
INSERT INTO books (title, author, ISBN, publisher, year_published, bookGetDate, is_available) VALUES ('To Kill a Mockingbird', 'Harper Lee', '978-00-611200-8-4', 'Harper Perennial Modern Classics', '2006', NOW(), true);
INSERT INTO books (title, author, ISBN, publisher, year_published, bookGetDate, is_available) VALUES ('Pride and Prejudice', 'Jane Austen', '978-15-032905-6-3', 'CreateSpace Independent Publishing Platform', '2014', NOW(), true);
INSERT INTO books (title, author, ISBN, publisher, year_published, bookGetDate, is_available) VALUES ('The Catcher in the Rye', 'J.D. Salinger', '978-03-167694-8-8', 'Little, Brown and Company', '1991', NOW(), true);
INSERT INTO books (title, author, ISBN, publisher, year_published, bookGetDate, is_available) VALUES ('The Alchemist', 'Paulo Coelho', '978-00-623150-0-7', 'HarperOne', '2014', NOW(), true);

/* User table */
DROP TABLE IF EXISTS users;
CREATE TABLE IF NOT EXISTS users (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL
);
INSERT INTO users (username, password, email) VALUES ('user123', '$2a$10$uUJGW6TVnOTkazes1af/aO2ohWAOXLOQfEbR84mWg7psVnHQgy1k.', 'example@gmail.com'); /* password: password */

/* Staff table */
DROP TABLE IF EXISTS staff;
CREATE TABLE IF NOT EXISTS staff (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    fullname VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL
);
INSERT INTO staff (username, fullname, password) VALUES ('CTM','Chan Tai Man', '$2a$10$uUJGW6TVnOTkazes1af/aO2ohWAOXLOQfEbR84mWg7psVnHQgy1k.'); /* password: password */

/* Admin table */
DROP TABLE IF EXISTS admin;
CREATE TABLE IF NOT EXISTS admin (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL
);
INSERT INTO admin (username, password) VALUES ('admin', '$2a$10$uUJGW6TVnOTkazes1af/aO2ohWAOXLOQfEbR84mWg7psVnHQgy1k.'); /* password: password */