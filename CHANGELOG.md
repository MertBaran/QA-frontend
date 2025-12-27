# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
