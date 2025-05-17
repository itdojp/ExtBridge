import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Paper, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemSecondaryAction,
  IconButton, 
  Divider, 
  CircularProgress,
  Button,
  TextField,
  InputAdornment,
  Box
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import SearchIcon from '@material-ui/icons/Search';
import StarIcon from '@material-ui/icons/Star';
import CodeIcon from '@material-ui/icons/Code';
import VisibilityIcon from '@material-ui/icons/Visibility';
import GitHubIcon from '@material-ui/icons/GitHub';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import { Link } from 'react-router-dom';

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
    padding: theme.spacing(3),
  },
  title: {
    marginBottom: theme.spacing(3),
  },
  paper: {
    padding: theme.spacing(2),
  },
  search: {
    marginBottom: theme.spacing(3),
  },
  listItem: {
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    padding: theme.spacing(4),
  },
  repoName: {
    fontWeight: 'bold',
  },
  repoDescription: {
    color: theme.palette.text.secondary,
  },
  repoStats: {
    display: 'flex',
    alignItems: 'center',
    '& > *': {
      marginRight: theme.spacing(2),
      display: 'flex',
      alignItems: 'center',
    },
    '& svg': {
      marginRight: theme.spacing(0.5),
    },
  },
  backButton: {
    marginBottom: theme.spacing(2),
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: theme.spacing(3),
  },
  githubIcon: {
    fontSize: 32,
    marginRight: theme.spacing(2),
  },
}));

const GitHubRepositories = () => {
  const classes = useStyles();
  const [loading, setLoading] = useState(true);
  const [repositories, setRepositories] = useState([]);
  const [filteredRepos, setFilteredRepos] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    // GitHubリポジトリ一覧を取得
    const fetchRepositories = async () => {
      try {
        const response = await fetch('/api/services/github/repositories', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (!response.ok) {
          throw new Error('リポジトリの取得に失敗しました');
        }
        
        const data = await response.json();
        
        if (data.status === 'success') {
          setRepositories(data.data.repositories);
          setFilteredRepos(data.data.repositories);
        } else {
          throw new Error(data.message || 'リポジトリの取得に失敗しました');
        }
      } catch (error) {
        console.error('GitHubリポジトリ取得エラー:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRepositories();
  }, []);

  // 検索処理
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredRepos(repositories);
    } else {
      const filtered = repositories.filter(repo => 
        repo.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (repo.description && repo.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredRepos(filtered);
    }
  }, [searchTerm, repositories]);

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  if (loading) {
    return (
      <div className={classes.loading}>
        <CircularProgress />
      </div>
    );
  }

  if (error) {
    return (
      <Container className={classes.root}>
        <Button 
          component={Link} 
          to="/dashboard" 
          startIcon={<ArrowBackIcon />}
          className={classes.backButton}
        >
          ダッシュボードに戻る
        </Button>
        <Paper className={classes.paper}>
          <Typography variant="h6" color="error" gutterBottom>
            エラーが発生しました
          </Typography>
          <Typography variant="body1">
            {error}
          </Typography>
          <Typography variant="body2" color="textSecondary" style={{ marginTop: 16 }}>
            GitHubとの連携が切れている可能性があります。ダッシュボードから再連携してください。
          </Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <Container className={classes.root}>
      <Button 
        component={Link} 
        to="/dashboard" 
        startIcon={<ArrowBackIcon />}
        className={classes.backButton}
      >
        ダッシュボードに戻る
      </Button>
      
      <div className={classes.header}>
        <GitHubIcon className={classes.githubIcon} />
        <Typography variant="h4" className={classes.title}>
          GitHubリポジトリ
        </Typography>
      </div>
      
      <TextField
        className={classes.search}
        variant="outlined"
        fullWidth
        placeholder="リポジトリを検索..."
        value={searchTerm}
        onChange={handleSearchChange}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
      />
      
      <Paper className={classes.paper}>
        {filteredRepos.length === 0 ? (
          <Typography variant="body1" align="center" style={{ padding: 16 }}>
            リポジトリが見つかりません
          </Typography>
        ) : (
          <List>
            {filteredRepos.map((repo, index) => (
              <React.Fragment key={repo.id}>
                <ListItem 
                  className={classes.listItem}
                  button
                  component={Link}
                  to={`/github/repositories/${repo.owner.login}/${repo.name}`}
                >
                  <ListItemText
                    primary={
                      <Typography className={classes.repoName}>
                        {repo.name}
                      </Typography>
                    }
                    secondary={
                      <>
                        <Typography className={classes.repoDescription} component="span" variant="body2">
                          {repo.description || 'No description'}
                        </Typography>
                        <Box mt={1} className={classes.repoStats}>
                          <span>
                            <StarIcon fontSize="small" />
                            {repo.stargazers_count}
                          </span>
                          <span>
                            <CodeIcon fontSize="small" />
                            {repo.language || 'Unknown'}
                          </span>
                          <span>
                            <VisibilityIcon fontSize="small" />
                            {repo.visibility}
                          </span>
                        </Box>
                      </>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton edge="end" aria-label="open in github" href={repo.html_url} target="_blank">
                      <GitHubIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
                {index < filteredRepos.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}
      </Paper>
    </Container>
  );
};

export default GitHubRepositories;
