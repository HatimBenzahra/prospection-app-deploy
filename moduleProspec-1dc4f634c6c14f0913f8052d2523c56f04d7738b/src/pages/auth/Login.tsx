import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui-admin/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui-admin/card';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = (role: 'admin' | 'manager' | 'directeur' | 'backoffice' | 'commercial') => {
    login(role);
    navigate('/'); // On redirige vers la racine, qui s'occupera de dispatcher vers le bon dashboard
  };

  return (
    <div className="flex items-center justify-center h-screen bg-secondary">
      <Card className="w-[400px]">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Finanssor</CardTitle>
          <CardDescription>Veuillez vous connecter en choisissant un rôle.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Button className="bg-green-600 text-white hover:bg-green-700" onClick={() => handleLogin('admin')}>Connexion Admin</Button>
          <Button variant="outline" onClick={() => handleLogin('manager')}>Connexion Manager</Button>
          <Button variant="outline" onClick={() => handleLogin('directeur')}>Connexion Directeur</Button>
          <Button variant="outline" onClick={() => handleLogin('backoffice')}>Connexion Back-office</Button>
          <Button variant="outline" onClick={() => handleLogin('commercial')}>Connexion Commercial</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;