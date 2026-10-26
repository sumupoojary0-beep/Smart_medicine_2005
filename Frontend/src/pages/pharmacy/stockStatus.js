/** How a stock row's status is shown (badge variant + label) on the Inventory page. */
export const STATUS_CONFIG = {
  available: { variant: 'success', label: 'Available' },
  low:       { variant: 'warning', label: 'Low Stock' },
  critical:  { variant: 'danger',  label: 'Critical' },
  out:       { variant: 'danger',  label: 'Out of Stock' },
  expiring:  { variant: 'warning', label: 'Expiring Soon' },
}