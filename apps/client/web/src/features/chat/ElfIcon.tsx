import { SvgIcon, SvgIconProps } from '@mui/material';

export const ElfIcon = (props: SvgIconProps) => {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      {/* Elf face with pointed ears */}
      <path
        d="M12,3c-4.97,0-9,4.03-9,9c0,3.92,2.51,7.25,6,8.5c1.01,0.36,2.04,0.53,3,0.5c0.96,0.03,1.99-0.14,3-0.5 c3.49-1.25,6-4.58,6-8.5C21,7.03,16.97,3,12,3z"
        fill="#9FE6A0"
        stroke="#1F8A4C"
        strokeWidth="1"
      />
      {/* Pointed ears */}
      <path
        d="M4,9.5L2,7l3,1L4,9.5z M20,9.5L22,7l-3,1L20,9.5z"
        fill="#9FE6A0"
        stroke="#1F8A4C"
        strokeWidth="1"
      />
      {/* Eyes */}
      <circle cx="9" cy="10" r="1.5" fill="#1F8A4C" />
      <circle cx="15" cy="10" r="1.5" fill="#1F8A4C" />
      {/* Sparkle in eyes */}
      <circle cx="9.5" cy="9.5" r="0.5" fill="white" />
      <circle cx="15.5" cy="9.5" r="0.5" fill="white" />
      {/* Cute smile */}
      <path
        d="M9,14c1,1.5,5,1.5,6,0"
        fill="none"
        stroke="#1F8A4C"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
      {/* Elf hat */}
      <path
        d="M12,3L9,1L5,2L8,3L12,3z M12,3L15,1L19,2L16,3L12,3z"
        fill="#F0C537"
        stroke="#D4A520"
        strokeWidth="0.75"
      />
      {/* Holly decoration */}
      <circle cx="12" cy="2" r="0.75" fill="#E74C3C" />
      <path
        d="M11.5,2.5L10.5,1.5 M12.5,2.5L13.5,1.5"
        stroke="#1F8A4C"
        strokeWidth="0.5"
        strokeLinecap="round"
      />
    </SvgIcon>
  );
};

export const ElfLogoIcon = (props: SvgIconProps) => {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      {/* Elf hat silhouette */}
      <path
        d="M12,2 L6,7 L7,14 L12,18 L17,14 L18,7 Z"
        fill="#1F8A4C"
        stroke="#0F5E30"
        strokeWidth="0.5"
      />
      {/* Gold trim */}
      <path d="M7.5,8 L16.5,8 L16,12 L8,12 Z" fill="#F0C537" stroke="#D4A520" strokeWidth="0.5" />
      {/* Ear points */}
      <path
        d="M7,11 L5,14 L7.5,13 Z M17,11 L19,14 L16.5,13 Z"
        fill="#9FE6A0"
        stroke="#1F8A4C"
        strokeWidth="0.5"
      />
      {/* Face silhouette */}
      <circle cx="12" cy="13" r="4" fill="#9FE6A0" stroke="#1F8A4C" strokeWidth="0.5" />
      {/* Sparkly eyes */}
      <circle cx="10.5" cy="12" r="0.8" fill="#0F5E30" />
      <circle cx="13.5" cy="12" r="0.8" fill="#0F5E30" />
      <circle cx="10.7" cy="11.7" r="0.3" fill="white" />
      <circle cx="13.7" cy="11.7" r="0.3" fill="white" />
      {/* Smile */}
      <path
        d="M10.5,14 C11.3,15 12.7,15 13.5,14"
        fill="none"
        stroke="#0F5E30"
        strokeWidth="0.75"
        strokeLinecap="round"
      />
      {/* Bell on hat tip */}
      <circle cx="12" cy="4" r="1" fill="#F0C537" stroke="#D4A520" strokeWidth="0.5" />
      {/* Holly decoration */}
      <circle cx="12" cy="8" r="0.75" fill="#E74C3C" />
      <path
        d="M11.5,8.5L10.5,7.5 M12.5,8.5L13.5,7.5"
        stroke="#1F8A4C"
        strokeWidth="0.5"
        strokeLinecap="round"
      />
    </SvgIcon>
  );
};
