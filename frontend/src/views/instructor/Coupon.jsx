import { useState, useEffect } from "react";
import moment from "moment"

import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";

import Sidebar from "./Partials/Sidebar";
import Header from "./Partials/Header";
import BaseHeader from "../partials/BaseHeader";
import BaseFooter from "../partials/BaseFooter";




import useAxios from "../../utils/useAxios";
import UserData from "../plugin/UserData";
import { teacherId } from '../../utils/constants'
import toast from "../plugin/toast";

function Coupon() {
  const api = useAxios() 

  const [coupons, setCoupons] = useState([])
  const [createCoupon, setCreateCoupon] = useState({code: "", discount: 0})

  const [show, setShow] = useState(false);
  const [showAddCoupon, setShowAddCoupon] = useState(false);

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  const handleAddCouponClose = () => setShowAddCoupon(false);
  const handleAddCouponShow = () => setShowAddCoupon(true);


  const fetchCoupons = () => {
    const teacherId = UserData()?.teacher_id;

    if (!teacherId) {
      console.error("Error: teacher_id is missing or invalid");
      return;
    }

    console.log("Fetching coupons for teacher ID:", teacherId);

    api.get(`teacher/coupon-list/${teacherId}/`)
      .then((res) => {
        console.log("Coupons API Response:", res.data);
        setCoupons(res.data);
      })
      .catch((error) => console.error("Error fetching coupons:", error));
  };
  useEffect(() => {
    fetchCoupons()
  }, [])



  const handleCreateCouponChange = (event) =>{
    setCreateCoupon({
      ...createCoupon,
      [event.target.name]:event.target.value
    })
  }
  
  const handleCouponSubmit = (e) => {
    e.preventDefault();
  
    const teacherId = UserData()?.teacher_id;
    if (!teacherId) {
      console.error("Error: Teacher ID is missing.");
      return;
    }
  
    const formData = new FormData();
    formData.append("teacher", teacherId);
    formData.append("code", createCoupon.code);
    formData.append("discount", createCoupon.discount);
  
    api
      .post(`teacher/coupon-list/${teacherId}/`, formData)
      .then((res) => {
        console.log("Coupon Created:", res.data);
        fetchCoupons();
        toast().fire({
          icon:"success",
          title:"Coupon created successfully"
        })
        handleAddCouponClose(); // ✅ Close modal
      })
      .catch((error) => console.error("Error creating coupon:", error));
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
              <div className="card mb-4">
                {/* Card header */}
                <div className="card-header d-lg-flex align-items-center justify-content-between">
                  <div className="mb-3 mb-lg-0">
                    <h3 className="mb-0">Coupons</h3>
                    <span>Manage all your coupons from here</span>
                  </div>
                  <button
                    className="btn btn-primary"
                    onClick={handleAddCouponShow}
                  >
                    Add Coupon
                  </button>
                </div>
                {/* Card body */}
                <div className="card-body">
                  {/* List group */}
                  <ul className="list-group list-group-flush">
                    {/* List group item */}
                    {coupons.map((c, index) => (


                      <li className="list-group-item p-4 shadow rounded-3">
                        <div className="d-flex">
                          <div className="ms-3 mt-2">
                            <div className="d-flex align-items-center justify-content-between">
                              <div>
                                <h4 className="mb-0">{c.code}</h4>
                                <span>{c.used_by}  Student</span>
                              </div>
                            </div>
                            <div className="mt-2">
                              <p className="mt-2">
                                <span className="me-2 fw-bold">
                                  Discount:{" "}
                                  <span className="fw-light">
                                    {c.discount}% Discount</span>
                                </span>
                              </p>
                              <p className="mt-1">
                                <span className="me-2 fw-bold">
                                  Date Created:{" "}
                                  <span className="fw-light">{moment(c.date).format("DD MMM,YYYY")}</span>
                                </span>
                              </p>
                              <p>
                                <button
                                  class="btn btn-outline-secondary"
                                  type="button"
                                  onClick={handleShow}
                                >
                                  Update Coupon
                                </button>

                                <button
                                  class="btn btn-danger ms-2"
                                  type="button"
                                >
                                  <i className="fas fa-trash"></i>
                                </button>
                              </p>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>
            Update Coupon - <span className="fw-bold">CODE1</span>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <form>
            <div class="mb-3">
              <label for="exampleInputEmail1" class="form-label">
                Code
              </label>
              <input
                type="text"
                placeholder="Code"
                value={createCoupon.code}
                className="form-control"
                name="code"
                onChange={handleCreateCouponChange}
                id=""
              />
              <label for="exampleInputEmail1" class="form-label mt-3">
                Discount
              </label>
              <input
                type="text"
                placeholder="Discount"
                value={createCoupon.discount}
                className="form-control"
                name="discount"
                onChange={handleCreateCouponChange}
                id=""
              />
            </div>

            <button type="submit" class="btn btn-primary">
              Update Coupon <i className="fas fa-check-circle"> </i>
            </button>

            <Button className="ms-2" variant="secondary" onClick={handleClose}>
              Close
            </Button>
          </form>
        </Modal.Body>
      </Modal>

      <Modal show={showAddCoupon} onHide={handleAddCouponClose}>
        <Modal.Header closeButton>
          <Modal.Title>Create New Coupon</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <form onSubmit={handleCouponSubmit}>
            <div class="mb-3">
            <label for="exampleInputEmail1" class="form-label">
                Code
              </label>
              <input
                type="text"
                placeholder="Code"
                value={createCoupon.code}
                className="form-control"
                name="code"
                onChange={handleCreateCouponChange}
                id=""
              />
              <label for="exampleInputEmail1" class="form-label mt-3">
                Discount
              </label>
              <input
                type="text"
                placeholder="Discount"
                value={createCoupon.discount}
                className="form-control"
                name="discount"
                onChange={handleCreateCouponChange}
                id=""
              />
            </div>

            <button type="submit" class="btn btn-primary">
              Create Coupon <i className="fas fa-plus"> </i>
            </button>

            <Button
              className="ms-2"
              variant="secondary"
              onClick={handleAddCouponClose}
            >
              Close
            </Button>
          </form>
        </Modal.Body>
      </Modal>

      <BaseFooter />
    </>
  );
}

export default Coupon;
