import React from 'react';

interface TestimonialProps {
    quote: string;
    author: string;
    role: string;
    image?: string;
}

const styles = {
    card: {
        background: 'white',
        padding: '2rem',
        borderRadius: '0.75rem',
        border: '1px solid rgba(0,0,0,0.05)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
        transition: 'all 0.3s'
    },
    cardHover: {
        boxShadow: '0 10px 30px rgba(0,0,0,0.06)'
    },
    stars: {
        marginBottom: '1.5rem'
    },
    star: {
        color: '#d9b56c',
        fontSize: '0.875rem'
    },
    quote: {
        color: '#151614',
        fontSize: '1.125rem',
        fontWeight: 500,
        lineHeight: '1.75',
        marginBottom: '2rem',
        fontFamily: "'Space Grotesk', sans-serif"
    },
    authorContainer: {
        display: 'flex',
        alignItems: 'center',
        gap: '1rem'
    },
    avatar: {
        width: '2.5rem',
        height: '2.5rem',
        borderRadius: '9999px',
        background: '#f5f0e6',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#151614',
        fontWeight: 700,
        fontSize: '0.875rem'
    },
    avatarImage: {
        width: '100%',
        height: '100%',
        borderRadius: '9999px',
        objectFit: 'cover' as const
    },
    authorName: {
        fontWeight: 700,
        color: '#151614',
        fontSize: '0.875rem'
    },
    authorRole: {
        color: '#9a958a',
        fontSize: '0.75rem',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.05em'
    }
};

export const TestimonialCard: React.FC<TestimonialProps> = ({ quote, author, role, image }) => {
    return (
        <div style={styles.card}>
            <div style={styles.stars}>
                {[1, 2, 3, 4, 5].map((star) => (
                    <span key={star} style={styles.star}>★</span>
                ))}
            </div>
            <p style={styles.quote}>
                "{quote}"
            </p>
            <div style={styles.authorContainer}>
                <div style={styles.avatar}>
                    {image ? (
                        <img src={image} alt={author} style={styles.avatarImage} />
                    ) : (
                        author.charAt(0)
                    )}
                </div>
                <div>
                    <div style={styles.authorName}>{author}</div>
                    <div style={styles.authorRole}>{role}</div>
                </div>
            </div>
        </div>
    );
};
