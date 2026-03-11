type Props = {
  title?: string;
  children: React.ReactNode;
};

export default function ResultCard({ title, children }: Props) {
  return (
    <div className="rounded-lg border bg-zinc-50 p-4 dark:bg-zinc-900">
      {title && <p className="mb-2 text-xs font-semibold uppercase opacity-60">{title}</p>}
      <div className="text-sm whitespace-pre-wrap">{children}</div>
    </div>
  );
}
