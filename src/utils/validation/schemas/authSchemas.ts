import * as yup from 'yup';
import { t } from '../../translations';

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
// Password validation regex: min 8 chars, uppercase, lowercase, number, special char
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]).{8,}$/;

export const createPasswordChangeSchema = (lang: string) =>
  yup.object({
    oldPassword: yup.string().optional(),
    newPassword: yup
      .string()
      .required(t('new_password_required', lang))
      .min(8, t('password_requirements', lang))
      .matches(passwordRegex, t('password_requirements', lang)),
    confirmPassword: yup
      .string()
      .required(t('confirm_password_required', lang))
      .oneOf([yup.ref('newPassword')], t('passwords_must_match', lang)),
  });

export const passwordChangeCodeSchema = yup.object({
  code: yup
    .string()
    .required('Verification code is required')
    .length(6, 'Code must be 6 digits')
    .matches(/^\d{6}$/, 'Code must contain only digits'),
});

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
    .min(8, 'Şifre en az 8 karakter olmalıdır')
    .matches(
      passwordRegex,
      'En az 8 karakter, bir büyük harf, bir küçük harf, bir rakam ve bir özel karakter (!@#$%^&* vb.) içermelidir'
    )
    .required('Şifre zorunludur'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Şifreler eşleşmiyor')
    .required('Şifre tekrarı zorunludur'),
});
