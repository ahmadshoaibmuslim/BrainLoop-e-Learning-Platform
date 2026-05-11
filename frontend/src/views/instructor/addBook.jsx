import React, { useState, useRef } from 'react';
import Cookies from 'js-cookie';
import toast from '../plugin/toast';
import apiInstance from '../../utils/axios';
import BaseHeader from '../partials/BaseHeader';
import BaseFooter from '../partials/BaseFooter';
import '../styles/addBook.css'; // Custom CSS for enhanced styling

const AddBook = () => {
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    description: '',
    category: '',
    price: '',
    image: null,
    preview_url: '',
    total_pages: '',
    preview_pages: '',
    pdf_file: null,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  const categoryChoices = [
    'Technology',
    'Adventure',
    'Science',
    'History',
    'Web Development',
    'AI',
    'ML',
    'Python',
    'Mobile App',
    'Deep Learning',
  ];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setFormData({ ...formData, [e.target.name]: file });

    // Create image preview for cover image
    if (e.target.name === 'image' && file) {
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const token = Cookies.get('access_token');

    if (!token) {
      toast.error("You must be logged in to add a book.");
      setIsSubmitting(false);
      return;
    }

    const data = new FormData();
    for (const key in formData) {
      if (formData[key] !== null && formData[key] !== '') {
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
        category: '',
        price: '',
        image: null,
        preview_url: '',
        total_pages: '',
        preview_pages: '',
        pdf_file: null,
      });
      setImagePreview(null);
    } catch (error) {
      console.error(error);
      toast.error("Failed to add book. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <BaseHeader />
      <div className="add-book-container">
        <div className="background-decoration"></div>
        
        <div className="container">
          {/* Enhanced Page Header with Animation */}
          <div className="page-header text-center mb-5 fade-in">
            <div className="header-icon-wrapper mb-3">
              <div className="header-icon">
                <i className="fas fa-book-open"></i>
              </div>
            </div>
            <h1 className="display-4 fw-bold gradient-text mb-3">
              Create Your Book
            </h1>
            <p className="lead text-muted mb-4">
              Share your knowledge with thousands of students. Upload your book and reach a global audience.
            </p>
            <div className="header-divider mx-auto"></div>
          </div>

          <div className="row justify-content-center">
            <div className="col-lg-11">
              <div className="form-wrapper">
                {/* Progress Indicator */}
                <div className="progress-section mb-4">
                  <div className="progress-bar-custom">
                    <div className="progress-step active">
                      <span className="step-number">1</span>
                      <span className="step-label">Details</span>
                    </div>
                    <div className="progress-line"></div>
                    <div className="progress-step">
                      <span className="step-number">2</span>
                      <span className="step-label">Upload</span>
                    </div>
                    <div className="progress-line"></div>
                    <div className="progress-step">
                      <span className="step-number">3</span>
                      <span className="step-label">Preview</span>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="book-form">
                  <div className="row g-4">
                    {/* Left Column - Form Fields */}
                    <div className="col-lg-8">
                      {/* Basic Information Section */}
                      <div className="form-section card-section mb-4 slide-in-left">
                        <div className="section-header">
                          <div className="section-icon">
                            <i className="fas fa-info-circle"></i>
                          </div>
                          <div>
                            <h5 className="section-title mb-1">Basic Information</h5>
                            <p className="section-subtitle">Essential details about your book</p>
                          </div>
                        </div>

                        {/* Title */}
                        <div className="form-group">
                          <label htmlFor="title" className="form-label-custom">
                            <i className="fas fa-heading"></i> Book Title
                            <span className="required">*</span>
                          </label>
                          <div className="input-group-wrapper">
                            <input
                              type="text"
                              className="form-control-enhanced"
                              id="title"
                              name="title"
                              value={formData.title}
                              onChange={handleChange}
                              placeholder="Enter an engaging book title"
                              required
                              maxLength="200"
                            />
                            <span className="char-count">{formData.title.length}/200</span>
                          </div>
                        </div>

                        {/* Author */}
                        <div className="form-group">
                          <label htmlFor="author" className="form-label-custom">
                            <i className="fas fa-user"></i> Author Name
                            <span className="required">*</span>
                          </label>
                          <input
                            type="text"
                            className="form-control-enhanced"
                            id="author"
                            name="author"
                            value={formData.author}
                            onChange={handleChange}
                            placeholder="Your name or pen name"
                            required
                            maxLength="100"
                          />
                        </div>

                        {/* Description */}
                        <div className="form-group">
                          <label htmlFor="description" className="form-label-custom">
                            <i className="fas fa-align-left"></i> Description
                            <span className="required">*</span>
                          </label>
                          <textarea
                            className="form-control-enhanced textarea-enhanced"
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows="5"
                            placeholder="Write a compelling description of your book. Include key topics, target audience, and unique features..."
                            required
                            maxLength="2000"
                          />
                          <span className="char-count">{formData.description.length}/2000</span>
                        </div>

                        {/* Category and Price Row */}
                        <div className="row g-3">
                          <div className="col-md-6">
                            <div className="form-group">
                              <label htmlFor="category" className="form-label-custom">
                                <i className="fas fa-tags"></i> Category
                                <span className="required">*</span>
                              </label>
                              <select
                                className="form-select-enhanced"
                                id="category"
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                required
                              >
                                <option value="">Choose a category...</option>
                                {categoryChoices.map((cat) => (
                                  <option key={cat} value={cat}>
                                    {cat}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div className="col-md-6">
                            <div className="form-group">
                              <label htmlFor="price" className="form-label-custom">
                                <i className="fas fa-dollar-sign"></i> Price (USD)
                                <span className="required">*</span>
                              </label>
                              <div className="price-input-wrapper">
                                <span className="currency-symbol">$</span>
                                <input
                                  type="number"
                                  className="form-control-enhanced"
                                  id="price"
                                  name="price"
                                  value={formData.price}
                                  onChange={handleChange}
                                  placeholder="99.99"
                                  min="0"
                                  step="0.01"
                                  required
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* File Uploads Section */}
                      <div className="form-section card-section mb-4 slide-in-left">
                        <div className="section-header">
                          <div className="section-icon">
                            <i className="fas fa-cloud-upload-alt"></i>
                          </div>
                          <div>
                            <h5 className="section-title mb-1">Upload Files</h5>
                            <p className="section-subtitle">Add your book cover and content</p>
                          </div>
                        </div>

                        {/* Book Cover Image */}
                        <div className="form-group">
                          <label className="form-label-custom">
                            <i className="fas fa-image"></i> Book Cover Image
                          </label>
                          <div className="file-upload-area">
                            <input
                              type="file"
                              className="file-input"
                              id="image"
                              name="image"
                              onChange={handleFileChange}
                              accept="image/*"
                              ref={fileInputRef}
                            />
                            <label htmlFor="image" className="file-upload-label">
                              <div className="upload-icon">
                                <i className="fas fa-image"></i>
                              </div>
                              <h6 className="mb-1">Upload Book Cover</h6>
                              <p className="text-muted small">JPG, PNG (Recommended: 400x600px)</p>
                            </label>
                          </div>
                          {formData.image && (
                            <div className="file-info mt-2">
                              <i className="fas fa-check-circle text-success me-2"></i>
                              <small>{formData.image.name}</small>
                            </div>
                          )}
                        </div>

                        {/* PDF File Upload */}
                        <div className="form-group">
                          <label className="form-label-custom">
                            <i className="fas fa-file-pdf"></i> Book PDF File
                            <span className="required">*</span>
                          </label>
                          <div className="file-upload-area">
                            <input
                              type="file"
                              className="file-input"
                              id="pdf_file"
                              name="pdf_file"
                              onChange={handleFileChange}
                              accept=".pdf"
                              required
                            />
                            <label htmlFor="pdf_file" className="file-upload-label">
                              <div className="upload-icon pdf-icon">
                                <i className="fas fa-file-pdf"></i>
                              </div>
                              <h6 className="mb-1">Upload PDF File</h6>
                              <p className="text-muted small">Your complete book in PDF format</p>
                            </label>
                          </div>
                          {formData.pdf_file && (
                            <div className="file-info mt-2">
                              <i className="fas fa-check-circle text-success me-2"></i>
                              <small>{formData.pdf_file.name}</small>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Preview Settings Section */}
                      <div className="form-section card-section mb-4 slide-in-left">
                        <div className="section-header">
                          <div className="section-icon">
                            <i className="fas fa-eye"></i>
                          </div>
                          <div>
                            <h5 className="section-title mb-1">Preview Settings</h5>
                            <p className="section-subtitle">Configure preview options for students</p>
                          </div>
                        </div>

                        {/* Preview URL */}
                        <div className="form-group">
                          <label htmlFor="preview_url" className="form-label-custom">
                            <i className="fas fa-link"></i> Preview URL (Optional)
                          </label>
                          <input
                            type="url"
                            className="form-control-enhanced"
                            id="preview_url"
                            name="preview_url"
                            value={formData.preview_url}
                            onChange={handleChange}
                            placeholder="https://example.com/preview"
                          />
                          <small className="form-text">External preview link (alternative to PDF preview)</small>
                        </div>

                        {/* Pages Info */}
                        <div className="row g-3">
                          <div className="col-md-6">
                            <div className="form-group">
                              <label htmlFor="total_pages" className="form-label-custom">
                                <i className="fas fa-file-alt"></i> Total Pages
                              </label>
                              <input
                                type="number"
                                className="form-control-enhanced"
                                id="total_pages"
                                name="total_pages"
                                value={formData.total_pages}
                                onChange={handleChange}
                                placeholder="300"
                                min="1"
                              />
                            </div>
                          </div>

                          <div className="col-md-6">
                            <div className="form-group">
                              <label htmlFor="preview_pages" className="form-label-custom">
                                <i className="fas fa-eye"></i> Free Preview Pages
                              </label>
                              <input
                                type="number"
                                className="form-control-enhanced"
                                id="preview_pages"
                                name="preview_pages"
                                value={formData.preview_pages}
                                onChange={handleChange}
                                placeholder="10"
                                min="1"
                              />
                              <small className="form-text">Pages students can preview for free</small>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Submit Button */}
                      <button
                        type="submit"
                        className={`btn-submit ${isSubmitting ? 'loading' : ''}`}
                        disabled={isSubmitting}
                      >
                        <span className="btn-text">
                          {isSubmitting ? (
                            <>
                              <i className="fas fa-spinner fa-spin me-2"></i>
                              Publishing Your Book...
                            </>
                          ) : (
                            <>
                              <i className="fas fa-rocket me-2"></i>
                              Publish Book
                            </>
                          )}
                        </span>
                      </button>
                    </div>

                    {/* Right Column - Live Preview */}
                    <div className="col-lg-4">
                      <div className="preview-sticky">
                        {/* Book Preview Card */}
                        <div className="preview-card slide-in-right">
                          <div className="preview-header">
                            <i className="fas fa-eye"></i> Live Preview
                          </div>

                          <div className="preview-body">
                            {/* Book Cover Preview */}
                            <div className="book-cover-preview mb-3">
                              {imagePreview ? (
                                <img
                                  src={imagePreview}
                                  alt="Book cover"
                                  className="book-cover-image"
                                />
                              ) : (
                                <div className="no-image-placeholder">
                                  <i className="fas fa-image"></i>
                                  <p>Book Cover</p>
                                </div>
                              )}
                            </div>

                            {/* Book Info */}
                            <div className="book-info">
                              <h6 className="book-title">
                                {formData.title || 'Book Title'}
                              </h6>
                              <p className="book-author">
                                by {formData.author || 'Author Name'}
                              </p>

                              <div className="price-badge">
                                ${formData.price || '0.00'}
                              </div>

                              {formData.category && (
                                <div className="category-badge">
                                  <i className="fas fa-tag me-1"></i>
                                  {formData.category}
                                </div>
                              )}

                              <div className="description-preview">
                                <p className="text-muted small">
                                  {formData.description
                                    ? formData.description.substring(0, 100) + '...'
                                    : 'Book description will appear here'}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Stats Card */}
                        <div className="stats-card mt-3">
                          <div className="stat-item">
                            <div className="stat-icon">
                              <i className="fas fa-file-alt"></i>
                            </div>
                            <div className="stat-info">
                              <span className="stat-number">{formData.total_pages || '0'}</span>
                              <span className="stat-label">Total Pages</span>
                            </div>
                          </div>

                          <div className="stat-item">
                            <div className="stat-icon">
                              <i className="fas fa-eye"></i>
                            </div>
                            <div className="stat-info">
                              <span className="stat-number">{formData.preview_pages || '0'}</span>
                              <span className="stat-label">Free Preview</span>
                            </div>
                          </div>

                          <div className="stat-item">
                            <div className="stat-icon">
                              <i className="fas fa-file-pdf"></i>
                            </div>
                            <div className="stat-info">
                              <span className="stat-number">{formData.pdf_file ? 'Yes' : 'No'}</span>
                              <span className="stat-label">PDF Upload</span>
                            </div>
                          </div>
                        </div>

                        {/* Tips Card */}
                        <div className="tips-card mt-3">
                          <div className="tips-header">
                            <i className="fas fa-lightbulb"></i> Tips
                          </div>
                          <ul className="tips-list">
                            <li>Use descriptive titles for better discoverability</li>
                            <li>High-quality cover images attract more students</li>
                            <li>Offer 10-20 free preview pages to boost sales</li>
                            <li>Keep description under 2000 characters</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
      <BaseFooter />
    </>
  );
};

export default AddBook;