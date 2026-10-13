// Images from HoYoLAB's CDN. External and already sized by HoYoLAB, so a plain img
// rather than next/image (which would need every CDN host allow-listed).
export function RemoteImage({
  src,
  alt = "",
  className,
}: {
  src: string;
  alt?: string;
  className?: string;
}) {
  if (!src) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} referrerPolicy="no-referrer" loading="lazy" className={className} />
  );
}
