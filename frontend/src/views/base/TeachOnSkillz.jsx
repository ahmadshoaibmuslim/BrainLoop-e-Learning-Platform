import React from "react";
import { Link } from "react-router-dom";
import BaseHeader from '../partials/BaseHeader'
import BaseFooter from '../partials/BaseFooter'

const TeachOnSkillz = () => {
    return (
        <>
            <BaseHeader />
            <div className="container-xl text-center my-5 py-5">
                <h1 className="fw-bold text-primary">Become an Instructor on Skillz</h1>
                <p className="lead text-muted px-3">
                    Teach and share your expertise with thousands of students worldwide. Create engaging
                    video-based courses and help learners master new skills.
                </p>
                <Link to="/apply-instructor/" className="btn btn-lg btn-primary mt-3">
                    <i className="fas fa-chalkboard-teacher me-2"></i> Get Started
                </Link>
            </div>
            <BaseFooter />
        </>
    );
};

export default TeachOnSkillz;
