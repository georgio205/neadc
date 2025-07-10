import React, { useState } from 'react';
import { ChevronUpIcon, ChevronDownIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface Column {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: any) => React.ReactNode;
}

interface DataTableProps {
  data: any[];
  columns: Column[];
  onRowClick?: (row: any) => void;
  onEdit?: (row: any) => void;
  onDelete?: (row: any) => void;
  searchable?: boolean;
  sortable?: boolean;
  className?: string;
}

const DataTable: React.FC<DataTableProps> = ({
  data,
  columns,
  onRowClick,
  onEdit,
  onDelete,
  searchable = true,
  sortable = true,
  className = ''
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Filter data based on search term
  const filteredData = data.filter(row =>
    Object.values(row).some(value =>
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // Sort data
  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortColumn) return 0;

    const aValue = a[sortColumn];
    const bValue = b[sortColumn];

    if (aValue === bValue) return 0;

    const comparison = aValue < bValue ? -1 : 1;
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const handleSort = (columnKey: string) => {
    if (!sortable) return;

    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (columnKey: string) => {
    if (sortColumn !== columnKey) {
      return <ChevronUpIcon className="h-4 w-4 text-gray-400" />;
    }
    return sortDirection === 'asc' ? (
      <ChevronUpIcon className="h-4 w-4 text-blue-500" />
    ) : (
      <ChevronDownIcon className="h-4 w-4 text-blue-500" />
    );
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      active: 'bg-red-100 text-red-800',
      resolved: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      available: 'bg-green-100 text-green-800',
      responding: 'bg-blue-100 text-blue-800',
      busy: 'bg-orange-100 text-orange-800',
      maintenance: 'bg-gray-100 text-gray-800'
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityColors = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800'
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityColors[priority as keyof typeof priorityColors] || 'bg-gray-100 text-gray-800'}`}>
        {priority.toUpperCase()}
      </span>
    );
  };

  const getTypeIcon = (type: string) => {
    const icons = {
      medical: '🏥',
      fire: '🔥',
      police: '🚨',
      traffic: '🚦',
      ems: '🚑',
      other: '⚠️'
    };
    return icons[type as keyof typeof icons] || '⚠️';
  };

  return (
    <div className={`bg-white shadow-sm rounded-lg overflow-hidden ${className}`}>
      {/* Search Bar */}
      {searchable && (
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                    column.sortable && sortable ? 'cursor-pointer hover:bg-gray-100' : ''
                  }`}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.label}</span>
                    {column.sortable && sortable && getSortIcon(column.key)}
                  </div>
                </th>
              ))}
              {(onEdit || onDelete) && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedData.map((row, index) => (
              <tr
                key={row.id || index}
                className={`hover:bg-gray-50 ${onRowClick ? 'cursor-pointer' : ''}`}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((column) => (
                  <td key={column.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {column.render ? (
                      column.render(row[column.key], row)
                    ) : (
                      <div>
                        {column.key === 'status' && getStatusBadge(row[column.key])}
                        {column.key === 'priority' && getPriorityBadge(row[column.key])}
                        {column.key === 'type' && (
                          <div className="flex items-center space-x-2">
                            <span className="text-lg">{getTypeIcon(row[column.key])}</span>
                            <span className="capitalize">{row[column.key]}</span>
                          </div>
                        )}
                        {!['status', 'priority', 'type'].includes(column.key) && row[column.key]}
                      </div>
                    )}
                  </td>
                ))}
                {(onEdit || onDelete) && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center space-x-2">
                      {onEdit && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit(row);
                          }}
                          className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                        >
                          Edit
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(row);
                          }}
                          className="text-red-600 hover:text-red-900 text-sm font-medium"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {sortedData.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg font-medium">No data found</div>
          {searchTerm && (
            <div className="text-gray-500 text-sm mt-2">
              No results for "{searchTerm}"
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DataTable;