import React, { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";
import BaseHeader from "../partials/BaseHeader";
import BaseFooter from "../partials/BaseFooter";
import apiInstance from "../../utils/axios";
import { PAYPAL_CLIENT_ID, API_BASE_URL } from "../../utils/constants"; 

function Checkout() {
  const [order, setOrder] = useState([]);
  const param = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await apiInstance.get(`order/checkout/${param.order_oid}/`);
        setOrder(res.data);
      } catch (error) {
        console.log(error);
      }
    };
    fetchOrder();
  }, [param.order_oid]);

  const initialOptions = {
    clientId: PAYPAL_CLIENT_ID,
    currency: "USD",
    intent: "capture",
  };

  const payWithJazzCash = () => {
    
    window.location.href = `${API_BASE_URL}payment/jazzcash-checkout/${order.oid}/`;
  };

//   const payWithEasyPaisa = () => {
//     window.location.href = `${API_URL}/payment/easypaisa-checkout/${order.oid}/`;
//   };

  return (
    <>
      <BaseHeader />
      <section className="py-0">
        <div className="container">
          <div className="row">
            <div className="col-12">
              <div className="bg-light p-4 text-center rounded-3">
                <h1 className="m-0">Checkout</h1>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="pt-5">
        <div className="container">
          <div className="row g-4 g-sm-5">
            <div className="col-xl-8">
              <div className="p-4 shadow rounded-3 mt-4">
                <h5 className="mb-3">Courses</h5>
                <table className="table">
                  <tbody>
                    {order?.order_items?.map((o) => (
                      <tr key={o.course.id}>
                        <td>
                          <img src={o.course.image} className="rounded" alt="" width="100" height="70" />
                        </td>
                        <td>{o.course.title}</td>
                        <td className="text-success">${o.course.price}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <Link to="/cart/" className="btn btn-outline-secondary mt-3">Edit Cart</Link>
              </div>
            </div>
            <div className="col-xl-4">
              <div className="shadow p-4 rounded-3">
                <h4 className="mb-4">Order Summary</h4>
                <ul className="list-group">
                  <li className="list-group-item d-flex justify-content-between">
                    Sub Total <span>${order.sub_total}</span>
                  </li>
                  <li className="list-group-item d-flex justify-content-between">
                    Discount <span>${order.saved}</span>
                  </li>
                  <li className="list-group-item d-flex justify-content-between">
                    Tax <span>${order.tax_fee}</span>
                  </li>
                  <li className="list-group-item d-flex justify-content-between fw-bold">
                    Total <span>${order.total}</span>
                  </li>
                </ul>
                <div className="d-grid mt-3">
                  <button className="btn btn-danger" onClick={payWithJazzCash}>Pay With JazzCash</button>
                  {/* <button className="btn btn-warning mt-2" onClick={payWithEasyPaisa}>Pay With EasyPaisa</button> */}
                  <br />
                  <PayPalScriptProvider options={initialOptions}>
                    <PayPalButtons
                      createOrder={(data, actions) => {
                        return actions.order.create({
                          purchase_units: [
                            {
                              amount: {
                                currency_code: "USD",
                                value: order.total?.toString(),
                              },
                            },
                          ],
                        });
                      }}
                      onApprove={(data, actions) => {
                        return actions.order.capture().then((details) => {
                          navigate(`/payment-success/${order.oid}/?paypal_order_id=${data.orderID}`);
                        });
                      }}
                    />
                  </PayPalScriptProvider>
                </div>
                <p className="small mt-2 text-center">
                  By proceeding, you agree to the <strong>Terms of Service</strong>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      <BaseFooter />
    </>
  );
}

export default Checkout;
