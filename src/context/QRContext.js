import React, { createContext, useContext, useState } from 'react';

const QRContext = createContext();

export const QRProvider = ({ children }) => {
  const [scannedBatchId, setScannedBatchId] = useState(null);
  const [scannedFromRole, setScannedFromRole] = useState(null);
  const [scanningRole, setScanningRoleState] = useState(null); // Current role attempting to scan
  const [completedRoles, setCompletedRoles] = useState({}); // Track completed roles per batch

  const setScannedData = (batchId, fromRole) => {
    setScannedBatchId(batchId);
    setScannedFromRole(fromRole);
  };

  const clearScannedData = () => {
    setScannedBatchId(null);
    setScannedFromRole(null);
  };

  const setScanningRole = (role) => {
    setScanningRoleState(role);
  };

  const markRoleCompleted = (batchId, role) => {
    setCompletedRoles(prev => ({
      ...prev,
      [batchId]: {
        ...prev[batchId],
        [role]: true
      }
    }));
  };

  const isRoleCompleted = (batchId, role) => {
    return completedRoles[batchId]?.[role] || false;
  };

  const getNextAllowedRole = (batchId) => {
    const completed = completedRoles[batchId] || {};
    
    // Define the supply chain order
    const roles = ['Farmer', 'Distributor', 'Retailer', 'Consumer'];
    
    // Find the first role that hasn't completed
    for (const role of roles) {
      if (!completed[role]) {
        return role;
      }
    }
    
    return null; // All roles completed
  };

  const canRoleScan = (batchId, role) => {
    const nextAllowedRole = getNextAllowedRole(batchId);
    return nextAllowedRole === role;
  };

  return (
    <QRContext.Provider
      value={{
        scannedBatchId,
        scannedFromRole,
        scanningRole,
        completedRoles,
        setScannedData,
        clearScannedData,
        setScanningRole,
        markRoleCompleted,
        isRoleCompleted,
        getNextAllowedRole,
        canRoleScan,
      }}
    >
      {children}
    </QRContext.Provider>
  );
};

export const useQR = () => {
  const context = useContext(QRContext);
  if (!context) {
    throw new Error('useQR must be used within a QRProvider');
  }
  return context;
};
