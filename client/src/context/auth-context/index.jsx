import { Skeleton } from "@/components/ui/skeleton";
import { initialSignInFormData, initialSignUpFormData } from "@/config";
import { checkAuthService, loginService, registerService } from "@/services";
import { createContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export const AuthContext = createContext(null);

// eslint-disable-next-line react/prop-types
export default function AuthProvider({ children }) {
  const [signInFormData, setSignInFormData] = useState(initialSignInFormData);
  const [signUpFormData, setSignUpFormData] = useState(initialSignUpFormData);
  const [auth, setAuth] = useState({
    authenticate: false,
    user: null,
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  async function handleRegisterUser(event, onSuccess) {
    event.preventDefault();
    try {
      const data = await registerService(signUpFormData);
      if (data.success) {
        toast.success("Registration successful! Please login.");
        setSignUpFormData(initialSignUpFormData);
        if (typeof onSuccess === 'function') {
          onSuccess();
        }
      } else {
        toast.error(data.message || "Registration failed. Please try again.");
      }
    } catch (error) {
      console.error("Registration error:", error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else if (error.response?.status === 409) {
        toast.error("Email already exists. Please use a different email.");
      } else {
        toast.error("Registration failed. Please try again.");
      }
    }
  }

  async function handleLoginUser(event) {
    event.preventDefault();
    try {
      const data = await loginService(signInFormData);
      if (data.success) {
        sessionStorage.setItem(
          "accessToken",
          JSON.stringify(data.data.accessToken)
        );
        setAuth({
          authenticate: true,
          user: data.data.user,
        });
        toast.success("Login successful!");
        
        // Navigate to appropriate page based on user role
        if(data.data.user.role === "instructor") {
          navigate("/instructor");
        } else {
          navigate("/home");
        }
      } else {
        toast.error(data.message || "Invalid credentials. Please try again.");
        setAuth({
          authenticate: false,
          user: null,
        });
      }
    } catch (error) {
      console.error("Login error:", error);
      if (error.response?.status === 401) {
        toast.error("Invalid email or password. Please try again.");
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Login failed. Please try again.");
      }
      setAuth({
        authenticate: false,
        user: null,
      });
    }
  }

  function checkIfSignInFormIsValid() {
    return (
      signInFormData &&
      signInFormData.userEmail !== "" &&
      signInFormData.password !== ""
    );
  }

  function checkIfSignUpFormIsValid() {
    return (
      signUpFormData &&
      signUpFormData.userName !== "" &&
      signUpFormData.userEmail !== "" &&
      signUpFormData.password !== "" &&
      signUpFormData.role !== ""
    );
  }

  //check auth user
  async function checkAuth() {
    try {
      const data = await checkAuthService();

      if (data?.success) {
        setAuth({
          authenticate: true,
          user: data.data.user,
        });
      } else {
        setAuth({
          authenticate: false,
          user: null,
        });
      }
    } catch (error) {
      console.error("Auth check error:", error);
        setAuth({
          authenticate: false,
          user: null,
        });
    } finally {
        setLoading(false);
    }
  }

  function resetCredentials() {
    sessionStorage.clear();
    setAuth({
      authenticate: false,
      user: null,
    });
  }

  useEffect(() => {
    checkAuth();
  }, []);

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <Skeleton className="h-[200px] w-[200px] rounded-3xl" />
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        signInFormData,
        setSignInFormData,
        signUpFormData,
        setSignUpFormData,
        handleRegisterUser,
        handleLoginUser,
        auth,
        checkIfSignInFormIsValid,
        checkIfSignUpFormIsValid,
        resetCredentials,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
