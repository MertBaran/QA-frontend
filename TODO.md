# TODO List

## Frontend Issues

### Profile Edit Modal Z-Index Problem

- **Issue**: "Name" label in edit profile modal is only half visible, appears to be cut off by the modal title
- **Location**: `QA-frontend/src/pages/user/Profile.tsx` - Edit Profile Dialog
- **Status**: 🔴 **URGENT** - User cannot see the full "Ad Soyad" label
- **Attempted Solutions**:
  - Increased Dialog z-index to 99999
  - Added margin to DialogTitle (mb: 4)
  - Tried aggressive z-index approach (didn't work)
  - Simplified to basic spacing (still not working)
- **Next Steps**:
  - Investigate MUI Dialog's internal z-index system
  - Try different approach: maybe use a custom modal or adjust DialogTitle height
  - Check if there are conflicting CSS rules from other components

## Backend Issues

## General Improvements

## Completed Tasks
