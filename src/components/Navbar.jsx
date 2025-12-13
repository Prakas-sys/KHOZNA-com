import SearchIcon from "../icons/SearchIcon";
import MessageIcon from "../icons/MessageIcon";
import "../styles/navbar.css";

const Navbar = () => {
    return (
        <nav className="navbar">
            <button className="nav-btn">
                <SearchIcon />
            </button>

            <button className="nav-btn">
                <MessageIcon />
            </button>
        </nav>
    );
};

export default Navbar;