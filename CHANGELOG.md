# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.7.0] - 2026-01-08

### Added

- **Follow/Unfollow Users**: Users can now follow and unfollow other users
  - Follow/unfollow buttons on user profile pages
  - Display followers and following counts
  - Clickable counts to view lists of followers/following
  - UsersListModal component to display user lists
  - Redux state management for follow operations
- **Profile Image Upload**: Users can now upload and change their profile pictures
  - Profile image upload with cropping support (react-easy-crop)
  - Zoom and crop controls for image adjustment
  - Automatic deletion of old profile images when new one is uploaded
  - Instant UI update after upload without page refresh
  - Loading indicators during upload process
  - Profile images stored on Cloudflare R2
- **Custom Profile Background**: Users can upload custom backgrounds for their profile pages (Magnefite theme)
  - Support for images (GIF, JPEG, PNG, WebP) and videos (MP4, WebM, OGG)
  - Maximum file size: 20MB
  - Ping-pong video playback (forward and reverse loop)
  - Automatic deletion of old backgrounds when new one is uploaded
  - Background upload/delete controls in profile edit modal
- **Likes/Dislikes User Lists**: View users who liked or disliked content
  - Click like/dislike icons on QuestionDetail page to see user lists
  - UsersListModal displays lists of users who liked or disliked
  - Works for both questions and answers
- **Profile Edit Modal Improvements**: Enhanced profile editing experience
  - Dark mode theme support
  - Removed title field
  - Background upload controls integrated into edit modal
  - Improved form layout and spacing

### Changed

- **Profile Page**: Major UI/UX improvements
  - Removed "Total Likes" and "Profile Views" statistics
  - Improved overlay opacity for better background visibility in light mode
  - Better profile image and background resolution from Cloudflare keys
  - Success/error messages displayed as Snackbar notifications (top-right)
- **Asset Service**: Improved asset management
  - Renamed `forcePresignedUrl` to `presignedUrl` for better semantics
  - Updated `deleteAsset` to use DELETE HTTP method
  - Better URL resolution with public URL support
- **Question and Answer Cards**: Enhanced interaction icons
  - Answer count icon uses rotated Comment icon (180 degrees)
  - Related questions icon changed to Quiz icon
  - Profile images resolved from Cloudflare keys
  - Improved icon alignment and spacing
- **ActionButtons**: Updated icons
  - "Ask Question" button uses ContactSupport icon instead of HelpOutline

### Fixed

- **Like/Dislike Behavior**: When a user likes content they previously disliked, the dislike is now automatically removed
- **Profile Image Display**: Profile images now correctly display after page refresh
- **Background Display**: Custom backgrounds now persist after page refresh
- **Background Delete**: Fixed 404 error when deleting backgrounds
- **ActionButtons Positioning**: Fixed positioning issues in Papyrus theme

### Technical Improvements

- Added react-easy-crop dependency for profile image cropping
- Improved profile image and background URL resolution
- Better error handling in profile upload operations
- Enhanced Redux state management for follow operations
- Improved TypeScript type safety

## [1.6.0] - 2025-01-XX

### Extraordinary Searching Structure v1

#### Added

- **Advanced Search Page**: Comprehensive search interface with advanced filtering and search options
  - New `Search.tsx` page with unified search for questions and answers
  - Tab-based interface for switching between questions and answers
  - Advanced search options panel with collapsible sections
  - Support for multiple search modes: phrase, all_words, any_word
  - Match type selection: exact and fuzzy matching
  - Typo tolerance levels: low, medium, high
  - Smart search options: linguistic (synonym) and semantic (ELSER) search
  - Language detection and filtering
  - Exclude IDs functionality for refined search results
  - Real-time search with debouncing
  - Search result pagination with customizable items per page
  - Search history and recent searches
- **Search Service**: Centralized search service for API integration
  - `searchService.ts` with methods for question and answer search
  - Support for all advanced search options
  - Integration with backend search API endpoints
  - Error handling and warning management
  - Search result transformation and pagination handling
- **Answer Card Component**: New component for displaying answer search results
  - `AnswerCard.tsx` component for answer display in search results
  - Answer content rendering with markdown support
  - Answer metadata display (author, date, likes, etc.)
  - Question information enrichment in answer cards
  - Responsive design with theme support
- **Enhanced Header**: Improved navigation with search integration
  - Search bar integration in header
  - Quick search functionality
  - Navigation to advanced search page
  - Improved header layout and responsiveness
- **Internationalization**: Extended i18n support for search features
  - New translation keys for search interface
  - Search mode labels and descriptions
  - Match type and typo tolerance labels
  - Smart search option descriptions
  - Error messages and warnings

#### Changed

- **Question Service**: Enhanced with advanced search capabilities
  - Updated `searchQuestions` method with all search options
  - Support for semantic and linguistic search
  - Improved error handling and warning management
  - Better pagination handling
- **Answer Service**: Enhanced with advanced search capabilities
  - Updated `searchAnswers` method with all search options
  - Support for semantic and linguistic search
  - Improved error handling and warning management
  - Better pagination handling
- **App Routes**: Updated routing configuration
  - Added search route (`/search`)
  - Updated route configuration for new search page
  - Improved navigation structure
- **Theme Configuration**: Enhanced theme with search-specific styles
  - New theme variables for search interface
  - Improved color scheme for search results
  - Enhanced typography for search pages
  - Better responsive breakpoints
- **Question Card**: Minor improvements for search integration
  - Better integration with search results
  - Improved styling consistency
- **Question Detail**: Enhanced with search context
  - Better integration with search navigation
  - Improved related content display

#### Fixed

- Search result pagination calculation
- Search option state management
- Search debouncing for better performance
- Search result transformation and data mapping

#### Technical Improvements

- Improved code organization with new service layer
- Enhanced TypeScript type safety
- Better error handling throughout search functionality
- Improved component reusability with AnswerCard
- Enhanced user experience with advanced search options
- Better state management for search functionality

## [1.5.0] - 2025-12-27

### Added

- **Question Thumbnail Support**: Complete thumbnail management system for questions
  - Thumbnail upload functionality in CreateQuestionModal
  - Thumbnail display on question cards (QuestionCard component)
  - Thumbnail display on question detail pages (QuestionDetail component)
  - Thumbnail preview modal with full-size image viewing
  - Thumbnail removal functionality during question updates
  - Automatic thumbnail URL resolution from storage keys
- **Content Asset Service**: Frontend service for asset management
  - `contentAssetService` for resolving asset URLs
  - Support for presigned URL generation
  - Automatic retry logic for failed thumbnail loads
- **Thumbnail UI Components**: Enhanced UI for thumbnail display
  - Thumbnail preview with click-to-expand functionality
  - Responsive thumbnail layout (60x60px preview)
  - Thumbnail positioning next to question content
  - Error handling with automatic URL re-resolution

### Changed

- **QuestionCard Component**: Enhanced with thumbnail support
  - Added thumbnail display with vertical centering
  - Improved layout with flexbox for thumbnail positioning
  - Thumbnail preview modal integration
  - Enhanced error handling for thumbnail loading
- **QuestionDetail Component**: Enhanced with thumbnail support
  - Thumbnail display alongside question title and content
  - Thumbnail state management with useState
  - Instant thumbnail removal on update
  - Improved thumbnail URL resolution logic
- **CreateQuestionModal Component**: Added thumbnail upload
  - Thumbnail file selection and preview
  - Thumbnail upload via presigned URLs
  - Thumbnail removal option during edit
  - File size validation (MAX_THUMBNAIL_SIZE_MB)
- **Question Types**: Updated type definitions
  - Added `thumbnail` field to Question interface
  - Thumbnail type with `key` and optional `url` properties
- **Theme and Styling**: Improved UI consistency
  - Updated theme configuration
  - Enhanced component styling
  - Improved responsive design

### Fixed

- Thumbnail not displaying when URL exists but fails to load
- Thumbnail not removing instantly on question update
- Duplicate title display on homepage question cards
- Thumbnail URL resolution when only key is available
- Frontend log cleanup (removed unnecessary console logs)

### Technical Improvements

- Improved error handling for thumbnail loading failures
- Enhanced state management for thumbnail URLs
- Better TypeScript type safety
- Improved code organization and component structure
- Enhanced user experience with instant UI updates
