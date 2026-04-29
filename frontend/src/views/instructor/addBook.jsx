import React, { useState } from 'react';
import Cookies from 'js-cookie';
import toast from '../plugin/toast';
import apiInstance from '../../utils/axios';

const AddBook = () => {
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    description: '',
    price: '',
    image: null,
    preview_url: '',
    total_pages: '',
    preview_pages: '',
    pdf_file: null,
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.files[0] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const token = Cookies.get('access_token');

    if (!token) {
      toast.error("You must be logged in to add a book.");
      return;
    }

    const data = new FormData();
    for (const key in formData) {
      if (formData[key] !== null) {
        data.append(key, formData[key]);
      }
    }

    try {
      const response = await apiInstance.post('books/create/', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log(response.data);
      toast.success("Book added successfully!");

      // Reset the form after successful submission
      setFormData({
        title: '',
        author: '',
        description: '',
        price: '',
        image: null,
        preview_url: '',
        total_pages: '',
        preview_pages: '',
        pdf_file: null,
      });
    } catch (error) {
      console.error(error);
      toast.error("Failed to add book. Please try again.");
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card shadow">
            <div className="card-header bg-primary text-white">
              <h4 className="mb-0">Add a New Book</h4>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                {/* Title */}
                <div className="mb-3">
                  <label htmlFor="title" className="form-label">Title</label>
                  <input
                    type="text"
                    className="form-control"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* Author */}
                <div className="mb-3">
                  <label htmlFor="author" className="form-label">Author</label>
                  <input
                    type="text"
                    className="form-control"
                    id="author"
                    name="author"
                    value={formData.author}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* Description */}
                <div className="mb-3">
                  <label htmlFor="description" className="form-label">Description</label>
                  <textarea
                    className="form-control"
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* Price */}
                <div className="mb-3">
                  <label htmlFor="price" className="form-label">Price</label>
                  <input
                    type="number"
                    className="form-control"
                    id="price"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* Image Upload */}
                <div className="mb-3">
                  <label htmlFor="image" className="form-label">Book Cover Image</label>
                  <input
                    type="file"
                    className="form-control"
                    id="image"
                    name="image"
                    onChange={handleFileChange}
                  />
                </div>

                {/* Preview URL */}
                <div className="mb-3">
                  <label htmlFor="preview_url" className="form-label">Preview URL</label>
                  <input
                    type="url"
                    className="form-control"
                    id="preview_url"
                    name="preview_url"
                    value={formData.preview_url}
                    onChange={handleChange}
                  />
                </div>

                {/* Total Pages */}
                <div className="mb-3">
                  <label htmlFor="total_pages" className="form-label">Total Pages</label>
                  <input
                    type="number"
                    className="form-control"
                    id="total_pages"
                    name="total_pages"
                    value={formData.total_pages}
                    onChange={handleChange}
                  />
                </div>

                {/* Preview Pages */}
                <div className="mb-3">
                  <label htmlFor="preview_pages" className="form-label">Preview Pages</label>
                  <input
                    type="number"
                    className="form-control"
                    id="preview_pages"
                    name="preview_pages"
                    value={formData.preview_pages}
                    onChange={handleChange}
                  />
                </div>

                {/* PDF File Upload */}
                <div className="mb-3">
                  <label htmlFor="pdf_file" className="form-label">PDF File</label>
                  <input
                    type="file"
                    className="form-control"
                    id="pdf_file"
                    name="pdf_file"
                    onChange={handleFileChange}
                  />
                </div>

                {/* Submit Button */}
                <div className="d-grid">
                  <button type="submit" className="btn btn-primary">
                    Add Book
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddBook;