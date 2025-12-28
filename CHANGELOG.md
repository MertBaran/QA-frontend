# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
