import React,{useState, useEffect} from 'react'
import BaseHeader from '../partials/BaseHeader'
import BaseFooter from '../partials/BaseFooter'
import Sidebar from './Partials/Sidebar'
import Header from './Partials/Header'

import useAxios from '../../utils/useAxios';
import UserData from '../plugin/UserData';
import toast from '../plugin/toast';


function ChangePassword() {
    const [password, setPassword] = useState({
        old_password: "",
        new_password:"",
        confirm_new_password:"",
    });

    const handlePasswordChange = (event) =>{
        setPassword({
            ...password,
            [event.target.name]: event.target.value,
        });
    }
    // console.log(password );
    const ChangePasswordSubmit = async (e) => {
        e.preventDefault();
    
        // Check if any password field is empty
        if (!password.old_password || !password.new_password || !password.confirm_new_password) {
            toast().fire({
                icon: "error",
                title: "All password fields are required",
            });
            return;
        }
    
        // Check if the new password and confirmation match
        if (password.confirm_new_password !== password.new_password) {
            toast().fire({
                icon: "error",
                title: "Passwords do not match",
            });
            return;
        }
    
        // Check if the new password is the same as the old password
        if (password.old_password === password.new_password) {
            toast().fire({
                icon: "error",
                title: "New password must be different from old password",
            });
            return;
        }
    
        const formData = new FormData();
        formData.append("user_id", UserData()?.user_id);
        formData.append("old_password", password.old_password);
        formData.append("new_password", password.new_password);
    
        try {
            const res = await useAxios().post(`user/change-password/`, formData);
            
            console.log(res.data); // Debugging
    
            // Show appropriate message based on response
            if (res.data.success) {
                toast().fire({
                    icon: "success",
                    title: "Password changed successfully",
                });
            } else {
                toast().fire({
                    icon: "error",
                    title: res.data.message || "Failed to change password",
                });
            }
        } catch (error) {
            console.error("Error changing password:", error);
            toast().fire({
                icon: "error",
                title: "An error occurred while changing password",
            });
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
                            {/* Card */}
                            <div className="card">
                                {/* Card header */}
                                <div className="card-header">
                                    <h3 className="mb-0">Change Password</h3>
                                </div>
                                {/* Card body */}
                                <div className="card-body">
                                    <div>
                                        <form className="row gx-3 needs-validation" noValidate="" onSubmit={ChangePasswordSubmit}>
                                            {/* First name */}
                                            <div className="mb-3 col-12 col-md-12">
                                                <label className="form-label" htmlFor="fname">
                                                    Old Password
                                                </label>
                                                <input
                                                    type="password"
                                                    id="password"
                                                    className="form-control"
                                                    placeholder="**************"
                                                    required=""
                                                    name="old_password"
                                                    value={password.old_password}
                                                    onChange={handlePasswordChange}
                                                />
                                            </div>
                                            {/* Last name */}
                                            <div className="mb-3 col-12 col-md-12">
                                                <label className="form-label" htmlFor="lname">
                                                    New Password
                                                </label>
                                                <input
                                                    type="password"
                                                    id="password"
                                                    className="form-control"
                                                    placeholder="**************"
                                                    required=""
                                                    name="new_password"
                                                    value={password.new_password}
                                                    onChange={handlePasswordChange}
                                                />
                                            </div>

                                            {/* Country */}
                                            <div className="mb-3 col-12 col-md-12">
                                                <label className="form-label" htmlFor="editCountry">
                                                    Confirm New Password
                                                </label>
                                                <input
                                                    type="password"
                                                    id="password"
                                                    className="form-control"
                                                    placeholder="**************"
                                                    required=""
                                                    name="confirm_new_password"
                                                    value={password.confirm_new_password}
                                                    onChange={handlePasswordChange}
                                                />
                                                <div className="invalid-feedback">Please choose country.</div>
                                            </div>
                                            <div className="col-12">
                                                {/* Button */}
                                                <button className="btn btn-primary" type="submit">
                                                    Save New Password <i className='fas fa-check-circle'></i>
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </section>

            <BaseFooter />
        </>
    )
}
export default ChangePassword