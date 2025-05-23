import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Users, IndianRupee } from "lucide-react";
import { useEffect } from "react";

function InstructorDashboard({ listOfCourses }) {
  // Debugging: Log courses data once
  useEffect(() => {
    console.log("Courses list:", listOfCourses);
  }, [listOfCourses]);
  
  function calculateTotalStudentsAndProfit() {
    const { totalStudents, totalProfit, studentList } = listOfCourses.reduce(
      (acc, course) => {
        const studentCount = course.students?.length || 0;
        acc.totalStudents += studentCount;
        acc.totalProfit += course.pricing * studentCount;

        if (course.students && Array.isArray(course.students)) {
        course.students.forEach((student) => {
            // Only add students with valid data from User model
            if (student.studentName && student.studentEmail) {
          acc.studentList.push({
            courseTitle: course.title,
            studentName: student.studentName,
            studentEmail: student.studentEmail,
          });
            }
        });
        }

        return acc;
      },
      {
        totalStudents: 0,
        totalProfit: 0,
        studentList: [],
      }
    );

    return {
      totalProfit,
      totalStudents,
      studentList,
    };
  }

  const config = [
    {
      icon: Users,
      label: "Total Students",
      value: calculateTotalStudentsAndProfit().totalStudents,
    },
    {
      icon: IndianRupee,
      label: "Total Revenue",
      value: calculateTotalStudentsAndProfit().totalProfit,
    },
  ];

  // Get the calculated data once to avoid multiple calculations
  const calculatedData = calculateTotalStudentsAndProfit();
  const hasStudents = calculatedData.studentList.length > 0;

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {config.map((item, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {item.label}
              </CardTitle>
              <item.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{item.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Students List</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table className="w-full">
              <TableHeader>
                <TableRow>
                  <TableHead>Course Name</TableHead>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Student Email</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {hasStudents ? (
                  calculatedData.studentList.map((studentItem, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">
                        {studentItem.courseTitle}
                      </TableCell>
                      <TableCell>{studentItem.studentName}</TableCell>
                      <TableCell>{studentItem.studentEmail}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-4">
                      No students have purchased your courses yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default InstructorDashboard;
