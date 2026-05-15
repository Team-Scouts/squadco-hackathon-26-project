type IconBadgeProps = {
  children: React.ReactNode;
};

export default function IconBadge({ children }: IconBadgeProps) {
  return <span className="tile-icon">{children}</span>;
}
