const StudentCourses = require("../../models/StudentCourses");
const Course = require("../../models/Course");

const getCoursesByStudentId = async (req, res) => {
  try {
    const { studentId } = req.params;
    const studentBoughtCourses = await StudentCourses.findOne({
      userId: studentId,
    });

    if (!studentBoughtCourses) {
      return res.status(200).json({
        success: true,
        data: [], // Return empty array if student hasn't bought any courses
      });
    }

    // Get the list of course IDs the student has bought
    const boughtCourseIds = studentBoughtCourses.courses.map(course => course.courseId);

    // Find these courses in the main Course collection, ensuring they are published
    const publishedCourses = await Course.find({
      _id: { $in: boughtCourseIds },
      isPublised: true // Assuming 'isPublised' is the field indicating if a course is published
    }).select('_id'); // Select only the _id for efficiency

    // Create a set of published course IDs for quick lookup
    const publishedCourseIdsSet = new Set(publishedCourses.map(course => course._id.toString()));

    // Filter the student's bought courses list
    const filteredBoughtCourses = studentBoughtCourses.courses.filter(course =>
      publishedCourseIdsSet.has(course.courseId)
    );

    res.status(200).json({
      success: true,
      data: filteredBoughtCourses,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Some error occurred!",
    });
  }
};

module.exports = {
  getCoursesByStudentId,
};
