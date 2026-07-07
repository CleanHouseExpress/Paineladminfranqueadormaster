import { Navigate, useParams } from 'react-router';

export function ChangeHistory() {
  const { entityId } = useParams();
  return <Navigate to={`/settings/form-builder/${entityId ?? ''}`} replace />;
}
