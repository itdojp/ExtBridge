import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Grid, 
  Paper, 
  Typography, 
  Button, 
  Card, 
  CardContent, 
  CardActions,
  CircularProgress,
  Divider,
  Box
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import GitHubIcon from '@material-ui/icons/GitHub';
import InsertPhotoIcon from '@material-ui/icons/InsertPhoto';
import ForumIcon from '@material-ui/icons/Forum';
import LinkIcon from '@material-ui/icons/Link';
import LinkOffIcon from '@material-ui/icons/LinkOff';

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
    height: '100%',
  },
  card: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  cardContent: {
    flexGrow: 1,
  },
  serviceIcon: {
    fontSize: 48,
    marginBottom: theme.spacing(2),
  },
  divider: {
    margin: theme.spacing(2, 0),
  },
  connectedStatus: {
    color: theme.palette.success.main,
    display: 'flex',
    alignItems: 'center',
    marginBottom: theme.spacing(1),
  },
  disconnectedStatus: {
    color: theme.palette.text.secondary,
    display: 'flex',
    alignItems: 'center',
    marginBottom: theme.spacing(1),
  },
  statusIcon: {
    marginRight: theme.spacing(1),
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    padding: theme.spacing(4),
  },
}));

const Dashboard = () => {
  const classes = useStyles();
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState({
    github: { connected: false, data: null },
    figma: { connected: false, data: null },
    slack: { connected: false, data: null },
  });

  useEffect(() => {
    // ユーザーの連携サービス情報を取得
    const fetchUserServices = async () => {
      try {
        // APIからユーザー情報を取得
        const response = await fetch('/api/user/services', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          
          // サービス連携状態を更新
          setServices({
            github: { 
              connected: data.services.some(s => s.service === 'github'),
              data: data.services.find(s => s.service === 'github')
            },
            figma: { 
              connected: data.services.some(s => s.service === 'figma'),
              data: data.services.find(s => s.service === 'figma')
            },
            slack: { 
              connected: data.services.some(s => s.service === 'slack'),
              data: data.services.find(s => s.service === 'slack')
            },
          });
        }
      } catch (error) {
        console.error('サービス情報取得エラー:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserServices();
  }, []);

  const handleConnect = (service) => {
    // サービス連携ページにリダイレクト
    window.location.href = `/api/services/${service}/connect`;
  };

  const handleDisconnect = async (service) => {
    try {
      const response = await fetch(`/api/services/${service}/disconnect`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // 連携解除成功、状態を更新
        setServices(prev => ({
          ...prev,
          [service]: { connected: false, data: null }
        }));
      }
    } catch (error) {
      console.error(`${service}連携解除エラー:`, error);
    }
  };

  if (loading) {
    return (
      <div className={classes.loading}>
        <CircularProgress />
      </div>
    );
  }

  return (
    <Container className={classes.root}>
      <Typography variant="h4" className={classes.title}>
        ダッシュボード
      </Typography>
      
      <Grid container spacing={3}>
        {/* GitHub連携カード */}
        <Grid item xs={12} md={4}>
          <Card className={classes.card}>
            <CardContent className={classes.cardContent}>
              <Box display="flex" justifyContent="center">
                <GitHubIcon className={classes.serviceIcon} />
              </Box>
              <Typography variant="h5" component="h2" align="center" gutterBottom>
                GitHub
              </Typography>
              
              {services.github.connected ? (
                <div>
                  <div className={classes.connectedStatus}>
                    <LinkIcon className={classes.statusIcon} />
                    <Typography variant="body2">連携済み</Typography>
                  </div>
                  <Typography variant="body2" color="textSecondary">
                    {services.github.data?.serviceUserId && `ユーザーID: ${services.github.data.serviceUserId}`}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {services.github.data?.connectedAt && `連携日時: ${new Date(services.github.data.connectedAt).toLocaleString()}`}
                  </Typography>
                </div>
              ) : (
                <div className={classes.disconnectedStatus}>
                  <LinkOffIcon className={classes.statusIcon} />
                  <Typography variant="body2">未連携</Typography>
                </div>
              )}
              
              <Divider className={classes.divider} />
              
              <Typography variant="body2" color="textSecondary">
                GitHubと連携して、リポジトリやコミット履歴を管理します。
              </Typography>
            </CardContent>
            <CardActions>
              {services.github.connected ? (
                <Button 
                  size="small" 
                  color="secondary" 
                  onClick={() => handleDisconnect('github')}
                >
                  連携解除
                </Button>
              ) : (
                <Button 
                  size="small" 
                  color="primary" 
                  onClick={() => handleConnect('github')}
                >
                  連携する
                </Button>
              )}
              {services.github.connected && (
                <Button 
                  size="small" 
                  color="primary" 
                  href="/github/repositories"
                >
                  リポジトリを表示
                </Button>
              )}
            </CardActions>
          </Card>
        </Grid>
        
        {/* Figma連携カード */}
        <Grid item xs={12} md={4}>
          <Card className={classes.card}>
            <CardContent className={classes.cardContent}>
              <Box display="flex" justifyContent="center">
                <InsertPhotoIcon className={classes.serviceIcon} />
              </Box>
              <Typography variant="h5" component="h2" align="center" gutterBottom>
                Figma
              </Typography>
              
              {services.figma.connected ? (
                <div>
                  <div className={classes.connectedStatus}>
                    <LinkIcon className={classes.statusIcon} />
                    <Typography variant="body2">連携済み</Typography>
                  </div>
                  <Typography variant="body2" color="textSecondary">
                    {services.figma.data?.serviceUserId && `ユーザーID: ${services.figma.data.serviceUserId}`}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {services.figma.data?.connectedAt && `連携日時: ${new Date(services.figma.data.connectedAt).toLocaleString()}`}
                  </Typography>
                </div>
              ) : (
                <div className={classes.disconnectedStatus}>
                  <LinkOffIcon className={classes.statusIcon} />
                  <Typography variant="body2">未連携</Typography>
                </div>
              )}
              
              <Divider className={classes.divider} />
              
              <Typography variant="body2" color="textSecondary">
                Figmaと連携して、デザインファイルやプロジェクトを管理します。
              </Typography>
            </CardContent>
            <CardActions>
              {services.figma.connected ? (
                <Button 
                  size="small" 
                  color="secondary" 
                  onClick={() => handleDisconnect('figma')}
                >
                  連携解除
                </Button>
              ) : (
                <Button 
                  size="small" 
                  color="primary" 
                  onClick={() => handleConnect('figma')}
                >
                  連携する
                </Button>
              )}
              {services.figma.connected && (
                <Button 
                  size="small" 
                  color="primary" 
                  href="/figma/projects"
                >
                  プロジェクトを表示
                </Button>
              )}
            </CardActions>
          </Card>
        </Grid>
        
        {/* Slack連携カード */}
        <Grid item xs={12} md={4}>
          <Card className={classes.card}>
            <CardContent className={classes.cardContent}>
              <Box display="flex" justifyContent="center">
                <ForumIcon className={classes.serviceIcon} />
              </Box>
              <Typography variant="h5" component="h2" align="center" gutterBottom>
                Slack
              </Typography>
              
              {services.slack.connected ? (
                <div>
                  <div className={classes.connectedStatus}>
                    <LinkIcon className={classes.statusIcon} />
                    <Typography variant="body2">連携済み</Typography>
                  </div>
                  <Typography variant="body2" color="textSecondary">
                    {services.slack.data?.teamName && `チーム: ${services.slack.data.teamName}`}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {services.slack.data?.connectedAt && `連携日時: ${new Date(services.slack.data.connectedAt).toLocaleString()}`}
                  </Typography>
                </div>
              ) : (
                <div className={classes.disconnectedStatus}>
                  <LinkOffIcon className={classes.statusIcon} />
                  <Typography variant="body2">未連携</Typography>
                </div>
              )}
              
              <Divider className={classes.divider} />
              
              <Typography variant="body2" color="textSecondary">
                Slackと連携して、チームコミュニケーションを効率化します。
              </Typography>
            </CardContent>
            <CardActions>
              {services.slack.connected ? (
                <Button 
                  size="small" 
                  color="secondary" 
                  onClick={() => handleDisconnect('slack')}
                >
                  連携解除
                </Button>
              ) : (
                <Button 
                  size="small" 
                  color="primary" 
                  onClick={() => handleConnect('slack')}
                >
                  連携する
                </Button>
              )}
              {services.slack.connected && (
                <Button 
                  size="small" 
                  color="primary" 
                  href="/slack/channels"
                >
                  チャンネルを表示
                </Button>
              )}
            </CardActions>
          </Card>
        </Grid>
        
        {/* 統計情報 */}
        <Grid item xs={12}>
          <Paper className={classes.paper}>
            <Typography variant="h6" gutterBottom>
              連携サービス統計
            </Typography>
            <Typography variant="body2" color="textSecondary">
              連携サービス数: {Object.values(services).filter(s => s.connected).length} / 3
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;
