import React, { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import toast from '../plugin/toast';
import apiInstance from '../../utils/axios';
import BaseHeader from '../partials/BaseHeader';
import BaseFooter from '../partials/BaseFooter';
import '../styles/studentDashboard.css';


const MentoringSessions = () => {
  // Form States
  const [formData, setFormData] = useState({
    teacher: '',
    topic: '',
    date_time: '',
    duration: '30',
  });

  // Data States
  const [teachers, setTeachers] = useState([]);
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [pastSessions, setPastSessions] = useState([]);

  const getSessionEnd = (session) => {
    if (!session?.start_time || !session?.duration) return null;
    const start = new Date(session.start_time);
    if (Number.isNaN(start.getTime())) return null;
    return new Date(start.getTime() + session.duration * 60000);
  };

  // UI States
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('upcoming'); // request, upcoming, history

  // Fetch Data on Component Mount
  useEffect(() => {
    const token = Cookies.get('access_token');
    if (!token) {
      toast.error('Please log in first');
      return;
    }

    fetchTeachers();
    fetchSessions();
  }, []);

  // Fetch Teachers List
  const fetchTeachers = async () => {
    try {
      const response = await apiInstance.get('teachers/');
      if (response.data && Array.isArray(response.data)) {
        const teachersList = response.data.map((teacher) => ({
          id: teacher.id || teacher.user?.id,
          full_name: teacher.teacher_name || teacher.full_name || teacher.user?.full_name || teacher.user?.username || 'Unknown Teacher',
          user: teacher.user,
        }));
        setTeachers(teachersList);
      } else {
        setTeachers([]);
      }
    } catch (error) {
      console.error('Error fetching teachers:', error);
      toast.error('Failed to load teachers');
      setTeachers([]);
    }
  };

  // Fetch Mentoring Sessions
  const fetchSessions = async () => {
    try {
      setLoading(true);
      const response = await apiInstance.get('mentoring-sessions/');
      
      if (response.data && Array.isArray(response.data)) {
        const now = new Date();

        const upcoming = response.data.filter((session) => {
          const status = session?.status?.toLowerCase();
          const start = session.start_time ? new Date(session.start_time) : null;
          const end = getSessionEnd(session);
          if (!start || Number.isNaN(start.getTime())) return false;
          if (status === 'rejected') return false;
          if (status === 'accepted') {
            return end ? end > now : start > now;
          }
          return true;
        });

        const past = response.data.filter((session) => {
          const status = session?.status?.toLowerCase();
          const end = getSessionEnd(session);
          return status === 'rejected' || (status === 'accepted' && end && end <= now);
        });

        setUpcomingSessions(upcoming);
        setPastSessions(past);
      } else {
        setUpcomingSessions([]);
        setPastSessions([]);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast.error('Failed to load sessions');
      setUpcomingSessions([]);
      setPastSessions([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle Form Input Change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle Session Request Submission
  const handleSubmitSession = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const token = Cookies.get('access_token');
      if (!token) {
        toast.error('Please log in first');
        setSubmitting(false);
        return;
      }

      // Validate form data
      if (!formData.teacher) {
        toast.error('Please select a teacher');
        setSubmitting(false);
        return;
      }

      if (!formData.topic || formData.topic.trim() === '') {
        toast.error('Please enter a topic');
        setSubmitting(false);
        return;
      }

      if (!formData.date_time) {
        toast.error('Please select date and time');
        setSubmitting(false);
        return;
      }

      if (!formData.duration) {
        toast.error('Please select duration');
        setSubmitting(false);
        return;
      }

      // Prepare data for API
      const sessionData = {
        teacher_id: parseInt(formData.teacher),
        topic: formData.topic.trim(),
        start_time: formData.date_time,
        duration: parseInt(formData.duration),
      };

      // Make API call
      const response = await apiInstance.post('mentoring-sessions/', sessionData);

      if (response.status === 201 || response.status === 200) {
        toast.success('Mentoring session requested successfully!');
        
        // Reset form
        setFormData({
          teacher: '',
          topic: '',
          date_time: '',
          duration: '30',
        });

        // Refresh sessions list
        fetchSessions();
        
        // Switch to upcoming sessions tab
        setActiveTab('upcoming');
      }
    } catch (error) {
      console.error('Error creating session:', error);
      
      // Better error handling
      if (error.response?.data) {
        const errorData = error.response.data;
        if (typeof errorData === 'object') {
          const errorMessage = Object.values(errorData).flat().join(', ');
          toast.error(errorMessage || 'Failed to request session');
        } else {
          toast.error(errorData.detail || 'Failed to request session');
        }
      } else {
        toast.error('Failed to request session. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Join Session
  const handleJoinSession = (joinUrl) => {
    if (joinUrl) {
      window.open(joinUrl, '_blank');
    } else {
      toast.error('Join URL not available yet');
    }
  };

  // Format Date & Time
  const formatDateTime = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch (error) {
      return dateString;
    }
  };

  // Get Status Badge Color
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'badge-warning';
      case 'accepted':
        return 'badge-success';
      case 'rejected':
        return 'badge-danger';
      case 'completed':
        return 'badge-info';
      default:
        return 'badge-secondary';
    }
  };

  // Get Teacher Name
  const getTeacherName = (teacher, teacherName) => {
    if (teacherName) return teacherName;
    if (!teacher) return 'Unknown Teacher';
    if (typeof teacher === 'object') {
      return teacher.full_name || teacher.username || 'Unknown Teacher';
    }
    return 'Unknown Teacher';
  };

  return (
    <>
      <BaseHeader />
      
      {/* Request Session - Full Page */}
      {activeTab === 'request' && (
        <div className="mentoring-request-page">
          <div className="request-background"></div>
          <div className="request-container">
            {/* Left Side - Content */}
            <div className="request-content">
              <div className="content-header fade-in">
                <div className="content-icon">
                  <i className="fas fa-video"></i>
                </div>
                <h1>Schedule Your Mentoring Session</h1>
                <p>Connect with expert mentors and accelerate your learning journey</p>
              </div>

              {/* Benefits */}
              <div className="benefits-section">
                <div className="benefit-item">
                  <div className="benefit-icon">
                    <i className="fas fa-clock"></i>
                  </div>
                  <div className="benefit-text">
                    <h6>Flexible Timing</h6>
                    <p>Choose a time that works best for you</p>
                  </div>
                </div>

                <div className="benefit-item">
                  <div className="benefit-icon">
                    <i className="fas fa-user-tie"></i>
                  </div>
                  <div className="benefit-text">
                    <h6>Expert Mentors</h6>
                    <p>Learn from experienced professionals</p>
                  </div>
                </div>

                <div className="benefit-item">
                  <div className="benefit-icon">
                    <i className="fas fa-chart-line"></i>
                  </div>
                  <div className="benefit-text">
                    <h6>Personal Growth</h6>
                    <p>Get personalized guidance and feedback</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Form */}
            <div className="request-form-wrapper">
              <form onSubmit={handleSubmitSession} className="request-form">
                <div className="form-title">
                  <h2>Request a Session</h2>
                  <p>Complete the form to book your mentoring session</p>
                </div>

                {/* Form Fields */}
                <div className="form-fields">
                  {/* Select Teacher */}
                  <div className="form-group">
                    <label className="form-label">
                      <i className="fas fa-user-tie"></i>
                      Select Teacher
                    </label>
                    <select
                      name="teacher"
                      value={formData.teacher}
                      onChange={handleChange}
                      className="form-select"
                      required
                    >
                      <option value="">Choose a teacher...</option>
                      {Array.isArray(teachers) && teachers.length > 0 ? (
                        teachers.map(teacher => (
                          <option key={teacher.id} value={teacher.id}>
                            {teacher.full_name || 'Unknown Teacher'}
                          </option>
                        ))
                      ) : (
                        <option disabled>No teachers available</option>
                      )}
                    </select>
                    <small className="form-hint">Select the teacher you want to learn from</small>
                  </div>

                  {/* Topic */}
                  <div className="form-group">
                    <label className="form-label">
                      <i className="fas fa-lightbulb"></i>
                      Topic
                    </label>
                    <input
                      type="text"
                      name="topic"
                      value={formData.topic}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="e.g., Advanced React Hooks, Django REST API"
                      maxLength="200"
                      required
                    />
                    <small className="form-hint">What topic do you want to learn about?</small>
                  </div>

                  {/* Date & Time */}
                  <div className="form-group">
                    <label className="form-label">
                      <i className="fas fa-calendar"></i>
                      Date & Time
                    </label>
                    <input
                      type="datetime-local"
                      name="date_time"
                      value={formData.date_time}
                      onChange={handleChange}
                      className="form-input"
                      required
                    />
                    <small className="form-hint">Select when you want to have the session</small>
                  </div>

                  {/* Duration */}
                  <div className="form-group">
                    <label className="form-label">
                      <i className="fas fa-hourglass-half"></i>
                      Duration
                    </label>
                    <select
                      name="duration"
                      value={formData.duration}
                      onChange={handleChange}
                      className="form-select"
                      required
                    >
                      <option value="15">15 minutes</option>
                      <option value="30">30 minutes</option>
                      <option value="45">45 minutes</option>
                      <option value="60">1 hour</option>
                      <option value="90">1.5 hours</option>
                      <option value="120">2 hours</option>
                    </select>
                    <small className="form-hint">How long do you need for this session?</small>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="btn-request-submit"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <i className="fas fa-spinner fa-spin me-2"></i>
                        Requesting...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-paper-plane me-2"></i>
                        Request Session
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Other Tabs - Container */}
      {activeTab !== 'request' && (
        <div className="mentoring-page">
          <div className="container py-5">
            {/* Tab Navigation - Top */}
            <div className="tab-navigation-top mb-4">
              <div className="tab-buttons">
                <button
                  className={`tab-btn ${activeTab === 'upcoming' ? 'active' : ''}`}
                  onClick={() => setActiveTab('upcoming')}
                >
                  <i className="fas fa-calendar-alt me-2"></i>
                  Upcoming Sessions
                  {upcomingSessions.length > 0 && (
                    <span className="badge bg-primary ms-2">{upcomingSessions.length}</span>
                  )}
                </button>
                <button
                  className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
                  onClick={() => setActiveTab('history')}
                >
                  <i className="fas fa-history me-2"></i>
                  History
                  {pastSessions.length > 0 && (
                    <span className="badge bg-secondary ms-2">{pastSessions.length}</span>
                  )}
                </button>
                <button
                  className="tab-btn back-to-form"
                  onClick={() => setActiveTab('request')}
                >
                  <i className="fas fa-plus-circle me-2"></i>
                  New Request
                </button>
              </div>
            </div>

            {/* Upcoming Sessions Tab */}
            {activeTab === 'upcoming' && (
              <div className="tab-pane active fade-in">
                {loading ? (
                  <div className="loading-state">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-3">Loading sessions...</p>
                  </div>
                ) : Array.isArray(upcomingSessions) && upcomingSessions.length > 0 ? (
                  <div className="sessions-grid">
                    {upcomingSessions.map(session => (
                      <div key={session.id} className="session-card slide-in-left">
                        <div className="session-header">
                          <div className="session-icon">
                            <i className="fas fa-video"></i>
                          </div>
                          <div className="session-status">
                            <span className={`badge ${getStatusColor(session.status)}`}>
                              {session.status || 'pending'}
                            </span>
                          </div>
                        </div>

                        <div className="session-content">
                          <h5 className="session-title">
                            {session.topic || 'Untitled Session'}
                          </h5>

                          <div className="session-detail">
                            <i className="fas fa-user-circle"></i>
                            <span>{getTeacherName(session.teacher, session.teacher_name)}</span>
                          </div>

                          <div className="session-detail">
                            <i className="fas fa-calendar"></i>
                            <span>{formatDateTime(session.start_time)}</span>
                          </div>

                          <div className="session-detail">
                            <i className="fas fa-hourglass-end"></i>
                            <span>{session.duration || '0'} minutes</span>
                          </div>

                          {session.join_url && (
                            <div className="session-detail">
                              <i className="fas fa-link"></i>
                              <span className="text-success">Meeting link available</span>
                            </div>
                          )}
                        </div>

                        <div className="session-actions">
                          {session.status?.toLowerCase() === 'accepted' && session.join_url ? (
                            <button
                              className="btn-join"
                              onClick={() => handleJoinSession(session.join_url)}
                            >
                              <i className="fas fa-video me-2"></i>
                              Join Now
                            </button>
                          ) : session.status?.toLowerCase() === 'pending' ? (
                            <button className="btn-pending" disabled>
                              <i className="fas fa-hourglass-start me-2"></i>
                              Awaiting Acceptance
                            </button>
                          ) : (
                            <button className="btn-disabled" disabled>
                              <i className="fas fa-times-circle me-2"></i>
                              {session.status || 'Unavailable'}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <div className="empty-icon">
                      <i className="fas fa-calendar-times"></i>
                    </div>
                    <h5>No Upcoming Sessions</h5>
                    <p>You don't have any upcoming mentoring sessions.</p>
                    <button
                      className="btn-action"
                      onClick={() => setActiveTab('request')}
                    >
                      <i className="fas fa-plus me-2"></i>
                      Request a Session
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Session History Tab */}
            {activeTab === 'history' && (
              <div className="tab-pane active fade-in">
                {loading ? (
                  <div className="loading-state">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-3">Loading history...</p>
                  </div>
                ) : Array.isArray(pastSessions) && pastSessions.length > 0 ? (
                  <div className="sessions-grid">
                    {pastSessions.map(session => (
                      <div key={session.id} className="session-card history-card slide-in-left">
                        <div className="session-header">
                          <div className="session-icon completed">
                            <i className="fas fa-check-circle"></i>
                          </div>
                          <div className="session-status">
                            <span className={`badge ${getStatusColor(session.status)}`}>
                              Completed
                            </span>
                          </div>
                        </div>

                        <div className="session-content">
                          <h5 className="session-title">
                            {session.topic || 'Untitled Session'}
                          </h5>

                          <div className="session-detail">
                            <i className="fas fa-user-circle"></i>
                            <span>{getTeacherName(session.teacher, session.teacher_name)}</span>
                          </div>

                          <div className="session-detail">
                            <i className="fas fa-calendar"></i>
                            <span>{formatDateTime(session.start_time)}</span>
                          </div>

                          <div className="session-detail">
                            <i className="fas fa-hourglass-end"></i>
                            <span>{session.duration || '0'} minutes</span>
                          </div>
                        </div>

                        <div className="session-actions">
                          <button className="btn-history" disabled>
                            <i className="fas fa-archive me-2"></i>
                            Session Completed
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <div className="empty-icon">
                      <i className="fas fa-history"></i>
                    </div>
                    <h5>No Session History</h5>
                    <p>You haven't completed any mentoring sessions yet.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      <BaseFooter />
    </>
  );
};

export default MentoringSessions;