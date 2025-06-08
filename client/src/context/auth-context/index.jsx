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

  // Add validation functions
  function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  function validatePassword(password) {
    // Password must contain at least:
    // - 6 characters
    // - 1 uppercase letter
    // - 1 lowercase letter
    // - 1 number
    // - 1 special character
    const minLength = 6;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    return (
      password.length >= minLength &&
      hasUpperCase &&
      hasLowerCase &&
      hasNumbers &&
      hasSpecialChar
    );
  }

  function getPasswordValidationMessage(password) {
    if (!password) return "Password is required";
    if (password.length < 6) return "Password must be at least 6 characters long";
    if (!/[A-Z]/.test(password)) return "Password must contain at least one uppercase letter";
    if (!/[a-z]/.test(password)) return "Password must contain at least one lowercase letter";
    if (!/\d/.test(password)) return "Password must contain at least one number";
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return "Password must contain at least one special character";
    return "";
  }

  async function handleRegisterUser(event, onSuccess) {
    event.preventDefault();
    
    // Validate email and password before making the API call
    if (!validateEmail(signUpFormData.userEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }
    
    const passwordMessage = getPasswordValidationMessage(signUpFormData.password);
    if (passwordMessage) {
      toast.error(passwordMessage);
      return;
    }
    
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
      validateEmail(signInFormData.userEmail) &&
      signInFormData.password !== ""
    );
  }

  function checkIfSignUpFormIsValid() {
    const isEmailValid = validateEmail(signUpFormData.userEmail);
    const isPasswordValid = validatePassword(signUpFormData.password);
    const passwordMessage = getPasswordValidationMessage(signUpFormData.password);
    
    return (
      signUpFormData &&
      signUpFormData.userName !== "" &&
      signUpFormData.userEmail !== "" &&
      isEmailValid &&
      signUpFormData.password !== "" &&
      isPasswordValid &&
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
        validateEmail,
        validatePassword,
        getPasswordValidationMessage,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
