const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

/**
 * Universal helper for JSON REST requests
 */
async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMessage = data?.message || `Request failed with status ${response.status}`;
      throw new Error(errorMessage);
    }

    return data;
  } catch (error) {
    console.error(`API Error on ${endpoint}:`, error);
    throw error;
  }
}

export const api = {
  // Dashboard
  getStats: () => request('/dashboard/stats'),

  // Books
  getBooks: (search = '', category = '') => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (category && category !== 'All') params.append('category', category);
    const query = params.toString() ? `?${params.toString()}` : '';
    return request(`/books${query}`);
  },
  getBookById: (id) => request(`/books/${id}`),
  getCategories: () => request('/books/categories'),
  createBook: (bookData) =>
    request('/books', {
      method: 'POST',
      body: JSON.stringify(bookData)
    }),
  updateBook: (id, bookData) =>
    request(`/books/${id}`, {
      method: 'PUT',
      body: JSON.stringify(bookData)
    }),
  deleteBook: (id) =>
    request(`/books/${id}`, {
      method: 'DELETE'
    }),

  // Members
  getMembers: (search = '') => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    const query = params.toString() ? `?${params.toString()}` : '';
    return request(`/members${query}`);
  },
  getMemberById: (id) => request(`/members/${id}`),
  createMember: (memberData) =>
    request('/members', {
      method: 'POST',
      body: JSON.stringify(memberData)
    }),
  updateMember: (id, memberData) =>
    request(`/members/${id}`, {
      method: 'PUT',
      body: JSON.stringify(memberData)
    }),
  deleteMember: (id) =>
    request(`/members/${id}`, {
      method: 'DELETE'
    }),

  // Issues & Returns
  getIssues: (status = 'all', search = '') => {
    const params = new URLSearchParams();
    if (status && status !== 'all') params.append('status', status);
    if (search) params.append('search', search);
    const query = params.toString() ? `?${params.toString()}` : '';
    return request(`/issues${query}`);
  },
  issueBook: (issueData) =>
    request('/issues', {
      method: 'POST',
      body: JSON.stringify(issueData)
    }),
  returnBook: (issueId) =>
    request(`/issues/${issueId}/return`, {
      method: 'POST'
    })
};

export default api;
