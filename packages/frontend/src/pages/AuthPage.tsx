// import React, { useState, useRef, useEffect } from "react";
// import { Eye, EyeOff } from "lucide-react";
// import { mockUsers } from "../data";
// import { apiService, useAuth, useToast } from "../App";

// const AuthLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
//   <div className="min-h-screen flex">
//     <div
//       className="hidden lg:block lg:w-1/2 bg-cover bg-center"
//       style={{
//         backgroundImage:
//           "url('https://picsum.photos/1200/1200?grayscale&blur=2')",
//       }}
//     >
//       <div className="flex flex-col justify-start p-12 h-full bg-black bg-opacity-10">
//         <div className="flex items-center">
//           <div className="w-10 h-10 bg-[#FFA500] rounded-full flex items-center justify-center text-white font-bold text-2xl mr-3">
//             N
//           </div>
//           <h1 className="text-2xl font-bold text-gray-800">NeokRED</h1>
//         </div>
//         <p className="text-sm text-gray-700 mt-2">POWER TO YOU</p>
//       </div>
//     </div>
//     <div className="w-full lg:w-1/2 flex items-center justify-center bg-white p-8">
//       <div className="w-full max-w-sm">{children}</div>
//     </div>
//   </div>
// );

// // AuthPage.tsx - Updated LoginPage component
// const LoginPage: React.FC<{ onNavigate: (page: string) => void }> = ({
//   onNavigate,
// }) => {
//   const [showPassword, setShowPassword] = useState(false);
//   const [isLoading, setIsLoading] = useState(false);
//   const { login } = useAuth();
//   const { addToast } = useToast();

//   // const handleLogin = async (e: React.FormEvent) => {
//   //   e.preventDefault();
//   //   setIsLoading(true);

//   //   const formData = new FormData(e.target as HTMLFormElement);
//   //   const email = formData.get("email") as string;
//   //   const password = formData.get("password") as string;

//   //   try {
//   //     const { user, token } = await apiService.login({ email, password });
//   //     login({ ...user, token });
//   //     addToast("Login successful!", "success");
//   //   } catch (error) {
//   //     addToast("Login failed. Please check your credentials.", "error");
//   //     console.error("Login error:", error);
//   //   } finally {
//   //     setIsLoading(false);
//   //   }
//   // };
//   const handleLogin = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setIsLoading(true);

//     const formData = new FormData(e.target as HTMLFormElement);
//     const email = formData.get("email") as string;
//     const password = formData.get("password") as string;

//     try {
//       console.log("Login credentials:", { email, password });

//       const response = await apiService.login({ email, password });
//       console.log("API Response:", response);

//       // The API returns { id, name, email, role, token } directly
//       // Use the response as the user object since it contains all user data + token
//       const userData = {
//         id: response.id,
//         name: response.name,
//         email: response.email,
//         role: response.role,
//         token: response.token,
//         status: "Active" as const, // Add default status
//         // Add any other required fields with defaults if needed
//       };

//       console.log("User data to store:", userData);

//       // Validate required fields
//       if (
//         !userData.id ||
//         !userData.name ||
//         !userData.email ||
//         !userData.role ||
//         !userData.token
//       ) {
//         console.error("Missing required user fields:", userData);
//         throw new Error("Invalid user data received from server");
//       }

//       login(userData);
//       addToast("Login successful!", "success");
//     } catch (error) {
//       console.error("Login error:", error);
//       addToast("Login failed. Please check your credentials.", "error");
//     } finally {
//       setIsLoading(false);
//     }
//   };
//   return (
//     <div>
//       <h2 className="text-3xl font-bold text-gray-900">Welcome 👋</h2>
//       <p className="mt-2 text-gray-600">Login</p>
//       <form className="mt-8 space-y-6" onSubmit={handleLogin}>
//         <div>
//           <label
//             htmlFor="email"
//             className="block text-sm font-medium text-gray-700"
//           >
//             Email *
//           </label>
//           <input
//             id="email"
//             name="email"
//             type="email"
//             required
//             defaultValue="admin@company.com"
//             className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-neokred-primary focus:border-neokred-primary sm:text-sm"
//           />
//         </div>
//         <div className="relative">
//           <label
//             htmlFor="password"
//             className="block text-sm font-medium text-gray-700"
//           >
//             Password
//           </label>
//           <input
//             id="password"
//             name="password"
//             type={showPassword ? "text" : "password"}
//             required
//             defaultValue="password"
//             className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-neokred-primary focus:border-neokred-primary sm:text-sm"
//           />
//           <button
//             type="button"
//             onClick={() => setShowPassword(!showPassword)}
//             className="absolute inset-y-0 right-0 top-6 pr-3 flex items-center text-gray-500"
//           >
//             {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
//           </button>
//         </div>
//         <div className="text-right text-sm">
//           <button
//             type="button"
//             onClick={() => onNavigate("forgot")}
//             className="font-medium text-neokred-primary hover:text-neokred-primary-dark"
//           >
//             Forgot password?
//           </button>
//         </div>
//         <button
//           type="submit"
//           disabled={isLoading}
//           className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-neokred-primary hover:bg-neokred-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neokred-primary disabled:opacity-50 disabled:cursor-not-allowed"
//         >
//           {isLoading ? "Logging in..." : "Login"}
//         </button>
//       </form>
//     </div>
//   );
// };

// const ForgotPasswordPage: React.FC<{ onNavigate: (page: string) => void }> = ({
//   onNavigate,
// }) => (
//   <div>
//     <h2 className="text-3xl font-bold text-gray-900">Forgot Password?</h2>
//     <p className="mt-2 text-gray-600">
//       No worries, we'll send you the reset instructions
//     </p>
//     <form
//       className="mt-8 space-y-6"
//       onSubmit={(e) => {
//         e.preventDefault();
//         onNavigate("otp");
//       }}
//     >
//       <div>
//         <label
//           htmlFor="email-forgot"
//           className="block text-sm font-medium text-gray-700"
//         >
//           Email
//         </label>
//         <input
//           id="email-forgot"
//           name="email"
//           type="email"
//           required
//           placeholder="Enter registered email"
//           className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-neokred-primary focus:border-neokred-primary sm:text-sm"
//         />
//       </div>
//       <button
//         type="submit"
//         className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-neokred-primary hover:bg-neokred-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neokred-primary"
//       >
//         Get reset Link
//       </button>
//     </form>
//   </div>
// );

// const OtpPage: React.FC<{ onNavigate: (page: string) => void }> = ({
//   onNavigate,
// }) => {
//   const [otp, setOtp] = useState<string[]>(new Array(6).fill(""));
//   const [timer, setTimer] = useState(59);
//   const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

//   useEffect(() => {
//     const interval = setInterval(() => {
//       setTimer((prev) => (prev > 0 ? prev - 1 : 0));
//     }, 1000);
//     return () => clearInterval(interval);
//   }, []);

//   const handleChange = (element: HTMLInputElement, index: number) => {
//     if (isNaN(Number(element.value))) return;
//     setOtp([...otp.map((d, idx) => (idx === index ? element.value : d))]);
//     if (element.nextSibling && element.value) {
//       (element.nextSibling as HTMLInputElement).focus();
//     }
//   };

//   return (
//     <div>
//       <h2 className="text-3xl font-bold text-gray-900">OTP verification</h2>
//       <p className="mt-2 text-gray-600">
//         Enter the OTP Sent to karna@neokred.tech
//       </p>
//       <form
//         className="mt-8 space-y-6"
//         onSubmit={(e) => {
//           e.preventDefault();
//           onNavigate("login");
//         }}
//       >
//         <div className="flex justify-between items-center">
//           <div className="flex gap-2">
//             {otp.map((data, index) => (
//               <input
//                 key={index}
//                 type="text"
//                 maxLength={1}
//                 value={data}
//                 // Fix: The ref callback should not return a value. Using a block statement `{ ... }` prevents an implicit return.
//                 ref={(el) => {
//                   inputsRef.current[index] = el;
//                 }}
//                 onChange={(e) => handleChange(e.target, index)}
//                 onFocus={(e) => e.target.select()}
//                 className="w-12 h-12 text-center border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-neokred-primary focus:border-neokred-primary text-lg"
//               />
//             ))}
//           </div>
//           <span className="text-sm font-medium text-neokred-primary">{`00:${timer
//             .toString()
//             .padStart(2, "0")}`}</span>
//         </div>
//         <button
//           type="submit"
//           className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-neokred-primary hover:bg-neokred-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neokred-primary"
//         >
//           Verify
//         </button>
//       </form>
//     </div>
//   );
// };

// const AuthPage: React.FC = () => {
//   const [currentPage, setCurrentPage] = useState("login");

//   const renderPage = () => {
//     switch (currentPage) {
//       case "login":
//         return <LoginPage onNavigate={setCurrentPage} />;
//       case "forgot":
//         return <ForgotPasswordPage onNavigate={setCurrentPage} />;
//       case "otp":
//         return <OtpPage onNavigate={setCurrentPage} />;
//       default:
//         return <LoginPage onNavigate={setCurrentPage} />;
//     }
//   };

//   return <AuthLayout>{renderPage()}</AuthLayout>;
// };

// export default AuthPage;

import React, { useState, useRef, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import { apiService, useAuth, useToast } from "../App";
import logoUrl from "../public/asset/logo.svg";
//@ts-ignore
import backgroundUrl from "../public/asset/background.jpg";

const AuthLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="min-h-screen flex ">
    {/* Left Side - Branding/Image Section */}
    <div
      className="hidden lg:block lg:w-1/2 bg-full bg-left-top m-8 rounded-2xl h-[700px] mt-[100px] mx-[100px]"
      style={{
        backgroundImage: `url(${backgroundUrl})`,
      }}
    >
      <div className="flex flex-col justify-start items-end p-12 h-full bg-opacity-10">
        <div className="flex items-center mb-8">
          <div className="mr-3">
            <img src={logoUrl} alt="Resolution Engine Logo" />
          </div>
        </div>
      </div>
    </div>

    {/* Right Side - Login Form */}
    <div className="w-full lg:w-1/2 flex items-center justify-center bg-white p-8">
      <div className="w-full max-w-sm">
        {/* Mobile Logo */}
        <div className="lg:hidden flex justify-center mb-8">
          <img src={logoUrl} alt="Resolution Engine Logo" />
        </div>

        {/* Welcome Message */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome Back!
          </h2>
          <p className="text-gray-600">Access your support dashboard</p>
        </div>

        {children}
      </div>
    </div>
  </div>
);

const LoginPage: React.FC<{ onNavigate: (page: string) => void }> = ({
  onNavigate,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const { login } = useAuth();
  const { addToast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validation
    if (!formData.email.trim() || !formData.password.trim()) {
      addToast("Please enter both email and password", "error");
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      addToast("Please enter a valid email address", "error");
      return;
    }

    setIsLoading(true);

    try {
      console.log("Attempting login with:", {
        email: formData.email,
        password: formData.password,
      });

      const response = await apiService.login(formData);
      console.log("API Response:", response);

      // Validate the response structure
      if (!response || !response.token) {
        throw new Error("Invalid response from server: No token received");
      }

      if (!response.id || !response.name || !response.email || !response.role) {
        throw new Error("Invalid response from server: Missing user data");
      }

      const userData = {
        id: response.id,
        name: response.name,
        email: response.email,
        role: response.role,
        token: response.token,
        status: "Active" as const,
      };

      console.log("User data to store:", userData);
      login(userData);
      addToast("Login successful!", "success");
    } catch (error) {
      console.error("Login error:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Login failed. Please check your credentials.";
      addToast(errorMessage, "error");
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div>
      {/* <h2 className="text-3xl font-bold text-gray-900">Welcome 👋</h2> */}
      <h1 className="mt-2 text-gray-600 text-2xl font-bold">Login</h1>
      <form className="mt-8 space-y-6 " onSubmit={handleLogin}>
        <div className="space-y-2">
          <label
            htmlFor="email"
            className="block text-md font-medium text-gray-700"
          >
            Email *
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            value={formData.email}
            onChange={handleInputChange}
            placeholder="Enter your email"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-neokred-primary focus:border-neokred-primary sm:text-sm"
          />
        </div>
        <div className="relative">
          <label
            htmlFor="password"
            className="block text-md font-medium text-gray-700"
          >
            Password *
          </label>
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            value={formData.password}
            onChange={handleInputChange}
            placeholder="Enter your password"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-neokred-primary focus:border-neokred-primary sm:text-sm"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 top-6 pr-3 flex items-center text-gray-500"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
        <div className="text-right text-sm">
          <button
            type="button"
            onClick={() => onNavigate("forgot")}
            className="font-medium text-neokred-primary hover:text-neokred-primary-dark"
          >
            Forgot password?
          </button>
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-neokred-primary hover:bg-neokred-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neokred-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
};

// Fixed LoginPage Component

// Also fix ForgotPasswordPage to be typeable
const ForgotPasswordPage: React.FC<{ onNavigate: (page: string) => void }> = ({
  onNavigate,
}) => {
  const [email, setEmail] = useState("");

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-900">Forgot Password?</h2>
      <p className="mt-2 text-gray-600">
        No worries, we'll send you the reset instructions
      </p>
      <form
        className="mt-8 space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          onNavigate("otp");
        }}
      >
        <div>
          <label
            htmlFor="email-forgot"
            className="block text-sm font-medium text-gray-700"
          >
            Email *
          </label>
          <input
            id="email-forgot"
            name="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter registered email"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-neokred-primary focus:border-neokred-primary sm:text-sm"
          />
        </div>
        <button
          type="submit"
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-neokred-primary hover:bg-neokred-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neokred-primary"
        >
          Get reset Link
        </button>
      </form>
    </div>
  );
};

// OTP Page remains the same (it's already using proper state)
const OtpPage: React.FC<{ onNavigate: (page: string) => void }> = ({
  onNavigate,
}) => {
  const [otp, setOtp] = useState<string[]>(new Array(6).fill(""));
  const [timer, setTimer] = useState(59);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleChange = (element: HTMLInputElement, index: number) => {
    if (isNaN(Number(element.value))) return;
    setOtp([...otp.map((d, idx) => (idx === index ? element.value : d))]);
    if (element.nextSibling && element.value) {
      (element.nextSibling as HTMLInputElement).focus();
    }
  };

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-900">OTP verification</h2>
      <p className="mt-2 text-gray-600">Enter the OTP Sent to your email</p>
      <form
        className="mt-8 space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          onNavigate("login");
        }}
      >
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            {otp.map((data, index) => (
              <input
                key={index}
                type="text"
                maxLength={1}
                value={data}
                ref={(el) => {
                  inputsRef.current[index] = el;
                }}
                onChange={(e) => handleChange(e.target, index)}
                onFocus={(e) => e.target.select()}
                className="w-12 h-12 text-center border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-neokred-primary focus:border-neokred-primary text-lg"
              />
            ))}
          </div>
          <span className="text-sm font-medium text-neokred-primary">{`00:${timer
            .toString()
            .padStart(2, "0")}`}</span>
        </div>
        <button
          type="submit"
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-neokred-primary hover:bg-neokred-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neokred-primary"
        >
          Verify
        </button>
      </form>
    </div>
  );
};

const AuthPage: React.FC = () => {
  const [currentPage, setCurrentPage] = useState("login");

  const renderPage = () => {
    switch (currentPage) {
      case "login":
        return <LoginPage onNavigate={setCurrentPage} />;
      case "forgot":
        return <ForgotPasswordPage onNavigate={setCurrentPage} />;
      case "otp":
        return <OtpPage onNavigate={setCurrentPage} />;
      default:
        return <LoginPage onNavigate={setCurrentPage} />;
    }
  };

  return <AuthLayout>{renderPage()}</AuthLayout>;
};

export default AuthPage;
