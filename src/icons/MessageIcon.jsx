const MessageIcon = (props) => {
    return (
        <svg
            viewBox="0 0 15 15"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            stroke="currentColor"
            strokeWidth="1.5" /* Adjusted to match the delicate 15px grid, or can be overridden */
            strokeLinecap="round"
            strokeLinejoin="round"
            {...props}
        >
            <path d="M5.5 11.493L7.5 14.491L9.5 11.493H13.5C13.7652 11.493 14.0196 11.3876 14.2071 11.2001C14.3946 11.0125 14.5 10.7582 14.5 10.493V1.49998C14.4997 1.23493 14.3943 0.980836 14.2068 0.793516C14.0192 0.606196 13.765 0.500976 13.5 0.500977H1.5C1.23478 0.500977 0.98043 0.606333 0.792893 0.79387C0.605357 0.981406 0.5 1.23576 0.5 1.50098V10.495C0.5 11.047 0.947 11.494 1.5 11.494L5.5 11.493Z" />
        </svg>
    );
};

export default MessageIcon;
