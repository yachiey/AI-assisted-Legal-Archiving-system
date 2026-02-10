import "../css/app.css";
import "../css/document-sidebar.css";

import { createRoot } from "react-dom/client";
import { createInertiaApp } from "@inertiajs/react";
import { resolvePageComponent } from "laravel-vite-plugin/inertia-helpers";
import { router } from "@inertiajs/react";
import axios from 'axios';

// Configure axios defaults
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

// Set up axios interceptor to include token
const token = localStorage.getItem("auth_token");
if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}



createInertiaApp({
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.tsx`,
            import.meta.glob("./Pages/**/*.tsx")
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);
        root.render(
            <App {...props} />
        );
    },
});
