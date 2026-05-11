import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom';
import moment from "moment";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";



import Sidebar from './Partials/Sidebar'
import Header from './Partials/Header'
import BaseHeader from '../partials/BaseHeader'
import BaseFooter from '../partials/BaseFooter'

import useAxios from '../../utils/useAxios';
import UserData from '../plugin/UserData';
import { object } from 'prop-types';
import Swal from 'sweetalert2';

function CourseEdit() {
  const api = useAxios();
  const user = UserData();
  const teacherId = user?.teacher_id;
  const param = useParams();

  const [course, setCourse] = useState({
    category: "",
    file: "",
    image: "",
    title: "",
    description: "",
    price: "",
    level: "",
    language: "",
    teacher_course_status: "",
    slug: "",
  });

  const [categories, setCategories] = useState([]);
  const [progress, setProgress] = useState(0);
  const [cKEditorData, setCKEditorData] = useState("");


  const [variants, SetVariants] = useState([
    {
      title: "",
      description: "",
      items: [{ title: "", description: "", file: "", preview: false }]
    }
  ]);

  const fetchCourseDetails = async () => {
    try {
      const categoryRes = await api.get(`course/category/`);
      setCategories(categoryRes.data || []);
    } catch (error) {
      console.error("Failed to load categories", error);
    }

    try {
      const res = await api.get(`teacher/course-detail/${param.course_id}/`);
      const data = res.data;
      setCourse({
        category: data.category?.id || data.category || "",
        file: data.file || "",
        image: data.image || "",
        title: data.title || "",
        description: data.description || "",
        price: data.price || "",
        level: data.level || "",
        language: data.language || "",
        teacher_course_status: data.teacher_course_status || "",
        slug: data.slug || "",
      });
      SetVariants(data.variants || []);
      setCKEditorData(data.description || "");
    } catch (error) {
      console.error("Failed to load course details", error);
    }
  };

  useEffect(() => {
    if (param?.course_id) {
      fetchCourseDetails();
    }
  }, [param.course_id]);

  const handleCourseChange = (e) => {
    const { name, value } = e.target;
    setCourse((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveCourse = async () => {
    if (!teacherId || !param?.course_id) {
      Swal.fire('Error', 'Unable to save course. Instructor or course ID missing.', 'error');
      return;
    }

    try {
      const payload = {
        title: course.title,
        description: course.description,
        price: course.price,
        level: course.level,
        language: course.language,
        teacher_course_status: course.teacher_course_status,
        category: course.category,
      };

      await api.put(`/teacher/course-update/${teacherId}/${param.course_id}/`, payload);
      Swal.fire('Success!', 'Course changes have been saved successfully.', 'success');
    } catch (error) {
      console.error('Failed to save course', error);
      Swal.fire('Error', error.response?.data?.detail || 'Unable to save course. Please try again.', 'error');
    }
  };

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
              <>
                <section className="py-4 py-lg-6 bg-primary rounded-3">
                  <div className="container">
                    <div className="row">
                      <div className="offset-lg-1 col-lg-10 col-md-12 col-12">
                        <div className="d-lg-flex align-items-center justify-content-between">
                          {/* Content */}
                          <div className="mb-4 mb-lg-0">
                            <h1 className="text-white mb-1">Update Course</h1>
                            <p className="mb-0 text-white lead fw-bold">
                              Learn React.Js 2024
                            </p>
                          </div>
                          <div>
                            <Link to="/instructor/courses/" className="btn" style={{ backgroundColor: "white" }}> <i className='fas fa-arrow-left'></i> Back to Course</Link>
                            <a href="instructor-courses.html" className="btn btn-dark ms-2">Save <i className='fas fa-check-circle'></i></a>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
                <section className="pb-8 mt-5">
                  <div className="card mb-3">

                    {/* Basic Info Section */}
                    <div className="card-header border-bottom px-4 py-3">
                      <h4 className="mb-0">Basic Information</h4>
                    </div>
                    <div className="card-body">
                      <label htmlFor="courseTHumbnail" className="form-label">Thumbnail Preview</label>
                      <img style={{ width: "100%", height: "330px", objectFit: "cover", borderRadius: "10px" }} className='mb-4' src={course.image || "https://www.eclosio.ong/wp-content/uploads/2018/08/default.png"} alt="Course Thumbnail" />
                      <div className="mb-3">
                        <label htmlFor="courseTHumbnail" className="form-label">Course Thumbnail</label>
                        <input
                          id="courseTHumbnail"
                          className="form-control"
                          type="file"
                        />
                      </div>
                      <div className="mb-3">
                        <label htmlFor="introvideo" className="form-label">
                          Intro Video
                        </label>
                        <input
                          id="introvideo"
                          className="form-control"
                          type="file"
                        />
                      </div>
                      <div className="mb-3">
                        <label htmlFor="courseTitle" className="form-label">
                          Title
                        </label>
                        <input
                          id="courseTitle"
                          name="title"
                          value={course.title}
                          onChange={handleCourseChange}
                          className="form-control"
                          type="text"
                          placeholder="Enter course title"
                        />
                        <small>Write a 60 character course title.</small>
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Courses category</label>
                        <select
                          name="category"
                          className="form-select"
                          value={course.category}
                          onChange={handleCourseChange}
                        >
                          <option value="">Select category</option>
                          {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>{cat.title}</option>
                          ))}
                        </select>
                        <small>
                          Help people find your course by choosing the right category.
                        </small>
                      </div>
                      <div className="mb-3">
                        <select
                          name="level"
                          className="form-select"
                          value={course.level}
                          onChange={handleCourseChange}
                        >
                          <option value="">Select level</option>
                          <option value="Beginner">Beginner</option>
                          <option value="Intermediate">Intermediate</option>
                          <option value="Advanced">Advanced</option>
                        </select>
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Course Description</label>
                        <textarea
                          name="description"
                          className='form-control'
                          value={course.description}
                          onChange={handleCourseChange}
                          cols="30"
                          rows="10"
                        />
                        <small>A brief summary of your course.</small>
                      </div>
                      <label htmlFor="coursePrice" className="form-label">
                        Price
                      </label>
                      <input
                        id="coursePrice"
                        name="price"
                        value={course.price}
                        onChange={handleCourseChange}
                        className="form-control"
                        type="number"
                        placeholder="$20.99"
                      />
                      <div className="mb-3 mt-3">
                        <label className="form-label">Language</label>
                        <select
                          name="language"
                          className="form-select"
                          value={course.language}
                          onChange={handleCourseChange}
                        >
                          <option value="">Select language</option>
                          <option value="English">English</option>
                          <option value="Spanish">Spanish</option>
                          <option value="French">French</option>
                        </select>
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Status</label>
                        <select
                          name="teacher_course_status"
                          className="form-select"
                          value={course.teacher_course_status}
                          onChange={handleCourseChange}
                        >
                          <option value="">Select status</option>
                          <option value="Published">Published</option>
                          <option value="Draft">Draft</option>
                          <option value="Disabled">Disabled</option>
                        </select>
                      </div>
                    </div>

                    {/* Curriculum Section */}
                    <div className="card-header border-bottom px-4 py-3">
                      <h4 className="mb-0">Curriculum</h4>
                    </div>
                    <div className="card-body ">
                      <div className='border p-2 rounded-3 mb-3' style={{ backgroundColor: "#ededed" }}>
                        <div className="d-flex mb-4">
                          <input
                            type="text"
                            placeholder="Section Name"
                            required
                            className='form-control'
                          />
                          <button className='btn btn-danger ms-2' type='button' ><i className='fas fa-trash'></i></button>
                        </div>

                        <div className=' mb-2 mt-2 shadow p-2 rounded-3 ' style={{ border: "1px #bdbdbd solid" }}>
                          <input
                            type="text"
                            placeholder="Lesson Title"
                            className='form-control me-1 mt-2'
                            name='title'
                          />
                          <textarea name="" id="" cols="30" className='form-control mt-2' placeholder='Lesson Description' rows="4"></textarea>
                          <input
                            type="file"
                            placeholder="Item Price"
                            className='form-control me-1 mt-2'
                            name='price'
                          />
                          <button className='btn btn-sm btn-outline-danger me-2 mt-2' type='button'>Delete Lesson <i className='fas fa-trash'></i></button>
                        </div>
                        <button className='btn btn-sm btn-primary mt-2' type='button'>+ Add Lesson</button>
                      </div>
                      <button className='btn btn-sm btn-secondary w-100 mt-2' type='button'>+ New Section</button>
                    </div>

                  </div>
                  <button onClick={handleSaveCourse} className='btn btn-lg btn-success w-100 mt-2' type='button'>Save Changes <i className='fas fa-check-circle'></i></button>
                </section>
              </>

            </div>

          </div>
        </div>
      </section>

      <BaseFooter />
    </>
  )
}

export default CourseEdit