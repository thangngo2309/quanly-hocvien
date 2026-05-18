'use client';

import {
  AppBar,
  Box,
  CssBaseline,
  Divider,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import SchoolIcon from '@mui/icons-material/School';
import GroupsIcon from '@mui/icons-material/Groups';
import PaymentsIcon from '@mui/icons-material/Payments';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import BarChartIcon from '@mui/icons-material/BarChart';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const drawerWidth = 260;

const menus = [
  {
    label: 'Tổng quan',
    href: '/',
    icon: <DashboardIcon />,
  },
  {
    label: 'Khóa học',
    href: '/courses',
    icon: <SchoolIcon />,
  },
  {
    label: 'Học viên',
    href: '/students',
    icon: <GroupsIcon />,
  },
  {
    label: 'Thu học phí',
    href: '/tuition-payments',
    icon: <PaymentsIcon />,
  },
  {
    label: 'Khoản chi',
    href: '/expenses',
    icon: <ReceiptLongIcon />,
  },
  {
    label: 'Báo cáo',
    href: '/reports',
    icon: <BarChartIcon />,
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <CssBaseline />

      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          zIndex: theme => theme.zIndex.drawer + 1,
          bgcolor: '#ffffff',
          color: '#111827',
          borderBottom: '1px solid #e5e7eb',
        }}
      >
        <Toolbar>
          <Typography variant="h6">
            Quản lý trung tâm đào tạo lái xe
          </Typography>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            borderRight: '1px solid #e5e7eb',
          },
        }}
      >
        <Toolbar />

        <Box sx={{ p: 2 }}>
          <Typography variant="subtitle2" color="text.secondary">
            MENU QUẢN LÝ
          </Typography>
        </Box>

        <Divider />

        <List sx={{ px: 1.5 }}>
          {menus.map(item => {
            const selected =
              item.href === '/'
                ? pathname === '/'
                : pathname.startsWith(item.href);

            return (
              <ListItemButton
                key={item.href}
                component={Link}
                href={item.href}
                selected={selected}
                sx={{
                  mb: 0.5,
                  borderRadius: 2,
                  '&.Mui-selected': {
                    bgcolor: 'primary.main',
                    color: '#ffffff',
                    '& .MuiListItemIcon-root': {
                      color: '#ffffff',
                    },
                    '&:hover': {
                      bgcolor: 'primary.dark',
                    },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  {item.icon}
                </ListItemIcon>

                <ListItemText primary={item.label} />
              </ListItemButton>
            );
          })}
        </List>
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: 'background.default',
          minHeight: '100vh',
          p: 3,
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
}