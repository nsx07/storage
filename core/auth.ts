export function validateTokenProvider(token: string) {
  if (!token) {
    return {
      success: false,
      code: "Unauthorized",
      message: "Token is missing",
    };
  }

  if (token != process.env.STORAGE_TOKEN) {
    return {
      success: false,
      code: "Unauthorized",
      message: "Token is invalid",
    };
  }

  return { success: true, code: "Unauthorized", message: "Token validated" };
}
