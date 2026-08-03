<?php
/**
 * Admin-side guard on top of the shared site session (includes/auth.php).
 * Any logged-in account with role = 'admin' can reach the admin panel.
 */

function is_admin_logged_in(): bool
{
    return isset($_SESSION['user_id']) && ($_SESSION['user_role'] ?? '') === 'admin';
}

function current_admin_name(): string
{
    return $_SESSION['user_name'] ?? 'Admin';
}

/** Redirects to the shared login page if not authenticated as an admin. */
function require_admin_login(): void
{
    if (!is_admin_logged_in()) {
        header('Location: ../login.php');
        exit;
    }
}
