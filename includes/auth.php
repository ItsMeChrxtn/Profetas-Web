<?php
/**
 * Site-wide authentication helpers, shared by the customer site and the
 * admin panel. Requires includes/session.php to have already run.
 */

function is_logged_in(): bool
{
    return isset($_SESSION['user_id']);
}

function current_customer_id(): ?int
{
    return $_SESSION['user_id'] ?? null;
}

function current_customer_name(): string
{
    return $_SESSION['user_name'] ?? '';
}

function current_user_role(): ?string
{
    return $_SESSION['user_role'] ?? null;
}

/** Redirects to login if not authenticated, remembering where to return to. */
function require_login(): void
{
    if (!is_logged_in()) {
        $_SESSION['redirect_after_login'] = $_SERVER['REQUEST_URI'] ?? 'index.php';
        header('Location: login.php');
        exit;
    }
}
