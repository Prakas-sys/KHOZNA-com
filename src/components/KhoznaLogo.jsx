import React from "react";

export default function KhoznaLogo({
  size = 240,
  ...props
}) {
  return (
    <img
      src="/logo.jpg"
      alt="Khozna Logo"
      style={{ width: size, height: size, objectFit: 'contain' }}
      {...props}
    />
  );
}
