// src/components/billing/ProductSelection.js
import React, { useState } from 'react';
import { Row, Col, Select, InputNumber, Button, Tabs, Tag } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { getProductPrice } from './BillingHelpers';

const { Option } = Select;
const { TabPane } = Tabs;

const ProductSelection = ({ 
  products, 
  businessType, 
  selectedBranch, 
  onAddProduct, 
  onShowProductModal 
}) => {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);

  const handleAddProduct = () => {
    if (selectedProduct && quantity > 0) {
      const price = getProductPrice(selectedProduct, businessType);
      onAddProduct({
        product: selectedProduct,
        quantity,
        originalPrice: price,
        currentPrice: price,
        businessType,
        branch: selectedBranch
      });
      setSelectedProduct(null);
      setQuantity(1);
    }
  };

  return (
    <Tabs defaultActiveKey="1" size="small">
      <TabPane tab="Existing Products" key="1">
        <Row gutter={8} style={{ marginBottom: 12 }}>
          <Col span={12}>
            <Select
              showSearch
              style={{ width: '100%' }}
              placeholder="Select Product"
              value={selectedProduct?.id}
              onChange={(value) => {
                const product = products.find(p => p.id === value);
                setSelectedProduct(product || null);
              }}
              filterOption={(input, option) =>
                option.children.toLowerCase().includes(input.toLowerCase())
              }
              size="small"
            >
              {products.map(product => {
                const price = getProductPrice(product, businessType);
                return (
                  <Option key={product.id} value={product.id}>
                    {`${product.name} - ₹${price}`}
                    {businessType === 'wholesale' && product.wholesalePrice && (
                      <Tag color="orange" size="small" style={{ marginLeft: 4 }}>WS</Tag>
                    )}
                  </Option>
                );
              })}
            </Select>
          </Col>
          <Col span={6}>
            <InputNumber
              min={1}
              value={quantity}
              onChange={(val) => setQuantity(val)}
              style={{ width: '100%' }}
              placeholder="Qty"
              size="small"
            />
          </Col>
          <Col span={6}>
            <Button 
              type="primary" 
              onClick={handleAddProduct} 
              block 
              size="small"
              icon={<PlusOutlined />}
              disabled={!selectedProduct}
            >
              Add
            </Button>
          </Col>
        </Row>
      </TabPane>
      
      <TabPane tab="Custom Product" key="2">
        <Button 
          type="dashed" 
          icon={<PlusOutlined />} 
          onClick={onShowProductModal}
          block
          size="small"
        >
          Add Custom Product
        </Button>
      </TabPane>
    </Tabs>
  );
};

export default ProductSelection;