interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeMap = {
  sm: 'w-5 h-5',
  md: 'w-8 h-8',
  lg: 'w-10 h-10',
  xl: 'w-16 h-16',
};

export function Logo({ className = '', size = 'md' }: LogoProps) {
  return (
    <img
      src="/favicon.svg"
      alt="Dev Dynasty Universal AI Logo"
      className={`object-contain transition-transform duration-200 hover:scale-105 ${sizeMap[size]} ${className}`}
      loading="eager"
    />
  );
}

export default Logo;
