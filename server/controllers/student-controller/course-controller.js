const Course = require("../../models/Course");
const StudentCourses = require("../../models/StudentCourses");
const { searchCourses, getCourseRecommendations } = require("../../services/search-service");

const getAllStudentViewCourses = async (req, res) => {
  try {
    const {
      category = [],
      level = [],
      primaryLanguage = [],
      sortBy = "price-lowtohigh",
      search = "",
      page = 1,
      size = 10
    } = req.query;

    // Convert string arrays to actual arrays with proper type checking
    const filters = {
      category: typeof category === 'string' ? category.split(",").filter(Boolean) : [],
      level: typeof level === 'string' ? level.split(",").filter(Boolean) : [],
      primaryLanguage: typeof primaryLanguage === 'string' ? primaryLanguage.split(",").filter(Boolean) : []
    };

    // Use Elasticsearch for search
    const searchResults = await searchCourses(search, filters, sortBy, parseInt(page), parseInt(size));

    res.status(200).json({
      success: true,
      data: searchResults.hits,
      total: searchResults.total,
      page: parseInt(page),
      size: parseInt(size)
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Some error occurred!",
    });
  }
};

const getStudentViewCourseDetails = async (req, res) => {
  
  try {
    const { id } = req.params;
    
    
    const courseDetails = await Course.findById(id);

    if (!courseDetails) {
      return res.status(404).json({
        success: false,
        message: "No course details found",
        data: null,
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

const checkCoursePurchaseInfo = async (req, res) => {
  try {
    const { id, studentId } = req.params;

    const studentCourses = await StudentCourses.findOne({
      userId: studentId,
    });

    if (!studentCourses) {
      return res.status(200).json({
        success: true,
        data: false, // hasn't purchased any course
      });
    }

    const ifStudentAlreadyBoughtCurrentCourse =
      studentCourses.courses.findIndex((item) => item.courseId === id) > -1;

    res.status(200).json({
      success: true,
      data: ifStudentAlreadyBoughtCurrentCourse,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Some error occurred!",
    });
  }
};

// Add a new endpoint for course recommendations
const getRecommendedCourses = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { limit = 5 } = req.query;

    const recommendations = await getCourseRecommendations(courseId, parseInt(limit));

    res.status(200).json({
      success: true,
      data: recommendations
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
  getAllStudentViewCourses,
  getStudentViewCourseDetails,
  checkCoursePurchaseInfo,
  getRecommendedCourses
};
