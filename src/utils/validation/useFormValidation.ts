import { useState } from 'react';
import * as yup from 'yup';

export const useFormValidation = (schema: yup.ObjectSchema<any>) => {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Validate a single field
  const validateField = async (
    name: string,
    value: any,
    allFormData?: Record<string, any>,
  ): Promise<boolean> => {
    try {
      // Create a partial schema for the specific field
      const fieldSchema = yup.object({
        [name]: schema.fields[name],
      });

      // Use allFormData if provided (for yup.ref() support), otherwise just the field value
      const dataToValidate = allFormData ? { ...allFormData, [name]: value } : { [name]: value };

      await fieldSchema.validate(dataToValidate, { abortEarly: false });

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
  const validateForm = async (formData: Record<string, any>): Promise<boolean> => {
    try {
      await schema.validate(formData, { abortEarly: false });
      setErrors({});
      return true;
    } catch (validationError) {
      if (validationError instanceof yup.ValidationError) {
        const newErrors: Record<string, string> = {};
        validationError.inner.forEach((error) => {
          if (error.path) newErrors[error.path] = error.message;
        });
        setErrors(newErrors);
        return false;
      }
      return false;
    }
  };

  // Handle field blur
  const handleBlur = async (name: string, value: any, allFormData?: Record<string, any>) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
    await validateField(name, value, allFormData);
  };

  // Handle field change
  const handleChange = async (name: string, value: any, allFormData?: Record<string, any>) => {
    if (touched[name]) {
      await validateField(name, value, allFormData);
    }
  };

  // Check if form is valid
  const isFormValid = Object.keys(errors).length === 0;

  // Get error for a specific field
  const getFieldError = (name: string): string => {
    return touched[name] ? errors[name] : '';
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
