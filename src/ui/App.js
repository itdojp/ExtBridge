import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Switch, Redirect } from 'react-router-dom';
import { ThemeProvider, createMuiTheme } from '@material-ui/core/styles';
import CssBaseline from '@material-ui/core/CssBaseline';
import { blue, pink } from '@material-ui/core/colors';

// コンポーネントのインポート
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import GitHubRepositories from './pages/GitHubRepositories';
import FigmaProjects from './pages/FigmaProjects';
import SlackChannels from './pages/SlackChannels';

// テーマの設定
const theme = createMuiTheme({
  palette: {
    primary: blue,
    secondary: pink,
  },
  typography: {
    fontFamily: [
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
  },
});

// 認証済みルートコンポーネント
const PrivateRoute = ({ component: Component, authenticated, ...rest }) => (
  <Route
    {...rest}
    render={(props) =>
      authenticated ? (
        <Component {...props} />
      ) : (
        <Redirect to={{ pathname: '/login', state: { from: props.location } }} />
      )
    }
  />
);

const App = () => {
  const [authenticated, setAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // トークンの検証とユーザー情報の取得
    const verifyToken = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setLoading(false);
        return;
      }
      
      try {
        const response = await fetch('/auth/verify', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
          setAuthenticated(true);
        } else {
          // トークンが無効な場合、ローカルストレージから削除
          localStorage.removeItem('token');
        }
      } catch (error) {
        console.error('認証エラー:', error);
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };
    
    verifyToken();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setAuthenticated(false);
    setUser(null);
    window.location.href = '/login';
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Header user={user} onLogout={handleLogout} />
        <Switch>
          <Route exact path="/" render={() => <Redirect to="/dashboard" />} />
          <Route path="/login" render={(props) => authenticated ? <Redirect to="/dashboard" /> : <div>Login Page</div>} />
          <PrivateRoute path="/dashboard" component={Dashboard} authenticated={authenticated} />
          <PrivateRoute path="/github/repositories" component={GitHubRepositories} authenticated={authenticated} />
          <PrivateRoute path="/figma/projects" component={FigmaProjects} authenticated={authenticated} />
          <PrivateRoute path="/slack/channels" component={SlackChannels} authenticated={authenticated} />
          <Route path="*" render={() => <div>404 Not Found</div>} />
        </Switch>
      </Router>
    </ThemeProvider>
  );
};

export default App;
