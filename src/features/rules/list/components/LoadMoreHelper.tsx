import React, { useEffect, useRef } from 'react';
import { useIntersectionObserver } from '@react-hookz/web';

interface LoadMoreHelperProps {
  handleLoad: () => void;
}

export function LoadMoreHelper({ handleLoad }: LoadMoreHelperProps) {
  const intersectionRef = useRef<HTMLDivElement>(null);
  const intersection = useIntersectionObserver<HTMLDivElement>(intersectionRef, {
    root: null,
    threshold: [1],
  });

  useEffect(() => {
    const completelyInView = intersection && intersection.isIntersecting;
    if (completelyInView) {
      handleLoad();
    }
  }, [intersection, handleLoad]);

  return <div ref={intersectionRef} data-testid="load-more-helper" />;
}
