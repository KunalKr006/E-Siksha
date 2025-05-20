import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import VideoPlayer from "@/components/video-player";
import { AuthContext } from "@/context/auth-context";
import { StudentContext } from "@/context/student-context";
import {
  checkCoursePurchaseInfoService,
  createPaymentService,
  fetchStudentViewCourseDetailsService,
} from "@/services";
import { CheckCircle, Globe, Lock, PlayCircle } from "lucide-react";
import { useContext, useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import axiosInstance from "@/api/axiosInstance";

function StudentViewCourseDetailsPage() {
  const {
    studentViewCourseDetails,
    setStudentViewCourseDetails,
    currentCourseDetailsId,
    setCurrentCourseDetailsId,
    loadingState,
    setLoadingState,
  } = useContext(StudentContext);

  const { auth } = useContext(AuthContext);

  const [displayCurrentVideoFreePreview, setDisplayCurrentVideoFreePreview] =
    useState(null);
  const [showFreePreviewDialog, setShowFreePreviewDialog] = useState(false);
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();

  async function fetchStudentViewCourseDetails() {
    const checkCoursePurchaseInfoResponse =
      await checkCoursePurchaseInfoService(
        currentCourseDetailsId,
        auth?.user._id
      );

    if (
      checkCoursePurchaseInfoResponse?.success &&
      checkCoursePurchaseInfoResponse?.data
    ) {
      navigate(`/course-progress/${currentCourseDetailsId}`);
      return;
    }

    const response = await fetchStudentViewCourseDetailsService(
      currentCourseDetailsId
    );

    if (response?.success) {
      setStudentViewCourseDetails(response?.data);
      setLoadingState(false);
    } else {
      setStudentViewCourseDetails(null);
      setLoadingState(false);
    }
  }

  function handleSetFreePreview(getCurrentVideoInfo) {
    if (getCurrentVideoInfo?.freePreview) {
      setDisplayCurrentVideoFreePreview(getCurrentVideoInfo?.videoUrl);
    }
  }

  async function handleCreatePayment() {
    const paymentPayload = {
      userId: auth?.user?._id,
      userName: auth?.user?.userName,
      userEmail: auth?.user?.userEmail,
      orderStatus: "pending",
      paymentMethod: "razorpay",
      paymentStatus: "initiated",
      orderDate: new Date(),
      instructorId: studentViewCourseDetails?.instructorId,
      instructorName: studentViewCourseDetails?.instructorName,
      courseImage: studentViewCourseDetails?.image,
      courseTitle: studentViewCourseDetails?.title,
      courseId: studentViewCourseDetails?._id,
      coursePricing: studentViewCourseDetails?.pricing,
    };

    try {
      const response = await createPaymentService(paymentPayload);

      if (response.success) {
        const options = {
          key: response.data.key,
          amount: response.data.amount,
          currency: response.data.currency,
          name: "E-Siksha",
          description: studentViewCourseDetails?.title,
          order_id: response.data.razorpayOrderId,
          handler: async function (response) {
            try {
              const captureResponse = await axiosInstance.post('/student/order/capture', {
                orderId: response.data.orderId,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature
              });
              
              if (captureResponse.data.success) {
                navigate('/student-courses');
              }
            } catch (error) {
              console.error("Error capturing payment:", error);
            }
          },
          prefill: {
            name: auth?.user?.userName,
            email: auth?.user?.userEmail,
          },
          theme: {
            color: "#0F172A",
          },
        };

        const razorpay = new window.Razorpay(options);
        razorpay.open();
      }
    } catch (error) {
      console.error("Error in payment:", error);
    }
  }

  useEffect(() => {
    if (displayCurrentVideoFreePreview !== null) setShowFreePreviewDialog(true);
  }, [displayCurrentVideoFreePreview]);

  useEffect(() => {
    if (currentCourseDetailsId !== null) fetchStudentViewCourseDetails();
  }, [currentCourseDetailsId]);

  useEffect(() => {
    if (id) setCurrentCourseDetailsId(id);
  }, [id]);

  useEffect(() => {
    if (!location.pathname.includes("course/details"))
      setStudentViewCourseDetails(null),
        setCurrentCourseDetailsId(null),
        setCoursePurchaseId(null);
  }, [location.pathname]);

  if (loadingState) return <Skeleton />;

  const getIndexOfFreePreviewUrl =
    studentViewCourseDetails !== null
      ? studentViewCourseDetails?.curriculum?.findIndex(
          (item) => item.freePreview
        )
      : -1;

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Course Header */}
      <div className="bg-background border rounded-lg p-4 md:p-8 shadow-sm mb-6">
        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)}
            className="self-start md:self-auto"
          >
            ← Back
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold break-words">
            {studentViewCourseDetails?.title}
          </h1>
        </div>
        <p className="text-lg md:text-xl mb-4 text-muted-foreground break-words">
          {studentViewCourseDetails?.subtitle}
        </p>
        <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
          <span className="flex items-center">
            Created By <span className="font-semibold ml-1">{studentViewCourseDetails?.instructorName}</span>
          </span>
          <span className="flex items-center">
            Created On {studentViewCourseDetails?.date?.split("T")[0]}
          </span>
          <span className="flex items-center">
            <Globe className="mr-1 h-4 w-4" />
            {studentViewCourseDetails?.primaryLanguage}
          </span>
          <span className="flex items-center">
            {studentViewCourseDetails?.students?.length || 0}{" "}
            {studentViewCourseDetails?.students?.length <= 1
              ? "Student"
              : "Students"}
          </span>
        </div>
      </div>

      {/* Main Content and Sidebar */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main Content */}
        <main className="flex-grow lg:max-w-[calc(100%-520px)]">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>What you'll learn</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {studentViewCourseDetails?.objectives
                  .split(",")
                  .map((objective, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle className="mr-2 h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm md:text-base">{objective}</span>
                    </li>
                  ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Course Description</CardTitle>
            </CardHeader>
            <CardContent className="text-sm md:text-base whitespace-pre-wrap">
              {studentViewCourseDetails?.description}
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Course Curriculum</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {studentViewCourseDetails?.curriculum?.map(
                  (curriculumItem, index) => (
                    <li
                      key={index}
                      className="flex items-center p-2 rounded-md transition-colors cursor-not-allowed opacity-75"
                      onClick={() => {
                        alert("Please purchase the course to access this lecture");
                      }}
                    >
                      <Lock className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span className="text-sm md:text-base">{curriculumItem?.title}</span>
                    </li>
                  )
                )}
              </ul>
            </CardContent>
          </Card>
        </main>

        {/* Sidebar */}
        <aside className="w-full lg:w-[500px]">
          <Card className="sticky top-4">
            <CardContent className="p-4 md:p-6">
              <div className="aspect-video mb-4 rounded-lg overflow-hidden">
                <img
                  src={studentViewCourseDetails?.image}
                  alt={studentViewCourseDetails?.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="mb-4">
                <span className="text-2xl md:text-3xl font-bold">
                  ₹{studentViewCourseDetails?.pricing}
                </span>
              </div>
              <Button onClick={handleCreatePayment} className="w-full">
                Buy Now
              </Button>
            </CardContent>
          </Card>
        </aside>
      </div>

      {/* Preview Dialog */}
      <Dialog
        open={showFreePreviewDialog}
        onOpenChange={() => {
          setShowFreePreviewDialog(false);
          setDisplayCurrentVideoFreePreview(null);
        }}
      >
        <DialogContent className="w-[95vw] max-w-[800px] p-4 md:p-6">
          <DialogHeader>
            <DialogTitle>Course Preview</DialogTitle>
            <p className="text-sm text-muted-foreground">
              This is a preview lecture. Purchase the course to access all content.
            </p>
          </DialogHeader>
          <div className="aspect-video rounded-lg overflow-hidden mb-4">
            <VideoPlayer
              url={displayCurrentVideoFreePreview}
              width="100%"
              height="100%"
            />
          </div>
          <div className="flex flex-col gap-2">
            {studentViewCourseDetails?.curriculum
              ?.filter((item) => item.freePreview)
              .map((filteredItem, index) => (
                <p
                  key={index}
                  onClick={() => handleSetFreePreview(filteredItem)}
                  className="cursor-pointer text-sm md:text-base font-medium p-2 hover:bg-muted/50 rounded-md transition-colors"
                >
                  {filteredItem?.title}
                </p>
              ))}
          </div>
          <DialogFooter className="sm:justify-between mt-4">
            <Button onClick={handleCreatePayment} className="flex-1">
              Buy Full Course
            </Button>
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Close
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default StudentViewCourseDetailsPage;
