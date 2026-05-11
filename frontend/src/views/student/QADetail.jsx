import React, { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import moment from 'moment'

import Sidebar from './Partials/Sidebar'
import Header from './Partials/Header'
import BaseHeader from '../partials/BaseHeader'
import BaseFooter from '../partials/BaseFooter'
import useAxios from '../../utils/useAxios'
import UserData from '../plugin/UserData'

function QADetail() {
    const { course_id } = useParams()
    const [questions, setQuestions] = useState([])
    const [selectedQuestion, setSelectedQuestion] = useState(null)
    const [message, setMessage] = useState("")
    const [fetching, setFetching] = useState(true)
    const lastMessageRef = useRef()

    const fetchQuestions = async () => {
        setFetching(true)
        try {
            const response = await useAxios().get(`student/question-answer-list-create/${course_id}/`)
            console.log("Questions for course:", response.data)
            setQuestions(response.data)
            if (response.data.length > 0) {
                setSelectedQuestion(response.data[0])
            }
        } catch (error) {
            console.error("Error fetching questions:", error)
            setQuestions([])
        } finally {
            setFetching(false)
        }
    }

    useEffect(() => {
        fetchQuestions()
    }, [course_id])

    useEffect(() => {
        if (lastMessageRef.current) {
            lastMessageRef.current.scrollIntoView({ behavior: "smooth" })
        }
    }, [selectedQuestion])

    const handleSendMessage = async (e) => {
        e.preventDefault()
        if (!message.trim() || !selectedQuestion) return

        try {
            const formdata = new FormData()
            formdata.append("course_id", course_id)
            formdata.append("user_id", UserData()?.user_id)
            formdata.append("message", message)
            formdata.append("qa_id", selectedQuestion.qa_id)

            const response = await useAxios().post(`student/question-answer-message-create/`, formdata)
            console.log("Message sent:", response.data)
            setSelectedQuestion(response.data.question)
            setMessage("")
        } catch (error) {
            console.error("Error sending message:", error)
        }
    }

    const handleSelectQuestion = (q) => {
        setSelectedQuestion(q)
    }

    return (
        <>
            <BaseHeader />

            <section className="pt-5 pb-5">
                <div className="container">
                    <Header />
                    <div className="row mt-0 mt-md-4">
                        <Sidebar />
                        <div className="col-lg-9 col-md-8 col-12">
                            <h4 className="mb-0 mb-4">
                                <i className='fas fa-envelope'></i> Q/A - {selectedQuestion?.course_title || "Course Discussion"}
                            </h4>

                            {fetching ? (
                                <p className="mt-3 p-3">Loading...</p>
                            ) : (
                                <div className="row">
                                    {/* Questions List */}
                                    <div className="col-lg-4 col-md-12 mb-3 mb-lg-0">
                                        <div className="card">
                                            <div className="card-header">
                                                <h5 className="mb-0">Questions</h5>
                                            </div>
                                            <div className="card-body" style={{ maxHeight: "500px", overflowY: "auto" }}>
                                                {questions.length > 0 ? (
                                                    <div className="list-group">
                                                        {questions.map((q) => (
                                                            <button
                                                                key={q.qa_id}
                                                                className={`list-group-item list-group-item-action text-start ${selectedQuestion?.qa_id === q.qa_id ? 'active' : ''}`}
                                                                onClick={() => handleSelectQuestion(q)}
                                                            >
                                                                <h6 className="mb-1">{q.title}</h6>
                                                                <small className="text-muted">{moment(q.date).fromNow()}</small>
                                                            </button>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="text-muted">No questions found</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Messages Area */}
                                    <div className="col-lg-8">
                                        {selectedQuestion ? (
                                            <div className="card">
                                                <div className="card-header">
                                                    <h5 className="mb-0">{selectedQuestion.title}</h5>
                                                    <small className="text-muted">Asked by {selectedQuestion.user_name || 'User'}</small>
                                                </div>
                                                <div className="card-body" style={{ maxHeight: "400px", overflowY: "auto" }}>
                                                    <ul className="list-unstyled mb-0">
                                                        {selectedQuestion.messages && selectedQuestion.messages.length > 0 ? (
                                                            selectedQuestion.messages.map((msg, idx) => (
                                                                <li key={idx} className="comment-item mb-3">
                                                                    <div className="d-flex">
                                                                        <div className="avatar avatar-sm flex-shrink-0">
                                                                            <img
                                                                                className="avatar-img rounded-circle"
                                                                                src={msg.user_profile_image || "https://via.placeholder.com/40"}
                                                                                style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover" }}
                                                                                alt="user"
                                                                            />
                                                                        </div>
                                                                        <div className="ms-2">
                                                                            <div className="bg-light p-3 rounded w-100">
                                                                                <h6 className="mb-1 lead fw-bold">
                                                                                    {msg.user_name}
                                                                                    <br />
                                                                                    <span style={{ fontSize: "12px", color: "gray" }}>
                                                                                        {moment(msg.date).fromNow()}
                                                                                    </span>
                                                                                </h6>
                                                                                <p className="mb-0 mt-2">{msg.message}</p>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </li>
                                                            ))
                                                        ) : (
                                                            <li className="text-muted">No messages yet</li>
                                                        )}
                                                        <li ref={lastMessageRef}></li>
                                                    </ul>
                                                </div>

                                                {/* Message Form */}
                                                <div className="card-footer">
                                                    <form onSubmit={handleSendMessage}>
                                                        <div className="input-group">
                                                            <input
                                                                type="text"
                                                                className="form-control"
                                                                placeholder="Type your message..."
                                                                value={message}
                                                                onChange={(e) => setMessage(e.target.value)}
                                                            />
                                                            <button className="btn btn-primary" type="submit">
                                                                Send <i className='fas fa-paper-plane ms-2'></i>
                                                            </button>
                                                        </div>
                                                    </form>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="card">
                                                <div className="card-body text-center p-5">
                                                    <p className="text-muted">Select a question to view messages</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            <BaseFooter />
        </>
    )
}

export default QADetail