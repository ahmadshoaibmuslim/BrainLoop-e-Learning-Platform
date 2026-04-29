import React, { useContext, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CartContext } from "../plugin/Context";
import { useAuthStore } from "../../store/auth";
import useAxios from "../../utils/useAxios";
import CartId from "../plugin/cartId";

function BaseHeader() {
    const [cartCount, setCartCount] = useContext(CartContext);
    const [searchQuery, setSearchQuery] = useState("");
    const navigate = useNavigate();
    const [isLoggedIn, getUser] = useAuthStore((state) => [
        state.isLoggedIn,
        state.user,
    ]);
    const user = getUser(); 
    console.log("User in Header:", user); 
    const isInstructor = user?.teacher_id > 0;

    const api = useAxios();
    useEffect(() => {
        if (isLoggedIn() && user?.id) {
            fetchCart(CartId());
            
            // checkIfTeacher(user.id);
            if (user.id === 8)
            console.log("User teacher_id:", user?.teacher_id);
        } else {
            setCartCount(0);
            // setIsTeacher(false);
        }
    }, [isLoggedIn, user?.id]);

    const fetchCart = async (cartId) => {
        try {
            const res = await api.get(`course/cart-list/${cartId}/`);
            setCartCount(res.data?.length || 0);
        } catch (error) {
            console.error("Error fetching cart:", error);
        }
    };  
    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/search?query=${encodeURIComponent(searchQuery)}`);
        }
    };
    const handleScrollToFooter = () => {
        const footer = document.getElementById("footer-section");
        if (footer) {
            footer.scrollIntoView({ behavior: "smooth" });
        }
    };
    return (
        <div>
            <nav className="navbar navbar-expand-lg bg-body-tertiary" data-bs-theme="dark">
                <div className="container">
                    <Link className="navbar-brand" to="/">Skillz</Link>
                    <button className="navbar-toggler" type="button" data-bs-toggle="collapse"
                        data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent"
                        aria-expanded="false" aria-label="Toggle navigation">
                        <span className="navbar-toggler-icon" />
                    </button>
                    <div className="collapse navbar-collapse" id="navbarSupportedContent">
                        <ul className="navbar-nav me-auto mb-2 mb-lg-0">
                            <li className="nav-item">
                                <button className="nav-link text-white d-flex align-items-center" style={{ border: 'none', background: 'none' }} onClick={handleScrollToFooter}>
                                    <i className="fas fa-envelope me-1"></i> Contact Us
                                </button>
                            </li>
                            <li className="nav-item">
                                <button className="nav-link text-white d-flex align-items-center" style={{ border: 'none', background: 'none' }} onClick={handleScrollToFooter}>
                                    <i className="fas fa-address-card me-1"></i> About Us
                                </button>
                            </li>

                            
                            {isLoggedIn() && (
    isInstructor ? (
        <li className="nav-item dropdown">
            <a className="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">
                <i className="fas fa-chalkboard-teacher"></i> Instructor
            </a>
            <ul className="dropdown-menu">
                <li><Link className="dropdown-item" to="/instructor/dashboard"><i className="bi bi-grid-fill"></i> Dashboard</Link></li>
                <li><Link className="dropdown-item" to="/instructor/courses"><i className="fas fa-book"></i> My Courses</Link></li>
                <li><Link className="dropdown-item" to="/instructor/profile"><i className="fas fa-user"></i> Profile</Link></li>
            </ul>
        </li>
    ) : (
        <li className="nav-item dropdown">
            <a className="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                <i className="fas fa-graduation-cap"></i> Student
            </a>
            <ul className="dropdown-menu">
                <li><Link className="dropdown-item" to="/student/dashboard/"><i className="bi bi-grid-fill"></i> Dashboard</Link></li>
                <li><Link className="dropdown-item" to="/student/courses/"><i className="fas fa-shopping-cart"></i> My Courses</Link></li>
                <li><Link className="dropdown-item" to="/student/wishlist/"><i className="fas fa-heart"></i> Wishlist</Link></li>
                <li><Link className="dropdown-item" to="/student/question-answer/"><i className="fas fa-envelope"></i> Q/A</Link></li>
                <li><Link className="nav-link" to="/student/mentoring-sessions/"><i className="fas fa-chalkboard-teacher"></i> Sessions</Link></li>
                <li><Link className="dropdown-item" to="/student/profile/"><i className="fas fa-gear"></i> Profile & Settings</Link></li>
            </ul>
        </li>
    )
)}
                        {/* {!isInstructor && isLoggedIn() &&(
                        <li>
                            <Link className="dropdown-item text-success" to="/become-instructor/">
                            <i className="fas fa-user-plus me-1"></i> Become Instructor
                            </Link>
                        </li>
                        )} */}

{isLoggedIn() && !isInstructor && (
  <li className="nav-item ms-3">
    <Link className="btn btn-outline-success" to="/become-instructor/">
      <i className="fas fa-user-plus me-1"></i> Become Instructor
    </Link>
  </li>
)}
                        </ul>

                        {/* Search Form */}
                        <form className="d-flex" role="search" onSubmit={handleSearchSubmit}>
                            <input
                                className="form-control me-2 w-100"
                                type="search"
                                placeholder="Search Courses"
                                aria-label="Search Courses"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <button className="btn btn-outline-success w-50" type="submit">
                                Search <i className="fas fa-search"></i>
                            </button>
                        </form>

                        {isLoggedIn() ? (
                            <>
                                <Link to="/logout/" className="btn btn-primary ms-2" type="submit" onClick={() => setCartCount(0)}>
                                    Logout <i className="fas fa-sign-out-alt"></i>
                                </Link>
                            </>
                        ) : (
                            <>
                                <Link to="/login/" className="btn btn-primary ms-2" type="submit">
                                    Login <i className="fas fa-sign-in-alt"></i>
                                </Link>
                                <Link to="/register/" className="btn btn-primary ms-2" type="submit">
                                    Register <i className="fas fa-user-plus"> </i>
                                </Link>
                            </>
                        )}
                        <Link className="btn btn-success ms-2" to="/cart/">
                            Cart ({cartCount}) <i className="fas fa-shopping-cart"> </i>
                        </Link>
                    </div>
                </div>
            </nav>
        </div>
    );
}

export default BaseHeader;
