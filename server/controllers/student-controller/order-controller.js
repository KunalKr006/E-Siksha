const crypto = require('crypto');
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

    const newOrder = new Order({
      userId,
      userName,
      userEmail,
      orderStatus: "confirmed",
      paymentMethod: "free",
      paymentStatus: "paid",
      orderDate,
      paymentId: "free_purchase",
      payerId: userId,
      instructorId,
      instructorName,
      courseImage,
      courseTitle,
      courseId,
      coursePricing,
    });

    await newOrder.save();

    // Add course to student's courses
    const studentCourses = await StudentCourses.findOne({ userId });

    if (studentCourses) {
      studentCourses.courses.push({
        courseId,
        title: courseTitle,
        instructorId,
        instructorName,
        dateOfPurchase: orderDate,
        courseImage,
      });

      await studentCourses.save();
    } else {
      const newStudentCourses = new StudentCourses({
        userId,
        courses: [
          {
            courseId,
            title: courseTitle,
            instructorId,
            instructorName,
            dateOfPurchase: orderDate,
            courseImage,
          },
        ],
      });

      await newStudentCourses.save();
    }

    // Add student to course
    const studentData = {
      studentId: userId,
      studentName: userName,
      studentEmail: userEmail,
      paidAmount: coursePricing,
    };

    await Course.findByIdAndUpdate(courseId, {
      $addToSet: {
        students: studentData
      },
    });

    res.status(201).json({
      success: true,
      data: {
        orderId: newOrder._id,
      },
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: "Error while creating order" });
  }
};

// Keep the capturePaymentAndFinalizeOrder function for future use
const capturePaymentAndFinalizeOrder = async (req, res) => {
  res.status(501).json({ success: false, message: "Payment capture is temporarily disabled" });
};

module.exports = { createOrder, capturePaymentAndFinalizeOrder };
