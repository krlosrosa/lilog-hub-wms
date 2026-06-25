import { cn } from '@lilog/ui';

type UsuarioAvatarProps = {
  nome: string;
  avatarUrl?: string;
  className?: string;
  size?: 'sm' | 'md';
  variant?: 'default' | 'destructive' | 'tertiary' | 'primary';
};

function getInitials(nome: string) {
  return nome
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

const variantStyles = {
  default: 'border-outline-variant bg-surface-highest text-muted-foreground',
  primary: 'border-primary/30 bg-primary/20 text-primary',
  tertiary: 'border-tertiary/30 bg-tertiary/20 text-tertiary',
  destructive: 'border-destructive/30 bg-destructive/20 text-destructive',
};

export function UsuarioAvatar({
  nome,
  avatarUrl,
  className,
  size = 'md',
  variant = 'default',
}: UsuarioAvatarProps) {
  const initials = getInitials(nome);
  const sizeClass = size === 'sm' ? 'size-7 text-[10px]' : 'size-10 text-sm';

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={`Avatar de ${nome}`}
        className={cn(
          'rounded-full border border-outline-variant object-cover',
          sizeClass,
          className,
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full border font-bold',
        sizeClass,
        variantStyles[variant],
        className,
      )}
      aria-hidden
    >
      {initials}
    </div>
  );
}
