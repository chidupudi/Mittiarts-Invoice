import { Spin } from 'antd';
// Replace CircularProgress/Backdrop with Spin

export default function Loading({ isLoading }) {
  return (
    <Backdrop open={isLoading} style={{ zIndex: 9999 }}>
      <CircularProgress color="primary" />
    </Backdrop>
  );
}