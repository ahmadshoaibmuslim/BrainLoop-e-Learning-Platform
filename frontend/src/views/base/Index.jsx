import { useEffect, useMemo, useState, useContext } from 'react';
import BaseHeader from '../partials/BaseHeader';
import BaseFooter from '../partials/BaseFooter';
import { Link, useLocation } from 'react-router-dom';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import CartId from '../plugin/cartId';
import GetCurrentAddress from '../plugin/UserCountry';
import UserData from '../plugin/UserData';
import toast from '../plugin/toast';

import Rater from 'react-rater'   //for rating in react
import "react-rater/lib/react-rater.css"
import '../styles/home.css'   //enhanced home page styles

import apiInstance from '../../utils/useAxios';
import { useAuthStore } from '../../store/auth';

import { CartContext } from '../plugin/Context';

import axios from 'axios';

function Index() {

    const [courses, setCourses] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [cartCount, setCartCount] = useContext(CartContext);
    const [books, setBooks] = useState([]);
    const location = useLocation();
    const queryParam = new URLSearchParams(location.search).get('query') || '';

    const country = GetCurrentAddress().country;
    // const userId = UserData()?.user_id; // user_id is not defined 
    const cartId = CartId();
    const authUser = useAuthStore((state) => state.allUserData);
    const currentUserId = authUser?.user_id || authUser?.id || UserData()?.user_id;

    const fetchBooks = async () => {
        setIsLoading(true);
        try {
            await axios.get(`http://127.0.0.1:8000/api/v1/books/`).then((res) => {
                setBooks(res.data);
                setIsLoading(false);
            });
        } catch (error) {
            console.error("Error fetching books:", error.response?.data || error.message);
        }
    };

    useEffect(() => {
        fetchBooks();
    }, []);


    const fetchCourse = async () => {
        setIsLoading(true);
        try {
            await axios.get(`http://127.0.0.1:8000/api/v1/course/course-list/`).then((res) => {
                setCourses(res.data);
                setIsLoading(false);
            })
        } catch (error) {
            console.error("Error fetching courses:", error.response?.data || error.message);


        }
        

    }

    useEffect(() => {
        fetchCourse();
    }, [])

    console.log(courses);

    const fetchCart = async (userId) => {
        try {
            const res = await apiInstance().get(`course/cart-list/${userId}/`);
            setCartCount(res.data?.length || 0); // Ensure it's always a valid number
        } catch (error) {
            console.error("Error fetching cart:", error);
        }
    };

    useEffect(() => {
        if (currentUserId) {
            fetchCart(currentUserId);
        }
    }, [currentUserId]);

    const searchQuery = queryParam.toLowerCase().trim();

    const filteredCourses = useMemo(() => {
        if (!searchQuery) {
            return courses;
        }

        return courses.filter((course) => {
            const title = course?.title || '';
            const description = course?.description || '';
            const tags = course?.tags || '';
            const categoryTitle = course?.category?.title || course?.category || '';
            const instructorName = course?.teacher?.full_name || course?.teacher?.teacher_name || '';

            return [title, description, tags, categoryTitle, instructorName]
                .join(' ')
                .toLowerCase()
                .includes(searchQuery);
        });
    }, [courses, searchQuery]);

    const filteredBooks = useMemo(() => {
        if (!searchQuery) {
            return books;
        }

        return books.filter((book) => {
            const title = book?.title || '';
            const description = book?.description || '';
            const category = book?.category?.title || book?.category || '';
            const author = book?.author || '';

            return [title, description, category, author]
                .join(' ')
                .toLowerCase()
                .includes(searchQuery);
        });
    }, [books, searchQuery]);

    const addToCart = async (courseId, price, country, cartId) => {
        if (!currentUserId) {
            console.error("User ID is missing! Ensure user is logged in.");
            toast().fire({
                title: "Please login to add items",
                icon: "warning",
            });
            return;
        }
    
        const formdata = new FormData();
        formdata.append("course_id", courseId);
        formdata.append("user_id", currentUserId);
        formdata.append("price", price);
        formdata.append("country_name", country);
        formdata.append("cart_id", cartId);
    
        try {
            const res = await apiInstance().post(`course/cart/`, formdata);
            console.log("Cart response:", res.data);
    
            toast().fire({
                title: "Added To Cart",
                icon: "success",
            });
    
            fetchCart(currentUserId);
        } catch (error) {
            console.error("Error adding to cart:", error);
            toast().fire({
                title: "Unable to add to cart",
                icon: "error",
            });
        }
    };
    

    const formatPrice = (price) => {
        const amount = Number(price);
        if (!Number.isFinite(amount)) {
            return "$0.00";
        }
        return `$${amount.toFixed(2)}`;
    };

    const itemPerPage = 8
    const [currentPage, setCurrentPage] = useState(1)
    const indexOfLastItem = currentPage * itemPerPage
    const indexOfFirstItem = indexOfLastItem - itemPerPage
    const currentItems = filteredCourses.slice(indexOfFirstItem, indexOfLastItem)
    const totalPage = Math.max(1, Math.ceil(filteredCourses.length / itemPerPage))
    const pageNumber = Array.from(
        { length: totalPage },
        (_, index) => index + 1
    )

    const handlePageChange = (page) => {
        if (page < 1 || page > totalPage) return;
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const showSearchResults = Boolean(searchQuery);

    return (
        <>
            <BaseHeader />

            {showSearchResults && (
                <section className="search-results-section py-4">
                    <div className="container">
                        <div className="section-header mb-4">
                            <h2 className="section-title mb-2">
                                Search Results for "{queryParam}"
                            </h2>
                            <p className="section-subtitle mb-0">
                                Courses and books matching your search are shown below.
                            </p>
                        </div>

                        <div className="row g-4 mb-5">
                            {filteredCourses.length > 0 ? (
                                filteredCourses.map((c, index) => (
                                    <div className="col-12 col-md-6 col-lg-3" key={`search-course-${c.id}-${index}`}>
                                        <div className="course-card h-100">
                                            <div className="course-image-wrapper">
                                                <Link to={`/course-detail/${c.slug}/`}>
                                                    <img
                                                        src={c.image_url || c.image || 'https://via.placeholder.com/600x400?text=Course+Image'}
                                                        alt={c.title}
                                                    />
                                                </Link>
                                            </div>
                                            <div className="course-card-body">
                                                <h4 className="course-title mb-2">
                                                    <Link to={`/course-detail/${c.slug}/`} className="text-inherit text-decoration-none">
                                                        {c.title}
                                                    </Link>
                                                </h4>
                                                <p className="course-students mb-0">
                                                    <i className="fas fa-users me-2"></i>
                                                    {c.students?.length || 0} student{c.students?.length !== 1 ? 's' : ''}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="col-12">
                                    <p className="mb-0">No matching courses found.</p>
                                </div>
                            )}
                        </div>

                        <div className="row g-4">
                            {filteredBooks.length > 0 ? (
                                filteredBooks.map((book) => (
                                    <div className="col-12 col-md-6 col-lg-3" key={`search-book-${book.id}`}>
                                        <div className="book-card h-100">
                                            <div className="book-image-wrapper">
                                                <Link to={`/books/books-detail/${book.id}/`}>
                                                    <img
                                                        src={book.image_url || book.image || 'https://via.placeholder.com/600x400?text=Book+Image'}
                                                        alt={book.title}
                                                        className="book-image"
                                                        style={{ width: '100%', height: '220px', objectFit: 'cover' }}
                                                    />
                                                </Link>
                                            </div>
                                            <div className="book-body p-3">
                                                <h4 className="book-title mb-2">
                                                    <Link to={`/books/books-detail/${book.id}/`} className="text-decoration-none">
                                                        {book.title}
                                                    </Link>
                                                </h4>
                                                <p className="book-author mb-0">By: <strong>{book.author}</strong></p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="col-12">
                                    <p className="mb-0">No matching books found.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            )}

            {/* Enhanced Hero Section */}
            <section className="hero-section">
                <div className="hero-decoration hero-decoration-1"></div>
                <div className="hero-decoration hero-decoration-2"></div>
                
                <div className="container">
                    <div className="row align-items-center">
                        <div className="col-lg-6 hero-content">
                            <div className="hero-badge">
                                <span className="hero-badge-icon">
                                    <i className="fas fa-check"></i>
                                </span>
                                <span>Trusted by 1M+ learners worldwide</span>
                            </div>
                            
                            <h1 className="hero-title">
                                Your future is just a course away
                            </h1>
                            
                            <p className="hero-description">
                                Discover world-class programs designed to help you gain the skills you need to thrive in a competitive world. Learn from industry experts and transform your career.
                            </p>
                            
                            <div className="hero-buttons">
                                <Link to="/search" className="btn-primary-gradient">
                                    <i className="fas fa-play me-2"></i>Explore Courses
                                </Link>
                                <a href="#popular-courses" className="btn-outline-white">
                                    <i className="fas fa-arrow-down me-2"></i>Browse Popular
                                </a>
                            </div>
                        </div>
                        
                        <div className="col-lg-6 d-none d-lg-flex justify-content-center hero-image">
                            <div className="hero-player">
                                <DotLottieReact
                                    src="https://lottie.host/817816ea-11a9-4fb4-a037-37c24bd22aa3/9zKyrlijDk.lottie"
                                    loop
                                    autoplay
                                    style={{ width: '100%', height: '100%' }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Enhanced Stats Section */}
            <section className="stats-section">
                <div className="container">
                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-icon">
                                <i className="fas fa-chalkboard-user"></i>
                            </div>
                            <h3 className="stat-number">1000+</h3>
                            <p className="stat-label">Expert Instructors</p>
                        </div>
                        
                        <div className="stat-card">
                            <div className="stat-icon">
                                <i className="fas fa-users"></i>
                            </div>
                            <h3 className="stat-number">1M+</h3>
                            <p className="stat-label">Active Learners</p>
                        </div>
                        
                        <div className="stat-card">
                            <div className="stat-icon">
                                <i className="fas fa-book"></i>
                            </div>
                            <h3 className="stat-number">5000+</h3>
                            <p className="stat-label">Courses Available</p>
                        </div>
                        
                        <div className="stat-card">
                            <div className="stat-icon">
                                <i className="fas fa-clock"></i>
                            </div>
                            <h3 className="stat-number">50K+</h3>
                            <p className="stat-label">Hours of Content</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Enhanced Courses Section */}
            <section className="courses-section" id="popular-courses">
                <div className="container">
                    <div className="section-header">
                            <h2 className="section-title">
                                {searchQuery ? `Search Results for "${queryParam}"` : 'Learn From the Best'}
                            </h2>
                        <p className="section-subtitle">
                            {searchQuery
                                ? 'Matching courses from the catalog.'
                                : 'Explore top-rated courses designed by industry experts and loved by learners worldwide.'}
                        </p>
                        <div className="section-title-underline"></div>
                    </div>
                    
                    <div className="row row-cols-1 row-cols-md-2 row-cols-lg-4 g-4">
                        {currentItems?.map((c, index) => (
                            <div className="col" key={`${c.id}-${index}`}>
                                <div className="course-card">
                                    <div className="course-image-wrapper">
                                        <Link to={`/course-detail/${c.slug}/`}>
                                            <img
                                                src={c.image_url || c.image || 'https://via.placeholder.com/600x400?text=Course+Image'}
                                                alt={c.title}
                                            />
                                        </Link>

                                        <div className="course-badges">
                                            <span className="badge badge-level">{c.level || 'All Levels'}</span>
                                            {c.total_students > 100 && (
                                                <span className="badge badge-bestseller">Popular</span>
                                            )}
                                        </div>

                                        <button
                                            className="course-wishlist"
                                            onClick={async (e) => {
                                                e.preventDefault();
                                                if (!currentUserId) {
                                                    toast.error('Please login to add to wishlist');
                                                    return;
                                                }
                                                try {
                                                    const fd = new FormData();
                                                    fd.append('user_id', currentUserId);
                                                    fd.append('course_id', c.id);
                                                    const res = await apiInstance().post(`student/wishlist/${currentUserId}/`, fd);
                                                    console.log('Wishlist toggle:', res.data);
                                                    toast.success(res.data.message || 'Wishlist updated');
                                                } catch (err) {
                                                    console.error('Wishlist error:', err?.response || err);
                                                    const msg = err?.response?.data?.detail || err?.response?.data?.message || 'Failed to update wishlist';
                                                    toast.error(msg);
                                                }
                                            }}
                                        >
                                            <i className="fas fa-heart"></i>
                                        </button>
                                    </div>

                                    <div className="course-card-body">
                                        <div className="course-instructor">
                                            <div className="instructor-avatar">
                                                {c.teacher?.full_name?.charAt(0)?.toUpperCase()}
                                            </div>
                                            <span className="instructor-name">{c.teacher?.full_name}</span>
                                        </div>

                                        <h4 className="course-title">
                                            <Link to={`/course-detail/${c.slug}/`} className="text-inherit text-decoration-none">
                                                {c.title}
                                            </Link>
                                        </h4>

                                        <div className="course-rating">
                                            <span className="rating-stars">
                                                <Rater total={5} rating={c.average_rating || 0} interactive={false} />
                                            </span>
                                            <span className="rating-count">({c.reviews?.length || 0})</span>
                                        </div>

                                        <p className="course-students">
                                            <i className="fas fa-users me-2"></i>
                                            {c.students?.length || 0} student{c.students?.length !== 1 ? 's' : ''}
                                        </p>
                                    </div>

                                    <div className="course-card-footer">
                                        <div>
                                            <div className="course-price">{formatPrice(c.price)}</div>
                                            <small className="text-muted">{c.total_students} students enrolled</small>
                                        </div>
                                        <div className="course-actions">
                                            <button
                                                className="course-btn course-cart-btn"
                                                onClick={() => addToCart(c.id, Number(c.price) || 0, country, cartId)}
                                            >
                                                Add to Cart
                                            </button>
                                            <Link to={`/course-detail/${c.slug}/`} className="course-btn course-view-btn">
                                                View <i className="fas fa-arrow-right ms-2"></i>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                                <nav className="pagination-wrapper mt-5" aria-label="Course pagination">
                                    <button
                                        className="page-nav-btn"
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                    >
                                        <i className="fas fa-chevron-left me-2" />
                                        Previous
                                    </button>

                                    <div className="pagination-pages">
                                        {pageNumber.map((page) => (
                                            <button
                                                key={page}
                                                className={`page-number ${currentPage === page ? 'active' : ''}`}
                                                onClick={() => handlePageChange(page)}
                                            >
                                                {page}
                                            </button>
                                        ))}
                                    </div>

                                    <button
                                        className="page-nav-btn"
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage === totalPage}
                                    >
                                        Next
                                        <i className="fas fa-chevron-right ms-2" />
                                    </button>
                                </nav>
                </div>
            </section>

            {/* Books Section */}
            <section className='books-section'>
            <div className="container">
            <div className="books-header">
                <div className="col-12">
                    <div className="section-header text-center mb-5">
                        <h2 className="section-title">📚 Explore Our Library</h2>
                        <p className="section-subtitle">Discover curated books across diverse categories to expand your knowledge</p>
                        <div className="section-title-underline mx-auto"></div>
                    </div>
                </div>
            </div>

            <div className="row">
                <div className="col-md-12">
                    <div className="row row-cols-1 row-cols-md-2 row-cols-lg-4 g-4">
                        {isLoading ? (
                            <p className="text-center">Loading books...</p>
                        ) : (
                            filteredBooks.map((book) => (
                                <div key={book.id} className="col">
                                    <div className="book-card h-100">
                                        <div className="book-image-wrapper">
                                            <Link to={`/books/books-detail/${book.id}/`}>
                                                <img
                                                    src={book.image}
                                                    alt={book.title}
                                                    className="book-image"
                                                    style={{ width: "100%", height: "280px", objectFit: "cover" }}
                                                />
                                            </Link>
                                            <div className="book-overlay">
                                                <Link to={`/books/books-detail/${book.id}/`} className="book-view-btn">
                                                    View Details
                                                </Link>
                                            </div>
                                        </div>

                                        <div className="book-body">
                                            <div className="book-meta mb-3">
                                                <span className="book-badge category-badge">{book.category}</span>
                                                <span className="book-badge author-badge">{book.author}</span>
                                            </div>

                                            <h4 className="book-title mb-2">
                                                <Link to={`/books/books-detail/${book.id}/`} className="text-decoration-none">
                                                    {book.title}
                                                </Link>
                                            </h4>
                                            <p className="book-author mb-2">By: <strong>{book.author}</strong></p>
                                            
                                            <div className="book-rating mb-3">
                                                <span className="rating-value">{book.rating || "N/A"}</span>
                                                <span className="rating-count">({book.reviews_count || 0} reviews)</span>
                                            </div>

                                            <div className="book-footer">
                                                <div className="book-price">${book.price}</div>
                                                <a href="#" className="book-like-btn">
                                                    <i className="fas fa-heart"></i>
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="d-flex justify-content-center mt-5">
                        <Link to="/books" className="btn-see-all-books">
                            See All Books <i className="fas fa-arrow-right ms-2"></i>
                        </Link>
                    </div>
                </div>
            </div>
        </div>

                
            </section>



            {/* Instructor CTA Section */}
            <section className="instructor-cta-section">
                <div className="container">
                    <div className="instructor-cta-wrapper">
                        <div className="instructor-cta-content">
                            <div className="cta-badge">
                                <i className="fas fa-star me-2"></i>
                                Join Our Teaching Community
                            </div>
                            <h2 className="instructor-cta-title">
                                Share Your Knowledge & Inspire Millions
                            </h2>
                            <p className="instructor-cta-description">
                                Become an instructor and teach millions of learners worldwide. We provide all the tools, resources, and support you need to create amazing courses and build a thriving teaching career.
                            </p>
                            <div className="instructor-benefits">
                                <div className="benefit-item">
                                    <i className="fas fa-check-circle"></i>
                                    <span>Unlimited Earning Potential</span>
                                </div>
                                <div className="benefit-item">
                                    <i className="fas fa-check-circle"></i>
                                    <span>Complete Creative Control</span>
                                </div>
                                <div className="benefit-item">
                                    <i className="fas fa-check-circle"></i>
                                    <span>24/7 Support & Resources</span>
                                </div>
                            </div>
                            <Link to="/apply-instructor/" className="btn-instructor-cta">
                                Start Teaching Today <i className="fas fa-arrow-right ms-2"></i>
                            </Link>
                        </div>
                        <div className="instructor-cta-visual">
                            <div className="cta-animation-box">
                                <div className="floating-card card-1">
                                    <i className="fas fa-video"></i>
                                    <span>Create Courses</span>
                                </div>
                                <div className="floating-card card-2">
                                    <i className="fas fa-users"></i>
                                    <span>Reach Students</span>
                                </div>
                                <div className="floating-card card-3">
                                    <i className="fas fa-coins"></i>
                                    <span>Earn Money</span>
                                </div>
                                <div className="cta-glow-element"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="features-section">
                <div className="container">
                    <div className="section-header text-center mb-5">
                        <h2 className="section-title">Why Choose Our Platform</h2>
                        <p className="section-subtitle">
                            Discover the powerful features that make learning enjoyable and effective
                        </p>
                        <div className="section-title-underline mx-auto"></div>
                    </div>

                    <div className="row g-4">
                        {/* Feature 1 */}
                        <div className="col-lg-3 col-md-6">
                            <div className="feature-card">
                                <div className="feature-icon bg-gradient-1">
                                    <i className="fas fa-video"></i>
                                </div>
                                <h4 className="feature-title">HD Video Courses</h4>
                                <p className="feature-description">
                                    Learn from high-quality HD videos with professional instructors from around the world.
                                </p>
                                <a href="#" className="feature-link">Learn more <i className="fas fa-arrow-right ms-2"></i></a>
                            </div>
                        </div>

                        {/* Feature 2 */}
                        <div className="col-lg-3 col-md-6">
                            <div className="feature-card">
                                <div className="feature-icon bg-gradient-2">
                                    <i className="fas fa-certificate"></i>
                                </div>
                                <h4 className="feature-title">Certificates</h4>
                                <p className="feature-description">
                                    Earn recognized certificates upon course completion and showcase your achievements.
                                </p>
                                <a href="#" className="feature-link">Learn more <i className="fas fa-arrow-right ms-2"></i></a>
                            </div>
                        </div>

                        {/* Feature 3 */}
                        <div className="col-lg-3 col-md-6">
                            <div className="feature-card">
                                <div className="feature-icon bg-gradient-3">
                                    <i className="fas fa-users"></i>
                                </div>
                                <h4 className="feature-title">Community Support</h4>
                                <p className="feature-description">
                                    Join a vibrant community of learners, ask questions, and get help from peers.
                                </p>
                                <a href="#" className="feature-link">Learn more <i className="fas fa-arrow-right ms-2"></i></a>
                            </div>
                        </div>

                        {/* Feature 4 */}
                        <div className="col-lg-3 col-md-6">
                            <div className="feature-card">
                                <div className="feature-icon bg-gradient-4">
                                    <i className="fas fa-mobile-alt"></i>
                                </div>
                                <h4 className="feature-title">Mobile Learning</h4>
                                <p className="feature-description">
                                    Access courses on-the-go with our mobile app for seamless learning experience.
                                </p>
                                <a href="#" className="feature-link">Learn more <i className="fas fa-arrow-right ms-2"></i></a>
                            </div>
                        </div>

                        {/* Feature 5 */}
                        <div className="col-lg-3 col-md-6">
                            <div className="feature-card">
                                <div className="feature-icon bg-gradient-5">
                                    <i className="fas fa-clock"></i>
                                </div>
                                <h4 className="feature-title">Learn at Your Pace</h4>
                                <p className="feature-description">
                                    Study whenever and wherever you want with lifetime access to course materials.
                                </p>
                                <a href="#" className="feature-link">Learn more <i className="fas fa-arrow-right ms-2"></i></a>
                            </div>
                        </div>

                        {/* Feature 6 */}
                        <div className="col-lg-3 col-md-6">
                            <div className="feature-card">
                                <div className="feature-icon bg-gradient-6">
                                    <i className="fas fa-book"></i>
                                </div>
                                <h4 className="feature-title">Rich Resources</h4>
                                <p className="feature-description">
                                    Access comprehensive materials including books, notes, and downloadable resources.
                                </p>
                                <a href="#" className="feature-link">Learn more <i className="fas fa-arrow-right ms-2"></i></a>
                            </div>
                        </div>

                        {/* Feature 7 */}
                        <div className="col-lg-3 col-md-6">
                            <div className="feature-card">
                                <div className="feature-icon bg-gradient-7">
                                    <i className="fas fa-chart-line"></i>
                                </div>
                                <h4 className="feature-title">Track Progress</h4>
                                <p className="feature-description">
                                    Monitor your learning journey with detailed analytics and performance insights.
                                </p>
                                <a href="#" className="feature-link">Learn more <i className="fas fa-arrow-right ms-2"></i></a>
                            </div>
                        </div>

                        {/* Feature 8 */}
                        <div className="col-lg-3 col-md-6">
                            <div className="feature-card">
                                <div className="feature-icon bg-gradient-8">
                                    <i className="fas fa-star"></i>
                                </div>
                                <h4 className="feature-title">Expert Instructors</h4>
                                <p className="feature-description">
                                    Learn from industry experts with years of experience in their respective fields.
                                </p>
                                <a href="#" className="feature-link">Learn more <i className="fas fa-arrow-right ms-2"></i></a>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <BaseFooter />

        </>
    )
}

export default Index
