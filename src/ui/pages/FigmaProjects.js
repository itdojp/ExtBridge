import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Paper, 
  Grid,
  Card,
  CardContent,
  CardActions,
  CardMedia,
  Button,
  TextField,
  InputAdornment,
  CircularProgress,
  Box,
  Chip
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import SearchIcon from '@material-ui/icons/Search';
import InsertPhotoIcon from '@material-ui/icons/InsertPhoto';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import FolderIcon from '@material-ui/icons/Folder';
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
  card: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  cardMedia: {
    paddingTop: '56.25%', // 16:9
    backgroundColor: theme.palette.grey[200],
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    flexGrow: 1,
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    padding: theme.spacing(4),
  },
  backButton: {
    marginBottom: theme.spacing(2),
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: theme.spacing(3),
  },
  figmaIcon: {
    fontSize: 32,
    marginRight: theme.spacing(2),
  },
  teamChip: {
    marginTop: theme.spacing(1),
  },
  emptyIcon: {
    fontSize: 60,
    color: theme.palette.grey[400],
  },
  emptyCardContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing(4),
  },
}));

const FigmaProjects = () => {
  const classes = useStyles();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    // Figmaプロジェクト一覧を取得
    const fetchProjects = async () => {
      try {
        const response = await fetch('/api/services/figma/projects', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (!response.ok) {
          throw new Error('プロジェクトの取得に失敗しました');
        }
        
        const data = await response.json();
        
        if (data.status === 'success') {
          setProjects(data.data.projects);
          setFilteredProjects(data.data.projects);
        } else {
          throw new Error(data.message || 'プロジェクトの取得に失敗しました');
        }
      } catch (error) {
        console.error('Figmaプロジェクト取得エラー:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  // 検索処理
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredProjects(projects);
    } else {
      const filtered = projects.filter(project => 
        project.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProjects(filtered);
    }
  }, [searchTerm, projects]);

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
            Figmaとの連携が切れている可能性があります。ダッシュボードから再連携してください。
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
        <InsertPhotoIcon className={classes.figmaIcon} />
        <Typography variant="h4" className={classes.title}>
          Figmaプロジェクト
        </Typography>
      </div>
      
      <TextField
        className={classes.search}
        variant="outlined"
        fullWidth
        placeholder="プロジェクトを検索..."
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
      
      {filteredProjects.length === 0 ? (
        <Paper className={classes.paper}>
          <Typography variant="body1" align="center" style={{ padding: 16 }}>
            プロジェクトが見つかりません
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {filteredProjects.map((project) => (
            <Grid item key={project.id} xs={12} sm={6} md={4}>
              <Card className={classes.card}>
                {project.thumbnail ? (
                  <CardMedia
                    className={classes.cardMedia}
                    image={project.thumbnail}
                    title={project.name}
                  />
                ) : (
                  <Box className={classes.emptyCardContent}>
                    <FolderIcon className={classes.emptyIcon} />
                  </Box>
                )}
                <CardContent className={classes.cardContent}>
                  <Typography gutterBottom variant="h6" component="h2">
                    {project.name}
                  </Typography>
                  <Chip 
                    label={project.teamName} 
                    size="small" 
                    className={classes.teamChip}
                  />
                </CardContent>
                <CardActions>
                  <Button 
                    size="small" 
                    color="primary"
                    component={Link}
                    to={`/figma/projects/${project.id}/files`}
                  >
                    ファイル一覧
                  </Button>
                  <Button 
                    size="small" 
                    color="primary"
                    href={`https://www.figma.com/files/project/${project.id}`}
                    target="_blank"
                  >
                    Figmaで開く
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default FigmaProjects;
