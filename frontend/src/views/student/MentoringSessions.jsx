import React, { useState, useEffect } from "react";
import axios from "axios";
import { Modal, Button, Form } from "react-bootstrap";
import BaseHeader from "../partials/BaseHeader";
import BaseFooter from "../partials/BaseFooter";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Cookies from "js-cookie";


function MentoringSessions() {
    const [sessions, setSessions] = useState([]);
    const [mentors, setMentors] = useState([]);
    const [filteredSessions, setFilteredSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [formData, setFormData] = useState({
        mentorId: "",
        date: new Date(),
        time: new Date(),
        goals: "",
        title: "",
    });

    useEffect(() => {
        const fetchMentors = async () => {
            try {
                const response = await axios.get(
                    "http://127.0.0.1:8000/api/v1/teachers/"
                );
                console.log("Mentors Data:", response.data);
                setMentors(response.data);
            } catch (error) {
                console.error("Error fetching mentors:", error);
            }
        };

        const fetchSessions = async () => {
            try {
                const token = Cookies.get("access_token");
                if (!token) throw new Error("No authentication token found");
        
                const userId = localStorage.getItem("userId"); // Get user ID
                if (!userId) throw new Error("User ID not found");
        
                const response = await axios.get(
                    "http://127.0.0.1:8000/api/v1/mentoring-sessions/",
                    {
                        params: { student: userId }, // Ensure filtering by logged-in user
                        headers: {
                            Authorization: `Token ${token}`,
                            "Content-Type": "application/json",
                        },
                    }
                );
        
                console.log("Fetched Sessions:", response.data);
                setSessions(response.data);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching sessions:", error);
                setLoading(false);
            }
        };

        
        const handleBooking = async () => {
            try {
                const token = Cookies.get("access_token"); // Use Cookies consistently
                if (!token) {
                    alert("Please login again");
                    return;
                }
        
                const userId = localStorage.getItem("userId"); // Get the logged-in user ID
                if (!userId) {
                    alert("User ID not found, please log in again.");
                    return;
                }
        
                // Convert mentorId and studentId to integers
                const mentorId = parseInt(formData.mentorId, 10);
                const studentId = parseInt(userId, 10);
        
                if (isNaN(mentorId) || isNaN(studentId)) {
                    alert("Invalid mentor or student ID.");
                    return;
                }
        
                // Prepare request data
                const requestData = {
                    title: formData.title,
                    mentor: mentorId,
                    student: studentId,
                    date: formData.date.toISOString().split("T")[0], // Format date as YYYY-MM-DD
                    time: formData.time.toTimeString().split(" ")[0], // Format time as HH:MM:SS
                    goals: formData.goals || "",
                    status: "upcoming",
                };
        
                console.log("Booking Request Data:", requestData); // Debugging
        
                // API request
                const response = await axios.post(
                    "http://127.0.0.1:8000/api/v1/mentoring-sessions/",
                    requestData,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "application/json",
                        },
                    }
                );
        
                Swal.fire({
                    icon: "success",
                    title: "Session booked successfully!",
                    showConfirmButton: false,
                    timer: 1500,
                });
        
                setShowBookingModal(false);
                fetchSessions(); // Refresh session list
            } catch (error) {
                console.error("Error booking session:", error.response?.data || error);
        
                if (error.response?.status === 401 || error.response?.status === 403) {
                    try {
                        const newTokens = await getRefreshedToken();
                        if (newTokens) {
                            setAuthUser(newTokens.access, newTokens.refresh);
                            return handleBooking(); // Retry booking
                        }
                    } catch (refreshError) {
                        logout();
                        Swal.fire({
                            icon: "error",
                            title: "Session expired",
                            text: "Please login again",
                        });
                    }
                } else {
                    Swal.fire({
                        icon: "error",
                        title: "Booking failed",
                        text: error.response?.data?.message || "Please check your input",
                    });
                }
            }
        };
        

        fetchMentors();
        fetchSessions();
    }, []);

    useEffect(() => {
        if (!loading) {
            const filtered = sessions.filter((session) => {
                const matchesSearch =
                    session.title.toLowerCase().includes(searchQuery) ||
                    session.mentor?.full_name.toLowerCase().includes(searchQuery);
                const matchesFilter =
                    filterStatus === "all" || session.status === filterStatus;
                return matchesSearch && matchesFilter;
            });
            setFilteredSessions(filtered);
        }
    }, [sessions, searchQuery, filterStatus, loading]);
    
    const handleBooking = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
        console.error("No authentication token found. Please log in again.");
        return;
    }

    // Debugging: Log the formData object
    console.log("Form Data:", formData);

    // Check if mentorId is defined
    if (!formData.mentorId) {
        alert("Please select a mentor.");
        return;
    }

    // Check if session title is defined
    if (!formData.title) {
        alert("Please enter a session title.");
        return;
    }

    // Convert mentorId to an integer
    const mentorId = parseInt(formData.mentorId, 10);
    if (isNaN(mentorId)) {
        alert("Invalid mentor selected.");
        return;
    }

    // Get and validate the student ID from localStorage
    const userId = localStorage.getItem("userId");
    if (!userId) {
        console.error("User ID not found in localStorage. Please log in again.");
        return;
    }

    const studentId = parseInt(userId, 10);
    if (isNaN(studentId)) {
        console.error("Invalid user ID in localStorage.");
        return;
    }

    // Format date as YYYY-MM-DD
    const formattedDate = formData.date.toISOString().split("T")[0];

    // Format time as HH:MM:SS
    const formattedTime = formData.time.toTimeString().split(" ")[0];

    const requestData = {
        title: formData.title,  // Include the session title
        // mentor: mentorId,  // Use the mentorId from formData
        mentor: parseInt(formData.mentorId, 10), // Ensure it's an integer
        student: studentId,  // Use the validated student ID
        date: formattedDate,  // Use formatted date
        time: formattedTime,  // Use formatted time
        goals: formData.goals || "",
        status: "upcoming",
    };

    // Debugging: Log the request payload
    console.log("Request Payload:", requestData);

    try {
        const response = await axios.post(
            "http://127.0.0.1:8000/api/v1/mentoring-sessions/",
            requestData,
            {
                headers: {
                    Authorization: `Token ${token}`,
                    "Content-Type": "application/json",
                },
            }
        );
        alert("Session booked successfully!");
        setShowBookingModal(false);
        fetchSessions(); // Refresh session list
    } catch (error) {
        console.error(
            "Error booking session:",
            error.response ? error.response.data : error
        );
        alert("Failed to book session. Please check your input and try again.");
    }
};

    const handleSearch = (e) => setSearchQuery(e.target.value.toLowerCase());
    const handleFilterChange = (e) => setFilterStatus(e.target.value);

    return (
        <>
            <BaseHeader />
            <div className="container my-4">
                <h2 className="mb-4">Mentoring Sessions</h2>

                {/* Search and Filter */}
                <div className="row mb-4">
                    <div className="col-md-6 mb-3">
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Search by title or mentor"
                            onChange={handleSearch}
                        />
                    </div>
                    <div className="col-md-6">
                        <select className="form-select" onChange={handleFilterChange}>
                            <option value="all">All</option>
                            <option value="upcoming">Upcoming</option>
                            <option value="completed">Completed</option>
                            <option value="canceled">Canceled</option>
                        </select>
                    </div>
                </div>

                {/* Schedule New Session Button */}
                <button
                    className="btn btn-primary mb-4"
                    onClick={() => setShowBookingModal(true)}
                >
                    Schedule New Session
                </button>

                {/* Render Sessions */}
                {loading ? (
                    <div className="text-center">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                    </div>
                ) : (
                    filteredSessions.map((session) => (
                        <div key={session.id} className="card mb-3 shadow-sm">
                            <div className="card-body">
                                <h5 className="card-title">{session.title}</h5>
                                <p className="card-text">
                                    <strong>Mentor:</strong>{" "}
                                    {session.mentor?.full_name || "Unknown"} <br />
                                    <strong>Date:</strong> {session.date} <br />
                                    <strong>Time:</strong> {session.time} <br />
                                    <strong>Status:</strong>{" "}
                                    <span className="badge bg-success">{session.status}</span>
                                </p>
                            </div>
                        </div>
                    ))
                )}

                {/* Booking Modal */}
                <Modal
                    show={showBookingModal}
                    onHide={() => setShowBookingModal(false)}
                >
                    <Modal.Header closeButton>
                        <Modal.Title>Schedule New Session</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form>
                            {/* Mentor Selection */}
                            <Form.Group className="mb-3">
    <Form.Label>Session Title</Form.Label>
    <Form.Control
        type="text"
        placeholder="Enter session title"
        value={formData.title}
        onChange={(e) =>
            setFormData({ ...formData, title: e.target.value })
        }
        style={{ fontSize: "16px", padding: "12px" }}
    />
</Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label>Choose Mentor</Form.Label>
                                <Form.Select
    style={{ fontSize: "18px", padding: "12px" }}
    onChange={(e) => {
        console.log("Selected Mentor ID:", e.target.value); // Debugging
        setFormData({ ...formData, mentorId: (e.target.value) });
    }}
>
    <option value="">Select</option>
    {mentors.map((mentor) => (
        <option key={mentor.id} value={mentor.id}> {/* ✅ Use mentor.id here */}
            {mentor.full_name} - {mentor.expertise}
        </option>
    ))}
</Form.Select>
 
                            </Form.Group>

                            {/* Date Picker */}
                            <Form.Group className="mb-3">
                                <Form.Label>Date</Form.Label>
                                <DatePicker
                                    selected={formData.date}
                                    onChange={(date) => setFormData({ ...formData, date })}
                                    dateFormat="yyyy-MM-dd"  // Format date as YYYY-MM-DD
                                    minDate={new Date()}  // Prevent past dates
                                    className="form-control"
                                    placeholderText="Select a date"
                                    style={{ fontSize: "18px", padding: "12px", width: "100%" }}
                                />
                            </Form.Group>

                            {/* Time Picker */}
                            <Form.Group className="mb-3">
                                <Form.Label>Time</Form.Label>
                                <DatePicker
                                    selected={formData.time}
                                    onChange={(time) => setFormData({ ...formData, time })}
                                    showTimeSelect
                                    showTimeSelectOnly
                                    timeIntervals={30}  // 30-minute intervals
                                    timeCaption="Time"
                                    dateFormat="HH:mm"  // Format time as HH:MM
                                    className="form-control"
                                    placeholderText="Select a time"
                                    style={{ fontSize: "18px", padding: "12px", width: "100%" }}
                                />
                            </Form.Group>

                            {/* Goals Input */}
                            <Form.Group className="mb-3">
                                <Form.Label>Goals (Optional)</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={3}
                                    placeholder="Enter session goals"
                                    style={{ fontSize: "16px", padding: "12px" }}
                                    onChange={(e) =>
                                        setFormData({ ...formData, goals: e.target.value })
                                    }
                                />
                            </Form.Group>
                        </Form>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button
                            variant="secondary"
                            onClick={() => setShowBookingModal(false)}
                        >
                            Close
                        </Button>
                        <Button variant="primary" onClick={handleBooking}>
                            Schedule
                        </Button>
                    </Modal.Footer>
                </Modal>
            </div>

            <BaseFooter />
        </>
    );
}

export default MentoringSessions;