const MessageIcon = (props) => {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
            {...props}
        >
            <path d="M21 12c0 4.418-4.03 8-9 8-1.038 0-2.037-.155-2.964-.44L3 21l1.755-4.318C4.273 15.86 3 14.01 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8Z" />
        </svg>
    );
};

export default MessageIcon;
