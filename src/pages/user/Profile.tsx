import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Avatar,
  Button,
  Grid,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Tabs,
  Tab,
  Pagination,
  Slider,
  Snackbar,
} from '@mui/material';
import Cropper from 'react-easy-crop';
import { Area } from 'react-easy-crop';
import {
  Edit,
  PhotoCamera,
  Person,
  Email,
  Description,
  Link,
  CalendarToday,
  LocationOn,
  Wallpaper,
  Delete,
} from '@mui/icons-material';
import Layout from '../../components/layout/Layout';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { useTheme } from '@mui/material/styles';
import { authService } from '../../services/authService';
import { getCurrentUser } from '../../store/auth/authThunks';
import papyrusHorizontal2 from '../../asset/textures/papyrus_horizontal_2.png';
import papyrusHorizontal1 from '../../asset/textures/papyrus_horizontal_1.png';
import papyrusVertical1 from '../../asset/textures/papyrus_vertical_1.png';
import magnefiteBackgroundVideo from '../../asset/videos/vid_ebru.mp4';
import { userService } from '../../services/userService';
import { questionService } from '../../services/questionService';
import { answerService } from '../../services/answerService';
import { t } from '../../utils/translations';
import { ProfilePageSkeleton, QuestionsListSkeleton, AnswersListSkeleton } from '../../components/ui/skeleton';
import { User } from '../../types/user';
import { Question } from '../../types/question';
import { Answer } from '../../types/answer';
import { followUser, unfollowUser, getFollowers, getFollowing } from '../../store/follow/followThunks';
import { openFollowersModal, closeFollowersModal, openFollowingModal, closeFollowingModal } from '../../store/follow/followSlice';
import UsersListModal from '../../components/ui/UsersListModal';
import { contentAssetService, uploadFileToPresignedUrl } from '../../services/contentAssetService';
import api from '../../services/api';
import PasswordChangeCodeModal from '../../components/ui/PasswordChangeCodeModal';
import { passwordChangeSchema } from '../../utils/validation';
import { showErrorToast, showSuccessToast } from '../../utils/notificationUtils';

interface ProfileStats {
  totalQuestions: number;
  totalAnswers: number;
}

interface UserActivity {
  id: string;
  type: 'question' | 'answer';
  title: string;
  content: string;
  createdAt: string;
  likes: number;
}

const Profile = () => {
  const { userId } = useParams<{ userId?: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const { user, isAuthenticated } = useAppSelector(state => state.auth);
  const { currentLanguage } = useAppSelector(state => state.language);
  const { name: themeName, mode } = useAppSelector(state => state.theme);
  const { 
    followersModalOpen, 
    followingModalOpen, 
    followers, 
    following, 
    followersLoading, 
    followingLoading 
  } = useAppSelector(state => state.follow);
  // TODO: Kullanıcı bazlı tema yükleme tamamlandığında themeName yerine kullanıcı verisinden gelen tema tercihleri kullanılacak.
  const isPapirus = themeName === 'papirus';
  const isMagnefite = themeName === 'magnefite';

  // State
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [backgroundUrl, setBackgroundUrl] = useState<string | null>(null);
  const [backgroundType, setBackgroundType] = useState<'image' | 'video' | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imageUploadLoading, setImageUploadLoading] = useState(false);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [answersLoading, setAnswersLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [questionsError, setQuestionsError] = useState<string | null>(null);
  const [answersError, setAnswersError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [stats, setStats] = useState<ProfileStats>({
    totalQuestions: 0,
    totalAnswers: 0,
  });
  const [passwordChangeCodeModalOpen, setPasswordChangeCodeModalOpen] = useState(false);
  const [passwordChangeVerificationToken, setPasswordChangeVerificationToken] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<{
    newPassword?: string;
    confirmPassword?: string;
    currentPassword?: string;
  }>({});
  const [userQuestions, setUserQuestions] = useState<Question[]>([]);
  const [userAnswers, setUserAnswers] = useState<Answer[]>([]);
  const [activeTab, setActiveTab] = useState<'questions' | 'answers'>('questions');
  const [questionsPage, setQuestionsPage] = useState(1);
  const [answersPage, setAnswersPage] = useState(1);
  const [questionsPagination, setQuestionsPagination] = useState({
    totalItems: 0,
    totalPages: 0,
    currentPage: 1,
    itemsPerPage: 10,
    hasNextPage: false,
    hasPreviousPage: false,
  });
  const [answersPagination, setAnswersPagination] = useState({
    total: 0,
    totalPages: 0,
    page: 1,
    limit: 10,
    hasNext: false,
    hasPrev: false,
  });
  const itemsPerPage = 10;
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const customBackgroundVideoRef = useRef<HTMLVideoElement | null>(null);
  const [isReversing, setIsReversing] = useState(false);
  const [isCustomReversing, setIsCustomReversing] = useState(false);
  const reverseAnimationFrameRef = useRef<number | null>(null);
  const reverseStartTimeRef = useRef<number | null>(null);
  const customReverseAnimationFrameRef = useRef<number | null>(null);
  const customReverseStartTimeRef = useRef<number | null>(null);
  
  // Cleanup reverse animation on unmount
  useEffect(() => {
    return () => {
      if (reverseAnimationFrameRef.current) {
        cancelAnimationFrame(reverseAnimationFrameRef.current);
      }
      if (customReverseAnimationFrameRef.current) {
        cancelAnimationFrame(customReverseAnimationFrameRef.current);
      }
    };
  }, []);
  
  // Reverse animation function for default video
  const startReverseAnimation = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    
    setIsReversing(true);
    const duration = video.duration;
    
    // Video'nun sonuna git ve biraz bekleyip reverse başlat
    video.currentTime = duration;
    
    // Kısa bir delay sonra reverse başlat (takılmayı önlemek için)
    setTimeout(() => {
      if (!video) return;
      
      reverseStartTimeRef.current = Date.now();
      const startTime = duration;
      
      const animate = () => {
        if (!video || !reverseStartTimeRef.current) return;
        
        const elapsed = (Date.now() - reverseStartTimeRef.current) / 1000;
        const newTime = Math.max(0, startTime - elapsed);
        
        // currentTime'ı sadece önemli değişikliklerde güncelle (takılmayı azaltmak için)
        if (Math.abs(video.currentTime - newTime) > 0.05) {
          video.currentTime = newTime;
        }
        
        if (newTime > 0.1) {
          reverseAnimationFrameRef.current = requestAnimationFrame(animate);
        } else {
          // Reverse bitti, normal oynatmaya dön
          if (reverseAnimationFrameRef.current) {
            cancelAnimationFrame(reverseAnimationFrameRef.current);
            reverseAnimationFrameRef.current = null;
          }
          setIsReversing(false);
          reverseStartTimeRef.current = null;
          video.currentTime = 0;
          video.play();
        }
      };
      
      reverseAnimationFrameRef.current = requestAnimationFrame(animate);
    }, 50); // 50ms delay - takılmayı önlemek için
  }, []);

  // Reverse animation function for custom background video
  const startCustomReverseAnimation = useCallback(() => {
    const video = customBackgroundVideoRef.current;
    if (!video) return;
    
    setIsCustomReversing(true);
    const duration = video.duration;
    
    // Video'nun sonuna git ve biraz bekleyip reverse başlat
    video.currentTime = duration;
    
    // Kısa bir delay sonra reverse başlat (takılmayı önlemek için)
    setTimeout(() => {
      if (!video) return;
      
      customReverseStartTimeRef.current = Date.now();
      const startTime = duration;
      
      const animate = () => {
        if (!video || !customReverseStartTimeRef.current) return;
        
        const elapsed = (Date.now() - customReverseStartTimeRef.current) / 1000;
        const newTime = Math.max(0, startTime - elapsed);
        
        // currentTime'ı sadece önemli değişikliklerde güncelle (takılmayı azaltmak için)
        if (Math.abs(video.currentTime - newTime) > 0.05) {
          video.currentTime = newTime;
        }
        
        if (newTime > 0.1) {
          customReverseAnimationFrameRef.current = requestAnimationFrame(animate);
        } else {
          // Reverse bitti, normal oynatmaya dön
          if (customReverseAnimationFrameRef.current) {
            cancelAnimationFrame(customReverseAnimationFrameRef.current);
            customReverseAnimationFrameRef.current = null;
          }
          setIsCustomReversing(false);
          customReverseStartTimeRef.current = null;
          video.currentTime = 0;
          video.play();
        }
      };
      
      customReverseAnimationFrameRef.current = requestAnimationFrame(animate);
    }, 50); // 50ms delay - takılmayı önlemek için
  }, []);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    title: '',
    about: '',
    place: '',
    website: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Determine if viewing own profile
  const isOwnProfile = !userId || userId === user?.id;

  // Load questions separately
  const loadQuestions = useCallback(async (targetUserId: string, page: number = 1) => {
    try {
      setQuestionsLoading(true);
      setQuestionsError(null);
      const result = await questionService.getQuestionsByUser(targetUserId, page, itemsPerPage);
      setUserQuestions(result.data);
      setQuestionsPagination(result.pagination);
    } catch (error: any) {
      console.error('Sorular yüklenirken hata:', error);
      const errorMessage = error?.response?.data?.message || error?.message || t('error_loading_questions', currentLanguage);
      setQuestionsError(errorMessage);
    } finally {
      setQuestionsLoading(false);
    }
  }, [currentLanguage, itemsPerPage]);

  // Load answers separately
  const loadAnswers = useCallback(async (targetUserId: string, page: number = 1) => {
    try {
      setAnswersLoading(true);
      setAnswersError(null);
      const result = await answerService.getAnswersByUser(targetUserId, page, itemsPerPage);
      setUserAnswers(result.data);
      setAnswersPagination(result.pagination);
    } catch (error: any) {
      console.error('Cevaplar yüklenirken hata:', error);
      const errorMessage = error?.response?.data?.message || error?.message || t('error_loading_answers', currentLanguage);
      setAnswersError(errorMessage);
    } finally {
      setAnswersLoading(false);
    }
  }, [currentLanguage, itemsPerPage]);

  // Load both questions and answers in parallel
  const loadUserData = useCallback(async (targetUserId: string) => {
    try {
      // Load both in parallel without blocking
      await Promise.all([
        loadQuestions(targetUserId),
        loadAnswers(targetUserId),
      ]);
    } catch (error) {
      console.error('Kullanıcı verileri yüklenirken hata:', error);
    }
  }, [loadQuestions, loadAnswers]);

  // Update stats when pagination changes (total counts)
  useEffect(() => {
    if (!questionsLoading && !answersLoading) {
          setStats({
        totalQuestions: questionsPagination.totalItems,
        totalAnswers: answersPagination.total,
          });
    }
  }, [questionsPagination.totalItems, answersPagination.total, userQuestions, userAnswers, questionsLoading, answersLoading]);

  // Load user data
  useEffect(() => {
    const loadProfileUser = async () => {
      if (!isAuthenticated) return;
      
      setLoading(true);
      try {
        let targetUser: User | null = null;
        
        if (userId) {
          // Fetch specific user profile
          targetUser = await userService.getUserById(userId);
        } else {
          // Fetch current user's profile to ensure we have latest data including background_asset_key
          if (user?.id) {
            targetUser = await userService.getUserById(user.id);
          } else {
            // Fallback to user state if no ID available
            targetUser = user;
          }
        }
        
        if (targetUser) {
          // Resolve profile_image URL if it's a Cloudflare key
          let profileImageUrl = targetUser.profile_image;
          if (targetUser.profile_image && !targetUser.profile_image.startsWith('http')) {
            try {
              // Check if it looks like a Cloudflare key (contains path structure or starts with date pattern)
              if (targetUser.profile_image.includes('user-profile-avatars') || targetUser.profile_image.match(/^\d{4}\/\d{2}\/\d{2}\//) || targetUser.profile_image.includes('/')) {
                const url = await contentAssetService.resolveAssetUrl({
                  key: targetUser.profile_image,
                  type: 'user-profile-avatar',
                  ownerId: targetUser.id,
                  visibility: 'public',
                  presignedUrl: false, // Use public URL if available, fallback to presigned if not
                });
                profileImageUrl = url;
              }
            } catch (error) {
              console.error('Failed to resolve profile image URL:', error);
              // Keep original value if resolution fails
            }
          }
          
          setProfileUser({ ...targetUser, profile_image: profileImageUrl });
          setProfileImageUrl(profileImageUrl);
          
          // Load background URL if exists
          if (targetUser.background_asset_key) {
            try {
              const url = await contentAssetService.resolveAssetUrl({
                key: targetUser.background_asset_key,
                type: 'user-profile-background',
                ownerId: targetUser.id,
                visibility: 'public',
                presignedUrl: false, // Use public URL if available, fallback to presigned if not
              });
              setBackgroundUrl(url);
              // Try to determine type from URL or default to video
              // We'll set it when uploading, but for existing ones, try to detect
              const isImage = url.match(/\.(gif|jpg|jpeg|png|webp)(\?|$)/i);
              setBackgroundType(isImage ? 'image' : 'video');
            } catch (error) {
              console.error('Failed to resolve background URL:', error);
              setBackgroundUrl(null);
              setBackgroundType(null);
            }
          } else {
            setBackgroundUrl(null);
            setBackgroundType(null);
          }
          
          setFormData({
            name: targetUser.name || '',
            email: targetUser.email || '',
            title: targetUser.title || '',
            about: targetUser.about || '',
            place: targetUser.place || '',
            website: targetUser.website || '',
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
          });
          
          // Start loading questions and answers immediately (non-blocking)
          // Don't await, let them load in parallel
          loadUserData(targetUser.id);
        } else {
          setError('Kullanıcı bulunamadı');
        }
      } catch (error) {
        console.error('Profil yüklenirken hata:', error);
        setError(t('error_loading_profile', currentLanguage));
      } finally {
        setLoading(false);
      }
    };

    loadProfileUser();
  }, [userId, isAuthenticated, user, currentLanguage, loadUserData]);

  const handleEditProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const updateData = {
        name: formData.name,
        email: formData.email,
        about: formData.about,
        place: formData.place,
        website: formData.website,
      };

      const updatedUser = await authService.editProfile(updateData);
      
      if (updatedUser) {
        setSuccess(t('profile_updated_success', currentLanguage));
        setIsEditing(false);
        // TODO: Redux store'u güncelle
      }
    } catch (error: any) {
      setError(error.message || t('profile_update_error', currentLanguage));
    } finally {
      setLoading(false);
    }
  };

  // Validate password fields in real-time
  const validatePasswordFields = async () => {
    const errors: { newPassword?: string; confirmPassword?: string; currentPassword?: string } = {};
    
    try {
      if (!profileUser?.isGoogleUser && !formData.currentPassword) {
        errors.currentPassword = t('current_password_required', currentLanguage) || 'Current password is required';
      }
      
      if (formData.newPassword) {
        try {
          await passwordChangeSchema.validateAt('newPassword', { newPassword: formData.newPassword });
        } catch (err: any) {
          errors.newPassword = err.message || t('password_requirements', currentLanguage) || 'Password does not meet requirements';
        }
      }
      
      if (formData.confirmPassword) {
        if (formData.newPassword !== formData.confirmPassword) {
          errors.confirmPassword = t('passwords_must_match', currentLanguage) || 'Passwords must match';
        } else {
          try {
            await passwordChangeSchema.validateAt('confirmPassword', { 
              newPassword: formData.newPassword,
              confirmPassword: formData.confirmPassword 
            });
          } catch (err: any) {
            errors.confirmPassword = err.message;
          }
        }
      }
    } catch (error) {
      // Ignore validation errors during typing
    }
    
    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePasswordFieldChange = async (field: 'currentPassword' | 'newPassword' | 'confirmPassword', value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Debounce validation
    setTimeout(() => {
      validatePasswordFields();
    }, 300);
  };

  const handleRequestPasswordChange = async () => {
    // Clear previous errors
    setPasswordErrors({});
    
    try {
      // Validate password fields
      await passwordChangeSchema.validate({
        oldPassword: profileUser?.isGoogleUser ? undefined : formData.currentPassword,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword,
      }, { abortEarly: false });

      setIsChangingPassword(true);
      setError(null);

      // Request password change code
      await authService.requestPasswordChange(
        profileUser?.isGoogleUser ? undefined : formData.currentPassword,
        formData.newPassword
      );

      // Open code verification modal
      setPasswordChangeCodeModalOpen(true);
      showSuccessToast(t('password_change_code_sent', currentLanguage) || 'Verification code sent to your email');
    } catch (error: any) {
      if (error.name === 'ValidationError') {
        const validationErrors: { newPassword?: string; confirmPassword?: string; currentPassword?: string } = {};
        error.inner?.forEach((err: any) => {
          if (err.path === 'newPassword') {
            validationErrors.newPassword = err.message;
          } else if (err.path === 'confirmPassword') {
            validationErrors.confirmPassword = err.message;
          } else if (err.path === 'oldPassword') {
            validationErrors.currentPassword = err.message;
          }
        });
        setPasswordErrors(validationErrors);
      } else {
        const errorMessage = error.response?.data?.message || error.message || t('password_change_request_failed', currentLanguage) || 'Failed to request password change';
        if (errorMessage.includes('Current password') || errorMessage.includes('current password')) {
          setPasswordErrors({ currentPassword: errorMessage });
        } else {
          showErrorToast(errorMessage);
        }
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleVerifyPasswordChangeCode = async (code: string) => {
    try {
      const response = await authService.verifyPasswordChangeCode(code);
      if (response.success && response.data?.verificationToken) {
        setPasswordChangeVerificationToken(response.data.verificationToken);
        setPasswordChangeCodeModalOpen(false);
        // Now confirm password change
        await handleConfirmPasswordChange(response.data.verificationToken);
      }
    } catch (error: any) {
      throw error; // Let modal handle the error
    }
  };

  const handleResendPasswordChangeCode = async () => {
    try {
      await authService.requestPasswordChange(
        profileUser?.isGoogleUser ? undefined : formData.currentPassword,
        formData.newPassword
      );
      showSuccessToast(t('code_resent', currentLanguage) || 'Code resent successfully');
    } catch (error: any) {
      throw error; // Let modal handle the error
    }
  };

  const handleConfirmPasswordChange = async (verificationToken: string) => {
    try {
      await authService.confirmPasswordChange(verificationToken, formData.newPassword);
      showSuccessToast(t('password_changed_success', currentLanguage) || 'Password changed successfully');
      
      // Reset password fields
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));
      setPasswordChangeVerificationToken(null);
    } catch (error: any) {
      showErrorToast(error.response?.data?.message || error.message || t('password_change_failed', currentLanguage) || 'Failed to change password');
    }
  };

  // Follow handlers
  const handleFollow = async () => {
    if (!profileUser || !user) return;
    
    // Optimistic update
    const previousUser = { ...profileUser };
    setProfileUser({
      ...profileUser,
      isFollowing: true,
      followersCount: (profileUser.followersCount || 0) + 1,
    });
    
    try {
      await dispatch(followUser(profileUser.id)).unwrap();
      // Refresh user data to get accurate counts
      const updatedUser = await userService.getUserById(profileUser.id);
      if (updatedUser) {
        setProfileUser(updatedUser);
      }
    } catch (error) {
      console.error('Follow error:', error);
      // Revert on error
      setProfileUser(previousUser);
    }
  };

  const handleUnfollow = async () => {
    if (!profileUser || !user) return;
    
    // Optimistic update
    const previousUser = { ...profileUser };
    setProfileUser({
      ...profileUser,
      isFollowing: false,
      followersCount: Math.max(0, (profileUser.followersCount || 0) - 1),
    });
    
    try {
      await dispatch(unfollowUser(profileUser.id)).unwrap();
      // Refresh user data to get accurate counts
      const updatedUser = await userService.getUserById(profileUser.id);
      if (updatedUser) {
        setProfileUser(updatedUser);
      }
    } catch (error) {
      console.error('Unfollow error:', error);
      // Revert on error
      setProfileUser(previousUser);
    }
  };

  const handleShowFollowers = async () => {
    if (!profileUser) return;
    dispatch(openFollowersModal());
    dispatch(getFollowers(profileUser.id));
  };

  const handleShowFollowing = async () => {
    if (!profileUser) return;
    dispatch(openFollowingModal());
    dispatch(getFollowing(profileUser.id));
  };

  const handleImageFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !profileUser) return;

    // Validate file type (image only)
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Lütfen geçerli bir görsel dosyası seçin (jpeg, png, gif, webp)');
      return;
    }

    // Validate file size (max 5MB for profile images)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setError('Dosya boyutu 5MB\'dan küçük olmalıdır');
      return;
    }

    // Create image URL for crop modal
    const imageUrl = URL.createObjectURL(file);
    setImageToCrop(imageUrl);
    setCropModalOpen(true);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  };

  const createImage = (url: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.src = url;
    });
  };

  const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: Area
  ): Promise<Blob> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('No 2d context');
    }

    const maxSize = Math.max(image.width, image.height);
    const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));

    canvas.width = safeArea;
    canvas.height = safeArea;

    ctx.translate(safeArea / 2, safeArea / 2);
    ctx.translate(-safeArea / 2, -safeArea / 2);

    ctx.drawImage(
      image,
      safeArea / 2 - image.width * 0.5,
      safeArea / 2 - image.height * 0.5
    );

    const data = ctx.getImageData(0, 0, safeArea, safeArea);

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.putImageData(
      data,
      Math.round(0 - safeArea / 2 + image.width * 0.5 - pixelCrop.x),
      Math.round(0 - safeArea / 2 + image.height * 0.5 - pixelCrop.y)
    );

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Canvas is empty'));
          return;
        }
        resolve(blob);
      }, 'image/jpeg', 0.95);
    });
  };

  const handleCropComplete = async () => {
    if (!imageToCrop || !croppedAreaPixels || !profileUser) return;

    try {
      setImageUploadLoading(true);
      setError(null);

      // 1. Crop the image
      const croppedBlob = await getCroppedImg(imageToCrop, croppedAreaPixels);
      const croppedFile = new File([croppedBlob], 'profile-image.jpg', { type: 'image/jpeg' });

      // 2. Get presigned URL
      const presigned = await contentAssetService.createPresignedUpload({
        type: 'user-profile-avatar',
        filename: croppedFile.name,
        mimeType: croppedFile.type,
        contentLength: croppedFile.size,
        ownerId: profileUser.id,
        visibility: 'public',
      });

      // 3. Upload cropped file to Cloudflare
      await uploadFileToPresignedUrl(presigned, croppedFile);

      // 4. Update user's profile_image
      const response = await api.put<{ success: boolean; data: { profile_image: string } }>(
        '/auth/profile-image',
        { profileImageKey: presigned.key }
      );

      if (response.data.success) {
        // Resolve the new profile image URL
        const newProfileImageUrl = await contentAssetService.resolveAssetUrl({
          key: presigned.key,
          type: 'user-profile-avatar',
          ownerId: profileUser.id,
          visibility: 'public',
          presignedUrl: false, // Use public URL if available, fallback to presigned if not
        });

        // Update local state with the resolved URL
        setProfileUser(prev => prev ? { ...prev, profile_image: newProfileImageUrl } : null);
        setProfileImageUrl(newProfileImageUrl);
        
        // Update Redux store so header avatar updates
        await dispatch(getCurrentUser());
        
        setSuccess('Profil fotoğrafı başarıyla yüklendi');
        setCropModalOpen(false);
        
        // Cleanup
        if (imageToCrop) {
          URL.revokeObjectURL(imageToCrop);
        }
        setImageToCrop(null);
      }
    } catch (error: any) {
      console.error('Profile image upload error:', error);
      setError(error.message || 'Profil fotoğrafı yüklenirken bir hata oluştu');
    } finally {
      setImageUploadLoading(false);
    }
  };

  const handleCropCancel = () => {
    setCropModalOpen(false);
    if (imageToCrop) {
      URL.revokeObjectURL(imageToCrop);
    }
    setImageToCrop(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
  };

  const handleBackgroundUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !profileUser) return;

      // Validate file type (video or image)
      const validTypes = ['video/mp4', 'video/webm', 'video/ogg', 'image/gif', 'image/jpeg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        setError('Lütfen geçerli bir video (mp4, webm, ogg) veya görsel (gif, jpeg, png, webp) dosyası seçin');
        return;
      }

      // Determine file type
      const isImage = file.type.startsWith('image/');
      const fileType = isImage ? 'image' : 'video';

    // Validate file size (max 20MB)
    const maxSize = 20 * 1024 * 1024; // 20MB
    if (file.size > maxSize) {
      setError('Dosya boyutu 20MB\'dan küçük olmalıdır');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // 1. Get presigned URL
      const presigned = await contentAssetService.createPresignedUpload({
        type: 'user-profile-background',
        filename: file.name,
        mimeType: file.type,
        contentLength: file.size,
        ownerId: profileUser.id,
        visibility: 'public',
      });

      // 2. Upload file to Cloudflare
      await uploadFileToPresignedUrl(presigned, file);

      // 3. Update user's background_asset_key
      const response = await api.put<{ success: boolean; data: { background_asset_key: string | null } }>(
        '/auth/background',
        { backgroundAssetKey: presigned.key }
      );

      if (response.data.success) {
        // Update local state
        const newKey = response.data.data.background_asset_key;
        setProfileUser(prev => prev ? { ...prev, background_asset_key: newKey || undefined } : null);
        
        // Update background URL
        if (newKey) {
          try {
            const url = await contentAssetService.resolveAssetUrl({
              key: newKey,
              type: 'user-profile-background',
              ownerId: profileUser.id,
              visibility: 'public',
              presignedUrl: false, // Use public URL if available, fallback to presigned if not
            });
            setBackgroundUrl(url);
            setBackgroundType(fileType);
          } catch (error) {
            console.error('Failed to resolve background URL:', error);
            setBackgroundUrl(null);
            setBackgroundType(null);
          }
        } else {
          setBackgroundUrl(null);
          setBackgroundType(null);
        }
        
        setSuccess('Arka plan başarıyla yüklendi');
      }
    } catch (error: any) {
      console.error('Background upload error:', error);
      setError(error.message || 'Arka plan yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleBackgroundDelete = async () => {
    if (!profileUser || !profileUser.background_asset_key) return;

    try {
      setLoading(true);
      setError(null);

      // Delete from Cloudflare
      await contentAssetService.deleteAsset({
        key: profileUser.background_asset_key,
        type: 'user-profile-background',
        ownerId: profileUser.id,
      });

      // Update user's background_asset_key to null
      const response = await api.put<{ success: boolean; data: { background_asset_key: string | null } }>(
        '/auth/background',
        { backgroundAssetKey: null }
      );

      if (response.data.success) {
        // Update local state
        setProfileUser(prev => prev ? { ...prev, background_asset_key: undefined } : null);
        setBackgroundUrl(null);
        setBackgroundType(null);
        setSuccess('Arka plan başarıyla silindi');
      }
    } catch (error: any) {
      console.error('Background delete error:', error);
      setError(error.message || 'Arka plan silinirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated || !user) {
    return (
      <Layout>
        {/* Papirus temasına özel arka plan dokusu */}
        {isPapirus && (
          <Box
            sx={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: `url(${papyrusHorizontal2})`,
              backgroundSize: '130%',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              opacity: mode === 'dark' ? 0.15 : 0.25,
              pointerEvents: 'none',
              zIndex: 0,
            }}
          />
        )}
        <Container maxWidth="md" sx={{ mt: 4, position: 'relative', zIndex: 1 }}>
          <Alert severity="warning">
            {t('login_required', currentLanguage)}
          </Alert>
        </Container>
      </Layout>
    );
  }

  if (!profileUser) {
    return (
      <Layout>
        {/* Papirus temasına özel arka plan dokusu */}
        {isPapirus && (
          <Box
            sx={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: `url(${papyrusHorizontal2})`,
              backgroundSize: '120%',
              backgroundPosition: 'center 15%',
              backgroundRepeat: 'no-repeat',
              opacity: mode === 'dark' ? 0.15 : 0.25,
              pointerEvents: 'none',
              zIndex: 0,
            }}
          />
        )}
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4, position: 'relative', zIndex: 1 }}>
          {loading ? (
            <ProfilePageSkeleton />
          ) : error ? (
            <Alert severity="error">{error}</Alert>
          ) : null}
        </Container>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Magnefite Video Background */}
      {isMagnefite && (
        <>
          {backgroundUrl ? (
            // User's custom background
            backgroundType === 'image' ? (
              <Box
                component="img"
                alt="Profile background"
                src={backgroundUrl}
                onError={(e) => {
                  console.error('Background image failed to load:', backgroundUrl);
                  setBackgroundUrl(null);
                  setBackgroundType(null);
                }}
                sx={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  filter: mode === 'dark' ? 'brightness(0.35)' : 'brightness(0.55)',
                  pointerEvents: 'none',
                  zIndex: 0,
                }}
              />
            ) : (
              <Box
                component="video"
                ref={customBackgroundVideoRef}
                autoPlay
                muted
                playsInline
                aria-hidden
                src={backgroundUrl}
                onError={(e) => {
                  console.error('Background video failed to load:', backgroundUrl);
                  setBackgroundUrl(null);
                  setBackgroundType(null);
                }}
                onEnded={() => {
                  if (!isCustomReversing) {
                    startCustomReverseAnimation();
                  }
                }}
                sx={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  filter: mode === 'dark' ? 'brightness(0.35)' : 'brightness(0.55)',
                  pointerEvents: 'none',
                  zIndex: 0,
                }}
              />
            )
          ) : (
            // Default video background
            <Box
              component="video"
              ref={videoRef}
              autoPlay
              muted
              playsInline
              aria-hidden
              src={magnefiteBackgroundVideo}
              onEnded={() => {
                if (!isReversing) {
                  startReverseAnimation();
                }
              }}
              sx={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                filter: mode === 'dark' ? 'brightness(0.35)' : 'brightness(0.55)',
                pointerEvents: 'none',
                zIndex: 0,
              }}
            />
          )}
          <Box
            sx={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: mode === 'dark'
                ? 'linear-gradient(180deg, rgba(15, 15, 15, 0.75) 0%, rgba(15, 15, 15, 0.6) 60%, rgba(15, 15, 15, 0.8) 100%)'
                : 'linear-gradient(180deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.08) 50%, rgba(255, 255, 255, 0.15) 100%)',
              pointerEvents: 'none',
              zIndex: 0,
            }}
          />
        </>
      )}

      {/* Papirus temasına özel arka plan dokusu */}
      {isPapirus && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `url(${papyrusHorizontal2})`,
            backgroundSize: '110%',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            opacity: mode === 'dark' ? 0.15 : 0.25,
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />
      )}
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ color: 'white', mb: 2 }}>
            {t('profile', currentLanguage)}
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {/* Sol Kolon - Profil Bilgileri */}
          <Grid item xs={12} md={4}>
            <Card sx={{ 
              bgcolor: theme.palette.mode === 'dark' 
                ? 'rgba(255,255,255,0.1)' 
                : 'rgba(255,255,255,0.8)',
              backdropFilter: 'blur(10px)',
              border: theme.palette.mode === 'dark' 
                ? '1px solid rgba(255,255,255,0.1)' 
                : '1px solid rgba(0,0,0,0.05)',
              position: 'relative',
              overflow: 'hidden',
              ...(isPapirus ? {
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundImage: `url(${papyrusVertical1})`,
                  backgroundSize: '140%',
                  backgroundPosition: 'center 70%',
                  backgroundRepeat: 'no-repeat',
                  opacity: mode === 'dark' ? 0.12 : 0.15,
                  pointerEvents: 'none',
                  zIndex: 0,
                },
                '& > *': {
                  position: 'relative',
                  zIndex: 1,
                },
              } : {}),
            }}>
              <CardContent sx={{ textAlign: 'center', p: 3 }}>
                {/* Profil Fotoğrafı */}
                <Box sx={{ position: 'relative', mb: 3 }}>
                  <Avatar
                    src={profileImageUrl || profileUser.profile_image}
                    sx={{ width: 120, height: 120, mx: 'auto', mb: 2 }}
                  />
                  {isOwnProfile && (
                    <>
                      <input
                        accept="image/*"
                        style={{ display: 'none' }}
                        id="profile-image-upload"
                        type="file"
                        onChange={handleImageFileSelect}
                      />
                      <label htmlFor="profile-image-upload">
                        <IconButton
                          component="span"
                          sx={{
                            position: 'absolute',
                            bottom: 0,
                            right: '50%',
                            transform: 'translateX(50%)',
                            bgcolor: 'primary.main',
                            '&:hover': { bgcolor: 'primary.dark' },
                          }}
                        >
                          <PhotoCamera />
                        </IconButton>
                      </label>
                    </>
                  )}
                </Box>

                {/* Kullanıcı Bilgileri */}
                <Typography variant="h5" sx={{ 
                  color: theme.palette.mode === 'dark' ? 'white' : '#1A202C', 
                  mb: 1 
                }}>
                  {profileUser.name}
                </Typography>
                {profileUser.title && (
                  <Typography variant="body2" sx={{ 
                    color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.7)' : '#4A5568', 
                    mb: 2 
                  }}>
                    {profileUser.title}
                  </Typography>
                )}

                {/* İstatistikler */}
                <Box sx={{ mt: 3 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="h6" sx={{ 
                        color: theme.palette.mode === 'dark' ? 'white' : '#1A202C' 
                      }}>
                        {stats.totalQuestions}
                      </Typography>
                      <Typography variant="body2" sx={{ 
                        color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.7)' : '#4A5568' 
                      }}>
                        {t('questions', currentLanguage)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="h6" sx={{ 
                        color: theme.palette.mode === 'dark' ? 'white' : '#1A202C' 
                      }}>
                        {stats.totalAnswers}
                      </Typography>
                      <Typography variant="body2" sx={{ 
                        color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.7)' : '#4A5568' 
                      }}>
                        {t('answers', currentLanguage)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          color: theme.palette.mode === 'dark' ? 'white' : '#1A202C',
                          cursor: profileUser.followersCount && profileUser.followersCount > 0 ? 'pointer' : 'default',
                          '&:hover': profileUser.followersCount && profileUser.followersCount > 0 ? { opacity: 0.7 } : {},
                        }}
                        onClick={profileUser.followersCount && profileUser.followersCount > 0 ? handleShowFollowers : undefined}
                      >
                        {profileUser.followersCount || 0}
                      </Typography>
                      <Typography variant="body2" sx={{ 
                        color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.7)' : '#4A5568' 
                      }}>
                        {t('followers', currentLanguage)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          color: theme.palette.mode === 'dark' ? 'white' : '#1A202C',
                          cursor: profileUser.followingCount && profileUser.followingCount > 0 ? 'pointer' : 'default',
                          '&:hover': profileUser.followingCount && profileUser.followingCount > 0 ? { opacity: 0.7 } : {},
                        }}
                        onClick={profileUser.followingCount && profileUser.followingCount > 0 ? handleShowFollowing : undefined}
                      >
                        {profileUser.followingCount || 0}
                      </Typography>
                      <Typography variant="body2" sx={{ 
                        color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.7)' : '#4A5568' 
                      }}>
                        {t('following', currentLanguage)}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>

                {/* Follow/Unfollow Butonu - Başkasının profili için */}
                {!isOwnProfile && user && (
                  <Button
                    variant={profileUser.isFollowing === true ? "contained" : "contained"}
                    onClick={profileUser.isFollowing === true ? handleUnfollow : handleFollow}
                    sx={{ 
                      mt: 3,
                      ...(profileUser.isFollowing === true ? {
                        // Unfollow butonu - kırmızımsı renk
                        color: 'white',
                        backgroundColor: theme.palette.mode === 'dark' 
                          ? 'rgba(239, 68, 68, 0.8)' // Koyu modda daha açık kırmızı
                          : '#EF4444', // Açık modda kırmızı
                        borderColor: theme.palette.mode === 'dark' 
                          ? 'rgba(239, 68, 68, 0.8)'
                          : '#EF4444',
                        '&:hover': {
                          backgroundColor: theme.palette.mode === 'dark'
                            ? 'rgba(239, 68, 68, 0.9)'
                            : '#DC2626', // Daha koyu kırmızı hover
                          borderColor: theme.palette.mode === 'dark'
                            ? 'rgba(239, 68, 68, 0.9)'
                            : '#DC2626',
                        }
                      } : {
                        // Follow butonu - normal renk
                        color: 'white',
                        borderColor: theme.palette.mode === 'dark' ? 'white' : '#1A202C',
                        backgroundColor: theme.palette.mode === 'dark' ? 'white' : '#1A202C',
                        '&:hover': {
                          backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.9)' : '#2D3748',
                          borderColor: theme.palette.mode === 'dark' ? 'white' : '#1A202C',
                        }
                      })
                    }}
                  >
                    {profileUser.isFollowing === true ? t('unfollow', currentLanguage) : t('follow', currentLanguage)}
                  </Button>
                )}

                {/* Düzenle Butonu - Sadece kendi profili için */}
                {isOwnProfile && (
                  <>
                    <Button
                      variant="outlined"
                      startIcon={<Edit />}
                      onClick={() => setIsEditing(true)}
                      sx={{ 
                        mt: 3, 
                        mr: 1,
                        color: theme.palette.mode === 'dark' ? 'white' : '#1A202C',
                        borderColor: theme.palette.mode === 'dark' ? 'white' : '#1A202C',
                        '&:hover': {
                          borderColor: theme.palette.mode === 'dark' ? 'white' : '#1A202C',
                          backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                        }
                      }}
                    >
                      {t('edit_profile', currentLanguage)}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Sağ Kolon - Detaylar */}
          <Grid item xs={12} md={8}>
            <Grid container spacing={3}>
              {/* Profil Detayları */}
              <Grid item xs={12}>
                <Card sx={{ 
                  bgcolor: theme.palette.mode === 'dark' 
                    ? 'rgba(255,255,255,0.1)' 
                    : 'rgba(255,255,255,0.8)',
                  backdropFilter: 'blur(10px)',
                  border: theme.palette.mode === 'dark' 
                    ? '1px solid rgba(255,255,255,0.1)' 
                    : '1px solid rgba(0,0,0,0.05)',
                  position: 'relative',
                  overflow: 'hidden',
                  ...(isPapirus ? {
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundImage: `url(${papyrusHorizontal1})`,
                      backgroundSize: '140%',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat',
                      opacity: mode === 'dark' ? 0.12 : 0.15,
                      pointerEvents: 'none',
                      zIndex: 0,
                    },
                    '& > *': {
                      position: 'relative',
                      zIndex: 1,
                    },
                  } : {}),
                }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ 
                      color: theme.palette.mode === 'dark' ? 'white' : '#1A202C', 
                      mb: 2 
                    }}>
                      {t('profile_details', currentLanguage)}
                    </Typography>
                    
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <Person sx={{ 
                            color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.7)' : '#4A5568', 
                            mr: 1 
                          }} />
                          <Typography variant="body2" sx={{ 
                            color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.7)' : '#4A5568' 
                          }}>
                            {t('name', currentLanguage)}: {profileUser.name}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <Email sx={{ 
                            color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.7)' : '#4A5568', 
                            mr: 1 
                          }} />
                          <Typography variant="body2" sx={{ 
                            color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.7)' : '#4A5568' 
                          }}>
                            {t('email', currentLanguage)}: {profileUser.email}
                          </Typography>
                        </Box>
                      </Grid>
                                             {profileUser.place && (
                         <Grid item xs={12} sm={6}>
                           <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                             <LocationOn sx={{ 
                               color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.7)' : '#4A5568', 
                               mr: 1 
                             }} />
                             <Typography variant="body2" sx={{ 
                               color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.7)' : '#4A5568' 
                             }}>
                               {t('location', currentLanguage)}: {profileUser.place}
                             </Typography>
                           </Box>
                         </Grid>
                       )}
                       {profileUser.website && (
                         <Grid item xs={12} sm={6}>
                           <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                             <Link sx={{ 
                               color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.7)' : '#4A5568', 
                               mr: 1 
                             }} />
                             <Typography variant="body2" sx={{ 
                               color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.7)' : '#4A5568' 
                             }}>
                               {t('website', currentLanguage)}: {profileUser.website}
                             </Typography>
                           </Box>
                         </Grid>
                       )}
                       {profileUser.about && (
                         <Grid item xs={12}>
                           <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                             <Description sx={{ 
                               color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.7)' : '#4A5568', 
                               mr: 1, 
                               mt: 0.5 
                             }} />
                             <Typography variant="body2" sx={{ 
                               color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.7)' : '#4A5568' 
                             }}>
                               {t('about', currentLanguage)}: {profileUser.about}
                             </Typography>
                           </Box>
                         </Grid>
                       )}
                       <Grid item xs={12}>
                         <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                           <CalendarToday sx={{ 
                             color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.7)' : '#4A5568', 
                             mr: 1 
                           }} />
                           <Typography variant="body2" sx={{ 
                             color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.7)' : '#4A5568' 
                           }}>
                             {t('member_since', currentLanguage)}: {profileUser.createdAt ? new Date(profileUser.createdAt).toLocaleDateString() : 'N/A'}
                           </Typography>
                         </Box>
                       </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* Sorular ve Cevaplar */}
              <Grid item xs={12}>
                <Card sx={{ 
                  bgcolor: theme.palette.mode === 'dark' 
                    ? 'rgba(255,255,255,0.1)' 
                    : 'rgba(255,255,255,0.8)',
                  backdropFilter: 'blur(10px)',
                  border: theme.palette.mode === 'dark' 
                    ? '1px solid rgba(255,255,255,0.1)' 
                    : '1px solid rgba(0,0,0,0.05)',
                  position: 'relative',
                  overflow: 'hidden',
                  ...(isPapirus ? {
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundImage: `url(${papyrusVertical1})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center 15%',
                      backgroundRepeat: 'no-repeat',
                      opacity: mode === 'dark' ? 0.12 : 0.15,
                      pointerEvents: 'none',
                      zIndex: 0,
                    },
                    '& > *': {
                      position: 'relative',
                      zIndex: 1,
                    },
                  } : {}),
                }}>
                  <CardContent>
                    <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                      <Tabs 
                        value={activeTab} 
                        onChange={async (_, newValue) => {
                          setActiveTab(newValue);
                          setQuestionsPage(1);
                          setAnswersPage(1);
                          // Tab değiştiğinde ilk sayfayı yükle
                          if (profileUser) {
                            if (newValue === 'questions') {
                              await loadQuestions(profileUser.id, 1);
                            } else {
                              await loadAnswers(profileUser.id, 1);
                            }
                          }
                        }}
                        textColor="primary"
                        indicatorColor="primary"
                      >
                        <Tab 
                          label={`${t('questions', currentLanguage)} (${questionsPagination.totalItems})`} 
                          value="questions" 
                          sx={{ color: theme.palette.mode === 'dark' ? 'white' : '#1A202C' }}
                        />
                        <Tab 
                          label={`${t('answers', currentLanguage)} (${answersPagination.total})`} 
                          value="answers" 
                          sx={{ color: theme.palette.mode === 'dark' ? 'white' : '#1A202C' }}
                        />
                      </Tabs>
                    </Box>
                    
                    {activeTab === 'questions' && (
                      <>
                        {questionsLoading ? (
                          <Box sx={{ mt: 2 }}>
                            <QuestionsListSkeleton count={3} />
                          </Box>
                        ) : questionsError ? (
                          <Alert severity="error" sx={{ my: 2 }}>
                            {questionsError}
                          </Alert>
                        ) : userQuestions.length > 0 ? (
                          <>
                            <List id="questions-list">
                              {userQuestions.map((question) => (
                              <ListItem 
                                key={question.id} 
                                sx={{ 
                                  px: 0, 
                                  py: 2,
                                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                                  cursor: 'pointer',
                                  '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' }
                                }}
                                onClick={(e) => {
                                  if (e.ctrlKey || e.metaKey || e.button === 1) {
                                    e.preventDefault();
                                    window.open(`/questions/${question.id}`, '_blank');
                                  } else {
                                    navigate(`/questions/${question.id}`);
                                  }
                                }}
                                onMouseDown={(e) => {
                                  if (e.button === 1) {
                                    e.preventDefault();
                                    window.open(`/questions/${question.id}`, '_blank');
                                  }
                                }}
                              >
                                <ListItemText
                                  primary={
                                    <Typography variant="body1" sx={{ 
                                      color: theme.palette.mode === 'dark' ? 'white' : '#1A202C',
                                      fontWeight: 500,
                                    }}>
                                      {question.title}
                                    </Typography>
                                  }
                                  secondary={
                                    <Typography variant="body2" sx={{ 
                                      color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.7)' : '#4A5568',
                                      mt: 0.5,
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      display: '-webkit-box',
                                      WebkitLineClamp: 3,
                                      WebkitBoxOrient: 'vertical',
                                      wordBreak: 'break-word',
                                    }}>
                                      {question.content}
                                    </Typography>
                                  }
                                />
                                <Box sx={{ textAlign: 'right', ml: 2 }}>
                                  <Typography variant="caption" sx={{ 
                                    color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.5)' : '#718096',
                                    display: 'block',
                                  }}>
                                    {new Date(question.createdAt || '').toLocaleDateString()}
                                  </Typography>
                                  <Box sx={{ display: 'flex', gap: 1, mt: 0.5, justifyContent: 'flex-end' }}>
                                    <Typography variant="caption" sx={{ 
                                      color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.5)' : '#718096' 
                                    }}>
                                      {question.likesCount} {t('likes', currentLanguage)}
                                    </Typography>
                                    <Typography variant="caption" sx={{ 
                                      color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.5)' : '#718096' 
                                    }}>
                                      • {question.answers} {currentLanguage === 'tr' ? 'cevap' : t('answers', currentLanguage)}
                                    </Typography>
                                  </Box>
                                </Box>
                              </ListItem>
                              ))}
                            </List>
                            {questionsPagination.totalPages > 1 && (
                              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                                <Pagination
                                  count={questionsPagination.totalPages}
                                  page={questionsPage}
                                  onChange={async (_, page) => {
                                    setQuestionsPage(page);
                                    // Scroll to top of the list
                                    const listElement = document.getElementById('questions-list');
                                    if (listElement) {
                                      listElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                    }
                                    // Backend'den yeni sayfayı yükle
                                    if (profileUser) {
                                      await loadQuestions(profileUser.id, page);
                                    }
                                  }}
                                  color="primary"
                                />
                              </Box>
                            )}
                          </>
                        ) : (
                          <Typography sx={{ 
                            color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.7)' : '#4A5568', 
                            textAlign: 'center',
                            py: 4,
                          }}>
                            {t('no_data', currentLanguage)}
                          </Typography>
                        )}
                      </>
                    )}
                    
                    {activeTab === 'answers' && (
                      <>
                        {answersLoading ? (
                          <Box sx={{ mt: 2 }}>
                            <AnswersListSkeleton count={3} />
                          </Box>
                        ) : answersError ? (
                          <Alert severity="error" sx={{ my: 2 }}>
                            {answersError}
                          </Alert>
                        ) : userAnswers.length > 0 ? (
                          <>
                            <List id="answers-list">
                              {userAnswers.map((answer) => (
                              <ListItem 
                                key={answer.id} 
                                sx={{ 
                                  px: 0, 
                                  py: 2,
                                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                                  cursor: 'pointer',
                                  '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' }
                                }}
                                onClick={(e) => {
                                  if (e.ctrlKey || e.metaKey || e.button === 1) {
                                    e.preventDefault();
                                    window.open(`/questions/${answer.questionId || ''}#answer-${answer.id}`, '_blank');
                                  } else {
                                    navigate(`/questions/${answer.questionId || ''}#answer-${answer.id}`);
                                  }
                                }}
                                onMouseDown={(e) => {
                                  if (e.button === 1) {
                                    e.preventDefault();
                                    window.open(`/questions/${answer.questionId || ''}#answer-${answer.id}`, '_blank');
                                  }
                                }}
                              >
                                <ListItemText
                                  primary={
                                    answer.questionTitle ? (
                                      <Typography variant="body2" sx={{ 
                                        color: (() => {
                                          if (themeName === 'molume') {
                                            return theme.palette.mode === 'dark' ? '#FFB800' : '#FFB800';
                                          } else if (themeName === 'magnefite') {
                                            return theme.palette.mode === 'dark' ? '#9CA3AF' : '#6B7280';
                                          } else if (themeName === 'papirus') {
                                            return theme.palette.mode === 'dark' ? '#A1887F' : '#8D6E63';
                                          }
                                          return theme.palette.primary.main;
                                        })(),
                                        fontWeight: 600,
                                        mb: 0.5,
                                      }}>
                                        {t('answer_to', currentLanguage)}: {answer.questionTitle}
                                      </Typography>
                                    ) : null
                                  }
                                  secondary={
                                    <Typography variant="body2" sx={{ 
                                      color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.7)' : '#4A5568',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      display: '-webkit-box',
                                      WebkitLineClamp: 3,
                                      WebkitBoxOrient: 'vertical',
                                      wordBreak: 'break-word',
                                    }}>
                                      {answer.content}
                                    </Typography>
                                  }
                                />
                                <Box sx={{ textAlign: 'right', ml: 2 }}>
                                  <Typography variant="caption" sx={{ 
                                    color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.5)' : '#718096',
                                    display: 'block',
                                  }}>
                                    {new Date(answer.createdAt || '').toLocaleDateString()}
                                  </Typography>
                                  <Typography variant="caption" sx={{ 
                                    color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.5)' : '#718096' 
                                  }}>
                                    {answer.likesCount} {t('likes', currentLanguage)}
                                  </Typography>
                                </Box>
                              </ListItem>
                              ))}
                            </List>
                            {answersPagination.totalPages > 1 && (
                              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                                <Pagination
                                  count={answersPagination.totalPages}
                                  page={answersPage}
                                  onChange={async (_, page) => {
                                    setAnswersPage(page);
                                    // Scroll to top of the list
                                    const listElement = document.getElementById('answers-list');
                                    if (listElement) {
                                      listElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                    }
                                    // Backend'den yeni sayfayı yükle
                                    if (profileUser) {
                                      await loadAnswers(profileUser.id, page);
                                    }
                                  }}
                                  color="primary"
                                />
                              </Box>
                            )}
                          </>
                        ) : (
                          <Typography sx={{ 
                            color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.7)' : '#4A5568', 
                            textAlign: 'center',
                            py: 4,
                          }}>
                            {t('no_data', currentLanguage)}
                          </Typography>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Grid>
        </Grid>

        {/* Profil Düzenleme Dialog'u */}
        <Dialog
          open={isEditing}
          onClose={() => setIsEditing(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              bgcolor: theme.palette.background.paper,
              borderRadius: 2,
              boxShadow: theme.palette.mode === 'dark'
                ? '0 20px 60px rgba(0, 0, 0, 0.5)'
                : '0 20px 60px rgba(0, 0, 0, 0.15)',
              border: theme.palette.mode === 'dark' 
                ? '1px solid rgba(255, 255, 255, 0.1)' 
                : '1px solid rgba(0, 0, 0, 0.05)',
            },
          }}
        >
          <DialogTitle sx={{ 
            color: theme.palette.mode === 'dark' ? 'white' : '#1A202C', 
            fontWeight: 600, 
            borderBottom: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`, 
            pb: 1.5,
            mb: 0,
            px: 3,
            pt: 3,
          }}>
            {t('edit_profile', currentLanguage)}
          </DialogTitle>
          <DialogContent sx={{ 
            color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.8)' : '#4A5568', 
            pt: '4px !important',
            px: 3,
            pb: 2,
            overflow: 'visible',
            '& .MuiInputLabel-root': {
              transform: 'translate(14px, 20px) scale(1)',
              '&.MuiInputLabel-shrink': {
                transform: 'translate(14px, -9px) scale(0.75)',
                top: 0,
              },
            },
            '& .MuiFormControl-root': {
              marginTop: '8px',
            },
            '& .MuiInputLabel-root.MuiInputLabel-shrink': {
              transform: 'translate(14px, -9px) scale(0.75) !important',
              top: 0,
            },
          }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  label={t('name', currentLanguage)}
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: theme.palette.mode === 'dark' 
                        ? 'rgba(255, 255, 255, 0.05)' 
                        : 'rgba(0, 0, 0, 0.02)',
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  label={t('email', currentLanguage)}
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                  disabled
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: theme.palette.mode === 'dark' 
                        ? 'rgba(255, 255, 255, 0.05)' 
                        : 'rgba(0, 0, 0, 0.02)',
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={t('about', currentLanguage)}
                  value={formData.about}
                  onChange={(e) => setFormData(prev => ({ ...prev, about: e.target.value }))}
                  multiline
                  rows={3}
                  InputLabelProps={{ shrink: true }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: theme.palette.mode === 'dark' 
                        ? 'rgba(255, 255, 255, 0.05)' 
                        : 'rgba(0, 0, 0, 0.02)',
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('location', currentLanguage)}
                  value={formData.place}
                  onChange={(e) => setFormData(prev => ({ ...prev, place: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: theme.palette.mode === 'dark' 
                        ? 'rgba(255, 255, 255, 0.05)' 
                        : 'rgba(0, 0, 0, 0.02)',
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('website', currentLanguage)}
                  value={formData.website}
                  onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: theme.palette.mode === 'dark' 
                        ? 'rgba(255, 255, 255, 0.05)' 
                        : 'rgba(0, 0, 0, 0.02)',
                    },
                  }}
                />
              </Grid>
              
              {/* Şifre Değiştirme */}
              <Grid item xs={12}>
                <Box sx={{ 
                  pt: 2, 
                  borderTop: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
                  mt: 1
                }}>
                  <Typography variant="subtitle2" sx={{ 
                    mb: 2,
                    color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.8)' : '#4A5568',
                  }}>
                    {t('change_password', currentLanguage) || 'Change Password'}
                  </Typography>
                  
                  {/* Google kullanıcı değilse eski şifre alanı */}
                  {!profileUser?.isGoogleUser && (
                    <TextField
                      fullWidth
                      type="password"
                      label={t('current_password', currentLanguage) || 'Current Password'}
                      value={formData.currentPassword}
                      onChange={(e) => handlePasswordFieldChange('currentPassword', e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      error={!!passwordErrors.currentPassword}
                      helperText={passwordErrors.currentPassword || ''}
                      sx={{
                        mb: 2,
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: theme.palette.mode === 'dark' 
                            ? 'rgba(255, 255, 255, 0.05)' 
                            : 'rgba(0, 0, 0, 0.02)',
                        },
                      }}
                    />
                  )}
                  
                  <TextField
                    fullWidth
                    type="password"
                    label={t('new_password', currentLanguage) || 'New Password'}
                    value={formData.newPassword}
                    onChange={(e) => handlePasswordFieldChange('newPassword', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    error={!!passwordErrors.newPassword}
                    helperText={passwordErrors.newPassword || (formData.newPassword ? '' : (t('password_requirements', currentLanguage) || 'Min 8 characters, uppercase, lowercase, number, special character'))}
                    sx={{
                      mb: 2,
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: theme.palette.mode === 'dark' 
                          ? 'rgba(255, 255, 255, 0.05)' 
                          : 'rgba(0, 0, 0, 0.02)',
                      },
                    }}
                  />
                  
                  <TextField
                    fullWidth
                    type="password"
                    label={t('confirm_new_password', currentLanguage) || 'Confirm New Password'}
                    value={formData.confirmPassword}
                    onChange={(e) => handlePasswordFieldChange('confirmPassword', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    error={!!passwordErrors.confirmPassword}
                    helperText={passwordErrors.confirmPassword || ''}
                    sx={{
                      mb: 2,
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: theme.palette.mode === 'dark' 
                          ? 'rgba(255, 255, 255, 0.05)' 
                          : 'rgba(0, 0, 0, 0.02)',
                      },
                    }}
                  />
                  
                  <Button
                    variant="outlined"
                    onClick={handleRequestPasswordChange}
                    disabled={
                      isChangingPassword || 
                      !formData.newPassword || 
                      !formData.confirmPassword || 
                      formData.newPassword !== formData.confirmPassword ||
                      !!passwordErrors.newPassword ||
                      !!passwordErrors.confirmPassword ||
                      (!profileUser?.isGoogleUser && !formData.currentPassword) ||
                      (!profileUser?.isGoogleUser && !!passwordErrors.currentPassword)
                    }
                    sx={{ 
                      mt: 1,
                      color: theme.palette.mode === 'dark' ? 'white' : '#1A202C',
                      borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)',
                      '&:hover': {
                        borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)',
                        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                      }
                    }}
                  >
                    {isChangingPassword ? <CircularProgress size={20} /> : (t('request_password_change', currentLanguage) || 'Request Password Change')}
                  </Button>
                </Box>
              </Grid>
              
              {/* Arka Plan Yükleme - Sadece Magnefite temasında */}
              {isMagnefite && (
                <Grid item xs={12}>
                  <Box sx={{ 
                    pt: 2, 
                    borderTop: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
                    mt: 1
                  }}>
                    <Typography variant="subtitle2" sx={{ 
                      mb: 2,
                      color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.8)' : '#4A5568',
                    }}>
                      Arka Plan
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                      <input
                        accept="video/*,image/gif,image/jpeg,image/png,image/webp"
                        style={{ display: 'none' }}
                        id="background-upload-modal"
                        type="file"
                        onChange={handleBackgroundUpload}
                      />
                      <label htmlFor="background-upload-modal">
                        <Button
                          component="span"
                          variant="outlined"
                          startIcon={<Wallpaper />}
                          sx={{ 
                            color: theme.palette.mode === 'dark' ? 'white' : '#1A202C',
                            borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)',
                            '&:hover': {
                              borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)',
                              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                            }
                          }}
                        >
                          {profileUser?.background_asset_key ? 'Arka Plan Değiştir' : 'Arka Plan Ekle'}
                        </Button>
                      </label>
                      {profileUser?.background_asset_key && (
                        <Button
                          variant="outlined"
                          startIcon={<Delete />}
                          onClick={handleBackgroundDelete}
                          sx={{ 
                            color: theme.palette.mode === 'dark' ? 'rgba(239, 68, 68, 0.9)' : '#EF4444',
                            borderColor: theme.palette.mode === 'dark' ? 'rgba(239, 68, 68, 0.5)' : '#EF4444',
                            '&:hover': {
                              borderColor: theme.palette.mode === 'dark' ? 'rgba(239, 68, 68, 0.8)' : '#DC2626',
                              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)',
                            }
                          }}
                        >
                          Arka Planı Sil
                        </Button>
                      )}
                    </Box>
                  </Box>
                </Grid>
              )}
            </Grid>
          </DialogContent>
          <DialogActions sx={{ 
            borderTop: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`, 
            pt: 2, 
            pb: 2 
          }}>
            <Button onClick={() => setIsEditing(false)} sx={{ 
              color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.8)' : '#4A5568' 
            }}>
              {t('cancel', currentLanguage)}
            </Button>
            <Button
              onClick={handleEditProfile}
              variant="contained"
              disabled={loading}
            >
              {loading ? <CircularProgress size={20} /> : t('save', currentLanguage)}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Followers Modal */}
        <UsersListModal
          open={followersModalOpen}
          onClose={() => dispatch(closeFollowersModal())}
          users={followers}
          title={t('followers', currentLanguage)}
          loading={followersLoading}
        />

        {/* Following Modal */}
        <UsersListModal
          open={followingModalOpen}
          onClose={() => dispatch(closeFollowingModal())}
          users={following}
          title={t('following', currentLanguage)}
          loading={followingLoading}
        />

        {/* Crop Modal */}
        <Dialog
          open={cropModalOpen}
          onClose={handleCropCancel}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              bgcolor: theme.palette.mode === 'dark' 
                ? 'rgba(30, 30, 30, 0.95)' 
                : 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
            }
          }}
        >
          <DialogTitle sx={{ 
            color: theme.palette.mode === 'dark' ? 'white' : '#1A202C',
            fontWeight: 600,
            borderBottom: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
            pb: 2,
            mb: 2
          }}>
            {t('crop_image', currentLanguage) || 'Fotoğrafı Düzenle'}
          </DialogTitle>
          <DialogContent>
            {imageToCrop && (
              <Box sx={{ position: 'relative', width: '100%', height: 400, mb: 3 }}>
                <Cropper
                  image={imageToCrop}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={(croppedArea, croppedAreaPixels) => {
                    setCroppedAreaPixels(croppedAreaPixels);
                  }}
                  style={{
                    containerStyle: {
                      width: '100%',
                      height: '100%',
                      position: 'relative',
                    },
                  }}
                />
              </Box>
            )}
            <Box sx={{ px: 2 }}>
              <Typography variant="body2" sx={{ mb: 1, color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.7)' : '#4A5568' }}>
                {t('zoom', currentLanguage) || 'Yakınlaştır'}
              </Typography>
              <Slider
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                onChange={(e, value) => setZoom(value as number)}
                sx={{ mb: 2 }}
              />
            </Box>
            {imageUploadLoading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 2 }}>
                <CircularProgress size={24} sx={{ mr: 2 }} />
                <Typography variant="body2" sx={{ color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.7)' : '#4A5568' }}>
                  {t('uploading', currentLanguage) || 'Yükleniyor...'}
                </Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2, borderTop: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}` }}>
            <Button onClick={handleCropCancel} disabled={imageUploadLoading}>
              {t('cancel', currentLanguage)}
            </Button>
            <Button 
              onClick={handleCropComplete} 
              variant="contained" 
              disabled={imageUploadLoading || !croppedAreaPixels}
            >
              {t('save', currentLanguage) || 'Kaydet'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Password Change Code Modal */}
        <PasswordChangeCodeModal
          open={passwordChangeCodeModalOpen}
          onClose={() => {
            setPasswordChangeCodeModalOpen(false);
            setPasswordChangeVerificationToken(null);
          }}
          onVerify={handleVerifyPasswordChangeCode}
          onResend={handleResendPasswordChangeCode}
          email={profileUser?.email || ''}
          currentLanguage={currentLanguage}
        />

        {/* Success/Error Snackbars */}
        <Snackbar
          open={!!success}
          autoHideDuration={4000}
          onClose={() => setSuccess(null)}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert 
            onClose={() => setSuccess(null)} 
            severity="success" 
            sx={{ width: '100%' }}
          >
            {success}
          </Alert>
        </Snackbar>

        <Snackbar
          open={!!error}
          autoHideDuration={6000}
          onClose={() => setError(null)}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert 
            onClose={() => setError(null)} 
            severity="error" 
            sx={{ width: '100%' }}
          >
            {error}
          </Alert>
        </Snackbar>
      </Container>
    </Layout>
  );
};

export default Profile;
