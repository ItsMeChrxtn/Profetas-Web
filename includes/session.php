<?php
/**
 * Starts the single site-wide session, shared by the customer site and
 * the admin panel. One account, one login, one session either way.
 */
if (session_status() === PHP_SESSION_NONE) {
    session_name('profetas_session');
    session_start();
}
