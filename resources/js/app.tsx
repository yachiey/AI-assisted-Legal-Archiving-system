import "../css/app.css";
import "../css/document-sidebar.css";
import "../css/CustomScrollBar.css";
import "lenis/dist/lenis.css";

import { createRoot } from "react-dom/client";
import { createInertiaApp, router } from "@inertiajs/react";
import { resolvePageComponent } from "laravel-vite-plugin/inertia-helpers";
import Lenis from "lenis";
import axios from "axios";

declare global {
    interface Window {
        __lenis?: Lenis;
        __lenisRafId?: number;
        __lenisResizeHandler?: () => void;
    }
}

// Configure axios defaults
axios.defaults.headers.common["X-Requested-With"] = "XMLHttpRequest";

// Set up axios interceptor to include token
const token = localStorage.getItem("auth_token");
if (token) {
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
}

const createLenis = () => {
    if (typeof window === "undefined") {
        return;
    }

    if (window.__lenisRafId) {
        window.cancelAnimationFrame(window.__lenisRafId);
    }

    if (window.__lenisResizeHandler) {
        window.removeEventListener("resize", window.__lenisResizeHandler);
    }

    window.__lenis?.destroy();

    const getClassName = (element: Element) =>
        typeof (element as HTMLElement).className === "string"
            ? (element as HTMLElement).className
            : "";

    const findScrollWrapper = () => {
        const main = document.querySelector("main");
        if (!main) {
            return null;
        }

        if (getClassName(main).includes("overflow-auto")) {
            return main as HTMLElement;
        }

        const candidates = Array.from(main.querySelectorAll<HTMLElement>("*"))
            .filter((element) => {
                const className = getClassName(element);
                const style = window.getComputedStyle(element);
                const rect = element.getBoundingClientRect();
                const looksScrollable =
                    className.includes("overflow-auto") ||
                    className.includes("overflow-y-auto") ||
                    style.overflowY === "auto" ||
                    style.overflowY === "scroll";

                const shouldIgnore =
                    style.position === "fixed" ||
                    style.position === "absolute" ||
                    rect.width < 280 ||
                    rect.height < 180;

                return looksScrollable && !shouldIgnore;
            })
            .sort((a, b) => b.clientWidth * b.clientHeight - a.clientWidth * a.clientHeight);

        return candidates[0] ?? null;
    };

    const scrollWrapper = findScrollWrapper();
    const wrapper = scrollWrapper ?? window;

    const lenis = new Lenis({
        wrapper,
        content: scrollWrapper ?? document.documentElement,
        eventsTarget: wrapper,
        duration: 1.1,
        smoothWheel: true,
        wheelMultiplier: 0.9,
        touchMultiplier: 1,
    });

    const raf = (time: number) => {
        lenis.raf(time);
        window.__lenisRafId = window.requestAnimationFrame(raf);
    };

    const handleResize = () => {
        window.__lenis?.resize();
    };

    window.__lenis = lenis;
    window.__lenisResizeHandler = handleResize;
    window.addEventListener("resize", handleResize);
    window.__lenisRafId = window.requestAnimationFrame(raf);
};

if (typeof window !== "undefined") {
    createLenis();

    router.on("navigate", () => {
        window.requestAnimationFrame(() => {
            window.requestAnimationFrame(() => {
                createLenis();
            });
        });
    });
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
