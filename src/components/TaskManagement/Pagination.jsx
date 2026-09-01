import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTasks } from '../../context/TaskContext';

export const Pagination = () => {
  const { currentPage, setCurrentPage, totalPages, totalTasks, itemsPerPage } = useTasks();

  if (totalTasks === 0) return null;

  const startEntry = (currentPage - 1) * itemsPerPage + 1;
  const endEntry = Math.min(currentPage * itemsPerPage, totalTasks);

  const getPageNumbers = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div className="pagination-container">
      <div className="pagination-info">
        Showing <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{startEntry}</span> to{' '}
        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{endEntry}</span> of{' '}
        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{totalTasks}</span> entries
      </div>

      <div className="pagination-controls">
        <button
          className="page-btn"
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          aria-label="Previous Page"
        >
          <ChevronLeft size={16} />
        </button>

        {getPageNumbers().map((page) => (
          <button
            key={page}
            className={`page-btn ${page === currentPage ? 'active' : ''}`}
            onClick={() => setCurrentPage(page)}
          >
            {page}
          </button>
        ))}

        <button
          className="page-btn"
          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
          aria-label="Next Page"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};
