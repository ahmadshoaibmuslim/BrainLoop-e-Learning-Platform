import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";

import BaseHeader from "../partials/BaseHeader";
import BaseFooter from "../partials/BaseFooter";
import toast from "../plugin/toast";
import "../styles/applyInstructor.css";

const steps = [
  {
    number: 1,
    title: "Working title",
    subtitle: "Give your learning module a clear name.",
  },
  {
    number: 2,
    title: "Category",
    subtitle: "Choose the topic that best fits your expertise.",
  },
  {
    number: 3,
    title: "Intended learners",
    subtitle: "Who will benefit from this learning path?",
  },
  {
    number: 4,
    title: "Learning objectives",
    subtitle: "What will students learn by the end?",
  },
  {
    number: 5,
    title: "Prerequisites",
    subtitle: "What should learners know before starting?",
  },
  {
    number: 6,
    title: "Time commitment",
    subtitle: "Help students understand the expected pace.",
  },
  {
    number: 7,
    title: "Review and submit",
    subtitle: "Send your request for admin approval.",
  },
];

const defaultFormData = {
  title: "",
  category: "",
  learningObjectives: [""],
  intendedLearners: [""],
  prerequisites: [""],
  timeCommitment: "",
};

const CourseCreationForm = ({ userToken, courseId }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isApproved, setIsApproved] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState(defaultFormData);

  useEffect(() => {
    checkApprovalStatus();
  }, []);

  const currentStepMeta = steps[step - 1];
  const progressValue = Math.round((step / steps.length) * 100);

  const checkApprovalStatus = async () => {
    if (!courseId) {
      return;
    }

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/v1/learning-modules/${courseId}/status/`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error("Failed to fetch course status");
      }

      const data = await response.json();
      setIsApproved(data.is_approved);
      setFeedback(data.feedback || "");
    } catch (error) {
      console.error("Error checking approval status:", error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleArrayChange = (e, index, field) => {
    const updatedArray = [...formData[field]];
    updatedArray[index] = e.target.value;
    setFormData((prev) => ({ ...prev, [field]: updatedArray }));
  };

  const addArrayField = (field) => {
    setFormData((prev) => ({
      ...prev,
      [field]: [...prev[field], ""],
    }));
  };

  const removeArrayField = (field, index) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].length > 1 ? prev[field].filter((_, itemIndex) => itemIndex !== index) : [""],
    }));
  };

  const nextStep = () => {
    setStep((prev) => Math.min(prev + 1, steps.length));
  };

  const prevStep = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");

    const accessToken = userToken || Cookies.get("access_token");
    if (!accessToken) {
      setSubmitError("You need to sign in before submitting your instructor application.");
      toast().fire({
        icon: "warning",
        title: "Please sign in before submitting.",
      });
      return;
    }

    const formattedData = new FormData();
    formattedData.append("title", formData.title);
    formattedData.append("category", formData.category);
    formattedData.append("time_commitment", formData.timeCommitment);
    formattedData.append("learning_objectives", JSON.stringify(formData.learningObjectives));
    formattedData.append("intended_learners", JSON.stringify(formData.intendedLearners));
    formattedData.append("prerequisites", JSON.stringify(formData.prerequisites));

    setIsSubmitting(true);

    try {
      const response = await fetch("http://127.0.0.1:8000/api/v1/learning-modules/", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formattedData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error ${response.status}: ${errorText}`);
      }

      setIsSubmitted(true);
      // Store submission state in localStorage so header can show "Application Pending"
      localStorage.setItem("instructor_application_pending", "true");
      toast().fire({
        icon: "success",
        title: "Your request has been submitted. Please wait for admin approval.",
      });
    } catch (error) {
      console.error("Error submitting form:", error);
      setSubmitError(error.message || "Submission failed. Please try again.");
      toast().fire({
        icon: "error",
        title: "Unable to submit your request.",
        text: error.message || "Please check the form and try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderProgressDots = () => (
    <div className="apply-stepper">
      {steps.map((item) => (
        <div key={item.number} className={`apply-step ${step >= item.number ? "active" : ""}`}>
          <span>{item.number}</span>
        </div>
      ))}
    </div>
  );

  const renderArrayFields = (field, label) => {
    const values = formData[field];
    return (
      <div className="stack-group">
        {values.map((value, index) => (
          <div className="array-row" key={`${field}-${index}`}>
            <input
              type="text"
              className="form-control apply-input"
              required
              value={value}
              placeholder={`${label} ${index + 1}`}
              onChange={(e) => handleArrayChange(e, index, field)}
            />
            <button
              type="button"
              className="apply-icon-btn apply-remove-btn"
              onClick={() => removeArrayField(field, index)}
              aria-label={`Remove ${label.toLowerCase()} ${index + 1}`}
            >
              −
            </button>
          </div>
        ))}
        <button type="button" className="apply-link-btn" onClick={() => addArrayField(field)}>
          + Add another {label.toLowerCase()}
        </button>
      </div>
    );
  };

  return (
    <>
      <BaseHeader />
      <main className="apply-instructor-page">
        <section className="apply-hero">
          <div className="apply-orb apply-orb-left" />
          <div className="apply-orb apply-orb-right" />

          <div className="container py-5">
            <div className="row align-items-center g-4">
              <div className="col-lg-5">
                <div className="apply-intro-card">
                  <div className="hero-badge apply-badge mb-4">
                    <span className="hero-badge-icon">
                      <i className="fas fa-user-plus"></i>
                    </span>
                    <span>Become an instructor</span>
                  </div>
                  <h1 className="apply-title">Build and submit your learning module in a polished, guided flow.</h1>
                  <p className="apply-description">
                    Give your expertise a place on BrainLoop. Fill in the essentials, preview the progress, and submit a request for review when you’re ready.
                  </p>

                  <div className="apply-highlights">
                    <div className="apply-highlight-item">
                      <i className="fas fa-layer-group"></i>
                      <span>Structured 7-step application</span>
                    </div>
                    <div className="apply-highlight-item">
                      <i className="fas fa-shield-alt"></i>
                      <span>Submitted for admin approval</span>
                    </div>
                    <div className="apply-highlight-item">
                      <i className="fas fa-bolt"></i>
                      <span>Fast, focused form experience</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-lg-7">
                <div className="apply-form-shell">
                  <div className="apply-form-topbar">
                    <div>
                      <div className="apply-eyebrow">Application progress</div>
                      <h2 className="apply-form-title">{currentStepMeta.title}</h2>
                      <p className="apply-form-subtitle">{currentStepMeta.subtitle}</p>
                    </div>
                    <div className="apply-progress-copy">Step {step} of {steps.length}</div>
                  </div>

                  <div className="apply-progress-track">
                    <div className="apply-progress-bar" style={{ width: `${progressValue}%` }} />
                  </div>

                  {renderProgressDots()}

                  <div className="apply-card-body">
                    {isApproved === false ? (
                      <div className="apply-state-card warning">
                        <i className="fas fa-clock"></i>
                        <h3>Your learning module is still under review.</h3>
                        <p>{feedback || "Please wait for admin approval before submitting another request."}</p>
                      </div>
                    ) : isSubmitted ? (
                      <div className="apply-state-card success">
                        <i className="fas fa-circle-check"></i>
                        <h3>Your module has been submitted for review.</h3>
                        <p>We’ve received your request and will notify you once it has been approved.</p>
                      </div>
                    ) : (
                      <form className="apply-form" onSubmit={handleSubmit}>
                        {step === 1 && (
                          <div className="stack-group">
                            <label className="apply-label">Course title</label>
                            <input
                              type="text"
                              name="title"
                              className="form-control apply-input"
                              placeholder="Enter a clear, specific title"
                              required
                              value={formData.title}
                              onChange={handleChange}
                            />
                            <p className="apply-helper">Tip: use a title that reflects the outcome, not just the topic.</p>
                          </div>
                        )}

                        {step === 2 && (
                          <div className="stack-group">
                            <label className="apply-label">Category</label>
                            <select name="category" className="form-control apply-input" value={formData.category} onChange={handleChange} required>
                              <option value="">Select Category</option>
                              <option>Web Development</option>
                              <option>Data Science</option>
                              <option>Business</option>
                              <option>Design</option>
                              <option>Marketing</option>
                              <option>Health & Fitness</option>
                              <option>Photography</option>
                              <option>Music</option>
                            </select>
                            <p className="apply-helper">Choose the category that best matches your course content.</p>
                          </div>
                        )}

                        {step === 3 && (
                          <div className="stack-group">
                            <label className="apply-label">Intended learners</label>
                            <p className="apply-helper">Describe who will benefit from this module.</p>
                            {renderArrayFields("intendedLearners", "Learner")}
                          </div>
                        )}

                        {step === 4 && (
                          <div className="stack-group">
                            <label className="apply-label">Learning objectives</label>
                            <p className="apply-helper">Add clear outcomes students can expect to achieve.</p>
                            {renderArrayFields("learningObjectives", "Objective")}
                          </div>
                        )}

                        {step === 5 && (
                          <div className="stack-group">
                            <label className="apply-label">Prerequisites</label>
                            <p className="apply-helper">List any knowledge, tools, or experience students need first.</p>
                            {renderArrayFields("prerequisites", "Requirement")}
                          </div>
                        )}

                        {step === 6 && (
                          <div className="stack-group">
                            <label className="apply-label">Weekly time commitment</label>
                            <select name="timeCommitment" className="form-control apply-input" onChange={handleChange} required value={formData.timeCommitment}>
                              <option value="">Select Time Commitment</option>
                              <option>0-2 hours</option>
                              <option>2-4 hours</option>
                              <option>5+ hours</option>
                              <option>Not sure yet</option>
                            </select>
                            <p className="apply-helper">This helps students decide if the module fits their schedule.</p>
                          </div>
                        )}

                        {step === 7 && (
                          <div className="apply-review-card">
                            <h3>Review your submission</h3>
                            <div className="apply-review-grid">
                              <div>
                                <span>Title</span>
                                <strong>{formData.title || "Not set"}</strong>
                              </div>
                              <div>
                                <span>Category</span>
                                <strong>{formData.category || "Not set"}</strong>
                              </div>
                              <div>
                                <span>Time commitment</span>
                                <strong>{formData.timeCommitment || "Not set"}</strong>
                              </div>
                            </div>
                            <p className="apply-helper mb-0">If everything looks right, submit your request for review.</p>
                          </div>
                        )}

                        <div className="apply-actions">
                          <button type="button" className="apply-secondary-btn" onClick={prevStep} disabled={step === 1}>
                            Previous
                          </button>

                          {step < steps.length ? (
                            <button type="button" className="apply-primary-btn" onClick={nextStep}>
                              Continue
                            </button>
                          ) : (
                            <button type="submit" className="apply-primary-btn" disabled={isSubmitting}>
                              {isSubmitting ? "Submitting..." : "Submit for Review"}
                            </button>
                          )}
                        </div>

                        {submitError ? <div className="apply-error-text">{submitError}</div> : null}
                      </form>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <BaseFooter />
    </>
  );
};

export default CourseCreationForm;
