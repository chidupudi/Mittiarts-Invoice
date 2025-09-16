// src/features/storefront/storefrontSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import firebaseService from '../../services/firebaseService';

// Mitti Arts branch configuration
const MITTI_ARTS_BRANCHES = {
  'main_showroom': {
    id: 'main_showroom',
    name: 'Main Showroom',
    address: 'Plot No. 123, Banjara Hills, Road No. 12, Hyderabad - 500034',
    phone: '+91 98765 43210',
    email: 'sales@mittiarts.com',
    icon: '🏪'
  },
  'pottery_workshop': {
    id: 'pottery_workshop', 
    name: 'Pottery Workshop',
    address: 'Survey No. 45, Madhapur, HITEC City, Hyderabad - 500081',
    phone: '+91 98765 43211',
    email: 'workshop@mittiarts.com',
    icon: '🏺'
  },
  'export_unit': {
    id: 'export_unit',
    name: 'Export Unit', 
    address: 'Plot No. 67, Gachibowli, Export Promotion Industrial Park, Hyderabad - 500032',
    phone: '+91 98765 43212',
    email: 'export@mittiarts.com',
    icon: '📦'
  }
};

// Async thunks for main store
export const fetchMainStore = createAsyncThunk(
  'storefront/fetchMainStore',
  async (_, { rejectWithValue }) => {
    try {
      const stores = await firebaseService.getAll('main_store');
      if (stores.length > 0) {
        return stores[0];
      } else {
        // Create default main store if none exists
        const defaultStore = {
          name: 'Mitti Arts Headquarters',
          type: 'main',
          address: {
            street: 'Plot No. 123, Banjara Hills, Road No. 12',
            city: 'Hyderabad',
            state: 'Telangana',
            pincode: '500034',
            country: 'India'
          },
          contact: {
            phone: '+91 98765 43210',
            email: 'info@mittiarts.com',
            website: 'www.mittiarts.com'
          },
          gst: '36ABCDE1234F1Z5',
          established: '2020-01-15',
          owner: 'Rajesh Kumar',
          status: 'active'
        };
        return await firebaseService.create('main_store', defaultStore);
      }
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateMainStore = createAsyncThunk(
  'storefront/updateMainStore',
  async (storeData, { rejectWithValue, getState }) => {
    try {
      const mainStore = getState().storefront.mainStore;
      if (mainStore?.id) {
        return await firebaseService.update('main_store', mainStore.id, storeData);
      } else {
        return await firebaseService.create('main_store', storeData);
      }
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Track if default branch initialization is in progress
let isInitializingDefaultBranch = false;

// Async thunks for branches
export const fetchBranches = createAsyncThunk(
  'storefront/fetchBranches',
  async (filters = {}, { rejectWithValue }) => {
    try {
      const options = {
        orderBy: { field: 'createdAt', direction: 'desc' }
      };

      const branches = await firebaseService.getAll('branches', options);
      return branches;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Separate thunk for initializing default branch (call only once)
export const initializeDefaultBranch = createAsyncThunk(
  'storefront/initializeDefaultBranch',
  async (_, { rejectWithValue }) => {
    try {
      // Prevent multiple simultaneous calls
      if (isInitializingDefaultBranch) {
        throw new Error('Default branch initialization already in progress');
      }

      isInitializingDefaultBranch = true;

      const branches = await firebaseService.getAll('branches', {});

      // Check if Main Showroom already exists
      const mainShowroomExists = branches.some(branch =>
        branch.name === 'Main Showroom' || branch.isMainBranch === true
      );

      // Only create if no branches exist and no main showroom exists
      if (branches.length === 0 || !mainShowroomExists) {
        const defaultBranch = {
          name: 'Main Showroom',
          type: 'permanent',
          address: {
            street: 'Plot No. 123, Banjara Hills, Road No. 12',
            city: 'Hyderabad',
            state: 'Telangana',
            pincode: '500034'
          },
          contact: {
            phone: '+91 98765 43210',
            email: 'sales@mittiarts.com'
          },
          manager: 'Suresh Reddy',
          establishedDate: '2020-01-15',
          status: 'active',
          monthlyRevenue: 250000,
          employeeCount: 8,
          isMainBranch: true
        };

        const createdBranch = await firebaseService.create('branches', defaultBranch);
        isInitializingDefaultBranch = false;
        return [createdBranch];
      }

      isInitializingDefaultBranch = false;
      return branches;
    } catch (error) {
      isInitializingDefaultBranch = false;
      return rejectWithValue(error.message);
    }
  }
);

export const createBranch = createAsyncThunk(
  'storefront/createBranch',
  async (branchData, { rejectWithValue }) => {
    try {
      return await firebaseService.create('branches', {
        ...branchData,
        status: 'active'
      });
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateBranch = createAsyncThunk(
  'storefront/updateBranch',
  async ({ id, branchData }, { rejectWithValue }) => {
    try {
      return await firebaseService.update('branches', id, branchData);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteBranch = createAsyncThunk(
  'storefront/deleteBranch',
  async (id, { rejectWithValue }) => {
    try {
      await firebaseService.delete('branches', id);
      return id;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunks for stalls
export const fetchStalls = createAsyncThunk(
  'storefront/fetchStalls',
  async (filters = {}, { rejectWithValue }) => {
    try {
      const options = {
        orderBy: { field: 'createdAt', direction: 'desc' }
      };

      return await firebaseService.getAll('stalls', options);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const createStall = createAsyncThunk(
  'storefront/createStall',
  async (stallData, { rejectWithValue }) => {
    try {
      // Ensure all required fields have default values
      const completeStallData = {
        name: stallData.name || '',
        type: stallData.type || 'fair_stall',
        location: stallData.location || '',
        eventName: stallData.eventName || '',
        startDate: stallData.startDate || '',
        endDate: stallData.endDate || '',
        setup: {
          date: stallData.setup?.date || '',
          time: stallData.setup?.time || '09:00',
          inPersonMaintainedBy: stallData.setup?.inPersonMaintainedBy || ''
        },
        status: stallData.status || 'planned',
        expectedRevenue: stallData.expectedRevenue || 0,
        stallSize: stallData.stallSize || '10x10 feet', // Default value
        stallCost: stallData.stallCost || 0,
        contact: {
          phone: stallData.contact?.phone || '',
          coordinator: stallData.contact?.coordinator || ''
        },
        totalRevenue: stallData.totalRevenue || 0,
        dailyRevenue: stallData.dailyRevenue || 0
      };

      return await firebaseService.create('stalls', completeStallData);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateStall = createAsyncThunk(
  'storefront/updateStall',
  async ({ id, stallData }, { rejectWithValue }) => {
    try {
      // Ensure all fields have values (no undefined)
      const completeStallData = {
        ...stallData,
        stallSize: stallData.stallSize || '10x10 feet',
        setup: {
          ...stallData.setup,
          time: stallData.setup?.time || '09:00',
          inPersonMaintainedBy: stallData.setup?.inPersonMaintainedBy || ''
        },
        contact: {
          ...stallData.contact,
          phone: stallData.contact?.phone || '',
          coordinator: stallData.contact?.coordinator || ''
        }
      };

      return await firebaseService.update('stalls', id, completeStallData);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteStall = createAsyncThunk(
  'storefront/deleteStall',
  async (id, { rejectWithValue }) => {
    try {
      await firebaseService.delete('stalls', id);
      return id;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateStallStatus = createAsyncThunk(
  'storefront/updateStallStatus',
  async ({ id, status }, { rejectWithValue }) => {
    try {
      return await firebaseService.update('stalls', id, { status });
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateStallRevenue = createAsyncThunk(
  'storefront/updateStallRevenue',
  async ({ id, revenueData }, { rejectWithValue }) => {
    try {
      return await firebaseService.update('stalls', id, revenueData);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  mainStore: null,
  branches: [],
  stalls: [],
  loading: false,
  error: null,
  branchFilters: {},
  stallFilters: {},
  analytics: {
    totalBranches: 0,
    totalRevenue: 0,
    activeStalls: 0,
    stallRevenue: 0
  }
};

const storefrontSlice = createSlice({
  name: 'storefront',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setBranchFilters: (state, action) => {
      state.branchFilters = { ...state.branchFilters, ...action.payload };
    },
    setStallFilters: (state, action) => {
      state.stallFilters = { ...state.stallFilters, ...action.payload };
    },
    updateAnalytics: (state) => {
      state.analytics = {
        totalBranches: state.branches.length,
        totalRevenue: state.branches.reduce((sum, branch) => sum + (branch.monthlyRevenue || 0), 0),
        activeStalls: state.stalls.filter(stall => stall.status === 'active').length,
        stallRevenue: state.stalls.reduce((sum, stall) => sum + (stall.totalRevenue || 0), 0)
      };
    }
  },
  extraReducers: (builder) => {
    builder
      // Main store
      .addCase(fetchMainStore.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMainStore.fulfilled, (state, action) => {
        state.loading = false;
        state.mainStore = action.payload;
      })
      .addCase(fetchMainStore.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateMainStore.fulfilled, (state, action) => {
        state.mainStore = action.payload;
      })

      // Branches
      .addCase(fetchBranches.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBranches.fulfilled, (state, action) => {
        state.loading = false;
        state.branches = action.payload;
      })
      .addCase(fetchBranches.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Initialize default branch
      .addCase(initializeDefaultBranch.fulfilled, (state, action) => {
        state.branches = action.payload;
      })
      .addCase(createBranch.fulfilled, (state, action) => {
        state.branches.unshift(action.payload);
      })
      .addCase(updateBranch.fulfilled, (state, action) => {
        const index = state.branches.findIndex(b => b.id === action.payload.id);
        if (index !== -1) {
          state.branches[index] = action.payload;
        }
      })
      .addCase(deleteBranch.fulfilled, (state, action) => {
        state.branches = state.branches.filter(b => b.id !== action.payload);
      })

      // Stalls
      .addCase(fetchStalls.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStalls.fulfilled, (state, action) => {
        state.loading = false;
        state.stalls = action.payload;
      })
      .addCase(fetchStalls.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createStall.fulfilled, (state, action) => {
        state.stalls.unshift(action.payload);
      })
      .addCase(updateStall.fulfilled, (state, action) => {
        const index = state.stalls.findIndex(s => s.id === action.payload.id);
        if (index !== -1) {
          state.stalls[index] = action.payload;
        }
      })
      .addCase(deleteStall.fulfilled, (state, action) => {
        state.stalls = state.stalls.filter(s => s.id !== action.payload);
      })
      .addCase(updateStallStatus.fulfilled, (state, action) => {
        const index = state.stalls.findIndex(s => s.id === action.payload.id);
        if (index !== -1) {
          state.stalls[index] = action.payload;
        }
      })
      .addCase(updateStallRevenue.fulfilled, (state, action) => {
        const index = state.stalls.findIndex(s => s.id === action.payload.id);
        if (index !== -1) {
          state.stalls[index] = action.payload;
        }
      });
  }
});

export const { 
  clearError, 
  setBranchFilters, 
  setStallFilters, 
  updateAnalytics 
} = storefrontSlice.actions;

export default storefrontSlice.reducer;