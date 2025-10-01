function handleRouteChange() {
    appContent.innerHTML = `<div class="text-center p-8">Loading...</div>`;
    const hash = window.location.hash.slice(1) || '/';

    // Dynamically build navigation based on route
    if (window.appNavigation) {
        if (hash.startsWith('/admin')) {
            buildNav(window.appNavigation.admin);
        } else {
            buildNav(window.appNavigation.public);
        }
    }

    const [path, queryString] = hash.split('?');
    const query = new URLSearchParams(queryString);

    // Find a matching route
    for (const route of routes) {
        const routeParts = route.path.split('/');
        const pathParts = path.split('/');

        if (routeParts.length === pathParts.length) {
            const params = {};
            let match = true;

            for (let i = 0; i < routeParts.length; i++) {
                if (routeParts[i].startsWith(':')) {
                    params[routeParts[i].slice(1)] = pathParts[i];
                } else if (routeParts[i] !== pathParts[i]) {
                    match = false;
                    break;
                }
            }

            if (match) {
                // Call the handler with params and query
                route.handler({ params, query });
                // highlightActiveLink() is now called inside buildNav
                return;
            }
        }
    }

    // If no specific route matches, try to find a dynamic page
    const dynamicPageRoute = routes.find(r => r.path === '/:route');
    if (dynamicPageRoute) {
        dynamicPageRoute.handler({ params: { route: path.slice(1) }, query });
        // highlightActiveLink() is now called inside buildNav
        return;
    }


    // If no route is found at all
    renderNotFoundPage();
    // highlightActiveLink() is now called inside buildNav
}
new_string:
function handleRouteChange() {
    appContent.innerHTML = `<div class="text-center p-8">Loading...</div>`;
    const hash = window.location.hash.slice(1) || '/';

    // Dynamically build navigation based on route
    if (window.appNavigation) {
        if (hash.startsWith('/admin')) {
            buildNav(window.appNavigation.admin);
        } else {
            buildNav(window.appNavigation.public);
        }
    }

    const [path, queryString] = hash.split('?');
    const query = new URLSearchParams(queryString);

    // Find a matching route
    for (const route of routes) {
        const routeParts = route.path.split('/');
        const pathParts = path.split('/');

        if (routeParts.length === pathParts.length) {
            const params = {};
            let match = true;

            for (let i = 0; i < routeParts.length; i++) {
                if (routeParts[i].startsWith(':')) {
                    params[routeParts[i].slice(1)] = pathParts[i];
                } else if (routeParts[i] !== pathParts[i]) {
                    match = false;
                    break;
                }
            }

            if (match) {
                // Call the handler with params and query
                route.handler({ params, query });
                // highlightActiveLink() is now called inside buildNav
                return;
            }
        }
    }

    // If no specific route matches, try to find a dynamic page
    const dynamicPageRoute = routes.find(r => r.path === '/:route');
    if (dynamicPageRoute) {
        dynamicPageRoute.handler({ params: { route: path.slice(1) }, query });
        // highlightActiveLink() is now called inside buildNav
        return;
    }


    // If no route is found at all
    renderNotFoundPage();
    // highlightActiveLink() is now called inside buildNav
}
old_string:
function handleRouteChange() {
    appContent.innerHTML = `<div class="text-center p-8">Loading...</div>`;
    const hash = window.location.hash.slice(1) || '/';
    const [path, queryString] = hash.split('?');
    const query = new URLSearchParams(queryString);

    // Find a matching route
    for (const route of routes) {
        const routeParts = route.path.split('/');
        const pathParts = path.split('/');

        if (routeParts.length === pathParts.length) {
            const params = {};
            let match = true;

            for (let i = 0; i < routeParts.length; i++) {
                if (routeParts[i].startsWith(':')) {
                    params[routeParts[i].slice(1)] = pathParts[i];
                } else if (routeParts[i] !== pathParts[i]) {
                    match = false;
                    break;
                }
            }

            if (match) {
                // Call the handler with params and query
                route.handler({ params, query });
                highlightActiveLink();
                return;
            }
        }
    }

    // If no specific route matches, try to find a dynamic page
    const dynamicPageRoute = routes.find(r => r.path === '/:route');
    if (dynamicPageRoute) {
        dynamicPageRoute.handler({ params: { route: path.slice(1) }, query });
        highlightActiveLink();
        return;
    }


    // If no route is found at all
    renderNotFoundPage();
    highlightActiveLink();
}
