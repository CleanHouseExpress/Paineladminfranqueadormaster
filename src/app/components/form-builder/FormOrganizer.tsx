import { Navigate, useParams } from 'react-router';

export function FormOrganizer() {
  const { entityId } = useParams();
  return <Navigate to={`/settings/form-builder/${entityId ?? ''}`} replace />;
}
