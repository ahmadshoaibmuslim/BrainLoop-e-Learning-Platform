import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

import BaseHeader from '../partials/BaseHeader'
import BaseFooter from '../partials/BaseFooter'
import Sidebar from './Partials/Sidebar'
import Header from './Partials/Header'
import useAxios from '../../utils/useAxios'
import UserData from '../plugin/UserData'

function QA() {
  const [coursesData, setCoursesData] = useState([])
  const [fetching, setFetching] = useState(true)

  const fetchQuestions = async () => {
    setFetching(true)
    try {
      const response = await useAxios().get(`student/question-answer-list/${UserData()?.user_id}/`)
      console.log("Questions data:", response.data)
      setCoursesData(response.data)
    } catch (error) {
      console.error("Error fetching questions:", error)
      setCoursesData([])
    } finally {
      setFetching(false)
    }
  }

  useEffect(() => {
    fetchQuestions()
  }, [])

  const handleSearchQuestion = (event) => {
    const query = event.target.value.toLowerCase()
    if (query === "") {
      fetchQuestions()
    } else {
      // Filter courses and questions by search query
      const filtered = coursesData?.map(course => ({
        ...course,
        questions: course.questions.filter(q => 
          q.title?.toLowerCase().includes(query) || 
          course.course_title?.toLowerCase().includes(query)
        )
      })).filter(course => course.questions.length > 0 || course.course_title?.toLowerCase().includes(query))
      
      setCoursesData(filtered)
    }
  }

  return (
    <>
      <BaseHeader />

      <section className="pt-5 pb-5">
        <div className="container">
          {/* Header Here */}
          <Header />
          <div className="row mt-0 mt-md-4">
            {/* Sidebar Here */}
            <Sidebar />
            <div className="col-lg-9 col-md-8 col-12">
              <h4 className="mb-0 mb-4"> <i className='fas fa-envelope'></i> Question and Answer</h4>

              <div className="card mb-4">
                <div className="card-header">
                  <span>All Questions and Answers are listed here</span>
                </div>
                <div className="card-body">
                  <form className="row gx-3">
                    <div className="col-lg-12 col-md-12 col-12 mb-lg-0 mb-2">
                      <input
                        type="search"
                        className="form-control"
                        placeholder="Search Questions or Courses"
                        onChange={handleSearchQuestion}
                      />
                    </div>
                  </form>
                </div>
                {fetching === true && <p className="mt-3 p-3">Loading...</p>}
                {fetching === false && (
                  <div className="p-4">
                    {coursesData && coursesData.length > 0 ? (
                      <div className="row g-4">
                        {coursesData.map((course) => (
                          <div key={course.course_id} className="col-lg-6 col-md-12">
                            <div className="card h-100 shadow-sm">
                              <img
                                src={course.course_image || "https://via.placeholder.com/300x200"}
                                alt={course.course_title}
                                className="card-img-top"
                                style={{ height: "200px", objectFit: "cover" }}
                              />
                              <div className="card-body">
                                <h5 className="card-title fw-bold mb-2">{course.course_title}</h5>
                                <p className="card-text text-muted mb-3">
                                  <i className='fas fa-comments me-2'></i>
                                  {course.questions.length} question{course.questions.length !== 1 ? 's' : ''}
                                </p>
                                <Link 
                                  to={`/student/question-answer/${course.course_id}/`} 
                                  className='btn btn-primary w-100'
                                >
                                  Join Conversation <i className='fas fa-arrow-right ms-2'></i>
                                </Link>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center p-5">
                        <p className="text-muted">No questions found</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <BaseFooter />
    </>
  )
}

export default QA