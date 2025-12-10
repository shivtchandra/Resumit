import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface FAQItem {
    question: string;
    answer: string;
}

interface FAQAccordionProps {
    items: FAQItem[];
}

const styles = {
    container: {
        width: '100%',
        maxWidth: '48rem',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '1rem'
    },
    item: {
        borderBottom: '1px solid rgba(0,0,0,0.08)'
    },
    itemLast: {
        borderBottom: 'none'
    },
    button: {
        width: '100%',
        padding: '1.5rem 0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        textAlign: 'left' as const,
        background: 'transparent',
        border: 'none',
        cursor: 'pointer'
    },
    question: {
        fontFamily: "'Space Grotesk', sans-serif",
        fontWeight: 500,
        fontSize: '1.125rem',
        color: '#151614',
        transition: 'color 0.2s'
    },
    questionHover: {
        color: '#5fe4d6'
    },
    answerContainer: {
        overflow: 'hidden',
        transition: 'all 0.3s ease-in-out'
    },
    answerOpen: {
        maxHeight: '12rem',
        opacity: 1,
        marginBottom: '1.5rem'
    },
    answerClosed: {
        maxHeight: 0,
        opacity: 0
    },
    answer: {
        color: '#9a958a',
        lineHeight: '1.75',
        paddingRight: '2rem'
    }
};

export const FAQAccordion: React.FC<FAQAccordionProps> = ({ items }) => {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    return (
        <div style={styles.container}>
            {items.map((item, index) => (
                <div
                    key={index}
                    style={{ ...styles.item, ...(index === items.length - 1 ? styles.itemLast : {}) }}
                >
                    <button
                        style={styles.button}
                        onClick={() => setOpenIndex(openIndex === index ? null : index)}
                    >
                        <span style={styles.question}>
                            {item.question}
                        </span>
                        {openIndex === index ? (
                            <ChevronUp style={{ width: '1.25rem', height: '1.25rem', color: '#5fe4d6' }} />
                        ) : (
                            <ChevronDown style={{ width: '1.25rem', height: '1.25rem', color: '#9a958a' }} />
                        )}
                    </button>
                    <div
                        style={{
                            ...styles.answerContainer,
                            ...(openIndex === index ? styles.answerOpen : styles.answerClosed)
                        }}
                    >
                        <p style={styles.answer}>
                            {item.answer}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
};
