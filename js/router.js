/**
 * Minimal client-side router.
 *
 * Fetches HTML fragments from screens/*.html and swaps them into
 * #screen-root (the .ipod-screen element), so the iPod shell + wheel never
 * reload. Uses history.pushState/popstate for clean, bookmarkable URLs
 * (e.g. /skills instead of /#skills).
 */
(function () {
    const screenRoot = document.getElementById('screen-root');
    const fragmentCache = new Map();

    function normalizePath(path) {
        if (!path) return '/';
        if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1);
        return path || '/';
    }

    function resolveScreen(path) {
        const normalized = normalizePath(path);
        const data = window.ScreensData[normalized];
        if (data) return { path: normalized, data };
        return { path: '/', data: window.ScreensData['/'] };
    }

    function isShellHtml(html) {
        // Detect when a dev server's SPA fallback returns index.html instead of
        // the fragment (common with `serve -s` when cleanUrls strips .html).
        return /<!DOCTYPE html/i.test(html) ||
            html.includes('id="wheel-container"') ||
            html.includes('id="screen-root"');
    }

    async function fetchFragment(fragmentUrl) {
        if (fragmentCache.has(fragmentUrl)) return fragmentCache.get(fragmentUrl);
        const response = await fetch(fragmentUrl);
        if (!response.ok) throw new Error(`Failed to load ${fragmentUrl}: ${response.status}`);
        const html = await response.text();
        if (isShellHtml(html)) {
            throw new Error(
                `Got index.html instead of ${fragmentUrl}. ` +
                'If using `npx serve -s .`, add serve.json with "cleanUrls": false ' +
                'and restart the server.'
            );
        }
        fragmentCache.set(fragmentUrl, html);
        return html;
    }

    function wireInternalLinks(root) {
        root.querySelectorAll('a[href^="/"]').forEach((a) => {
            if (a.target === '_blank') return;
            a.addEventListener('click', function (e) {
                e.preventDefault();
                navigate(a.getAttribute('href'));
            });
        });
    }

    async function render(path, options) {
        options = options || {};
        const { path: resolvedPath, data } = resolveScreen(path);

        try {
            const html = await fetchFragment(data.fragment);
            screenRoot.innerHTML = html;
        } catch (err) {
            console.error(err);
            return;
        }

        document.title = data.title;
        wireInternalLinks(screenRoot);
        window.Ipod.init(screenRoot, Object.assign({ path: resolvedPath }, data));

        if (options.replace) {
            history.replaceState({ path: resolvedPath }, '', resolvedPath);
        } else if (window.location.pathname !== resolvedPath) {
            history.pushState({ path: resolvedPath }, '', resolvedPath);
        }
    }

    function navigate(path) {
        render(path);
    }

    window.addEventListener('popstate', function (e) {
        const path = (e.state && e.state.path) || window.location.pathname;
        render(path, { replace: true });
    });

    window.Router = { navigate };

    document.addEventListener('DOMContentLoaded', function () {
        const { path: resolvedPath, data } = resolveScreen(window.location.pathname);

        // The home screen ships pre-rendered inside index.html so the first
        // paint needs no network round trip. Warm the cache from the DOM
        // that's already there instead of re-fetching it.
        if (resolvedPath === '/' && screenRoot.children.length > 0) {
            fragmentCache.set(data.fragment, screenRoot.innerHTML);
            document.title = data.title;
            wireInternalLinks(screenRoot);
            window.Ipod.init(screenRoot, Object.assign({ path: '/' }, data));
            history.replaceState({ path: '/' }, '', '/');
            return;
        }

        render(window.location.pathname, { replace: true });
    });
})();
