<?php
/**
 * Shared database connection (PDO) used by BOTH the customer site (project
 * root) and the admin panel (/admin). One place to change credentials.
 *
 * Usage from a root-level customer file:
 *   require_once __DIR__ . '/config/db.php';
 * Usage from a file inside /admin:
 *   require_once __DIR__ . '/../config/db.php';
 *
 * __DIR__ is used everywhere it's included so it works regardless of which
 * script triggered the request (unlike relative paths in `include`).
 */

const DB_HOST = 'localhost';
const DB_NAME = 'profetas_farm';
const DB_USER = 'root';
const DB_PASS = '';

try {
    $pdo = new PDO(
        'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4',
        DB_USER,
        DB_PASS,
        [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]
    );
} catch (PDOException $e) {
    http_response_code(500);
    die('Database connection failed. Please try again later.');
}
