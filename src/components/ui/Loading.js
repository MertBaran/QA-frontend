import { Box, CircularProgress, Typography, Backdrop, Fade } from "@mui/material";

// Basic Loading Component
const Loading = ({ message = "Loading...", size = "medium" }) => {
  const getSize = () => {
    switch (size) {
      case "small": return 24;
      case "large": return 60;
      default: return 40;
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "200px",
        gap: 2,
      }}
    >
      <CircularProgress size={getSize()} />
      <Typography variant="body2" color="text.secondary">
        {message}
      </Typography>
    </Box>
  );
};

// Full Screen Loading
export const FullScreenLoading = ({ message = "Loading application..." }) => {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        gap: 2,
      }}
    >
      <CircularProgress size={60} />
      <Typography variant="h6" color="text.secondary">
        {message}
      </Typography>
    </Box>
  );
};

// Overlay Loading
export const OverlayLoading = ({ open = false, message = "Loading..." }) => {
  return (
    <Backdrop
      sx={{
        color: '#fff',
        zIndex: (theme) => theme.zIndex.drawer + 1,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}
      open={open}
    >
      <CircularProgress color="inherit" />
      <Typography variant="body1" color="inherit">
        {message}
      </Typography>
    </Backdrop>
  );
};

// Inline Loading
export const InlineLoading = ({ message = "Loading...", size = "small" }) => {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        py: 1,
      }}
    >
      <CircularProgress size={size === "small" ? 16 : 20} />
      <Typography variant="body2" color="text.secondary">
        {message}
      </Typography>
    </Box>
  );
};

// Button Loading
export const ButtonLoading = ({ size = 20 }) => {
  return <CircularProgress size={size} color="inherit" />;
};

// Page Loading with Fade
export const PageLoading = ({ message = "Loading page...", show = true }) => {
  return (
    <Fade in={show}>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "400px",
          gap: 2,
        }}
      >
        <CircularProgress size={50} />
        <Typography variant="body1" color="text.secondary">
          {message}
        </Typography>
      </Box>
    </Fade>
  );
};

export default Loading;
