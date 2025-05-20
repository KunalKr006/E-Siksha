/* eslint-disable react/prop-types */
import { Navigate, useLocation } from "react-router-dom";
import { Fragment } from "react";

function RouteGuard({ authenticated, user, element }) {
  const location = useLocation();

  console.log(authenticated, user, "useruser");

  // If not authenticated, redirect to auth page unless already on auth page
  if (!authenticated && !location.pathname.includes("/auth")) {
    return <Navigate to="/auth" />;
  }

  // Prevent authenticated users from accessing auth page
  if (authenticated && location.pathname.includes("/auth")) {
    // Redirect instructor to instructor dashboard
    if (user?.role === "instructor") {
      return <Navigate to="/instructor" />;
    }
    // Redirect regular users to home
    return <Navigate to="/home" />;
  }

  // Prevent non-instructors from accessing instructor pages
  if (
    authenticated &&
    user?.role !== "instructor" &&
    location.pathname.includes("instructor")
  ) {
    return <Navigate to="/home" />;
  }

  // Prevent instructors from accessing non-instructor pages
  if (
    authenticated &&
    user?.role === "instructor" &&
    !location.pathname.includes("instructor") && 
    !location.pathname.includes("/auth")
  ) {
    return <Navigate to="/instructor" />;
  }

  return <Fragment>{element}</Fragment>;
}

export default RouteGuard;
