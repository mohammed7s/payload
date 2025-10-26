import { useState, useEffect } from 'react';
import { buildApiUrl } from '@/lib/api';

interface Employee {
  id: string;
  name: string;
  email: string | null;
  railgunAddress: string;
  salary: string;
  tokenSymbol: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export function useEmployees(employerAddress: string | undefined) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEmployees = async () => {
    if (!employerAddress) {
      setEmployees([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(buildApiUrl(`api/employees/${employerAddress}`));
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch employees');
      }

      setEmployees(data.employees || []);
    } catch (err) {
      console.error('Error fetching employees:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch employees');
      setEmployees([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [employerAddress]);

  return {
    employees,
    isLoading,
    error,
    refetch: fetchEmployees,
  };
}
