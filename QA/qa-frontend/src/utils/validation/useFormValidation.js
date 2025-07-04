import { useState } from "react";
import * as yup from "yup";

export const useFormValidation = (schema) => {
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Validate a single field
  const validateField = async (name, value) => {
    try {
      // Create a partial schema for the specific field
      const fieldSchema = yup.object({
        [name]: schema.fields[name],
      });

      await fieldSchema.validate({ [name]: value }, { abortEarly: false });

      // If validation passes, remove error for this field
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });

      return true;
    } catch (validationError) {
      if (validationError instanceof yup.ValidationError) {
        const fieldError = validationError.errors[0];
        setErrors((prev) => ({
          ...prev,
          [name]: fieldError,
        }));
        return false;
      }
      return false;
    }
  };

  // Validate entire form
  const validateForm = async (formData) => {
    try {
      await schema.validate(formData, { abortEarly: false });
      setErrors({});
      return true;
    } catch (validationError) {
      if (validationError instanceof yup.ValidationError) {
        const newErrors = {};
        validationError.inner.forEach((error) => {
          newErrors[error.path] = error.message;
        });
        setErrors(newErrors);
        return false;
      }
      return false;
    }
  };

  // Handle field blur
  const handleBlur = async (name, value) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
    await validateField(name, value);
  };

  // Handle field change
  const handleChange = async (name, value) => {
    if (touched[name]) {
      await validateField(name, value);
    }
  };

  // Check if form is valid
  const isFormValid = Object.keys(errors).length === 0;

  // Get error for a specific field
  const getFieldError = (name) => {
    return touched[name] ? errors[name] : "";
  };

  // Reset validation state
  const resetValidation = () => {
    setErrors({});
    setTouched({});
  };

  return {
    errors,
    touched,
    validateField,
    validateForm,
    handleBlur,
    handleChange,
    isFormValid,
    getFieldError,
    resetValidation,
  };
};
