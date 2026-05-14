type FieldProps = {
  label: string;
  className?: string;
  children: React.ReactNode;
};

export default function Field({ label, className = "", children }: FieldProps) {
  return (
    <label className={`field ${className}`}>
      <span>{label}</span>
      {children}
    </label>
  );
}
