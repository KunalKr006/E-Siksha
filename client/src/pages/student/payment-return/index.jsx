import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { captureAndFinalizePaymentService } from "@/services";

function PaymentReturnPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const razorpay_payment_id = params.get("razorpay_payment_id");
  const razorpay_order_id = params.get("razorpay_order_id");
  const razorpay_signature = params.get("razorpay_signature");

  useEffect(() => {
    if (razorpay_payment_id && razorpay_order_id && razorpay_signature) {
      async function capturePayment() {
        try {
          const paymentData = {
            razorpay_payment_id,
            razorpay_order_id,
            razorpay_signature,
          };

          const response = await captureAndFinalizePaymentService(paymentData);

          if (response?.success) {
            navigate("/student-courses");
          }
        } catch (error) {
          console.error("Error capturing payment:", error);
        }
      }

      capturePayment();
    }
  }, [razorpay_payment_id, razorpay_order_id, razorpay_signature, navigate]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Processing payment... Please wait</CardTitle>
      </CardHeader>
    </Card>
  );
}

export default PaymentReturnPage;
