const TicketStatus = {
  AVAILABLE: 'available',
  SOLD: 'sold',
  REMOVED: 'removed'
};

const statusLabelMap = {
  [TicketStatus.AVAILABLE]: '可转让',
  [TicketStatus.SOLD]: '已转让',
  [TicketStatus.REMOVED]: '已移除'
};

const adminStatusLabelMap = {
  [TicketStatus.AVAILABLE]: '在售',
  [TicketStatus.SOLD]: '已售',
  [TicketStatus.REMOVED]: '已移除'
};

const VALID_STATUSES = Object.values(TicketStatus);

function getTicketStatusLabel(status, isAdmin = false) {
  const map = isAdmin ? adminStatusLabelMap : statusLabelMap;
  return map[status] || statusLabelMap[TicketStatus.AVAILABLE];
}

function isTicketAvailable(status) {
  return status === TicketStatus.AVAILABLE;
}

function isTicketSold(status) {
  return status === TicketStatus.SOLD;
}

function isTicketRemoved(status) {
  return status === TicketStatus.REMOVED;
}

function isValidTicketStatus(status) {
  return VALID_STATUSES.includes(status);
}

function canMarkAsSold(status, isOwner) {
  return isOwner && status === TicketStatus.AVAILABLE;
}

function canConfirmTicket(status, isOwner) {
  return !isOwner && status === TicketStatus.AVAILABLE;
}

function getTicketStatusBadgeClass(status) {
  return `status-badge status-${status}`;
}

const adminTicketStatusTabs = [
  { key: TicketStatus.AVAILABLE, label: '在售' },
  { key: TicketStatus.SOLD, label: '已售' },
  { key: TicketStatus.REMOVED, label: '已移除' }
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    TicketStatus,
    VALID_STATUSES,
    getTicketStatusLabel,
    isTicketAvailable,
    isTicketSold,
    isTicketRemoved,
    isValidTicketStatus,
    canMarkAsSold,
    canConfirmTicket,
    getTicketStatusBadgeClass,
    adminTicketStatusTabs
  };
}

export {
  TicketStatus,
  VALID_STATUSES,
  getTicketStatusLabel,
  isTicketAvailable,
  isTicketSold,
  isTicketRemoved,
  isValidTicketStatus,
  canMarkAsSold,
  canConfirmTicket,
  getTicketStatusBadgeClass,
  adminTicketStatusTabs
};
