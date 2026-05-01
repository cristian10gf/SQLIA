type PasswordVisibilityIconProps = {
  visible: boolean;
};

export function PasswordVisibilityIcon({ visible }: PasswordVisibilityIconProps) {
  if (visible) {
    return (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M3 3L21 21"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M10.58 10.58A2 2 0 0 0 12 14a2 2 0 0 0 1.42-.58"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M9.88 4.24A9.77 9.77 0 0 1 12 4c5 0 8.27 3.11 10 8a13.4 13.4 0 0 1-2.68 4.23"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M6.61 6.61C4.52 7.95 2.98 9.85 2 12c1.73 4.89 5 8 10 8a9.94 9.94 0 0 0 4.39-.99"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M2 12C3.73 7.11 7 4 12 4C17 4 20.27 7.11 22 12C20.27 16.89 17 20 12 20C7 20 3.73 16.89 2 12Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M12 15A3 3 0 1 0 12 9A3 3 0 0 0 12 15Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}