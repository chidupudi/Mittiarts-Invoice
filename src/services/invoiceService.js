// src/services/invoiceService.js - Efficient invoice storage
import firebaseService from './firebaseService';

class InvoiceService {
  // Create invoice with optimized storage
  async createInvoice(orderData) {
    try {
      // Create main invoice document
      const invoiceData = {
        orderNumber: orderData.orderNumber,
        customerId: orderData.customerId,
        customerName: orderData.customer?.name || 'Walk-in Customer',
        customerPhone: orderData.customer?.phone || '',
        customerEmail: orderData.customer?.email || '',
        
        // Invoice summary for quick access
        itemCount: orderData.items.length,
        subtotal: orderData.subtotal,
        discount: orderData.discount || 0,
        discountPercentage: orderData.discountPercentage || 0,
        total: orderData.total,
        
        // Payment details
        paymentMethod: orderData.paymentMethod,
        paymentStatus: 'paid',
        
        // Metadata
        invoiceDate: new Date(),
        createdAt: new Date(),
        status: 'active', // active, cancelled, refunded
        
        // Search fields for efficient querying
        searchTerms: [
          orderData.orderNumber.toLowerCase(),
          orderData.customer?.name?.toLowerCase() || 'walk-in',
          orderData.customer?.phone || '',
          ...orderData.items.map(item => item.product.name.toLowerCase())
        ].filter(Boolean)
      };

      // Create the invoice
      const invoice = await firebaseService.create('invoices', invoiceData);

      // Store detailed items separately for better performance
      const itemsData = {
        invoiceId: invoice.id,
        orderNumber: orderData.orderNumber,
        items: orderData.items.map(item => ({
          productId: item.product.id,
          productName: item.product.name,
          category: item.product.category,
          quantity: item.quantity,
          originalPrice: item.originalPrice || item.price,
          currentPrice: item.currentPrice || item.price,
          finalPrice: item.price,
          discount: item.originalPrice ? 
            ((item.originalPrice - item.price) / item.originalPrice * 100) : 0,
          subtotal: (item.originalPrice || item.price) * item.quantity,
          total: item.price * item.quantity
        })),
        createdAt: new Date()
      };

      await firebaseService.create('invoice_items', itemsData);

      return { ...invoice, items: itemsData.items };
    } catch (error) {
      console.error('Error creating invoice:', error);
      throw new Error(`Failed to create invoice: ${error.message}`);
    }
  }

  // Get all invoices with pagination and filters
  async getInvoices(filters = {}) {
    try {
      const options = {
        orderBy: { field: 'createdAt', direction: 'desc' },
        limit: filters.limit || 50
      };

      // Add where conditions
      const whereConditions = [];
      
      if (filters.status) {
        whereConditions.push({ field: 'status', operator: '==', value: filters.status });
      }

      if (filters.customerId) {
        whereConditions.push({ field: 'customerId', operator: '==', value: filters.customerId });
      }

      if (filters.startDate) {
        whereConditions.push({ 
          field: 'invoiceDate', 
          operator: '>=', 
          value: new Date(filters.startDate) 
        });
      }

      if (filters.endDate) {
        whereConditions.push({ 
          field: 'invoiceDate', 
          operator: '<=', 
          value: new Date(filters.endDate) 
        });
      }

      if (whereConditions.length > 0) {
        options.where = whereConditions;
      }

      let invoices = await firebaseService.getAll('invoices', options);

      // Apply client-side search for text-based queries
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        invoices = invoices.filter(invoice => 
          invoice.searchTerms.some(term => term.includes(searchTerm))
        );
      }

      return invoices;
    } catch (error) {
      console.error('Error fetching invoices:', error);
      throw new Error(`Failed to fetch invoices: ${error.message}`);
    }
  }

  // Get single invoice with items
  async getInvoiceById(invoiceId) {
    try {
      // Get main invoice
      const invoice = await firebaseService.getById('invoices', invoiceId);
      
      // Get invoice items
      const itemsOptions = {
        where: [{ field: 'invoiceId', operator: '==', value: invoiceId }]
      };
      const itemsResults = await firebaseService.getAll('invoice_items', itemsOptions);
      const items = itemsResults.length > 0 ? itemsResults[0].items : [];

      return { ...invoice, items };
    } catch (error) {
      console.error('Error fetching invoice:', error);
      throw new Error(`Failed to fetch invoice: ${error.message}`);
    }
  }

  // Get invoices by customer
  async getInvoicesByCustomer(customerId, limit = 10) {
    try {
      const options = {
        where: [{ field: 'customerId', operator: '==', value: customerId }],
        orderBy: { field: 'createdAt', direction: 'desc' },
        limit
      };

      return await firebaseService.getAll('invoices', options);
    } catch (error) {
      console.error('Error fetching customer invoices:', error);
      throw new Error(`Failed to fetch customer invoices: ${error.message}`);
    }
  }

  // Update invoice status
  async updateInvoiceStatus(invoiceId, status) {
    try {
      return await firebaseService.update('invoices', invoiceId, {
        status,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error updating invoice status:', error);
      throw new Error(`Failed to update invoice status: ${error.message}`);
    }
  }

  // Cancel invoice
  async cancelInvoice(invoiceId, reason = '') {
    try {
      return await firebaseService.update('invoices', invoiceId, {
        status: 'cancelled',
        cancelReason: reason,
        cancelledAt: new Date(),
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error cancelling invoice:', error);
      throw new Error(`Failed to cancel invoice: ${error.message}`);
    }
  }

  // Get invoice analytics
  async getInvoiceAnalytics(startDate, endDate) {
    try {
      const options = {
        where: [
          { field: 'invoiceDate', operator: '>=', value: new Date(startDate) },
          { field: 'invoiceDate', operator: '<=', value: new Date(endDate) },
          { field: 'status', operator: '==', value: 'active' }
        ]
      };

      const invoices = await firebaseService.getAll('invoices', options);
      
      const analytics = {
        totalInvoices: invoices.length,
        totalRevenue: invoices.reduce((sum, inv) => sum + inv.total, 0),
        totalDiscount: invoices.reduce((sum, inv) => sum + (inv.discount || 0), 0),
        averageOrderValue: 0,
        paymentMethods: {},
        dailySales: {}
      };

      if (analytics.totalInvoices > 0) {
        analytics.averageOrderValue = analytics.totalRevenue / analytics.totalInvoices;
      }

      // Group by payment method
      invoices.forEach(invoice => {
        const method = invoice.paymentMethod || 'Unknown';
        analytics.paymentMethods[method] = 
          (analytics.paymentMethods[method] || 0) + invoice.total;
      });

      // Group by date
      invoices.forEach(invoice => {
        const date = invoice.invoiceDate.toDate().toDateString();
        analytics.dailySales[date] = (analytics.dailySales[date] || 0) + invoice.total;
      });

      return analytics;
    } catch (error) {
      console.error('Error fetching invoice analytics:', error);
      throw new Error(`Failed to fetch invoice analytics: ${error.message}`);
    }
  }

  // Search invoices efficiently
  async searchInvoices(searchTerm, limit = 20) {
    try {
      if (!searchTerm || searchTerm.trim() === '') {
        return this.getInvoices({ limit });
      }

      const term = searchTerm.toLowerCase().trim();
      
      // Get recent invoices and filter client-side for better performance
      const options = {
        orderBy: { field: 'createdAt', direction: 'desc' },
        limit: 200 // Get larger set for better search results
      };

      const invoices = await firebaseService.getAll('invoices', options);
      
      const filtered = invoices.filter(invoice => 
        invoice.searchTerms.some(searchField => 
          searchField.includes(term)
        )
      ).slice(0, limit);

      return filtered;
    } catch (error) {
      console.error('Error searching invoices:', error);
      throw new Error(`Failed to search invoices: ${error.message}`);
    }
  }

  // Export invoice data for reporting
  async exportInvoices(filters = {}) {
    try {
      const invoices = await this.getInvoices(filters);
      
      return invoices.map(invoice => ({
        'Invoice Number': invoice.orderNumber,
        'Date': invoice.invoiceDate.toDate().toLocaleDateString(),
        'Customer': invoice.customerName,
        'Phone': invoice.customerPhone,
        'Items': invoice.itemCount,
        'Subtotal': invoice.subtotal,
        'Discount': invoice.discount || 0,
        'Total': invoice.total,
        'Payment Method': invoice.paymentMethod,
        'Status': invoice.status
      }));
    } catch (error) {
      console.error('Error exporting invoices:', error);
      throw new Error(`Failed to export invoices: ${error.message}`);
    }
  }

  // Get invoice summary for dashboard
  async getInvoiceSummary(days = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const options = {
        where: [
          { field: 'invoiceDate', operator: '>=', value: startDate },
          { field: 'status', operator: '==', value: 'active' }
        ]
      };

      const invoices = await firebaseService.getAll('invoices', options);
      
      return {
        totalInvoices: invoices.length,
        totalRevenue: invoices.reduce((sum, inv) => sum + inv.total, 0),
        totalDiscount: invoices.reduce((sum, inv) => sum + (inv.discount || 0), 0),
        averageOrderValue: invoices.length > 0 ? 
          invoices.reduce((sum, inv) => sum + inv.total, 0) / invoices.length : 0,
        recentInvoices: invoices.slice(0, 5)
      };
    } catch (error) {
      console.error('Error fetching invoice summary:', error);
      throw new Error(`Failed to fetch invoice summary: ${error.message}`);
    }
  }
}

export default new InvoiceService();