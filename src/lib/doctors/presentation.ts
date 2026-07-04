export function getDoctorInitials(name: string) {
  const words = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (!words.length) {
    return "AV";
  }

  return words.map((word) => word.charAt(0).toUpperCase()).join("");
}
