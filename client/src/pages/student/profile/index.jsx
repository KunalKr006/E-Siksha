import { useContext, useEffect, useState } from "react";
import { AuthContext } from "@/context/auth-context";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { User, Mail, UserCheck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

function StudentProfilePage() {
  const { auth } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading time to ensure auth data is available
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-full" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl md:text-3xl">My Profile</CardTitle>
          <CardDescription>
            Your personal information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4 p-4 rounded-lg border">
              <div className="bg-primary text-primary-foreground p-3 rounded-full">
                <User size={24} />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-medium leading-none">Username</h3>
                <p className="text-sm text-muted-foreground">
                  {auth?.user?.userName || "Not available"}
                </p>
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4 p-4 rounded-lg border">
              <div className="bg-primary text-primary-foreground p-3 rounded-full">
                <Mail size={24} />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-medium leading-none">Email</h3>
                <p className="text-sm text-muted-foreground">
                  {auth?.user?.userEmail || "Not available"}
                </p>
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4 p-4 rounded-lg border">
              <div className="bg-primary text-primary-foreground p-3 rounded-full">
                <UserCheck size={24} />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-medium leading-none">Role</h3>
                <p className="text-sm text-muted-foreground capitalize">
                  {auth?.user?.role || "Student"}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default StudentProfilePage; 