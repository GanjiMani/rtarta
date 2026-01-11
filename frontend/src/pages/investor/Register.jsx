import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../services/AuthContext";
import { Country, State, City } from "country-state-city";
import {
  User,
  CreditCard,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Lock,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  AlertCircle,
  Globe,
  Eye,
  EyeOff
} from "lucide-react";

// InputField Component (Defined Outside to prevent re-render focus loss)
const InputField = ({ label, name, type = "text", icon: Icon, placeholder, options = [], value, onChange, error, ...props }) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {Icon && <Icon className="h-5 w-5 text-gray-400" />}
        </div>

        {type === "select" ? (
          <select
            name={name}
            value={value}
            onChange={onChange}
            className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors
              ${error ? "border-red-500 bg-red-50" : "border-gray-300"}`}
            {...props}
          >
            <option value="">Select {label}</option>
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ) : (
          <>
            <input
              type={inputType}
              name={name}
              value={value}
              onChange={onChange}
              placeholder={placeholder}
              className={`w-full pl-10 ${isPassword ? 'pr-10' : 'pr-4'} py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors
                ${error ? "border-red-500 bg-red-50" : "border-gray-300"}`}
              {...props}
            />
            {isPassword && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            )}
          </>
        )}
      </div>
      {error && <p className="text-red-500 text-xs mt-1 flex items-center"><AlertCircle className="w-3 h-3 mr-1" />{error}</p>}
    </div>
  );
};

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  // Steps configuration
  const steps = [
    { id: 1, title: "Identity", icon: User },
    { id: 2, title: "Contact", icon: MapPin },
    { id: 3, title: "Security", icon: Lock },
  ];

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Identity
    full_name: "",
    pan_number: "",
    date_of_birth: "",
    gender: "",
    // Contact
    email: "",
    mobile_number: "",
    country: "India", // Default
    state: "",
    city: "",
    address_line1: "",
    pincode: "",
    // Security
    password: "",
    confirmPassword: "",
    terms: false,
  });

  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [apiSuccess, setApiSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load Countries on mount
  useEffect(() => {
    setCountries(Country.getAllCountries());
  }, []);

  // Update States when Country changes
  useEffect(() => {
    const selectedCountry = countries.find((c) => c.name === formData.country);
    if (selectedCountry) {
      setStates(State.getStatesOfCountry(selectedCountry.isoCode));
      setCities([]); // Reset cities
      // Reset state and city in form if they don't match new country (optional logic to clear fields is in handleChange)
    }
  }, [formData.country, countries]);

  // Update Cities when State changes
  useEffect(() => {
    const selectedCountry = countries.find((c) => c.name === formData.country);
    const selectedState = states.find((s) => s.name === formData.state);
    if (selectedCountry && selectedState) {
      setCities(City.getCitiesOfState(selectedCountry.isoCode, selectedState.isoCode));
    }
  }, [formData.state, states, formData.country, countries]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    // For checkbox, use checked; for others, use value
    const val = type === "checkbox" ? checked : value;

    setFormData((prev) => {
      const newData = { ...prev, [name]: val };

      // Cascading logic to clear dependent fields
      if (name === "country") {
        newData.state = "";
        newData.city = "";
      }
      if (name === "state") {
        newData.city = "";
      }
      return newData;
    });
  };

  const validateStep = (step) => {
    const newErrors = {};
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    // Allow international numbers: + followed by 10-15 digits
    const mobileRegex = /^\+?[0-9]{10,15}$/;
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+=<>?{}[\]~]).{8,}$/;

    if (step === 1) {
      if (!formData.full_name || formData.full_name.length < 2) newErrors.full_name = "Full name required (min 2 chars)";
      if (!panRegex.test(formData.pan_number)) newErrors.pan_number = "Invalid PAN format (e.g., ABCDE1234F)";
      if (!formData.date_of_birth) newErrors.date_of_birth = "Date of Birth required";
      if (!formData.gender) newErrors.gender = "Gender required";
    }

    if (step === 2) {
      if (!emailRegex.test(formData.email)) newErrors.email = "Invalid email address";
      if (!mobileRegex.test(formData.mobile_number)) newErrors.mobile_number = "Invalid mobile number (10-15 digits)";
      if (!formData.country) newErrors.country = "Country required";
      if (!formData.state) newErrors.state = "State required";
      if (!formData.city) newErrors.city = "City required";
      if (!formData.address_line1 || formData.address_line1.length < 5) newErrors.address_line1 = "Address required (min 5 chars)";
      // Pincode validation: Relaxed for international, just ensure min length
      if (!formData.pincode || formData.pincode.length < 4) newErrors.pincode = "Invalid Pincode";
    }

    if (step === 3) {
      if (!passwordRegex.test(formData.password)) newErrors.password = "Min 8 chars, 1 Upper, 1 Number, 1 Special";
      if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Passwords do not match";
      if (!formData.terms) newErrors.terms = "You must accept the Terms & Conditions";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => prev - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError("");
    setApiSuccess("");

    if (!validateStep(3)) return;

    setIsSubmitting(true);
    try {
      await register({
        ...formData,
        pan_number: formData.pan_number.toUpperCase(),
      });
      setApiSuccess("Registration successful! Redirecting...");
      setTimeout(() => navigate("/login"), 2000);
    } catch (error) {
      setApiError(error.message || "Registration failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl flex overflow-hidden min-h-[600px]">

        {/* Left Side - Branding */}
        <div className="hidden md:flex w-1/3 bg-blue-600 p-8 flex-col justify-between text-white relative overflow-hidden">
          <div className="relative z-10">
            <h1 className="text-3xl font-bold mb-2">RTA Portal</h1>
            <p className="text-blue-100">Your Gateway to Smart Investing</p>
          </div>

          <div className="relative z-10 space-y-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-500/30 rounded-lg backdrop-blur-sm">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold">Secure & Fast</h3>
                <p className="text-xs text-blue-100">Bank-grade security protocols</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-500/30 rounded-lg backdrop-blur-sm">
                <Globe className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold">Global Access</h3>
                <p className="text-xs text-blue-100">Invest from anywhere in the world</p>
              </div>
            </div>
          </div>

          <div className="relative z-10 text-xs text-blue-200">
            © 2024 RTA Management. All rights reserved.
          </div>

          {/* Decorative Circles */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-blue-500 rounded-full opacity-20 filter blur-2xl"></div>
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-purple-500 rounded-full opacity-20 filter blur-2xl"></div>
        </div>

        {/* Right Side - Form Wizard */}
        <div className="w-full md:w-2/3 p-8 flex flex-col">

          {/* Progress Stepper */}
          <div className="flex items-center justify-between mb-8 relative">
            <div className="absolute left-0 top-1/2 w-full h-1 bg-gray-200 -z-10 rounded-full"></div>
            {steps.map((step) => {
              const isActive = step.id === currentStep;
              const isCompleted = step.id < currentStep;
              return (
                <div key={step.id} className="flex flex-col items-center bg-white px-2">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300
                    ${isActive ? "border-blue-600 bg-blue-600 text-white shadow-lg scale-110" :
                        isCompleted ? "border-green-500 bg-green-500 text-white" : "border-gray-300 text-gray-400 bg-white"}`}
                  >
                    {isCompleted ? <CheckCircle size={20} /> : <step.icon size={20} />}
                  </div>
                  <span className={`text-xs mt-2 font-medium ${isActive ? "text-blue-600" : "text-gray-500"}`}>
                    {step.title}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Form Content */}
          <div className="flex-1 overflow-y-auto px-1 custom-scrollbar">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">{steps[currentStep - 1].title} Details</h2>

            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Step 1: Identity */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <InputField
                    label="Full Name"
                    name="full_name"
                    icon={User}
                    value={formData.full_name}
                    onChange={handleChange}
                    error={errors.full_name}
                    placeholder="As per PAN card"
                  />
                  <InputField
                    label="PAN Number"
                    name="pan_number"
                    icon={CreditCard}
                    value={formData.pan_number}
                    onChange={handleChange}
                    error={errors.pan_number}
                    placeholder="ABCDE1234F"
                    maxLength={10}
                    style={{ textTransform: "uppercase" }}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <InputField
                      label="Date of Birth"
                      name="date_of_birth"
                      type="date"
                      value={formData.date_of_birth}
                      onChange={handleChange}
                      error={errors.date_of_birth}
                      icon={Calendar}
                    />
                    <InputField
                      label="Gender"
                      name="gender"
                      type="select"
                      value={formData.gender}
                      onChange={handleChange}
                      error={errors.gender}
                      icon={User}
                      options={[
                        { value: "male", label: "Male" },
                        { value: "female", label: "Female" },
                        { value: "other", label: "Other" }
                      ]}
                    />
                  </div>
                </div>
              )}

              {/* Step 2: Contact */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <InputField
                    label="Email Address"
                    name="email"
                    type="email"
                    icon={Mail}
                    value={formData.email}
                    onChange={handleChange}
                    error={errors.email}
                    placeholder="john@example.com"
                  />
                  <InputField
                    label="Mobile Number"
                    name="mobile_number"
                    type="tel"
                    icon={Phone}
                    value={formData.mobile_number}
                    onChange={handleChange}
                    error={errors.mobile_number}
                    placeholder="+91 9876543210"
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <InputField
                      label="Country"
                      name="country"
                      type="select"
                      icon={Globe}
                      value={formData.country}
                      onChange={handleChange}
                      error={errors.country}
                      options={countries.map(c => ({ value: c.name, label: c.name }))}
                    />
                    <InputField
                      label="State"
                      name="state"
                      type="select"
                      icon={MapPin}
                      value={formData.state}
                      onChange={handleChange}
                      error={errors.state}
                      disabled={!formData.country}
                      options={states.map(s => ({ value: s.name, label: s.name }))}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <InputField
                      label="City"
                      name="city"
                      type="select"
                      icon={MapPin}
                      value={formData.city}
                      onChange={handleChange}
                      error={errors.city}
                      disabled={!formData.state}
                      options={cities.map(c => ({ value: c.name, label: c.name }))}
                    />
                    <InputField
                      label="Pincode"
                      name="pincode"
                      icon={MapPin}
                      value={formData.pincode}
                      onChange={handleChange}
                      error={errors.pincode}
                      placeholder="Zip Code"
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1</label>
                    <textarea
                      name="address_line1"
                      value={formData.address_line1}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none ${errors.address_line1 ? 'border-red-500' : 'border-gray-300'}`}
                      rows="3"
                      placeholder="Enter your address line 1"
                    ></textarea>
                    {errors.address_line1 && <p className="text-red-500 text-xs mt-1">{errors.address_line1}</p>}
                  </div>
                </div>
              )}

              {/* Step 3: Security */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <InputField
                    label="Password"
                    name="password"
                    type="password"
                    icon={Lock}
                    value={formData.password}
                    onChange={handleChange}
                    error={errors.password}
                    placeholder="Min 8 chars"
                  />
                  <InputField
                    label="Confirm Password"
                    name="confirmPassword"
                    type="password"
                    icon={Lock}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    error={errors.confirmPassword}
                    placeholder="Re-enter password"
                  />

                  <div className="flex items-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <input
                      type="checkbox"
                      name="terms"
                      checked={formData.terms}
                      onChange={handleChange}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="ml-3 text-sm text-gray-600">
                      I agree to the <Link to="/terms" className="text-blue-600 hover:underline">Terms of Service</Link> and <Link to="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>
                    </span>
                  </div>
                  {errors.terms && <p className="text-red-500 text-xs">{errors.terms}</p>}
                </div>
              )}

              {/* API Messages */}
              {apiError && (
                <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-center">
                  <AlertCircle className="w-4 h-4 mr-2" /> {apiError}
                </div>
              )}
              {apiSuccess && (
                <div className="p-3 bg-green-50 text-green-700 text-sm rounded-lg flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2" /> {apiSuccess}
                </div>
              )}
            </form>
          </div>

          {/* Navigation Buttons */}
          <div className="pt-6 border-t border-gray-100 flex justify-between items-center mt-auto">
            {currentStep === 1 ? (
              <p className="text-sm text-gray-500">
                Already have an account? <Link to="/login" className="text-blue-600 font-medium hover:underline">Login</Link>
              </p>
            ) : (
              <button
                type="button"
                onClick={handleBack}
                className="flex items-center px-6 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                <ChevronLeft className="w-4 h-4 mr-2" /> Back
              </button>
            )}

            {currentStep < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                className="ml-auto flex items-center px-8 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all hover:scale-[1.02]"
              >
                Continue <ChevronRight className="w-4 h-4 ml-2" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="ml-auto flex items-center px-8 py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 shadow-lg shadow-green-500/30 transition-all hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Creating Account..." : "Complete Registration"}
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
