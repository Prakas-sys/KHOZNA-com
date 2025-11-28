import React from "react";

export default function KhoznaLogo({
  size = 480,
  ...props
}) {
  return (
    <img
      src="/logo.png"
      alt="Khozna Logo"
      style={{ width: size, height: size, objectFit: 'contain' }}
      {...props}
    />
  );
}
