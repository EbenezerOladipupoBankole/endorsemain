import logo from "../assets/images/logo-cropped.webp";

// The image is trimmed to the wordmark, so the className height is the logo's real visual height
// (e.g. h-9 in headers, h-12 in footers).
export const Logo = ({ className }: { className?: string }) => (
  <img src={logo} alt="Endorse" width={402} height={197} className={`w-auto shrink-0 object-contain ${className ?? "h-10"}`} />
);
