import defaultLogoImg from '../../assets/images/ignition_event_logo_1795447122656.jpg';

export function EventLogo({
  eventName,
  className = 'h-14 w-14',
}: {
  eventName: string;
  className?: string;
}) {
  return (
    <div
      className={`overflow-hidden rounded-full border-2 border-[#1b1b1b] bg-[#fffaf0] shadow-[3px_3px_0_0_#1b1b1b] shrink-0 ${className}`}
    >
      <img
        src={defaultLogoImg}
        alt={`${eventName} Official Logo`}
        className="h-full w-full object-cover"
      />
    </div>
  );
}
