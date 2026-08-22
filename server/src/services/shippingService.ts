/**
 * DEMO SHIPPING SERVICE
 * This is a mock integration demonstrating how a real shipping API
 * (e.g. Delhivery, Shiprocket, FedEx) would be integrated.
 * Replace trackOrder() with actual API calls in production.
 */

export interface ShipmentStatus {
  orderId: string;
  trackingId: string;
  carrier: string;
  status: string;
  currentLocation: string;
  estimatedDelivery: string;
  lastUpdated: string;
  events: Array<{
    timestamp: string;
    location: string;
    description: string;
  }>;
  isDemo: true;
}

const MOCK_STATUSES = [
  'Out for Delivery',
  'In Transit',
  'Shipment Picked Up',
  'Delivered',
  'Processing at Hub',
];

const MOCK_CARRIERS = ['Delhivery', 'BlueDart', 'Ecom Express', 'DTDC', 'India Post'];
const MOCK_CITIES = [
  'Mumbai Sorting Hub',
  'Delhi Distribution Centre',
  'Bangalore Warehouse',
  'Chennai Facility',
  'Hyderabad Hub',
];

function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' });
}

function hoursAgo(hours: number): string {
  const d = new Date();
  d.setHours(d.getHours() - hours);
  return d.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Tracks a shipment by order ID.
 * [DEMO] Returns deterministic mock data based on orderId.
 * Plug in Delhivery/Shiprocket/FedEx API here for production.
 */
export async function trackOrder(orderId: string): Promise<ShipmentStatus> {
  // Deterministic hash so same orderId always returns same carrier/status
  const hash = orderId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const statusIdx = hash % MOCK_STATUSES.length;
  const carrierIdx = hash % MOCK_CARRIERS.length;
  const cityIdx = hash % MOCK_CITIES.length;

  const status = MOCK_STATUSES[statusIdx]!;
  const carrier = MOCK_CARRIERS[carrierIdx]!;
  const city = MOCK_CITIES[cityIdx]!;
  const trackingId = `${carrier.toUpperCase().replace(/\s/g, '').slice(0, 3)}${orderId.replace(/\D/g, '').padEnd(8, '0').slice(-8)}`;
  const isDelivered = status === 'Delivered';
  const eta = isDelivered ? 'Already Delivered' : daysFromNow(hash % 3 === 0 ? 1 : 2);

  return {
    orderId,
    trackingId,
    carrier,
    status,
    currentLocation: city,
    estimatedDelivery: eta,
    lastUpdated: hoursAgo(hash % 6),
    events: [
      {
        timestamp: hoursAgo(hash % 6),
        location: city,
        description: status,
      },
      {
        timestamp: hoursAgo((hash % 6) + 12),
        location: MOCK_CITIES[(cityIdx + 1) % MOCK_CITIES.length]!,
        description: 'Shipment in transit between facilities',
      },
      {
        timestamp: hoursAgo((hash % 6) + 24),
        location: MOCK_CITIES[(cityIdx + 2) % MOCK_CITIES.length]!,
        description: 'Shipment picked up by courier',
      },
    ],
    isDemo: true,
  };
}
