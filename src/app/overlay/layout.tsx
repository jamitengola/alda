export default function OverlayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Overlay uses its own minimal layout — no sidebar, no header
  return <div className="bg-transparent overflow-hidden h-screen">{children}</div>;
}
