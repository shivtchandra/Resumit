import React from 'react';

/**
 * RazorpayButton component based on user-provided style.
 */
interface RazorpayButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    text?: string;
    subtext?: string;
}

export const RazorpayButton: React.FC<RazorpayButtonProps> = ({
    text = "Pay Now",
    subtext = "Secured by Razorpay",
    className = "",
    ...props
}) => {
    return (
        <div className={`ButtonContainer ${className}`}>
            <button
                className="PaymentButton-Button PaymentButton-Button--rzpTheme"
                {...props}
            >
                <svg width="18" height="20" viewBox="0 0 18 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M7.077 6.476l-.988 3.569 5.65-3.589-3.695 13.54 3.752.004 5.457-20L7.077 6.476z" fill="#fff"></path>
                    <path d="M1.455 14.308L0 20h7.202L10.149 8.42l-8.694 5.887z" fill="#fff"></path>
                </svg>
                <div className="PaymentButton-contents">
                    <span className="PaymentButton-text">{text}</span>
                    <div className="PoweredBy">{subtext}</div>
                </div>
            </button>
        </div>
    );
};
