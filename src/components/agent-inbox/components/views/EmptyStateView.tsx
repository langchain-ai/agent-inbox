interface EmptyStateViewProps {
  // Component might be extended with additional props in the future
}

export function EmptyStateView({}: EmptyStateViewProps) {
  return <div className="p-6 text-gray-500">No state found</div>;
}
