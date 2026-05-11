import React, { useContext, useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { CartContext } from "../plugin/Context";
import { useAuthStore } from "../../store/auth";
import useAxios from "../../utils/useAxios";
import CartId from "../plugin/cartId";

function BaseHeader() {
    const [cartCount, setCartCount] = useContext(CartContext);
    const [searchQuery, setSearchQuery] = useState(() => {
        if (typeof window === "undefined") {
            return "";
        }

        return new URLSearchParams(window.location.search).get("query") || "";
    });
    const navigate = useNavigate();
    const location = useLocation();
    const [isLoggedIn, allUserData, refreshUserData] = useAuthStore((state) => [
        state.isLoggedIn,
        state.allUserData,
        state.refreshUserData,
    ]);
    const user = allUserData;
    const isInstructor = allUserData?.teacher_id > 0;

    const api = useAxios();
    useEffect(() => {
        if (!isLoggedIn() || !allUserData?.id) {
            setCartCount(0);
        }
    }, [isLoggedIn, allUserData?.id, setCartCount]);

    useEffect(() => {
        const query = new URLSearchParams(location.search).get("query") || "";
        setSearchQuery(query);
    }, [location.search]);

    // 🔄 Refresh user data periodically to check for instructor approval
    useEffect(() => {
        if (isLoggedIn()) {
            // Refresh immediately
            refreshUserData();
            
            // Then refresh every 10 seconds
            const interval = setInterval(() => {
                refreshUserData();
            }, 10000);
            
            // Also refresh when page becomes visible
            const handleVisibilityChange = () => {
                if (!document.hidden) {
                    refreshUserData();
                }
            };
            document.addEventListener("visibilitychange", handleVisibilityChange);
            
            return () => {
                clearInterval(interval);
                document.removeEventListener("visibilitychange", handleVisibilityChange);
            };
        }
    }, [isLoggedIn, refreshUserData]);

    // 🧹 Clear localStorage flag if user is now an instructor
    useEffect(() => {
        if (isInstructor && localStorage.getItem("instructor_application_pending")) {
            console.log("Instructor approved! Clearing pending flag.");
            localStorage.removeItem("instructor_application_pending");
        }
    }, [isInstructor]);

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
            navigate(`/?query=${encodeURIComponent(searchQuery.trim())}`, { replace: true });
        } else {
            navigate(`/`, { replace: true });
        }
    };

    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearchQuery(value);
        if (value.trim()) {
            navigate(`/?query=${encodeURIComponent(value)}`, { replace: true });
        } else {
            navigate(`/`, { replace: true });
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
            <nav className="navbar navbar-expand-lg navbar-custom shadow-sm py-3">
                <div className="container-fluid px-4 px-xl-5">
                    <Link className="navbar-brand fw-bold text-dark" to="/">BrainLoop</Link>
                    <button className="navbar-toggler" type="button" data-bs-toggle="collapse"
                        data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent"
                        aria-expanded="false" aria-label="Toggle navigation">
                        <span className="navbar-toggler-icon" />
                    </button>
                    <div className="collapse navbar-collapse" id="navbarSupportedContent">
                        <ul className="navbar-nav me-auto mb-2 mb-lg-0">
                            <li className="nav-item">
                                <button className="nav-link text-dark d-flex align-items-center" style={{ border: 'none', background: 'none' }} onClick={handleScrollToFooter}>
                                    <i className="fas fa-envelope me-1"></i> Contact Us
                                </button>
                            </li>
                            <li className="nav-item">
                                <button className="nav-link text-dark d-flex align-items-center" style={{ border: 'none', background: 'none' }} onClick={handleScrollToFooter}>
                                    <i className="fas fa-address-card me-1"></i> About Us
                                </button>
                            </li>

                            
                            {isLoggedIn() && (
    isInstructor ? (
        <li className="nav-item dropdown">
            <a className="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                <i className="fas fa-chalkboard-teacher"></i> Instructor
            </a>
            <ul className="dropdown-menu dropdown-menu-end shadow border-0">
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
            <ul className="dropdown-menu dropdown-menu-end shadow border-0">
                <li><Link className="dropdown-item" to="/student/dashboard/"><i className="bi bi-grid-fill"></i> Dashboard</Link></li>
                <li><Link className="dropdown-item" to="/student/courses/"><i className="fas fa-shopping-cart"></i> My Courses</Link></li>
                <li><Link className="dropdown-item" to="/student/wishlist/"><i className="fas fa-heart"></i> Wishlist</Link></li>
                <li><Link className="dropdown-item" to="/student/question-answer/"><i className="fas fa-envelope"></i> Q/A</Link></li>
                <li><Link className="dropdown-item" to="/student/mentoring-sessions/"><i className="fas fa-chalkboard-teacher"></i> Sessions</Link></li>
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
    {localStorage.getItem("instructor_application_pending") ? (
      <span className="btn btn-warning text-white fw-semibold px-3 py-2 rounded-pill shadow-sm text-nowrap">
        <i className="fas fa-clock me-1"></i> Application Pending
      </span>
    ) : (
      <Link className="btn btn-primary text-white fw-semibold px-3 py-2 rounded-pill shadow-sm text-nowrap" to="/become-instructor/">
        <i className="fas fa-user-plus me-1"></i> Become Instructor
      </Link>
    )}
  </li>
)}
                        </ul>

                        {/* Search Form */}
                        <form className="d-flex align-items-center header-search-form" role="search" onSubmit={handleSearchSubmit}>
                            <input
                                className="form-control search-input me-2"
                                type="search"
                                placeholder="Search for anything"
                                aria-label="Search Courses"
                                value={searchQuery}
                                onChange={handleSearchChange}
                            />
                            <button className="btn btn-primary search-button" type="submit">
                                <i className="fas fa-search me-2"></i>Search
                            </button>
                        </form>

                        {isLoggedIn() ? (
                            <>
                                <Link to="/logout/" className="btn btn-outline-secondary ms-2" type="submit" onClick={() => setCartCount(0)}>
                                    Logout <i className="fas fa-sign-out-alt"></i>
                                </Link>
                            </>
                        ) : (
                            <>
                                <Link to="/login/" className="btn btn-outline-secondary ms-2" type="submit">
                                    Login <i className="fas fa-sign-in-alt"></i>
                                </Link>
                                <Link to="/register/" className="btn btn-outline-secondary ms-2" type="submit">
                                    Register <i className="fas fa-user-plus"> </i>
                                </Link>
                            </>
                        )}
                        <Link className="btn btn-primary text-white ms-2" to="/cart/">
                            Cart ({cartCount}) <i className="fas fa-shopping-cart"> </i>
                        </Link>
                    </div>
                </div>
            </nav>
        </div>
    );
}

export default BaseHeader;
