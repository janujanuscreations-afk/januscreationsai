
import React, { useEffect, useRef, useState } from 'react';

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  delayClass?: string;
  threshold?: number;
  once?: boolean;
}

const Reveal: React.FC<RevealProps> = ({ 
  children, 
  className = "", 
  delayClass = "", 
  threshold = 0.1,
  once = true 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const domRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once && domRef.current) observer.unobserve(domRef.current);
        } else if (!once) {
          setIsVisible(false);
        }
      });
    }, { threshold });

    if (domRef.current) {
      observer.observe(domRef.current);
    }

    return () => {
      if (domRef.current) observer.unobserve(domRef.current);
    };
  }, [threshold, once]);

  return (
    <div
      ref={domRef}
      className={`reveal ${isVisible ? 'reveal-visible' : ''} ${delayClass} ${className}`}
    >
      {children}
    </div>
  );
};

export default Reveal;
