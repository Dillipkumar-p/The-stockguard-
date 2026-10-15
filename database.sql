
-- =====================================================
-- PROJECT: STOCKGUARD
-- SMART INVENTORY AND EXPIRY DATE MANAGEMENT SYSTEM
-- DATABASE: ORACLE SQL
-- =====================================================


-- 1. CREATE PRODUCTS TABLE

CREATE TABLE products (
    id NUMBER PRIMARY KEY,
    name VARCHAR2(100) NOT NULL,
    category VARCHAR2(50) NOT NULL,
    quantity NUMBER DEFAULT 0 CHECK (quantity >= 0),
    expiry_date DATE NOT NULL
);


-- 2. INSERT SAMPLE PRODUCTS

INSERT INTO products
VALUES (1, 'Rice', 'Grocery', 50, DATE '2027-06-30');

INSERT INTO products
VALUES (2, 'Milk', 'Dairy', 20, DATE '2026-10-25');

INSERT INTO products
VALUES (3, 'Biscuits', 'Snacks', 100, DATE '2026-10-10');

INSERT INTO products
VALUES (4, 'Cooking Oil', 'Grocery', 30, DATE '2027-01-15');

INSERT INTO products
VALUES (5, 'Juice', 'Beverages', 15, DATE '2026-11-20');

COMMIT;


-- 3. DISPLAY ALL PRODUCTS

SELECT * FROM products;


-- 4. SEARCH PRODUCT BY NAME

SELECT *
FROM products
WHERE name LIKE '%Rice%';


-- 5. SEARCH PRODUCTS BY CATEGORY

SELECT *
FROM products
WHERE category = 'Grocery';


-- 6. DISPLAY PRODUCTS WITH LOW STOCK

SELECT *
FROM products
WHERE quantity < 20;


-- 7. DISPLAY EXPIRED PRODUCTS

SELECT *
FROM products
WHERE expiry_date < TRUNC(SYSDATE);


-- 8. DISPLAY PRODUCTS EXPIRING WITHIN 30 DAYS

SELECT *
FROM products
WHERE expiry_date >= TRUNC(SYSDATE)
AND expiry_date <= TRUNC(SYSDATE) + 30
ORDER BY expiry_date;


-- 9. UPDATE PRODUCT QUANTITY

UPDATE products
SET quantity = 40
WHERE id = 1;

COMMIT;


-- 10. INCREA
SE STOCK QUANTITY

UPDATE products
SET quantity = quantity + 10
WHERE id = 1;

COMMIT;


-- 11. COUNT TOTAL PRODUCT RECORDS

SELECT COUNT(*) AS total_products
FROM products;


-- 12. DISPLAY TOTAL STOCK BY CATEGORY

SELECT category, SUM(quantity) AS total_quantity
FROM products
GROUP BY category;


-- 13. DISPLAY PRODUCTS SORTED BY EXPIRY DATE

SELECT *
FROM products
ORDER BY expiry_date ASC;


-- 14. DISPLAY PRODUCTS WITH ZERO STOCK

SELECT *
FROM products
WHERE quantity = 0;


-- 15. DELETE A PRODUCT
-- Execute this separately only when required.

-- DELETE FROM products WHERE id = 5;
-- COMMIT;


-- 16. VERIFY FINAL PRODUCT RECORDS

SELECT * FROM products
ORDER BY id;
