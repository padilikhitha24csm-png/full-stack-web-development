-- ==============================================================================
-- Library Management System - Database Schema & Initial Seed Data
-- ==============================================================================

-- 1. Create database if it doesn't already exist
CREATE DATABASE IF NOT EXISTS library_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE library_db;

-- 2. Drop existing tables in reverse dependency order (safe for re-running)
DROP TABLE IF EXISTS book_issues;
DROP TABLE IF EXISTS members;
DROP TABLE IF EXISTS books;

-- 3. Books Table
-- Stores all library books with total quantity and currently available quantity.
CREATE TABLE books (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL,
    isbn VARCHAR(50) NOT NULL UNIQUE,
    category VARCHAR(100) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    available_quantity INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT chk_quantity CHECK (quantity >= 0),
    CONSTRAINT chk_available CHECK (available_quantity >= 0 AND available_quantity <= quantity)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Members Table
-- Stores library patrons / members with unique emails and contact numbers.
CREATE TABLE members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Book Issues Table
-- Tracks issuing and returning books with issue date, due date, return date, and status.
CREATE TABLE book_issues (
    id INT AUTO_INCREMENT PRIMARY KEY,
    book_id INT NOT NULL,
    member_id INT NOT NULL,
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    return_date DATE NULL,
    status ENUM('issued', 'returned') NOT NULL DEFAULT 'issued',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_issue_book FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_issue_member FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- Seed Data
-- ==============================================================================

-- Sample Books
INSERT INTO books (title, author, isbn, category, quantity, available_quantity) VALUES
('The Great Gatsby', 'F. Scott Fitzgerald', '978-0743273565', 'Classic Literature', 5, 4),
('Clean Code: A Handbook of Agile Software Craftsmanship', 'Robert C. Martin', '978-0132350884', 'Computer Science', 4, 3),
('To Kill a Mockingbird', 'Harper Lee', '978-0061120084', 'Classic Literature', 6, 6),
('Design Patterns: Elements of Reusable Object-Oriented Software', 'Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides', '978-0201633610', 'Computer Science', 3, 2),
('A Brief History of Time', 'Stephen Hawking', '978-0553380163', 'Science & Astronomy', 4, 4),
('Atomic Habits', 'James Clear', '978-0735211292', 'Self-Help', 7, 6),
('Sapiens: A Brief History of Humankind', 'Yuval Noah Harari', '978-0062316097', 'History', 5, 5),
('JavaScript: The Good Parts', 'Douglas Crockford', '978-0596517748', 'Computer Science', 3, 3);

-- Sample Members
INSERT INTO members (name, email, phone) VALUES
('Alice Johnson', 'alice.johnson@example.com', '555-0101'),
('Brian Smith', 'brian.smith@example.com', '555-0102'),
('Clara Davis', 'clara.davis@example.com', '555-0103'),
('David Wilson', 'david.wilson@example.com', '555-0104'),
('Emma Watson', 'emma.watson@example.com', '555-0105');

-- Sample Book Issues
-- Notice: corresponding books have available_quantity decremented appropriately!
-- Book 1 issued to Member 1 (The Great Gatsby, qty 5 -> available 4)
INSERT INTO book_issues (book_id, member_id, issue_date, due_date, return_date, status) VALUES
(1, 1, CURDATE() - INTERVAL 5 DAY, CURDATE() + INTERVAL 9 DAY, NULL, 'issued');

-- Book 2 issued to Member 2 (Clean Code, qty 4 -> available 3)
INSERT INTO book_issues (book_id, member_id, issue_date, due_date, return_date, status) VALUES
(2, 2, CURDATE() - INTERVAL 10 DAY, CURDATE() + INTERVAL 4 DAY, NULL, 'issued');

-- Book 4 issued to Member 3 (Design Patterns, qty 3 -> available 2) - overdue example
INSERT INTO book_issues (book_id, member_id, issue_date, due_date, return_date, status) VALUES
(4, 3, CURDATE() - INTERVAL 20 DAY, CURDATE() - INTERVAL 6 DAY, NULL, 'issued');

-- Book 6 issued to Member 4 (Atomic Habits, qty 7 -> available 6)
INSERT INTO book_issues (book_id, member_id, issue_date, due_date, return_date, status) VALUES
(6, 4, CURDATE() - INTERVAL 3 DAY, CURDATE() + INTERVAL 11 DAY, NULL, 'issued');

-- Returned book example (To Kill a Mockingbird returned by Alice)
INSERT INTO book_issues (book_id, member_id, issue_date, due_date, return_date, status) VALUES
(3, 1, CURDATE() - INTERVAL 30 DAY, CURDATE() - INTERVAL 16 DAY, CURDATE() - INTERVAL 18 DAY, 'returned');
