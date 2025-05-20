const crypto = require('crypto');
const razorpay = require("../../helpers/razorpay");
const Order = require("../../models/Order");
const Course = require("../../models/Course");
const StudentCourses = require("../../models/StudentCourses");

const createOrder = async (req, res) => {
  try {
    const {
      userId,
      userName,
      userEmail,
      orderDate,
      instructorId,
      instructorName,
      courseImage,
      courseTitle,
      courseId,
      coursePricing,
    } = req.body;

    const amountInPaise = parseInt(coursePricing * 100); // Razorpay works in paise (100 INR = 10000 paise)

    const options = {
      amount: amountInPaise,
      currency: "INR",
      receipt: `receipt_order_${Math.floor(Math.random() * 1000000)}`,
    };

    const order = await razorpay.orders.create(options);

    const newOrder = new Order({
      userId,
      userName,
      userEmail,
      orderStatus: "pending",
      paymentMethod: "razorpay",
      paymentStatus: "unpaid",
      orderDate,
      paymentId: "",
      payerId: "",
      instructorId,
      instructorName,
      courseImage,
      courseTitle,
      courseId,
      coursePricing,
    });

    await newOrder.save();

    res.status(201).json({
      success: true,
      data: {
        razorpayOrderId: order.id,
        amount: order.amount,
        currency: order.currency,
        orderId: newOrder._id,
        key: process.env.RAZORPAY_KEY_ID,
      },
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: "Error while creating Razorpay order" });
  }
};

const capturePaymentAndFinalizeOrder = async (req, res) => {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, orderId } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Verify Razorpay signature
    const generated_signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_SECRET)
      .update(orderId + "|" + razorpay_payment_id)
      .digest('hex');
      
    if (generated_signature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: "Invalid signature" });
    }

    order.paymentStatus = "paid";
    order.orderStatus = "confirmed";
    order.paymentId = razorpay_payment_id;

    await order.save();

    // Add course to student's courses
    const studentCourses = await StudentCourses.findOne({ userId: order.userId });

    if (studentCourses) {
      studentCourses.courses.push({
        courseId: order.courseId,
        title: order.courseTitle,
        instructorId: order.instructorId,
        instructorName: order.instructorName,
        dateOfPurchase: order.orderDate,
        courseImage: order.courseImage,
      });

      await studentCourses.save();
    } else {
      const newStudentCourses = new StudentCourses({
        userId: order.userId,
        courses: [
          {
            courseId: order.courseId,
            title: order.courseTitle,
            instructorId: order.instructorId,
            instructorName: order.instructorName,
            dateOfPurchase: order.orderDate,
            courseImage: order.courseImage,
          },
        ],
      });

      await newStudentCourses.save();
    }

    // Add student to course
    const studentData = {
      studentId: order.userId,
      studentName: order.userName,
      studentEmail: order.userEmail,
      paidAmount: order.coursePricing,
    };

    await Course.findByIdAndUpdate(order.courseId, {
      $addToSet: {
        students: studentData
      },
    });

    res.status(200).json({
      success: true,
      message: "Order confirmed and payment captured",
      data: order,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: "Error while capturing payment" });
  }
};

module.exports = { createOrder, capturePaymentAndFinalizeOrder };
