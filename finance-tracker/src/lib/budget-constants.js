// src/lib/budget-constants.js

export const CATEGORIES = [
  "Rent",            // Added
  "Travel",          // Added
  "Subscriptions", 
  "Groceries", 
  "Food", 
  "Cat", 
  "Transportation", 
  "Bills", 
  "Fun", 
  "Miscellaneous", 
  "Uber Eats", 
  "Shopping", 
  // "Uncategorized" // Removed from display list
].sort(); // Optional: Alphabetize

export const MONTHS = [
  "January", "February", "March", "April", "May", "June", 
  "July", "August", "September", "October", "November", "December"
];

export const YEARS = [2024, 2025, 2026];

export const formatCurrency = (val) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
};