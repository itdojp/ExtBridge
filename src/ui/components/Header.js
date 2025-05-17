import React from 'react';
import { Link } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button, Avatar, Menu, MenuItem, IconButton } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import AccountCircleIcon from '@material-ui/icons/AccountCircle';

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
  },
  title: {
    flexGrow: 1,
    textDecoration: 'none',
    color: 'white',
  },
  avatar: {
    marginRight: theme.spacing(1),
  },
  userName: {
    marginRight: theme.spacing(2),
  },
}));

const Header = ({ user, onLogout }) => {
  const classes = useStyles();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleClose();
    onLogout();
  };

  return (
    <div className={classes.root}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component={Link} to="/" className={classes.title}>
            ExtBridge
          </Typography>
          
          {user ? (
            <div>
              <IconButton
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleMenu}
                color="inherit"
              >
                {user.profileImage ? (
                  <Avatar className={classes.avatar} src={user.profileImage} />
                ) : (
                  <AccountCircleIcon />
                )}
                <Typography variant="body1" className={classes.userName}>
                  {user.name || user.email}
                </Typography>
              </IconButton>
              <Menu
                id="menu-appbar"
                anchorEl={anchorEl}
                anchorOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={open}
                onClose={handleClose}
              >
                <MenuItem component={Link} to="/profile" onClick={handleClose}>プロフィール</MenuItem>
                <MenuItem component={Link} to="/settings" onClick={handleClose}>設定</MenuItem>
                <MenuItem onClick={handleLogout}>ログアウト</MenuItem>
              </Menu>
            </div>
          ) : (
            <Button color="inherit" component={Link} to="/login">
              ログイン
            </Button>
          )}
        </Toolbar>
      </AppBar>
    </div>
  );
};

export default Header;
