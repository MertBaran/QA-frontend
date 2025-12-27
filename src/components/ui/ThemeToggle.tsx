import React, { useState, useRef, useEffect } from 'react';
import { Box } from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import { useTheme } from '@mui/material/styles';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { toggleTheme } from '../../store/theme/themeSlice';

// Gelişmiş salınım animasyonları
const naturalSwing = keyframes`
  0% { transform: rotate(-3deg) translateY(0px); }
  25% { transform: rotate(1deg) translateY(-2px); }
  50% { transform: rotate(3deg) translateY(0px); }
  75% { transform: rotate(1deg) translateY(-1px); }
  100% { transform: rotate(-3deg) translateY(0px); }
`;

const pullAnimation = keyframes`
  0% { transform: translateY(0px) scale(1) rotate(0deg); }
  25% { transform: translateY(-3px) scale(1.02) rotate(-1deg); }
  50% { transform: translateY(-5px) scale(1.05) rotate(0deg); }
  75% { transform: translateY(-3px) scale(1.02) rotate(1deg); }
  100% { transform: translateY(0px) scale(1) rotate(0deg); }
`;

const stringSwing = keyframes`
  0% { transform: rotate(-2deg); }
  50% { transform: rotate(2deg); }
  100% { transform: rotate(-2deg); }
`;

const stringHover = keyframes`
  0% { width: 3px; transform: rotate(0deg); }
  50% { width: 6px; transform: rotate(1deg); }
  100% { width: 3px; transform: rotate(0deg); }
`;

const stringPull = keyframes`
  0% { height: 25px; transform: rotate(0deg); }
  25% { height: 40px; transform: rotate(-2deg); }
  50% { height: 55px; transform: rotate(0deg); }
  75% { height: 40px; transform: rotate(2deg); }
  100% { height: 25px; transform: rotate(0deg); }
`;

const stringRelease = keyframes`
  0% { 
    height: 125px; 
    border-radius: 20px;
    transform: translateX(-50%) rotate(0deg); 
  }
  8% { 
    height: 110px; 
    border-radius: 25px;
    transform: translateX(-50%) rotate(calc(var(--swing-angle, 20deg) * 1.2)) translateY(-10px); 
  }
  20% { 
    height: 80px; 
    border-radius: 30px;
    transform: translateX(-50%) rotate(calc(var(--swing-angle, 20deg) * -0.8)) translateY(-5px); 
  }
  35% { 
    height: 50px; 
    border-radius: 25px;
    transform: translateX(-50%) rotate(calc(var(--swing-angle, 20deg) * 0.6)) translateY(-2px); 
  }
  50% { 
    height: 35px; 
    border-radius: 20px;
    transform: translateX(-50%) rotate(calc(var(--swing-angle, 20deg) * -0.4)) translateY(0px); 
  }
  65% { 
    height: 30px; 
    border-radius: 15px;
    transform: translateX(-50%) rotate(calc(var(--swing-angle, 20deg) * 0.2)) translateY(0px); 
  }
  80% { 
    height: 27px; 
    border-radius: 10px;
    transform: translateX(-50%) rotate(calc(var(--swing-angle, 20deg) * -0.1)) translateY(0px); 
  }
  90% { 
    height: 26px; 
    border-radius: 5px;
    transform: translateX(-50%) rotate(calc(var(--swing-angle, 20deg) * 0.05)) translateY(0px); 
  }
  100% { 
    height: 25px; 
    border-radius: 1.5px;
    transform: translateX(-50%) rotate(0deg) translateY(0px); 
  }
`;

const ThemeToggleContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  cursor: 'pointer',
  userSelect: 'none',
  transition: 'all 0.3s ease',
  padding: '10px',
  '&:hover': {
    transform: 'scale(1.02)',
  },
}));

const BulbContainer = styled(Box, {
  shouldForwardProp: (prop) =>
    prop !== 'isPulling' && prop !== 'isDragging' && prop !== 'themeName',
})<{
  isPulling: boolean;
  isDragging: boolean;
  themeName: 'molume' | 'papirus' | 'magnefite';
}>(({ theme, isPulling, isDragging, themeName }) => {
  const isDark = theme.palette.mode === 'dark';
  const baseStyles = {
    background: isDark
      ? 'linear-gradient(135deg, #FFB800 0%, #FF8F00 100%)'
      : 'linear-gradient(135deg, #FFD54F 0%, #FFB800 100%)',
    boxShadow: isDark
      ? '0 0 20px rgba(255, 184, 0, 0.4)'
      : '0 0 10px rgba(255, 184, 0, 0.2)',
  };

  const papirusStyles = {
    background: isDark
      ? 'linear-gradient(135deg, #C28C45 0%, #8B6F47 100%)'
      : 'linear-gradient(135deg, #E2B273 0%, #BA8A55 100%)',
    boxShadow: isDark
      ? '0 0 22px rgba(226, 178, 115, 0.45)'
      : '0 0 14px rgba(226, 178, 115, 0.28)',
  };

  const themeStyles = themeName === 'papirus' ? papirusStyles : baseStyles;

  return {
  position: 'relative',
  width: 50,
  height: 50,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '50%',
    background: themeStyles.background,
    boxShadow: themeStyles.boxShadow,
  transition: isDragging ? 'none' : 'all 0.3s ease',
  zIndex: 2,
  transform: isPulling 
    ? 'translateY(-5px) scale(1.05)'
    : 'translateY(0px) scale(1)',
  animation: isDragging ? 'none' : isPulling ? `${pullAnimation} 0.8s ease-in-out` : `${naturalSwing} 4s ease-in-out infinite`,
  '&:hover': {
    boxShadow: themeName === 'papirus'
      ? isDark
        ? '0 0 28px rgba(226, 178, 115, 0.6)'
        : '0 0 18px rgba(226, 178, 115, 0.4)'
      : isDark
      ? '0 0 30px rgba(255, 184, 0, 0.6)'
      : '0 0 20px rgba(255, 184, 0, 0.4)',
  },
};
});

const BulbIcon = styled('div', {
  shouldForwardProp: (prop) => prop !== 'themeName',
})<{ themeName: 'molume' | 'papirus' | 'magnefite' }>(({ theme, themeName }) => {
  const isPapirus = themeName === 'papirus';
  const outerGlow = isPapirus
    ? {
        background: 'rgba(248, 236, 218, 0.92)',
        boxShadow: '0 0 8px rgba(248, 236, 218, 0.7)',
      }
    : {
        background: 'rgba(255, 255, 255, 0.9)',
        boxShadow: '0 0 8px rgba(255, 255, 255, 0.8)',
      };
  const innerGlow = isPapirus
    ? {
        background: 'rgba(226, 178, 115, 0.8)',
        boxShadow: '0 0 5px rgba(226, 178, 115, 0.6)',
      }
    : {
        background: 'rgba(255, 184, 0, 0.8)',
        boxShadow: '0 0 4px rgba(255, 184, 0, 0.6)',
      };

  return {
  width: 30,
  height: 30,
  position: 'relative',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 20,
    height: 20,
    borderRadius: '50%',
      ...outerGlow,
  },
  '&::after': {
    content: '""',
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 10,
    height: 10,
    borderRadius: '50%',
      ...innerGlow,
  },
  };
});

const Rope = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isDragging',
})<{
  isDragging: boolean;
}>(({ theme, isDragging }) => ({
  position: 'absolute',
  top: -20,
  left: '50%',
  transform: 'translateX(-50%)',
  width: 2,
  height: 20,
  background: 'linear-gradient(to bottom, #8B4513 0%, #A0522D 50%, #8B4513 100%)',
  borderRadius: '1px',
  animation: isDragging ? 'none' : `${stringSwing} 3s ease-in-out infinite`,
  zIndex: 1,
  transition: isDragging ? 'none' : 'all 0.3s ease',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: -6,
    left: '50%',
    transform: 'translateX(-50%)',
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #8B4513 0%, #A0522D 100%)',
    border: '1px solid #654321',
  },
}));

const PullString = styled(Box, {
  shouldForwardProp: (prop) =>
    ![
      'isPulling',
      'isHovered',
      'isReleased',
      'isDragging',
      'mouseX',
      'mouseY',
    ].includes(String(prop)),
})<{
  isPulling: boolean;
  isHovered: boolean;
  isReleased: boolean;
  isDragging: boolean;
  mouseX: number;
  mouseY: number;
}>(({ theme, isPulling, isHovered, isReleased, isDragging, mouseX, mouseY }) => {
  const distance = Math.sqrt(mouseX * mouseX + mouseY * mouseY);
  // Yön hesaplaması - ipin başlangıç pozisyonuna göre
  const baseAngle = Math.atan2(25, 0) * (180 / Math.PI); // İpin başlangıç açısı (aşağı doğru)
  const currentAngle = Math.atan2(mouseY, mouseX) * (180 / Math.PI);
  const angle = currentAngle - baseAngle;
  
  // debug logs removed
  
  return {
    position: 'absolute',
    top: 50,
    left: '50%',
    width: isHovered || isDragging ? 6 : 3,
    height: isDragging ? Math.min(125, Math.max(25, distance > 20 ? distance * 0.2 : 25)) : 25,
    background: 'linear-gradient(to bottom, #D2691E 0%, #CD853F 50%, #D2691E 100%)',
    borderRadius: isDragging ? '20px' : '1.5px', // Yılan gibi kıvrılma
    cursor: isDragging ? 'grabbing' : 'grab',
    transition: isDragging ? 'none' : 'all 0.3s ease',
    animation: isDragging ? 'none' : isReleased ? `${stringRelease} var(--swing-duration, 1.5s) cubic-bezier(0.25, 0.46, 0.45, 0.94)` : isPulling ? `${stringPull} 0.8s ease-in-out` : isHovered ? `${stringHover} 1s ease-in-out infinite` : `${stringSwing} 2s ease-in-out infinite`,
    zIndex: 3,
    transformOrigin: 'top center',
    transform: isDragging 
      ? `translateX(-50%) rotate(${distance > 20 ? angle * 0.8 : 0}deg)`
      : 'translateX(-50%)',
    '--swing-angle': `${Math.min(60, Math.max(15, distance / 8))}deg`,
    '--swing-intensity': `${Math.min(1, distance / 100)}`,
    '&:hover': {
      width: 7,
      height: 35,
      borderRadius: '3.5px',
      '&::before': {
        transform: 'translateX(-50%) scale(1.2)',
      },
    },
    '&:active': {
      cursor: 'grabbing',
      width: 8,
      borderRadius: '4px',
    },
    '&::before': {
      content: '""',
      position: 'absolute',
      bottom: -4,
      left: '50%',
      transform: 'translateX(-50%)',
      width: isHovered || isDragging ? 14 : 8,
      height: 4,
      borderRadius: '2px',
      background: 'linear-gradient(135deg, #D2691E 0%, #CD853F 100%)',
      border: '1px solid #8B4513',
      transition: isDragging ? 'none' : 'all 0.3s ease',
    },
  };
});

const LightBeam = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isOn' && prop !== 'themeName',
})<{ isOn: boolean; themeName: 'molume' | 'papirus' | 'magnefite' }>(({ isOn, themeName }) => {
  const beamColor =
    themeName === 'papirus'
      ? 'rgba(226, 178, 115, 0.35)'
      : 'rgba(255, 184, 0, 0.3)';
  return {
  position: 'absolute',
  top: '100%',
  left: '50%',
  transform: 'translateX(-50%)',
  width: isOn ? 60 : 0,
  height: isOn ? 40 : 0,
  background: `linear-gradient(to bottom, ${beamColor} 0%, transparent 100%)`,
  borderRadius: '50% 50% 0 0',
  transition: 'all 0.3s ease',
  opacity: isOn ? 1 : 0,
  pointerEvents: 'none',
  zIndex: 1,
};
});

const ThemeToggle = () => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const { mode: currentMode, name: themeName } = useAppSelector((state) => state.theme);
  const [isPulling, setIsPulling] = useState(false);
  const [isOn, setIsOn] = useState(currentMode === 'dark');
  const [isHovered, setIsHovered] = useState(false);
  const [isReleased, setIsReleased] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [mouseX, setMouseX] = useState(0);
  const [mouseY, setMouseY] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsOn(currentMode === 'dark');
  }, [currentMode]);

  // Mouse pozisyonunu takip et
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current && isDragging) {
        const rect = containerRef.current.getBoundingClientRect();
        // İpin üst noktasından referans al (top: 50px)
        const stringTopX = rect.left + rect.width / 2;
        const stringTopY = rect.top + 50;
        
        setMouseX(e.clientX - stringTopX);
        setMouseY(e.clientY - stringTopY);
      }
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleMouseUp = () => {
    if (isDragging) {
      // Salınım şiddetine göre süre hesapla
      const currentDistance = Math.sqrt(mouseX * mouseX + mouseY * mouseY);
      const swingDuration = Math.min(2500, Math.max(1200, currentDistance * 4));
      
      // CSS custom property'yi set et
      if (containerRef.current) {
        containerRef.current.style.setProperty('--swing-duration', `${swingDuration}ms`);
      }
      
      setIsDragging(false);
      setIsReleased(true);
      
      // Tema değiştir
      dispatch(toggleTheme());
      setIsOn(!isOn);
      
      // Salınım animasyonu bittikten sonra released state'ini sıfırla
      setTimeout(() => {
        setIsReleased(false);
        setMouseX(0);
        setMouseY(0);
      }, swingDuration);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setIsPulling(true);
    
    // Mouse pozisyonunu hemen güncelle
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      // İpin üst noktasından referans al (top: 50px)
      const stringTopX = rect.left + rect.width / 2;
      const stringTopY = rect.top + 50;
      
      setMouseX(e.clientX - stringTopX);
      setMouseY(e.clientY - stringTopY);
    }
  };

  const handlePull = () => {
    setIsPulling(true);
    setIsOn(!isOn);
    
    // Tema değiştir
    dispatch(toggleTheme());
    
    // Animasyon süresi sonunda pulling state'ini sıfırla
    setTimeout(() => {
      setIsPulling(false);
      setIsReleased(true);
      
      // Salınım animasyonu bittikten sonra released state'ini sıfırla
      setTimeout(() => {
        setIsReleased(false);
      }, 1500);
    }, 800);
  };

  return (
    <ThemeToggleContainer 
      ref={containerRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Rope 
        isDragging={isDragging}
      />
      <BulbContainer 
        isPulling={isPulling}
        isDragging={isDragging}
        themeName={themeName}
      >
        <BulbIcon themeName={themeName} />
      </BulbContainer>
      <PullString 
        isPulling={isPulling} 
        isHovered={isHovered} 
        isReleased={isReleased}
        isDragging={isDragging}
        mouseX={mouseX}
        mouseY={mouseY}
        onMouseDown={handleMouseDown}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={!isDragging ? handlePull : undefined}
      />
      <LightBeam isOn={isOn} themeName={themeName} />
    </ThemeToggleContainer>
  );
};

export default ThemeToggle; 