import React, { useState } from 'react';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallback?: React.ReactNode;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  alt = '',
  loading = 'lazy',
  decoding = 'async',
  width,
  height,
  fallback = null,
  onError,
  ...props
}) => {
  const [failed, setFailed] = useState(false);

  if (failed) return <>{fallback}</>;

  return (
    <img
      {...props}
      alt={alt}
      loading={loading}
      decoding={decoding}
      width={width}
      height={height}
      onError={(event) => {
        setFailed(true);
        onError?.(event);
      }}
    />
  );
};

OptimizedImage.displayName = 'OptimizedImage';
