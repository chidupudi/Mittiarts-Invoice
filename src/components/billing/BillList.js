import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Table, Input, Button, Space } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { getBills } from '../../features/bill/billSlice';
import { useNavigate } from 'react-router-dom';

const { Search } = Input;

const BillList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { bills, totalBills, isLoading } = useSelector(state => state.bills);

  const [page, setPage] = useState(1); // AntD pagination starts from 1
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');

  useEffect(() => {
    dispatch(getBills({ page, limit: pageSize, search }));
  }, [dispatch, page, pageSize, search]);

  const handleSearch = (value) => {
    setSearch(value);
    setPage(1); // Reset to first page on new search
  };

  const handleView = (id) => {
    navigate(`/bills/${id}`);
  };

  const columns = [
    {
      title: 'Bill Number',
      dataIndex: 'billNumber',
      key: 'billNumber',
    },
    {
      title: 'Customer',
      dataIndex: ['customer', 'name'],
      key: 'customer',
    },
    {
      title: 'Total Amount',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amount) => `₹${amount.toFixed(2)}`,
    },
    {
      title: 'Payment Status',
      dataIndex: 'paymentStatus',
      key: 'paymentStatus',
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'date',
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => handleView(record._id)}
        />
      ),
    },
  ];

  return (
    <div style={{ padding: '20px' }}>
      <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
        <Search
          placeholder="Search"
          allowClear
          enterButton
          onSearch={handleSearch}
          style={{ width: 300 }}
        />
        <Button type="primary" onClick={() => navigate('/billing')}>
          Create New Bill
        </Button>
      </Space>

      <Table
        columns={columns}
        dataSource={bills}
        loading={isLoading}
        rowKey="_id"
        pagination={{
          current: page,
          pageSize: pageSize,
          total: totalBills,
          showSizeChanger: true,
          pageSizeOptions: ['5', '10', '25'],
          onChange: (page, size) => {
            setPage(page);
            setPageSize(size);
          },
        }}
      />
    </div>
  );
};

export default BillList;
