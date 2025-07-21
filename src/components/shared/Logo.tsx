interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function Logo({ className = '', size = 'md' }: LogoProps) {
  // Logo configuration - can be customized via environment variables
  const logoUrl = import.meta.env.VITE_LOGO_URL || "/logo.png";
  const logoAlt = import.meta.env.VITE_LOGO_ALT || "Q-Matrix Logo";

  // Size classes
  const sizeClasses = {
    sm: 'h-8',
    md: 'h-10', 
    lg: 'h-12'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-xl'
  };

  return (
    <div className={`relative ${className}`}>
      <img
        src={logoUrl}
        alt={logoAlt}
        className={`${sizeClasses[size]} w-auto object-contain`}
        onError={(e) => {
          // Fallback to text if image fails to load
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          const fallback = target.nextElementSibling as HTMLElement;
          if (fallback) fallback.style.display = 'block';
        }}
      />
      {/* Fallback text logo */}
      <div 
        className={`hidden font-bold text-primary dark:text-white ${textSizeClasses[size]}`}
        style={{ display: 'none' }}
      >
        Q-Matrix
      </div>
    </div>
  );
} 