import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const RoleBasedRedirect = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" />;
  }
  
  // En fonction du rôle de l'utilisateur, on le redirige vers le bon dashboard
  switch (user.role) {
    case 'admin':
      return <Navigate to="/admin" />; // Cette route existe
    case 'manager':
      return <Navigate to="/manager" />; // Cette route existe
    case 'directeur':
      return <Navigate to="/directeur" />; // Cette route existe
    case 'backoffice':
      return <Navigate to="/backoffice" />; // Cette route existe
    case 'commercial':
      return <Navigate to="/commercial" />; // Cette route existe
    default:
      return <Navigate to="/login" />;
  }
  //
};

export default RoleBasedRedirect;