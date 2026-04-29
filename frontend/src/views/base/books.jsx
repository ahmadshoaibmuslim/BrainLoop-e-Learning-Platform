import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import BaseHeader from "../partials/BaseHeader";
import BaseFooter from "../partials/BaseFooter";

const Books = () => {
  const [books, setBooks] = useState([]); // State to store books
  const [currentPage, setCurrentPage] = useState(1); // Pagination state
  const [booksPerPage] = useState(4); // Number of books per page
  const [searchQuery, setSearchQuery] = useState(""); // Search state
  const [recommendedBooks, setRecommendedBooks] = useState([]);

  
  // Placeholder for fetching books data from backend
  const fetchBooks = () => {
    // Example books data (Replace this with API data)
    
  };

  useEffect(() => {
    fetchBooks(); // Fetch books data on component load
  }, []);

  const handleSearch = (event) => {
    const query = event.target.value.toLowerCase();
    setSearchQuery(query);
  };
  // const addToCart = async (courseId, userId, price, country, cartId) => {
  //   const formdata = new FormData();

  //   formdata.append("title", title);
  //   formdata.append("author", author);
  //   formdata.append("description", description);
  //   formdata.append("category", category);
  //   formdata.append("price", price);
  //   formdata.append("uploaded_by", uploaded_by);
  //   formdata.append("created_at", created_at);
  //   formdata.append("image", image);
  //   formdata.append("preview_url", preview_url);
  //   console.log("uploaded_by", userId); // Verify if `userId` is undefined here

  //   try {
  //     await useAxios()
  //       .post(`books/cart/`, formdata)
  //       .then((res) => {
  //         console.log(res.data);

  //         toast().fire({
  //           title: "Added To Cart",
  //           icon: "success",
  //         });
  //         //set cart count after adding to cart
  //         apiInstance()
  //           .get(`course/cart-list/${CartId()}/`)
  //           .then((res) => {
  //             setCartCount(res.data?.length);
  //           });
  //       });
  //   } catch (error) {
  //     console.log(error);
  //   }
  // };

  const filteredBooks = books.filter((book) =>
    book.title.toLowerCase().includes(searchQuery)
  );

  // Pagination logic
  const indexOfLastBook = currentPage * booksPerPage;
  const indexOfFirstBook = indexOfLastBook - booksPerPage;
  const currentBooks = filteredBooks.slice(indexOfFirstBook, indexOfLastBook);

  const totalPages = Math.ceil(filteredBooks.length / booksPerPage);

  return (
    <>
      <BaseHeader />
      <section className="mb-5">
        <div className="container mb-lg-8">
          <div className="row mb-5 mt-3">
            <div className="col-12">
              <div className="mb-6">
                <h2 className="mb-1 h1">📚 Explore Our Books</h2>
                <p>
                  Discover the best books in various categories to expand your
                  knowledge.
                </p>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mb-4">
            <input
              type="text"
              className="form-control"
              placeholder="Search for books..."
              value={searchQuery}
              onChange={handleSearch}
            />
          </div>

          <div className="row">
            <div className="col-md-12">
              <div className="row row-cols-1 row-cols-md-2 row-cols-lg-4 g-4">
                {/* Hardcoded static data for books */}
                {currentBooks.map((book) => (
                  <div className="col" key={book.id}>
                    <div className="card card-hover">
                      <Link
                        to={`/book-detail/${book.title.replace(/\s+/g, "-").toLowerCase()}/`}
                      >
                        <img
                          src={book.image}
                          alt="book"
                          className="card-img-top"
                          style={{
                            width: "100%",
                            height: "200px",
                            objectFit: "cover",
                          }}
                        />
                      </Link>
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <div>
                            <span className="badge bg-info">Technology</span>
                            <span className="badge bg-success ms-2">
                              {book.author}
                            </span>
                          </div>
                          <a href="#" className="fs-5">
                            <i className="fas fa-heart text-danger align-middle" />
                          </a>
                        </div>
                        <h4 className="mb-2 text-truncate-line-2">
                          <Link
                            to={`/book-detail/${book.title.replace(/\s+/g, "-").toLowerCase()}/`}
                            className="text-inherit text-decoration-none text-dark fs-5"
                          >
                            {book.title}
                          </Link>
                        </h4>
                        <small>By: {book.author}</small> <br />
                        <small>{book.reviews} Reviews</small>
                        <br />
                        <div className="lh-1 mt-3 d-flex">
                          <span className="align-text-top">
                            <span className="fs-6">
                              <span className="text-warning">
                                {book.rating}
                              </span>
                            </span>
                          </span>
                          <span className="fs-6 ms-2">
                            {book.reviews} Reviews
                          </span>
                        </div>
                      </div>
                      <div className="card-footer">
                        <div className="row align-items-center g-0">
                          <div className="col">
                            <h5 className="mb-0">${book.price}</h5>
                          </div>
                          <div className="col-auto">
                            <button
                              type="button"
                              className="text-inherit text-decoration-none btn btn-primary me-2"
                              onClick={() =>
                                addToCart(
                                  c.id,
                                  userId,
                                  c.price,
                                  country,
                                  cartId
                                )
                              }
                            >
                              <i className="fas fa-shopping-cart text-primary text-white" />
                            </button>
                            <Link
                              to={`/book-detail/${book.title.replace(/\s+/g, "-").toLowerCase()}/`}
                              className="text-inherit text-decoration-none btn btn-primary"
                            >
                              View Details{" "}
                              <i className="fas fa-arrow-right text-primary align-middle me-2 text-white" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              
              </div>

              {/* Pagination */}
              <nav className="mt-4">
                <ul className="pagination justify-content-center">
                  <li
                    className={`page-item ${currentPage === 1 ? "disabled" : ""}`}
                  >
                    <button
                      className="page-link"
                      onClick={() => setCurrentPage(currentPage - 1)}
                    >
                      Previous
                    </button>
                  </li>

                  {Array.from({ length: totalPages }, (_, index) => (
                    <li
                      key={index + 1}
                      className={`page-item ${currentPage === index + 1 ? "active" : ""}`}
                    >
                      <button
                        className="page-link"
                        onClick={() => setCurrentPage(index + 1)}
                      >
                        {index + 1}
                      </button>
                    </li>
                  ))}

                  <li
                    className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}
                  >
                    <button
                      className="page-link"
                      onClick={() => setCurrentPage(currentPage + 1)}
                    >
                      Next
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
        </div>
      </section>
      <BaseFooter />
    </>
  );
};

export default Books;
