import React, { useState, useEffect, useRef } from 'react';
import { usePage } from '@inertiajs/react';
import { motion, useDragControls } from 'framer-motion';
import { useChat } from '../../Context/ChatContext';
import { ChatBubble } from './ChatBubble';
import { ChatPanel } from './ChatPanel';
import {
    DEFAULT_DASHBOARD_THEME,
    getDashboardThemeScopeForComponent,
    isThemedComponentForScope,
    useDashboardTheme,
} from '../../hooks/useDashboardTheme';

export const ChatWidget = () => {
    const { isOpen, isMinimized } = useChat();
    const { component } = usePage();
    const scope = getDashboardThemeScopeForComponent(component);
    const { theme } = useDashboardTheme(scope);
    const [shouldRender, setShouldRender] = useState(false);
    const dragControls = useDragControls();
    const constraintsRef = useRef<HTMLDivElement>(null);
    const isDashboardThemeEnabled =
        isThemedComponentForScope(component, scope) &&
        theme !== DEFAULT_DASHBOARD_THEME;

    useEffect(() => {
        if (isOpen) {
            setShouldRender(true);
            return;
        }

        const timer = setTimeout(() => {
            setShouldRender(false);
        }, 300);

        return () => clearTimeout(timer);
    }, [isOpen]);

    const startDrag = (event: React.PointerEvent) => {
        dragControls.start(event);
    };

    return (
        <div
            ref={constraintsRef}
            className="fixed inset-0 z-[9999] pointer-events-none"
        >
            <div
                data-theme={isDashboardThemeEnabled ? theme : undefined}
                className="contents"
            >
                <motion.div
                    drag
                    dragListener={false}
                    dragControls={dragControls}
                    dragConstraints={constraintsRef}
                    dragElastic={0}
                    dragMomentum={false}
                    whileDrag={{ cursor: 'grabbing' }}
                    initial={{ x: 0, y: 0 }}
                    className="absolute bottom-6 right-6 flex flex-col items-end gap-4 pointer-events-none"
                >
                    <div
                        className={`origin-bottom-right transition-all duration-300 ${
                            isOpen && !isMinimized
                                ? 'pointer-events-auto translate-y-0 scale-100 opacity-100'
                                : 'pointer-events-none translate-y-10 scale-95 opacity-0'
                        }`}
                    >
                        {shouldRender && <ChatPanel />}
                    </div>

                    <div className="pointer-events-auto relative cursor-grab active:cursor-grabbing">
                        <ChatBubble onPointerDown={startDrag} />
                    </div>
                </motion.div>
            </div>
        </div>
    );
};
