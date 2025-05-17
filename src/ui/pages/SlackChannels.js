import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Paper, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton, 
  Divider, 
  CircularProgress,
  Button,
  TextField,
  InputAdornment,
  Box,
  Chip,
  Badge
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import SearchIcon from '@material-ui/icons/Search';
import ForumIcon from '@material-ui/icons/Forum';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import LockIcon from '@material-ui/icons/Lock';
import TagIcon from '@material-ui/icons/Tag';
import MessageIcon from '@material-ui/icons/Message';
import PeopleIcon from '@material-ui/icons/People';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
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
  channelName: {
    fontWeight: 'bold',
  },
  channelInfo: {
    display: 'flex',
    alignItems: 'center',
    '& > *': {
      marginRight: theme.spacing(2),
      display: 'flex',
      alignItems: 'center',
    },
    '& svg': {
      marginRight: theme.spacing(0.5),
      fontSize: '0.875rem',
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
  slackIcon: {
    fontSize: 32,
    marginRight: theme.spacing(2),
  },
  privateIcon: {
    fontSize: '0.875rem',
    marginRight: theme.spacing(0.5),
  },
  channelPurpose: {
    color: theme.palette.text.secondary,
    fontSize: '0.875rem',
    marginTop: theme.spacing(0.5),
  },
  memberCount: {
    fontSize: '0.75rem',
    color: theme.palette.text.secondary,
    display: 'flex',
    alignItems: 'center',
  },
  memberIcon: {
    fontSize: '0.875rem',
    marginRight: theme.spacing(0.5),
  },
  channelType: {
    marginRight: theme.spacing(1),
  },
}));

const SlackChannels = () => {
  const classes = useStyles();
  const [loading, setLoading] = useState(true);
  const [channels, setChannels] = useState([]);
  const [filteredChannels, setFilteredChannels] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);
  const [teamInfo, setTeamInfo] = useState(null);

  useEffect(() => {
    // Slackチーム情報とチャンネル一覧を取得
    const fetchData = async () => {
      try {
        // チーム情報を取得
        const teamResponse = await fetch('/api/services/slack/team', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (!teamResponse.ok) {
          throw new Error('チーム情報の取得に失敗しました');
        }
        
        const teamData = await teamResponse.json();
        
        if (teamData.status === 'success') {
          setTeamInfo(teamData.data.team);
        } else {
          throw new Error(teamData.message || 'チーム情報の取得に失敗しました');
        }
        
        // チャンネル一覧を取得
        const channelsResponse = await fetch('/api/services/slack/channels', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (!channelsResponse.ok) {
          throw new Error('チャンネル一覧の取得に失敗しました');
        }
        
        const channelsData = await channelsResponse.json();
        
        if (channelsData.status === 'success') {
          setChannels(channelsData.data.channels);
          setFilteredChannels(channelsData.data.channels);
        } else {
          throw new Error(channelsData.message || 'チャンネル一覧の取得に失敗しました');
        }
      } catch (error) {
        console.error('Slackデータ取得エラー:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // 検索処理
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredChannels(channels);
    } else {
      const filtered = channels.filter(channel => 
        channel.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (channel.purpose && channel.purpose.value && 
         channel.purpose.value.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredChannels(filtered);
    }
  }, [searchTerm, channels]);

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
            Slackとの連携が切れている可能性があります。ダッシュボードから再連携してください。
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
        <ForumIcon className={classes.slackIcon} />
        <Typography variant="h4" className={classes.title}>
          Slackチャンネル
        </Typography>
      </div>
      
      {teamInfo && (
        <Paper className={classes.paper} style={{ marginBottom: 16 }}>
          <Typography variant="h6" gutterBottom>
            {teamInfo.name}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            ワークスペースID: {teamInfo.id}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            ドメイン: {teamInfo.domain}
          </Typography>
        </Paper>
      )}
      
      <TextField
        className={classes.search}
        variant="outlined"
        fullWidth
        placeholder="チャンネルを検索..."
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
        {filteredChannels.length === 0 ? (
          <Typography variant="body1" align="center" style={{ padding: 16 }}>
            チャンネルが見つかりません
          </Typography>
        ) : (
          <List>
            {filteredChannels.map((channel, index) => (
              <React.Fragment key={channel.id}>
                <ListItem 
                  className={classes.listItem}
                  button
                  component={Link}
                  to={`/slack/channels/${channel.id}`}
                >
                  <ListItemIcon>
                    {channel.is_private ? <LockIcon /> : <TagIcon />}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center">
                        <Typography className={classes.channelName}>
                          {channel.name}
                        </Typography>
                        {channel.is_private && (
                          <Chip 
                            label="プライベート" 
                            size="small" 
                            style={{ marginLeft: 8 }}
                            className={classes.channelType}
                          />
                        )}
                        {channel.is_archived && (
                          <Chip 
                            label="アーカイブ済" 
                            size="small" 
                            color="secondary" 
                            style={{ marginLeft: 8 }}
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <>
                        {channel.purpose && channel.purpose.value && (
                          <Typography className={classes.channelPurpose}>
                            {channel.purpose.value}
                          </Typography>
                        )}
                        <Box className={classes.channelInfo} mt={1}>
                          <span className={classes.memberCount}>
                            <PeopleIcon className={classes.memberIcon} />
                            {channel.num_members || 0} メンバー
                          </span>
                        </Box>
                      </>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton 
                      edge="end" 
                      aria-label="open in slack" 
                      href={`https://slack.com/app_redirect?channel=${channel.id}`} 
                      target="_blank"
                    >
                      <OpenInNewIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
                {index < filteredChannels.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}
      </Paper>
    </Container>
  );
};

export default SlackChannels;
