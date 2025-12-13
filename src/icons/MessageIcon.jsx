const MessageIcon = (props) => {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            stroke="currentColor"
            strokeWidth={props.strokeWidth || 1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            {...props}
        >
            {/* Rounded Message Bubble with Tail */}
            <path d="M21 11.5C21 15.6421 17.6421 19 13.5 19C12.3789 19 11.317 18.756 10.3546 18.3188L5 20.5L6.68537 15.7744C5.62629 14.6146 5 13.1255 5 11.5C5 7.35786 8.35786 4 12.5 4C16.6421 4 21 7.35786 21 11.5Z" />
        </svg>
    );
};

export default MessageIcon;
