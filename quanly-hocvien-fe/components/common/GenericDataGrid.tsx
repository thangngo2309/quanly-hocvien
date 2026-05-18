'use client';

import { Box, Card, CardContent } from '@mui/material';
import {
  DataGrid,
  GridColDef,
  GridRowId,
  GridValidRowModel,
} from '@mui/x-data-grid';

type GenericDataGridProps<T extends GridValidRowModel> = {
  rows: T[];
  columns: GridColDef<T>[];
  loading?: boolean;
  height?: number | string;
  getRowId?: (row: T) => GridRowId;
  pageSizeOptions?: number[];
  getRowClassName?: (params: any) => string;
};

export default function GenericDataGrid<T extends GridValidRowModel>({
  rows,
  columns,
  loading = false,
  height = 600,
  getRowId,
  pageSizeOptions = [10, 20, 50],
  getRowClassName
}: GenericDataGridProps<T>) {
  return (
    <Card>
      <CardContent sx={{ p: 0 }}>
        <Box sx={{ width: '100%', height }}>
          <DataGrid<T>
            rows={rows}
            columns={columns}
            loading={loading}
            getRowId={getRowId}
            disableRowSelectionOnClick
            pageSizeOptions={pageSizeOptions}
            getRowClassName={getRowClassName}
            initialState={{
              pagination: {
                paginationModel: {
                  page: 0,
                  pageSize: 10,
                },
              },
            }}
            slotProps={{
              pagination: {
                labelRowsPerPage: 'Số dòng mỗi trang:',
                labelDisplayedRows: ({ from, to, count }: any) =>
                  `${from}–${to} trên ${count !== -1 ? count : `hơn ${to}`}`,
              },
            }}
            localeText={{
              noRowsLabel: 'Không có dữ liệu',
              noResultsOverlayLabel: 'Không tìm thấy dữ liệu',
              columnMenuSortAsc: 'Sắp xếp tăng dần',
              columnMenuSortDesc: 'Sắp xếp giảm dần',
              columnMenuFilter: 'Lọc',
              columnMenuHideColumn: 'Ẩn cột',
              columnMenuManageColumns: 'Quản lý cột',
              footerRowSelected: count => `${count} dòng được chọn`,
            }}
            sx={{
              border: 0,
            
              '& .row-paid-full': {
                backgroundColor: '#ecfdf5',
              },
            
              '& .row-not-paid-full': {
                backgroundColor: '#fff7ed',
              },
            
              '& .row-paid-full:hover': {
                backgroundColor: '#d1fae5',
              },
            
              '& .row-not-paid-full:hover': {
                backgroundColor: '#ffedd5',
              },
            
              '& .MuiDataGrid-columnHeaders': {
                backgroundColor: '#f9fafb',
              },
            
              '& .MuiDataGrid-columnHeaderTitle': {
                fontWeight: 700,
              },
            
              '& .MuiDataGrid-cell': {
                outline: 'none !important',
              },
            
              '& .MuiDataGrid-footerContainer': {
                borderTop: '1px solid #e5e7eb',
              },
            }}
          />
        </Box>
      </CardContent>
    </Card>
  );
}