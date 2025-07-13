import * as yup from 'yup';

// Login validation schema
export const loginSchema = yup.object({
  email: yup
    .string()
    .email('Geçerli bir email adresi giriniz')
    .required('Email adresi zorunludur'),
  password: yup
    .string()
    .min(6, 'Şifre en az 6 karakter olmalıdır')
    .required('Şifre zorunludur'),
});

// Register validation schema
export const registerSchema = yup.object({
  firstName: yup
    .string()
    .min(2, 'Ad en az 2 karakter olmalıdır')
    .max(50, 'Ad en fazla 50 karakter olabilir')
    .required('Ad zorunludur'),
  lastName: yup
    .string()
    .min(2, 'Soyad en az 2 karakter olmalıdır')
    .max(50, 'Soyad en fazla 50 karakter olabilir')
    .required('Soyad zorunludur'),
  email: yup
    .string()
    .email('Geçerli bir email adresi giriniz')
    .required('Email adresi zorunludur'),
  password: yup
    .string()
    .min(6, 'Şifre en az 6 karakter olmalıdır')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Şifre en az bir küçük harf, bir büyük harf ve bir rakam içermelidir'
    )
    .required('Şifre zorunludur'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Şifreler eşleşmiyor')
    .required('Şifre tekrarı zorunludur'),
});
