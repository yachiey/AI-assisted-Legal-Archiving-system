import React, { useState, useEffect } from 'react';
import { useChat } from '../../Context/ChatContext';
import { ChatBubble } from './ChatBubble';
import { ChatPanel } from './ChatPanel';

import { motion, useDragControls } from 'framer-motion';

export const ChatWidget = () => {
    const { isOpen, isMinimized } = useChat();
    const [shouldRender, setShouldRender] = useState(false);
    const dragControls = useDragControls();

    useEffect(() => {
        if (isOpen) {
            setShouldRender(true);
        } else {
            // Delay unmounting for animation
            const timer = setTimeout(() => {
                setShouldRender(false);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    const startDrag = (event: React.PointerEvent) => {
        dragControls.start(event);
    };

    return (
        <motion.div
            drag
            dragListener={false}
            dragControls={dragControls}
            dragMomentum={false}
            whileDrag={{ cursor: 'grabbing' }}
            initial={{ x: 0, y: 0 }}
            className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-4 pointer-events-none"
        >
            {/* Panel container - handles pointer events for content */}
            <div className={`transition-all duration-300 origin-bottom-right
        ${isOpen && !isMinimized
                    ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto'
                    : 'opacity-0 translate-y-10 scale-95 pointer-events-none'}`}
            >
                {shouldRender && <ChatPanel />}
            </div>

            {/* Bubble always interactive and acts as drag handle */}
            <div className="pointer-events-auto cursor-grab active:cursor-grabbing relative">
                <ChatBubble onPointerDown={startDrag} />
            </div>
        </motion.div>
    );
};
