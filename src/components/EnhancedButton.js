import { Button, Spin } from 'antd';
import { Zoom } from '@mui/material';

export default function EnhancedButton({
  icon: Icon,
  loading,
  children,
  ...props
}) {
  return (
    <Button
      startIcon={Icon && <Zoom in={!loading}><Icon /></Zoom>}
      endIcon={loading && <CircularProgress size={20} />}
      {...props}
    >
      <Zoom in={!loading}>{children}</Zoom>
    </Button>
  );
}