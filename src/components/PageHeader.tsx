type Props = {
  title: string;
  description: string;
};

export default function PageHeader({ title, description }: Props) {
  return (
    <header className="mb-6">
      <h1 className="text-xl font-semibold">{title}</h1>
      <p className="text-sm opacity-70">{description}</p>
    </header>
  );
}
