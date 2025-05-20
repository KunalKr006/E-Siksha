const Course = require("../../models/Course");
const User = require("../../models/User");
const Order = require("../../models/Order");

const addNewCourse = async (req, res) => {
  try {
    const courseData = req.body;
    const newlyCreatedCourse = new Course(courseData);
    const saveCourse = await newlyCreatedCourse.save();

    if (saveCourse) {
      res.status(201).json({
        success: true,
        message: "Course saved successfully",
        data: saveCourse,
      });
    }
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Some error occurred!",
    });
  }
};

const getAllCourses = async (req, res) => {
  try {
    const coursesList = await Course.find({});
    
    // Enhance each course with complete student information
    const enhancedCoursesList = await Promise.all(
      coursesList.map(async (course) => {
        const courseObj = course.toObject();
        
        // If course has students, get their information from User collection
        if (courseObj.students && courseObj.students.length > 0) {
          // Get all unique student IDs
          const studentIds = courseObj.students
            .map(student => student.studentId)
            .filter(id => id); // Filter out empty IDs
            
          // Skip if no valid student IDs
          if (studentIds.length === 0) {
            return courseObj;
          }
            
          // Fetch all user information in one query
          const users = await User.find({ _id: { $in: studentIds } });
          
          if (!users || users.length === 0) {
            return courseObj;
          }
          
          // Create a map for quick lookup
          const userMap = {};
          users.forEach(user => {
            userMap[user._id.toString()] = {
              userName: user.userName,
              userEmail: user.userEmail
            };
          });
          
          // Update student information with user data
          courseObj.students = courseObj.students.map(student => {
            // Only use data from the User model
            if (student.studentId && userMap[student.studentId]) {
              const userData = userMap[student.studentId];
              return {
                ...student,
                studentName: userData.userName,
                studentEmail: userData.userEmail
              };
            }
            return student;
          });
        }
        
        return courseObj;
      })
    );

    res.status(200).json({
      success: true,
      data: enhancedCoursesList,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Some error occurred!",
    });
  }
};

const getCourseDetailsByID = async (req, res) => {
  try {
    const { id } = req.params;
    const courseDetails = await Course.findById(id);

    if (!courseDetails) {
      return res.status(404).json({
        success: false,
        message: "Course not found!",
      });
    }

    res.status(200).json({
      success: true,
      data: courseDetails,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Some error occurred!",
    });
  }
};

const updateCourseByID = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedCourseData = req.body;

    const updatedCourse = await Course.findByIdAndUpdate(
      id,
      updatedCourseData,
      { new: true }
    );

    if (!updatedCourse) {
      return res.status(404).json({
        success: false,
        message: "Course not found!",
      });
    }

    res.status(200).json({
      success: true,
      message: "Course updated successfully",
      data: updatedCourse,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Some error occurred!",
    });
  }
};

module.exports = {
  addNewCourse,
  getAllCourses,
  updateCourseByID,
  getCourseDetailsByID,
};

