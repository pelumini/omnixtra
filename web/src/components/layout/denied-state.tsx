type DeniedStateProps = {
  description: string;
  title: string;
};

export function DeniedState({ description, title }: DeniedStateProps) {
  return (
    <section className="mx-auto w-full max-w-md px-6 py-24 text-center">
      <h1 className="text-lg font-semibold text-[var(--foreground)]">{title}</h1>
      <p className="mt-2 text-sm text-slate-500">{description}</p>
    </section>
  );
}
