    import { useParams } from "react-router-dom";
    import { useState, useEffect, useContext } from "react";
    import BaseHeader from "../partials/BaseHeader";
    import BaseFooter from "../partials/BaseFooter";
    // import { CartContext } from '../context/CartContext';
    import { CartContext } from "../plugin/Context";
    // import { toast } from 'react-toastify';
    // import { toast } from "react-toastify"
    import toast from "../plugin/toast";
    import { Modal, Button } from "react-bootstrap";

    import { Link } from "react-router-dom";

    const BookDetail = () => {
    const { id } = useParams();
    const [book, setBook] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [addToCartBtn, setAddToCartBtn] = useState("Add To Cart");
    const [cartCount, setCartCount] = useContext(CartContext);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [showPreview, setShowPreview] = useState(false);
    const [recommendedBooks, setRecommendedBooks] = useState([]);

    useEffect(() => {
        fetch(`http://localhost:8000/api/v1/books/books-detail/${id}/`)
        .then((response) => response.json())
        .then((data) => {
            setBook(data);
            setPreviewUrl(data.preview_url);
            setIsLoading(false);

            fetch(`http://localhost:8000/api/v1/books/${id}/recommendations/`)
            .then((res) => res.json())
            .then((recData) => setRecommendedBooks(recData))
            .catch((err) =>
                console.error("Error fetching recommendations:", err)
            );
        })
        .catch((error) => {
            console.error("Error fetching book:", error);
            setIsLoading(false);
        });
    }, [id]);

    if (isLoading) {
        return (
        <div className="text-center">
            <p>
            Loading <i className="fas fa-spinner fa-spin"></i>
            </p>
        </div>
        );
    }

    if (!book) {
        return (
        <div className="text-center text-lg font-semibold">Book not found.</div>
        );
    }

    return (
        <>
        <BaseHeader />

        <div>
            <section className="bg-light py-0 py-sm-5">
            <div className="container">
                <div className="row py-5">
                <div className="col-lg-8">
                    {/* Badge */}
                    {book?.category?.title && (
                    <h6 className="mb-3 font-base bg-primary text-white py-2 px-4 rounded-2 d-inline-block">
                        {book.category.title}
                    </h6>
                    )}

                    {/* Title */}
                    <h1 className="mb-3">{book.title}</h1>
                    <p
                    className="mb-3"
                    dangerouslySetInnerHTML={{
                        __html: `${book?.description?.slice(0, 200)}`,
                    }}
                    ></p>

                    {/* Content */}
                    <ul className="list-inline mb-0">
                    <li className="list-inline-item h6 me-3 mb-1 mb-sm-0">
                        <i className="fas fa-star text-warning me-2" />
                        {book.average_rating}/5
                    </li>
                    <li className="list-inline-item h6 me-3 mb-1 mb-sm-0">
                        <i className="fas fa-user-graduate text-orange me-2" />
                        {book.students?.length}
                    </li>
                    <li className="list-inline-item h6 me-3 mb-1 mb-sm-0">
                        <i className="fas fa-signal text-success me-2" />
                        {book.level}
                    </li>
                    <li className="list-inline-item h6 me-3 mb-1 mb-sm-0">
                        <i className="bi bi-patch-exclamation-fill text-danger me-2" />
                        {new Date(book.date).toLocaleDateString()}
                    </li>
                    <li className="list-inline-item h6 mb-0">
                        <i className="fas fa-globe text-info me-2" />
                        {book.language}
                    </li>
                    </ul>
                </div>
                </div>
            </div>
            </section>

            <section className="pb-0 py-lg-5">
            <div className="container">
                <div className="row">
                {/* Main content START */}
                <div className="col-lg-8">
                    <div className="card shadow rounded-2 p-0">
                    {/* Tabs START */}
                    <div className="card-header border-bottom px-4 py-3">
                        <ul
                        className="nav nav-pills nav-tabs-line py-0"
                        id="book-pills-tab"
                        role="tablist"
                        >
                        <li className="nav-item me-2 me-sm-4" role="presentation">
                            <button
                            className="nav-link mb-2 mb-md-0 active"
                            id="book-pills-tab-1"
                            data-bs-toggle="pill"
                            data-bs-target="#book-pills-1"
                            type="button"
                            role="tab"
                            aria-controls="book-pills-1"
                            aria-selected="true"
                            >
                            Overview
                            </button>
                        </li>
                        <li className="nav-item me-2 me-sm-4" role="presentation">
                            <button
                            className="nav-link mb-2 mb-md-0"
                            id="book-pills-tab-2"
                            data-bs-toggle="pill"
                            data-bs-target="#book-pills-2"
                            type="button"
                            role="tab"
                            aria-controls="book-pills-2"
                            aria-selected="false"
                            >
                            Reviews
                            </button>
                        </li>
                        </ul>
                    </div>
                    {/* Tabs END */}

                    {/* Tab contents START */}
                    <div className="card-body p-4">
                        <div
                        className="tab-content pt-2"
                        id="book-pills-tabContent"
                        >
                        {/* Overview Tab */}
                        <div
                            className="tab-pane fade show active"
                            id="book-pills-1"
                            role="tabpanel"
                            aria-labelledby="book-pills-tab-1"
                        >
                            <h5 className="mb-3">Book Description</h5>
                            <p
                            className="mb-3"
                            dangerouslySetInnerHTML={{
                                __html: `${book?.description}`,
                            }}
                            ></p>
                        </div>

                        {/* Reviews Tab */}
                        <div
                            className="tab-pane fade"
                            id="book-pills-2"
                            role="tabpanel"
                            aria-labelledby="book-pills-tab-2"
                        >
                            <div className="row mb-1">
                            <h5 className="mb-4">Our Reader Reviews</h5>
                            </div>

                            {/* Leave Review Form */}
                            <div className="mt-2">
                            <h5 className="mb-4">Leave a Review</h5>
                            <form className="row g-3">
                                <div className="col-12 bg-light-input">
                                <select
                                    id="inputState2"
                                    className="form-select js-choice"
                                >
                                    <option selected="">★★★★★ (5/5)</option>
                                    <option>★★★★☆ (4/5)</option>
                                    <option>★★★☆☆ (3/5)</option>
                                    <option>★★☆☆☆ (2/5)</option>
                                    <option>★☆☆☆☆ (1/5)</option>
                                </select>
                                </div>
                                <div className="col-12 bg-light-input">
                                <textarea
                                    className="form-control"
                                    id="exampleFormControlTextarea1"
                                    placeholder="Your review"
                                    rows={3}
                                    defaultValue={""}
                                />
                                </div>
                                <div className="col-12">
                                <button
                                    type="submit"
                                    className="btn btn-primary mb-0"
                                >
                                    Post Review
                                </button>
                                </div>
                            </form>
                            </div>
                        </div>
                        </div>
                    </div>
                    {/* Tab contents END */}
                    </div>
                </div>
                {/* Main content END */}

                {/* Right sidebar START */}
                <div className="col-lg-4 pt-5 pt-lg-0">
                    <div className="row mb-5 mb-lg-0">
                    <div className="col-md-6 col-lg-12">
                        {/* Book Image */}
                        <div className="card shadow p-2 mb-4 z-index-9">
                        <div className="overflow-hidden rounded-3">
                            <img
                            src={book.image}
                            className="card-img"
                            alt="book image"
                            />
                        </div>

                        {/* Card body */}
                        <div className="card-body px-3">
                            {/* Price and Add to Cart */}
                            <div className="d-flex justify-content-between align-items-center">
                            <h3 className="fw-bold mb-0 me-2">${book.price}</h3>
                            <div className="dropdown">
                                <a
                                href="#"
                                className="btn btn-sm btn-light rounded small"
                                role="button"
                                id="dropdownShare"
                                data-bs-toggle="dropdown"
                                aria-expanded="false"
                                >
                                <i className="fas fa-fw fa-share-alt" />
                                </a>
                                <ul
                                className="dropdown-menu dropdown-w-sm dropdown-menu-end min-w-auto shadow rounded"
                                aria-labelledby="dropdownShare"
                                >
                                <li>
                                    <a className="dropdown-item" href="#">
                                    <i className="fab fa-twitter-square me-2" />
                                    Twitter
                                    </a>
                                </li>
                                <li>
                                    <a className="dropdown-item" href="#">
                                    <i className="fab fa-facebook-square me-2" />
                                    Facebook
                                    </a>
                                </li>
                                <li>
                                    <a className="dropdown-item" href="#">
                                    <i className="fab fa-linkedin me-2" />
                                    LinkedIn
                                    </a>
                                </li>
                                <li>
                                    <a className="dropdown-item" href="#">
                                    <i className="fas fa-copy me-2" />
                                    Copy link
                                    </a>
                                </li>
                                </ul>
                            </div>
                            </div>
                            <div>
                            {previewUrl && (
                                <button
                                className="btn btn-info mb-3 w-100"
                                onClick={() => setShowPreview(true)}
                                >
                                <i className="fas fa-book-open"></i> Preview Book
                                </button>
                            )}
                            <Modal
                                show={showPreview}
                                onHide={() => setShowPreview(false)}
                                size="lg"
                            >
                                <Modal.Header closeButton>
                                <Modal.Title>Book Preview</Modal.Title>
                                </Modal.Header>
                                <Modal.Body>
                                <iframe
                                    src={previewUrl}
                                    width="100%"
                                    height="500px"
                                    style={{ border: "none" }}
                                ></iframe>
                                </Modal.Body>
                                <Modal.Footer>
                                <Button
                                    variant="secondary"
                                    onClick={() => setShowPreview(false)}
                                >
                                    Close
                                </Button>
                                </Modal.Footer>
                            </Modal>
                            </div>
                            {/* Add to Cart & Buy Now Buttons */}
                            <div className="mt-3 d-sm-flex justify-content-sm-between">
                            {/* {addToCartBtn === "Add To Cart" && (
                                <button
                                type="button"
                                className="btn btn-primary mb-0 w-100 me-2"
                                onClick={() =>
                                    addToCart(
                                    book.id,
                                    userId,
                                    book.price,
                                    country,
                                    cartId()
                                    )
                                }
                                >
                                <i className="fas fa-shopping-cart"></i> Add To
                                Cart
                                </button>
                            )} */}
                            {/* {addToCartBtn === "Added To Cart" && (
                                <button
                                type="button"
                                className="btn btn-primary mb-0 w-100 me-2"
                                onClick={() =>
                                    addToCart(
                                    book.id,
                                    userId,
                                    book.price,
                                    country,
                                    cartId()
                                    )
                                }
                                >
                                <i className="fas fa-check-circle"></i> Added To
                                Cart
                                </button>
                            )}
                            {addToCartBtn === "Adding To Cart" && (
                                <button
                                type="button"
                                className="btn btn-primary mb-0 w-100 me-2"
                                onClick={() =>
                                    addToCart(
                                    book.id,
                                    userId,
                                    book.price,
                                    country,
                                    cartId()
                                    )
                                }
                                >
                                <i className="fas fa-spinner fa-spin"></i> Adding
                                To Cart
                                </button>
                            )} */}

                            <Link
                                to="/cart/"
                                className="btn btn-success mb-0 w-100"
                            >
                                Buy Now <i className="fas fa-arrow-right"></i>
                            </Link>
                            </div>
                        </div>
                        </div>

                        {/* Book Info */}
                        <div className="card card-body shadow p-4 mb-4">
                        <h4 className="mb-3">This book includes</h4>
                        <ul className="list-group list-group-borderless">
                            <li className="list-group-item d-flex justify-content-between align-items-center">
                            <span className="h6 fw-light mb-0">
                                <i className="fas fa-fw fa-book-open text-primary me-2" />
                                Pages
                            </span>
                            <span>{book.pages}</span>
                            </li>
                            <li className="list-group-item d-flex justify-content-between align-items-center">
                            <span className="h6 fw-light mb-0">
                                <i className="fas fa-fw fa-globe text-primary me-2" />
                                Language
                            </span>
                            <span>{book.language}</span>
                            </li>
                            <li className="list-group-item d-flex justify-content-between align-items-center">
                            <span className="h6 fw-light mb-0">
                                <i className="fas fa-fw fa-medal text-primary me-2" />
                                Publisher
                            </span>
                            <span>{book.publisher}</span>
                            </li>
                        </ul>
                        </div>
                    </div>
                    </div>
                </div>
                {/* Right sidebar END */}
                </div>
                {/* 📌 Recommended Books Section */}
                <h3 className="mt-4">📌 Recommended Books</h3>
                <div className="d-flex gap-5">
                {recommendedBooks.length > 0 ? (
  recommendedBooks.map((rec) => (
    <div key={rec.id} className="card p-2">
      {rec.image && (
        <img
          src={rec.image}
          alt={rec.title}
          style={{ width: "160px" }}
        />
      )}
      <h5>{rec.title}</h5>
      <p>Author: {rec.author}</p>
      <p>${rec.price}</p>
      <button
        className="btn btn-outline-primary"
        onClick={() => (window.location.href = `/books/${rec.id}`)}
      >
        View Book
      </button>
    </div>
  ))
) : (
  <p>No recommendations available.</p>
)}
                </div>
            </div>
            </section>
        </div>

        <BaseFooter />
        </>
    );
    };

    export default BookDetail;
