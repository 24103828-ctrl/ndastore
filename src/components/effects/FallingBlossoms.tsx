import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

// Simple cherry blossom petal shape (SVG)
const Petal = ({ style }: { style: any }) => (
    <motion.div
        style={{
            position: 'fixed',
            pointerEvents: 'none',
            zIndex: 50,
            ...style
        }}
        initial={{ opacity: 0, y: -20 }}
        animate={{
            opacity: [0, 1, 0.8, 0],
            y: window.innerHeight + 100,
            rotate: [0, 180, 360],
            x: [0, Math.random() * 100 - 50, Math.random() * 100 - 50]
        }}
        transition={{
            duration: Math.random() * 5 + 5, // 5-10s
            repeat: Infinity,
            delay: Math.random() * 5,
            ease: "linear"
        }}
    >
        <svg width="20" height="20" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 0C15 0 16.5 10 25 15C16.5 20 15 30 15 30C15 30 13.5 20 5 15C13.5 10 15 0 15 0Z" fill="#ffb7b2" fillOpacity="0.6" />
        </svg>
    </motion.div>
);

export function FallingBlossoms() {
    const [petals, setPetals] = useState<any[]>([]);

    useEffect(() => {
        // Create a fixed number of petals
        const petalCount = 30;
        const newPetals = Array.from({ length: petalCount }).map((_, i) => ({
            id: i,
            left: `${Math.random() * 100}vw`,
            scale: Math.random() * 0.5 + 0.5,
        }));
        setPetals(newPetals);
    }, []);

    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-[40]">
            {petals.map((petal) => (
                <Petal key={petal.id} style={{ left: petal.left, scale: petal.scale }} />
            ))}
        </div>
    );
}
