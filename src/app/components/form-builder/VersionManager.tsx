import { Navigate, useParams } from 'react-router';

export function VersionManager() {
  const { entityId } = useParams();
  return <Navigate to={`/settings/form-builder/${entityId ?? ''}`} replace />;
}
