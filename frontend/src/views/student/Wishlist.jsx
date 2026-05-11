import React, { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import Rater from "react-rater";
import "react-rater/lib/react-rater.css";

import BaseHeader from "../partials/BaseHeader";
import BaseFooter from "../partials/BaseFooter";
import Sidebar from "./Partials/Sidebar";
import Header from "./Partials/Header";

import useAxios from "../../utils/useAxios";
import UserData from "../plugin/UserData";
import { useAuthStore } from "../../store/auth";
import toast from '../plugin/toast';
import CartId from "../plugin/cartId";
import GetCurrentAddress from "../plugin/UserCountry";
import { CartContext } from "../plugin/Context";

function Wishlist() {
    const [wishlist, setWishlist] = useState([]);
    const [cartCount, setCartCount] = useContext(CartContext);
    const authUser = useAuthStore((state) => state.allUserData);
    const userId = authUser?.user_id || UserData()?.user_id;
    console.log("User ID:", userId);

    const fetchWishlist = () => {
        if (!userId) return;
        useAxios()
            .get(`student/wishlist/${userId}/`)
            .then((res) => {
                console.log("Wishlist fetched:", res.data);
                setWishlist(res.data || []);
            })
            .catch((err) => {
                console.error("Error fetching wishlist:", err);
                setWishlist([]);
            });
    };
    const country = GetCurrentAddress()?.country;

    useEffect(() => {
        fetchWishlist();
    }, [userId]);

    const addToCart = async (courseId, userId, price, country, cartId) => {
        if (!courseId || !userId || !price || !country || !cartId) {
            console.error("Missing data:", { courseId, userId, price, country, cartId });
            return; // Exit if any value is missing
        }
    
        const formdata = new FormData();
        formdata.append("course_id", courseId);
        formdata.append("user_id", userId);
        formdata.append("price", price);
        formdata.append("country_name", country);
        formdata.append("cart_id", cartId);
    
        console.log("Sending to backend:", {
            courseId: courseId,
            userId: userId,
            price: price,
            country: country,
            cartId: cartId
        });
    
        try {
            const res = await useAxios().post(`course/cart/`, formdata);
            console.log(res.data);
            toast().fire({
                title: "Added To Cart",
                icon: "success",
            });
            useAxios().get(`course/cart-list/${CartId()}/`).then((res) => {
                setCartCount(res.data?.length);
            });
        } catch (error) {
            console.error('Error:', error.response ? error.response.data : error.message);
        }
    };
    

    const addToWishlist = async (courseId) => {
        if (!courseId) return;

        const formdata = new FormData();
        formdata.append("user_id", UserData()?.user_id);
        formdata.append("course_id", courseId);

        try {
            const res = await useAxios().post(`student/wishlist/${userId}/`, formdata);
            console.log("Wishlist response:", res.data);
            // Refresh list and notify user
            await fetchWishlist();
            toast.success(res.data.message || "Wishlist updated");
        } catch (err) {
            console.error("Error updating wishlist:", err?.response || err.message || err);
            const message = err?.response?.data?.detail || err?.response?.data?.message || "Failed to update wishlist";
            toast.error(message);
        }
    };

    const removeFromWishlist = async (wishlistId) => {
        if (!wishlistId) return;
        try {
            const res = await useAxios().delete(`student/wishlist-delete/${wishlistId}/`);
            console.log('Removed wishlist:', res.data);
            await fetchWishlist();
            toast.success(res.data.message || 'Wishlist item removed');
        } catch (err) {
            console.error('Error removing wishlist item:', err?.response || err);
            const message = err?.response?.data?.detail || err?.response?.data?.message || 'Failed to remove wishlist item';
            toast.error(message);
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
                            <h4 className="mb-0 mb-4">
                                {" "}
                                <i className="fas fa-heart"></i> Wishlist{" "}
                            </h4>

                            <div className="row">
                                <div className="col-md-12">
                                    <div className="row row-cols-1 row-cols-md-2 row-cols-lg-4 g-4">
                                        {wishlist?.map((w) => (
                                            <div className="col-lg-4" key={w.id}>
                                                {/* Card */}
                                                <div className="card card-hover">
                                                    <Link to={`/course-detail/${w.course?.slug}/`}>
                                                        <img
                                                            src={w.course?.image}
                                                            alt="course"
                                                            className="card-img-top"
                                                            style={{
                                                                width: "100%",
                                                                height: "200px",
                                                                objectFit: "cover",
                                                            }}
                                                        />
                                                    </Link>
                                                    {/* Card Body */}
                                                    <div className="card-body">
                                                        <div className="d-flex justify-content-between align-items-center mb-3">
                                                            <div>
                                                                <span className="badge bg-info">
                                                                    {w.course?.level}
                                                                </span>
                                                                <span className="badge bg-success ms-2">
                                                                    {w.course?.language}
                                                                </span>
                                                            </div>
                                                            <a
                                                                onClick={() => addToWishlist(w.course?.id)}
                                                                className="fs-5"
                                                                style={{ cursor: 'pointer' }}
                                                            >
                                                                <i className="fas fa-heart text-danger align-middle" />
                                                            </a>
                                                        </div>
                                                        <h4 className="mb-2 text-truncate-line-2 ">
                                                            <Link
                                                                to={`/course-detail/${w.course?.slug}/`}
                                                                className="text-inherit text-decoration-none text-dark fs-5"
                                                            >
                                                                {w.course?.title}
                                                            </Link>
                                                        </h4>
                                                        <small>By: {w.course?.teacher?.full_name}</small>{" "}
                                                        <br />
                                                        <small>
                                                            {w.course?.students?.length} Student
                                                            {w.course?.students?.length > 1 && "s"}
                                                        </small>{" "}
                                                        <br />
                                                        <div className="lh-1 mt-3 d-flex">
                                                            <span className="align-text-top">
                                                                <span className="fs-6">
                                                                    <Rater
                                                                        total={5}
                                                                        rating={w.course?.average_rating || 0}
                                                                    />
                                                                </span>
                                                            </span>
                                                            <span className="text-warning">4.5</span>
                                                            <span className="fs-6 ms-2">
                                                                ({w.course?.reviews?.length} Reviews)
                                                            </span>
                                                        </div>
                                                    </div>
                                                    {/* Card Footer */}
                                                    <div className="card-footer">
                                                        <div className="row align-items-center g-0">
                                                            <div className="col">
                                                                <h5 className="mb-0">${Number(w.course?.price).toFixed(2)}</h5>
                                                            </div>
                                                            <div className="col-auto d-flex gap-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        addToCart(
                                                                            w.course?.id,
                                                                            UserData()?.user_id,
                                                                            w.course?.price,
                                                                            country,
                                                                            CartId()
                                                                        )
                                                                    }
                                                                    className="text-inherit text-decoration-none btn btn-primary me-2"
                                                                >
                                                                    <i className="fas fa-shopping-cart text-primary text-white" />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeFromWishlist(w.id)}
                                                                    className="text-inherit text-decoration-none btn btn-outline-danger"
                                                                >
                                                                    Remove
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}

                                        {wishlist.length < 1 && (
                                            <p className="mt-4 p-3">No item in wishlist</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <BaseFooter />
        </>
    );
}

export default Wishlist;
