// Supabase 오류를 친근한 한국어 안내로 바꿔 줘요

export function authErrorMessage(error: { message?: string; code?: string } | null): string {
  if (!error) return "";
  const code = error.code ?? "";
  const msg = error.message ?? "";
  if (code === "invalid_credentials" || msg.includes("Invalid login credentials"))
    return "이메일이나 비밀번호를 다시 확인해 주세요.";
  if (code === "user_already_exists" || msg.includes("already registered"))
    return "이미 가입된 이메일이에요. 로그인해 주세요.";
  if (code === "weak_password" || msg.toLowerCase().includes("password should be"))
    return "비밀번호는 6자 이상으로 해 주세요.";
  if (code === "email_address_invalid" || (msg.toLowerCase().includes("invalid") && msg.toLowerCase().includes("email")))
    return "이메일 주소를 다시 확인해 주세요.";
  if (code === "over_request_rate_limit" || code === "over_email_send_rate_limit")
    return "잠시 후에 다시 시도해 주세요.";
  return "문제가 생겼어요. 잠시 후 다시 시도해 주세요.";
}

export function familyErrorMessage(error: { message?: string; code?: string } | null): string {
  if (!error) return "";
  const msg = error.message ?? "";
  if (msg.includes("invalid_code")) return "코드를 다시 확인해 주세요.";
  if (msg.includes("already_member")) return "이미 이 가족방에 참여했어요.";
  if (msg.includes("already_in_family")) return "이미 다른 가족방에 들어가 있어요.";
  if (msg.includes("not_logged_in")) return "로그인이 풀렸어요. 다시 로그인해 주세요.";
  if (error.code === "23514") return "이름 길이를 확인해 주세요.";
  return "문제가 생겼어요. 잠시 후 다시 시도해 주세요.";
}
