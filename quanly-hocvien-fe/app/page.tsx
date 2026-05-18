"use client";

import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
} from '@mui/material';

export default function HomePage() {
  return (
    <Box>
      <Typography variant="h5">
        Tổng quan
      </Typography>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary">
                Tổng học viên
              </Typography>
              <Typography variant="h4">
                0
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary">
                Tổng khóa học
              </Typography>
              <Typography variant="h4">
                0
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary">
                Đã thu
              </Typography>
              <Typography variant="h4">
                0 đ
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary">
                Còn nợ
              </Typography>
              <Typography variant="h4">
                0 đ
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}