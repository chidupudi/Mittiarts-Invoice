import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Button, Typography, Alert, Upload, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { fetchProducts } from '../../features/products/productSlice';

const { Text } = Typography;

const BulkUpload = ({ onSuccess }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const dispatch = useDispatch();

  const beforeUpload = (file) => {
    const isCSV = file.type === 'text/csv';
    if (!isCSV) {
      message.error('Please select a valid CSV file');
    }
    return isCSV;
  };

  const handleUpload = async () => {
    if (!file) {
      message.error('Please select a file first');
      return;
    }

    setLoading(true);
    setError('');

    try {
      message.warning('Bulk upload feature requires backend implementation. Please add products individually for now.');
      setFile(null);
      
      dispatch(fetchProducts({}));
      
      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 2000);
    } catch (err) {
      message.error('Upload failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: 16 }}>
      <Text type="secondary" style={{ marginBottom: 16, display: 'block' }}>
        Select a CSV file with columns: name, category, weight, price, costPrice, stock
      </Text>
      
      <Upload
        beforeUpload={beforeUpload}
        showUploadList={false}
        onChange={({ file }) => setFile(file)}
      >
        <Button icon={<UploadOutlined />}>Select CSV File</Button>
      </Upload>
      
      {file && (
        <Text style={{ marginTop: 8, display: 'block' }}>
          Selected file: {file.name}
        </Text>
      )}
      
      {error && (
        <Alert message={error} type="error" style={{ marginTop: 8 }} />
      )}
      
      <Button
        type="primary"
        onClick={handleUpload}
        disabled={!file || loading}
        style={{ marginTop: 16 }}
        loading={loading}
      >
        Upload
      </Button>
    </div>
  );
};

export default BulkUpload;