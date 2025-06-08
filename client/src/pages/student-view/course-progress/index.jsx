import Notes from "../../../components/student-view/course-progress/Notes";

const CourseProgress = () => {
  // ... existing state and functions ...

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ... existing JSX ... */}
      
      {/* Add Notes component before the Chat component */}
      {currentLecture && (
        <Notes
          userId={user?._id}
          courseId={courseId}
          lectureId={currentLecture._id}
        />
      )}
      
      {/* Existing Chat component */}
      {currentLecture && (
        <Chat
          userId={user?._id}
          courseId={courseId}
          lectureId={currentLecture._id}
        />
      )}
      
      {/* ... rest of the existing JSX ... */}
    </div>
  );
};

export default CourseProgress; 