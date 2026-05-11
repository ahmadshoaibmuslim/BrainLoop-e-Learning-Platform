import React, { useState, useEffect } from 'react';
import apiInstance from '../../utils/axios';
import toast from '../plugin/toast';
import BaseHeader from '../partials/BaseHeader';
import BaseFooter from '../partials/BaseFooter';

const TeacherDashboard = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const response = await apiInstance.get('mentoring-sessions/');
      if (response?.data && Array.isArray(response.data)) {
        setSessions(response.data);
      } else {
        setSessions([]);
      }
    } catch (error) {
      console.error('Teacher dashboard fetch error:', error);
      toast.error('Unable to load mentoring sessions.');
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const patchSession = async (id, action) => {
    setProcessingId(id);
    try {
      const endpoint = `mentoring-sessions/${id}/${action}/`;
      const response = await apiInstance.patch(endpoint);
      if (response?.status === 200 || response?.status === 202) {
        toast.success(action === 'accept' ? 'Session accepted.' : 'Session rejected.');
        fetchSessions();
      } else {
        toast.error('Unable to update session status.');
      }
    } catch (error) {
      console.error(`Session ${action} error:`, error);
      const message = error?.response?.data?.detail || 'Action failed. Please try again.';
      toast.error(message);
    } finally {
      setProcessingId(null);
    }
  };

  const cancelSession = async (id) => {
    const confirmed = window.confirm('Are you sure you want to cancel this mentoring session?');
    if (!confirmed) return;

    setProcessingId(id);
    try {
      const response = await apiInstance.delete(`mentoring-sessions/${id}/`);
      if (response?.status === 204 || response?.status === 200) {
        toast.success('Session cancelled successfully.');
        fetchSessions();
      } else {
        toast.error('Unable to cancel session.');
      }
    } catch (error) {
      console.error('Cancel session error:', error);
      const message = error?.response?.data?.detail || 'Cancellation failed. Please try again.';
      toast.error(message);
    } finally {
      setProcessingId(null);
    }
  };

  const formatDateTime = (value) => {
    if (!value) return 'TBA';
    try {
      const date = new Date(value);
      return date.toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch (error) {
      return value;
    }
  };

  const getStudentName = (student) => {
    if (!student) return 'Unknown Student';
    if (typeof student === 'object') {
      return student.full_name || student.username || student.email || 'Unknown Student';
    }
    return String(student);
  };

  const now = new Date();
  const pendingRequests = Array.isArray(sessions)
    ? sessions.filter((session) => session?.status === 'pending')
    : [];
  const upcomingSessions = Array.isArray(sessions)
    ? sessions.filter((session) => {
        const start = session?.start_time ? new Date(session.start_time) : null;
        const end = start && session?.duration ? new Date(start.getTime() + session.duration * 60000) : null;
        return session?.status === 'accepted' && start && end && end > now;
      })
    : [];
  const historySessions = Array.isArray(sessions)
    ? sessions.filter((session) => {
        const start = session?.start_time ? new Date(session.start_time) : null;
        const end = start && session?.duration ? new Date(start.getTime() + session.duration * 60000) : null;
        const rejected = session?.status === 'rejected';
        const completed = session?.status === 'accepted' && start && end && end <= now;
        return rejected || completed;
      })
    : [];

  const teacherDashboardStyles = `
    .teacher-dashboard-page { background: #05080f; color: #eef4ff; min-height: 100vh; }
    .teacher-dashboard-hero { background: linear-gradient(135deg, #05111f, #0d2245); padding: 48px 0; }
    .teacher-dashboard-hero h1 { color: #ffffff; font-size: 2.8rem; }
    .teacher-dashboard-hero p { color: #9fc4ff; max-width: 720px; }
    .teacher-panel { background: #081129; border: 1px solid rgba(34, 106, 255, 0.18); border-radius: 24px; padding: 32px; box-shadow: 0 30px 70px rgba(0, 0, 0, 0.28); }
    .section-heading { display: flex; justify-content: space-between; align-items: center; gap: 16px; margin-bottom: 24px; }
    .section-heading h2 { margin: 0; font-size: 1.5rem; color: #f7fbff; }
    .section-heading .section-meta { color: #90aee8; font-size: 0.95rem; }
    .teacher-card-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px; }
    .teacher-card { background: #0b1627; border: 1px solid rgba(88, 144, 255, 0.16); border-radius: 20px; padding: 24px; }
    .teacher-card h3 { margin-top: 0; margin-bottom: 16px; color: #ffffff; font-size: 1.25rem; }
    .empty-state-card { text-align: center; padding: 40px 24px; border: 1px dashed rgba(118, 151, 255, 0.25); background: rgba(11, 20, 39, 0.9); color: #a3b7ff; }
    .empty-state-card i { font-size: 2rem; margin-bottom: 14px; color: #4f83ff; }
    .session-card { background: #0e1a34; border: 1px solid rgba(79, 125, 255, 0.14); border-radius: 18px; padding: 22px; margin-bottom: 18px; }
    .session-details { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; margin-bottom: 18px; }
    .session-detail { display: flex; flex-direction: column; gap: 6px; }
    .session-detail strong { color: #dbe9ff; font-size: 0.92rem; }
    .session-detail span { color: #b8c7e8; font-size: 0.92rem; }
    .session-actions { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; }
    .btn-action { min-width: 120px; border-radius: 999px; padding: 10px 18px; font-weight: 600; transition: transform 0.2s ease, box-shadow 0.2s ease; border: none; cursor: pointer; }
    .btn-action:hover:not(:disabled) { transform: translateY(-1px); }
    .btn-accept { background: linear-gradient(135deg, #1a6eff, #2bd2ce); color: #071622; }
    .btn-reject { background: #ff466b; color: #ffffff; }
    .btn-join { background: #1b6bff; color: #ffffff; }
    .btn-cancel { background: transparent; color: #a9c6ff; border: 1px solid rgba(169, 198, 255, 0.25); }
    .btn-join:disabled,
    .btn-action:disabled { opacity: 0.55; cursor: not-allowed; transform: none; }
    .status-pill { display: inline-flex; align-items: center; justify-content: center; padding: 6px 14px; border-radius: 999px; font-size: 0.82rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; }
    .status-pending { background: rgba(255, 214, 102, 0.16); color: #ffd969; }
    .status-accepted { background: rgba(79, 200, 255, 0.16); color: #8dd8ff; }
    .status-rejected { background: rgba(255, 96, 118, 0.16); color: #ff96a6; }
    .status-completed { background: rgba(107, 255, 181, 0.16); color: #b8ffdc; }
    .session-summary { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; margin-bottom: 12px; }
    .session-summary strong { color: #f1f7ff; }
    .dashboard-meta-badge { margin-left: auto; }
    .dashboard-highlights { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 20px; margin-bottom: 32px; }
    .highlight-card { background: #0f1c35; border: 1px solid rgba(70, 130, 250, 0.16); border-radius: 20px; padding: 24px; }
    .highlight-card span { display: block; color: #9bb7ff; margin-bottom: 10px; }
    .highlight-card strong { display: block; color: #ffffff; font-size: 1.9rem; }
    @media (max-width: 991px) {
      .teacher-card-grid { grid-template-columns: 1fr; }
      .session-details { grid-template-columns: 1fr; }
      .dashboard-highlights { grid-template-columns: 1fr; }
    }
    @media (max-width: 640px) {
      .teacher-dashboard-hero { padding: 36px 0; }
      .teacher-dashboard-hero h1 { font-size: 2.2rem; }
      .teacher-dashboard-hero p { font-size: 0.95rem; }
      .section-heading { flex-direction: column; align-items: flex-start; }
      .btn-action { width: 100%; }
    }
  `;

  return (
    <>
      <BaseHeader />
      <style>{teacherDashboardStyles}</style>
      <div className="teacher-dashboard-page">
        <section className="teacher-dashboard-hero">
          <div className="container">
            <div className="row align-items-center gy-4">
              <div className="col-lg-8">
                <h1>Mentoring Sessions Dashboard</h1>
                <p>
                  Manage student requests, accept or reject new mentoring sessions, join upcoming lessons, and review completed or rejected history.
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="container py-5">
          <div className="dashboard-highlights">
            <div className="highlight-card">
              <span>Pending requests</span>
              <strong>{pendingRequests.length}</strong>
            </div>
            <div className="highlight-card">
              <span>Upcoming sessions</span>
              <strong>{upcomingSessions.length}</strong>
            </div>
            <div className="highlight-card">
              <span>Session history</span>
              <strong>{historySessions.length}</strong>
            </div>
          </div>

          <div className="teacher-card-grid">
            <div className="teacher-panel">
              <div className="section-heading">
                <div>
                  <h2>Pending Requests</h2>
                  <div className="section-meta">Only sessions with status pending are shown here.</div>
                </div>
                <span className="status-pill status-pending">Pending</span>
              </div>

              {loading ? (
                <div className="empty-state-card">Loading requests...</div>
              ) : Array.isArray(pendingRequests) && pendingRequests.length > 0 ? (
                pendingRequests.map((session) => (
                  <div key={session?.id} className="session-card">
                    <div className="session-summary">
                      <strong>{getStudentName(session?.student)}</strong>
                      <span className="dashboard-meta-badge">{formatDateTime(session?.start_time)}</span>
                    </div>

                    <div className="session-details">
                      <div className="session-detail">
                        <strong>Topic</strong>
                        <span>{session?.topic || 'No topic provided'}</span>
                      </div>
                      <div className="session-detail">
                        <strong>Duration</strong>
                        <span>{session?.duration ? `${session.duration} minutes` : 'TBA'}</span>
                      </div>
                    </div>

                    <div className="session-actions">
                      <button
                        className="btn-action btn-accept"
                        disabled={processingId === session?.id}
                        onClick={() => patchSession(session?.id, 'accept')}
                      >
                        {processingId === session?.id ? 'Processing...' : 'Accept'}
                      </button>
                      <button
                        className="btn-action btn-reject"
                        disabled={processingId === session?.id}
                        onClick={() => patchSession(session?.id, 'reject')}
                      >
                        {processingId === session?.id ? 'Processing...' : 'Reject'}
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state-card">
                  <i className="fas fa-inbox"></i>
                  <p>No pending requests in your queue.</p>
                </div>
              )}
            </div>

            <div className="teacher-panel">
              <div className="section-heading">
                <div>
                  <h2>Upcoming Sessions</h2>
                  <div className="section-meta">Accepted sessions that are scheduled for the future.</div>
                </div>
                <span className="status-pill status-accepted">Accepted</span>
              </div>

              {loading ? (
                <div className="empty-state-card">Loading upcoming sessions...</div>
              ) : Array.isArray(upcomingSessions) && upcomingSessions.length > 0 ? (
                upcomingSessions.map((session) => (
                  <div key={session?.id} className="session-card">
                    <div className="session-summary">
                      <strong>{getStudentName(session?.student)}</strong>
                      <span className="dashboard-meta-badge">{formatDateTime(session?.start_time)}</span>
                    </div>

                    <div className="session-details">
                      <div className="session-detail">
                        <strong>Topic</strong>
                        <span>{session?.topic || 'No topic provided'}</span>
                      </div>
                      <div className="session-detail">
                        <strong>Duration</strong>
                        <span>{session?.duration ? `${session.duration} minutes` : 'TBA'}</span>
                      </div>
                    </div>

                    <div className="session-actions">
                      <button
                        className="btn-action btn-join"
                        disabled={!session?.join_url}
                        onClick={() => {
                          if (session?.join_url) window.open(session.join_url, '_blank');
                        }}
                      >
                        {session?.join_url ? 'Join Session' : 'Waiting for link'}
                      </button>
                      <button
                        className="btn-action btn-cancel"
                        disabled={processingId === session?.id}
                        onClick={() => cancelSession(session?.id)}
                      >
                        {processingId === session?.id ? 'Cancelling...' : 'Cancel'}
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state-card">
                  <i className="fas fa-calendar-check"></i>
                  <p>No upcoming sessions have been scheduled yet.</p>
                </div>
              )}
            </div>

            <div className="teacher-panel">
              <div className="section-heading">
                <div>
                  <h2>Session History</h2>
                  <div className="section-meta">Completed sessions and rejected requests are archived here.</div>
                </div>
                <span className="status-pill status-completed">History</span>
              </div>

              {loading ? (
                <div className="empty-state-card">Loading history...</div>
              ) : Array.isArray(historySessions) && historySessions.length > 0 ? (
                historySessions.map((session) => {
                  const start = session?.start_time ? new Date(session.start_time) : null;
                  const isRejected = session?.status === 'rejected';
                  const statusClass = isRejected ? 'status-rejected' : 'status-completed';
                  const statusLabel = isRejected ? 'Rejected' : 'Completed';

                  return (
                    <div key={session?.id} className="session-card">
                      <div className="session-summary">
                        <strong>{getStudentName(session?.student)}</strong>
                        <span className="dashboard-meta-badge">{start ? start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'No date'}</span>
                      </div>

                      <div className="session-details">
                        <div className="session-detail">
                          <strong>Topic</strong>
                          <span>{session?.topic || 'No topic provided'}</span>
                        </div>
                        <div className="session-detail">
                          <strong>Status</strong>
                          <span className={`status-pill ${statusClass}`} style={{ marginTop: 0, padding: '8px 14px' }}>
                            {statusLabel}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="empty-state-card">
                  <i className="fas fa-history"></i>
                  <p>No completed or rejected sessions yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <BaseFooter />
    </>
  );
};

export default TeacherDashboard;
