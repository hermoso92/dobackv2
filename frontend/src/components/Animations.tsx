import { Box, keyframes } from '@mui/material';
import React, { ReactNode, useEffect, useState } from 'react';

// Definir keyframes para diferentes animaciones
const slideInFromBottom = keyframes`
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const slideInFromTop = keyframes`
  from {
    opacity: 0;
    transform: translateY(-30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const slideInFromLeft = keyframes`
  from {
    opacity: 0;
    transform: translateX(-30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

const slideInFromRight = keyframes`
  from {
    opacity: 0;
    transform: translateX(30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

const scaleIn = keyframes`
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
`;

const bounceIn = keyframes`
  0% {
    opacity: 0;
    transform: scale(0.3);
  }
  50% {
    opacity: 1;
    transform: scale(1.05);
  }
  70% {
    transform: scale(0.9);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
`;

const pulse = keyframes`
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
`;

const shimmer = keyframes`
  0% {
    background-position: -200px 0;
  }
  100% {
    background-position: calc(200px + 100%) 0;
  }
`;

// Mapeo de animaciones
const animations = {
  slideInFromBottom,
  slideInFromTop,
  slideInFromLeft,
  slideInFromRight,
  fadeIn,
  scaleIn,
  bounceIn,
  pulse,
  shimmer
};

interface StaggeredAnimationProps {
  children: ReactNode;
  animation: keyof typeof animations;
  duration?: number;
  delay?: number;
  staggerDelay?: number;
  trigger?: boolean;
  className?: string;
}

export const StaggeredAnimation: React.FC<StaggeredAnimationProps> = ({
  children,
  animation,
  duration = 0.6,
  delay = 0,
  staggerDelay = 0.1,
  trigger = true,
  className
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (trigger) {
      const timer = setTimeout(() => setIsVisible(true), delay * 1000);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [trigger, delay]);

  const childrenArray = React.Children.toArray(children);

  return (
    <Box className={className}>
      {childrenArray.map((child, index) => (
        <Box
          key={index}
          sx={{
            animation: isVisible
              ? `${animations[animation]} ${duration}s ease-out forwards`
              : 'none',
            animationDelay: `${(delay + index * staggerDelay)}s`,
            opacity: isVisible ? 1 : 0
          }}
        >
          {child}
        </Box>
      ))}
    </Box>
  );
};

interface FadeInProps {
  children: ReactNode;
  duration?: number;
  delay?: number;
  trigger?: boolean;
}

export const FadeIn: React.FC<FadeInProps> = ({
  children,
  duration = 0.5,
  delay = 0,
  trigger = true
}) => {
  return (
    <StaggeredAnimation
      animation="fadeIn"
      duration={duration}
      delay={delay}
      trigger={trigger}
    >
      {children}
    </StaggeredAnimation>
  );
};

interface SlideInProps {
  children: ReactNode;
  direction?: 'up' | 'down' | 'left' | 'right';
  duration?: number;
  delay?: number;
  trigger?: boolean;
}

export const SlideIn: React.FC<SlideInProps> = ({
  children,
  direction = 'up',
  duration = 0.6,
  delay = 0,
  trigger = true
}) => {
  const animationMap = {
    up: 'slideInFromBottom',
    down: 'slideInFromTop',
    left: 'slideInFromRight',
    right: 'slideInFromLeft'
  } as const;

  return (
    <StaggeredAnimation
      animation={animationMap[direction]}
      duration={duration}
      delay={delay}
      trigger={trigger}
    >
      {children}
    </StaggeredAnimation>
  );
};

interface ScaleInProps {
  children: ReactNode;
  duration?: number;
  delay?: number;
  trigger?: boolean;
}

export const ScaleIn: React.FC<ScaleInProps> = ({
  children,
  duration = 0.5,
  delay = 0,
  trigger = true
}) => {
  return (
    <StaggeredAnimation
      animation="scaleIn"
      duration={duration}
      delay={delay}
      trigger={trigger}
    >
      {children}
    </StaggeredAnimation>
  );
};

interface BounceInProps {
  children: ReactNode;
  duration?: number;
  delay?: number;
  trigger?: boolean;
}

export const BounceIn: React.FC<BounceInProps> = ({
  children,
  duration = 0.8,
  delay = 0,
  trigger = true
}) => {
  return (
    <StaggeredAnimation
      animation="bounceIn"
      duration={duration}
      delay={delay}
      trigger={trigger}
    >
      {children}
    </StaggeredAnimation>
  );
};

interface PulseProps {
  children: ReactNode;
  duration?: number;
  iterations?: number | 'infinite';
}

export const Pulse: React.FC<PulseProps> = ({
  children,
  duration = 1,
  iterations = 'infinite'
}) => {
  return (
    <Box
      sx={{
        animation: `${pulse} ${duration}s ease-in-out ${iterations}`
      }}
    >
      {children}
    </Box>
  );
};

interface ShimmerProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
}

export const Shimmer: React.FC<ShimmerProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 4
}) => {
  return (
    <Box
      sx={{
        width,
        height,
        borderRadius,
        background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
        backgroundSize: '200px 100%',
        animation: `${shimmer} 1.5s infinite`,
        opacity: 0.7
      }}
    />
  );
};

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  delay?: number;
  format?: (value: number) => string;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  duration = 1,
  delay = 0,
  format = (val) => val.toString()
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay * 1000);
    return () => clearTimeout(timer);
  }, [delay]);

  useEffect(() => {
    if (!isVisible) return;

    const startTime = Date.now();
    const startValue = displayValue;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / (duration * 1000), 1);

      // Easing function (ease-out)
      const easedProgress = 1 - Math.pow(1 - progress, 3);

      const currentValue = Math.round(startValue + (value - startValue) * easedProgress);
      setDisplayValue(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [isVisible, value, duration, displayValue]);

  return <span>{format(displayValue)}</span>;
};

interface LoadingDotsProps {
  count?: number;
  duration?: number;
}

export const LoadingDots: React.FC<LoadingDotsProps> = ({
  count = 3,
  duration = 1
}) => {
  return (
    <Box sx={{ display: 'flex', gap: 0.5 }}>
      {Array.from({ length: count }).map((_, index) => (
        <Box
          key={index}
          sx={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: 'primary.main',
            animation: `${pulse} ${duration}s ease-in-out infinite`,
            animationDelay: `${index * 0.2}s`
          }}
        />
      ))}
    </Box>
  );
};

export default {
  StaggeredAnimation,
  FadeIn,
  SlideIn,
  ScaleIn,
  BounceIn,
  Pulse,
  Shimmer,
  AnimatedCounter,
  LoadingDots
};