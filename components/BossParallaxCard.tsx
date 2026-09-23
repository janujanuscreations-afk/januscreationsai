import React, { useEffect, useRef, useState } from 'react';

interface BossParallaxCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  maxRotateX?: number; // Maximum tilt angle on X-axis in degrees
  maxRotateY?: number; // Maximum tilt angle on Y-axis in degrees
  maxTranslateZ?: number; // Depth push in pixels
  maxTranslateY?: number; // Parallax vertical drift in pixels
  glowColor?: string;
  enableMouseTilt?: boolean;
}

/**
 * BossParallaxCard
 * Provides a dynamic scroll-triggered 3D parallax effect:
 * As the user scrolls past the card, it calculates its relative position
 * to the viewport center and rotates on X/Y axes, drifts in Y, and pushes outward on the Z-axis.
 */
export const BossParallaxCard: React.FC<BossParallaxCardProps> = ({
  children,
  className = '',
  maxRotateX = 6,
  maxRotateY = 4,
  maxTranslateZ = 30,
  maxTranslateY = 15,
  glowColor = 'rgba(0, 245, 212, 0.25)',
  enableMouseTilt = true,
  style = {},
  ...props
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transformStyle, setTransformStyle] = useState<string>('perspective(1200px) rotateX(0deg) rotateY(0deg) translateZ(0px) translateY(0px)');
  const [glarePosition, setGlarePosition] = useState<{ x: number; y: number; opacity: number }>({ x: 50, y: 50, opacity: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const mouseCoords = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    let rafId: number;
    let isIntersecting = false;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isIntersecting = entry.isIntersecting;
          if (isIntersecting) {
            updateParallax();
          }
        });
      },
      { threshold: [0, 0.25, 0.5, 0.75, 1], rootMargin: '100px 0px 100px 0px' }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    const updateParallax = () => {
      if (!cardRef.current || (!isIntersecting && !isHovered)) return;

      const rect = cardRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight || document.documentElement.clientHeight;
      
      // Calculate normalized progress from -1 (above viewport) to 1 (below viewport)
      // 0 is perfectly centered in viewport
      const cardCenterY = rect.top + rect.height / 2;
      const viewportCenterY = windowHeight / 2;
      const distanceFromCenter = (cardCenterY - viewportCenterY) / (windowHeight / 2);
      
      // Clamp between -1.2 and 1.2
      const clampedDist = Math.max(-1.2, Math.min(1.2, distanceFromCenter));

      // Scroll-driven transforms:
      // When scrolling down, top cards tilt slightly backward (negative rotateX), bottom cards tilt forward
      const scrollRotateX = -clampedDist * maxRotateX;
      // Slight alternating perspective skew based on position
      const scrollRotateY = Math.sin(clampedDist * Math.PI) * (maxRotateY * 0.75);
      // Peak depth at center of screen
      const centerFactor = 1 - Math.min(1, Math.abs(clampedDist));
      const scrollTranslateZ = centerFactor * maxTranslateZ;
      const scrollTranslateY = clampedDist * -maxTranslateY;

      if (isHovered && enableMouseTilt) {
        // Blend scroll parallax with interactive cursor tilt
        const mouseTiltX = (mouseCoords.current.y - 0.5) * -12;
        const mouseTiltY = (mouseCoords.current.x - 0.5) * 12;
        const combinedX = scrollRotateX * 0.4 + mouseTiltX;
        const combinedY = scrollRotateY * 0.4 + mouseTiltY;
        const hoverZ = scrollTranslateZ + 15;

        setTransformStyle(
          `perspective(1200px) rotateX(${combinedX.toFixed(2)}deg) rotateY(${combinedY.toFixed(2)}deg) translateZ(${hoverZ.toFixed(1)}px) translateY(${scrollTranslateY.toFixed(1)}px) scale3d(1.02, 1.02, 1.02)`
        );
      } else {
        setTransformStyle(
          `perspective(1200px) rotateX(${scrollRotateX.toFixed(2)}deg) rotateY(${scrollRotateY.toFixed(2)}deg) translateZ(${scrollTranslateZ.toFixed(1)}px) translateY(${scrollTranslateY.toFixed(1)}px)`
        );
        // Dynamic glare position based on scroll
        setGlarePosition({
          x: 50 + scrollRotateY * 5,
          y: Math.max(10, Math.min(90, 50 - clampedDist * 30)),
          opacity: 0.12 + centerFactor * 0.15
        });
      }
    };

    const handleScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(updateParallax);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    // Also trigger on initial mount
    updateParallax();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(rafId);
      if (cardRef.current) {
        observer.unobserve(cardRef.current);
      }
      observer.disconnect();
    };
  }, [maxRotateX, maxRotateY, maxTranslateZ, maxTranslateY, isHovered, enableMouseTilt]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || !enableMouseTilt) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    mouseCoords.current = { x, y };
    setGlarePosition({
      x: x * 100,
      y: y * 100,
      opacity: 0.35
    });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    mouseCoords.current = { x: 0.5, y: 0.5 };
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: transformStyle,
        transformStyle: 'preserve-3d',
        transition: isHovered 
          ? 'transform 0.15s ease-out, box-shadow 0.3s ease' 
          : 'transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.4s ease',
        willChange: 'transform',
        ...style
      }}
      className={`relative group ${className}`}
      {...props}
    >
      {/* Dynamic 3D Glare / Holographic Light Sheen */}
      <div
        className="pointer-events-none absolute inset-0 rounded-[inherit] overflow-hidden transition-opacity duration-300 z-20"
        style={{
          opacity: glarePosition.opacity,
          background: `radial-gradient(circle 350px at ${glarePosition.x}% ${glarePosition.y}%, ${glowColor} 0%, transparent 80%)`,
        }}
      />
      
      {/* Card Content with 3D Depth Isolation */}
      <div className="relative z-10 w-full h-full" style={{ transform: 'translateZ(10px)' }}>
        {children}
      </div>
    </div>
  );
};

export default BossParallaxCard;
