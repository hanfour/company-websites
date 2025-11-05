import Link from 'next/link';

interface SeeMoreButtonProps {
  href: string;
  text?: string;
  className?: string;
}

export default function SeeMoreButton({
  href,
  text = 'see more',
  className = ''
}: SeeMoreButtonProps) {
  return (
    <Link href={href} className={`btn-seeMore ${className}`}>
      <div className="line-horizontal"></div>
      <span className="text">{text}</span>
      <span>&gt;</span>
    </Link>
  );
}
