interface NonInterruptedDescriptionViewProps {
  // Component might be extended with additional props in the future
}

export function NonInterruptedDescriptionView({}: NonInterruptedDescriptionViewProps) {
  return (
    <div className="pt-6 pb-2 w-full">
      <p className="text-sm text-gray-500 italic">
        This thread has no additional description.
      </p>
    </div>
  );
}
