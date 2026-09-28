export const getFriendlyErrorMessage = (error: any) => {
  const message = error?.message || String(error);
  if (message.includes("permission-denied") || message.includes("insufficient permissions")) {
    return "You don't have permission to perform this action.";
  }
  if (message.includes("not-found")) {
    return "The requested record was not found.";
  }
  if (message.includes("unavailable")) {
    return "The service is currently unavailable. Please check your internet connection.";
  }
  if (message.includes("quota-exceeded")) {
    return "Storage quota exceeded. Please try again later.";
  }
  return "An unexpected error occurred. Please try again.";
};
