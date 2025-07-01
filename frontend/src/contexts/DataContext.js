import React, { createContext, useState, useMemo } from 'react';
import { axiosAuthInstance } from '../services/axiosConfig';

export const DataContext = createContext();

export function DataProvider({ children }) {
  const [verticals, setVerticals] = useState([]);
  const [nodes, setNodes] = useState([]);
  const [fetchedVerticals, setFetchedVerticals] = useState(false);
  const [isUserfetched, setIsUserFetched] = useState(false);
  const [user, setUser] = useState(null);

  const USER_TYPES = {
    ADMIN: 1,
    VENDOR: 2,
    VENDOR_OPERATOR: 3
  };

  const fetchAllVerticals = () => {
    console.log('Fetching all verticals...');
    axiosAuthInstance.get('/verticals/verticals-all')
      .then((response) => {
        console.log('Response data:', response.data);
        const verticalsArray = response.data|| [];
        const verts = verticalsArray.map((element) => ({
          id: element.id,
          name: element.res_name,
          description: element.description,
          orid: element.orid,
          labels: element.labels,
          parameters: element.parameters,
          status:element.status,
          assigned:element.assigned,
          assigned_vendor: element.assigned_vendor
        }));
        console.log('Mapped Vertical Data:', verts);
        setVerticals(verts);
        setFetchedVerticals(true);
      })
      .catch((err) => {
        console.error('Error fetching verticals:', err);
        setVerticals([]);
        setFetchedVerticals(false);
      });
  };
  
  const fetchUser = () => {
    axiosAuthInstance
      .get('/user/profile')
      .then((response) => {
        setUser(response.data);
        setIsUserFetched(true);
      })
      .catch((error) => {
        console.error('Error fetching user data', error);
        setIsUserFetched(false);
        setUser(null);
      });
  };

  const value = useMemo(
    () => ({
      verticals,
      setVerticals,
      nodes,
      setNodes,
      fetchAllVerticals,
      fetchedVerticals,
      fetchUser,
      isUserfetched,
      setIsUserFetched,
      user,
      setUser,
      USER_TYPES
    }),
    [verticals, nodes, user]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}
