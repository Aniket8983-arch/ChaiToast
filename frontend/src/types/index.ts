/**
 * SmartWaste 360 — TypeScript Interfaces
 * Single source of truth for all data types matching the backend schemas.
 */

export type BinCategory = 'BIO' | 'NONBIO' | 'MIXED'
export type BinStatus    = 'ONLINE' | 'OFFLINE' | 'FULL' | 'MAINTENANCE'
export type DataSource   = 'SIMULATED' | 'REAL'

export interface Bin {
  id:               string
  label:            string
  location_address: string | null
  location_lat:     number
  location_lng:     number
  zone:             string
  category:         BinCategory
  capacity_liters:  number
  current_fill_pct: number
  status:           BinStatus
  device_id:        string | null
  created_at:       string
  updated_at:       string | null
}

export type VehicleType   = 'COMPACT' | 'MEDIUM' | 'LARGE'
export type VehicleStatus = 'AVAILABLE' | 'ASSIGNED' | 'EN_ROUTE' | 'COLLECTING' | 'RETURNING' | 'OFFLINE' | 'MAINTENANCE'

export interface Vehicle {
  id:                  string
  registration:        string
  vehicle_type:        VehicleType
  capacity_liters:     number
  current_load_liters: number
  status:              VehicleStatus
  driver_id:           string | null
  location_lat:        number | null
  location_lng:        number | null
  location_source:     DataSource
  location_updated_at: string | null
  odometer_km:         number
  fuel_percent:        number
  created_at:          string
}

export type PickupStatus = 'SCHEDULED' | 'ASSIGNED' | 'IN_TRANSIT' | 'ARRIVED' | 'COLLECTED' | 'COMPLETED' | 'CANCELLED'
export type PickupPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'

export interface Pickup {
  id:                 string
  bin_id:             string | null
  establishment:      string | null
  location:           string | null
  waste_category:     BinCategory
  estimated_quantity: number
  scheduled_date:     string
  scheduled_time:     string | null
  priority:           PickupPriority
  assigned_vehicle:   string | null
  assigned_driver:    string | null
  vehicle_id:         string | null
  driver_id:          string | null
  status:             PickupStatus
  created_at:         string
  updated_at:         string | null
}

export type DriverStatus = 'ON_DUTY' | 'OFF_DUTY' | 'ON_LEAVE'

export interface Driver {
  id:                  string
  name:                string
  phone:               string | null
  license_number:      string | null
  status:              DriverStatus
  assigned_vehicle_id: string | null
  compliance_score:    number
  created_at:          string
}

export type AlertType     = 'BIN_ALMOST_FULL' | 'BIN_FULL' | 'BIN_OFFLINE' | 'MISSED_PICKUP' | 'DELAYED_PICKUP' | 'VEHICLE_UNAVAILABLE' | 'LOW_CONFIDENCE_SCAN' | 'DEVICE_OFFLINE'
export type AlertSeverity = 'INFO' | 'WARNING' | 'CRITICAL'

export interface Alert {
  id:              string
  alert_type:      AlertType
  severity:        AlertSeverity
  title:           string
  message:         string
  entity_type:     string | null
  bin_id:          string | null
  vehicle_id:      string | null
  device_id:       string | null
  job_id:          string | null
  acknowledged:    boolean
  acknowledged_at: string | null
  resolved:        boolean
  resolved_at:     string | null
  created_at:      string
}

export type ClassificationLabel = 'BIO' | 'NONBIO'

export interface Classification {
  id:               string
  label:            ClassificationLabel
  confidence:       number
  raw_score:        number
  image_filename:   string | null
  hardware_sent:    boolean
  hardware_command: string | null
  hardware_mode:    DataSource
  bin_id:           string | null
  classified_at:    string
}

export interface ClassificationSummary {
  total_today:          number
  bio_count:            number
  nonbio_count:         number
  avg_confidence:       number
  hardware_sends_today: number
}

export interface SensorReading {
  id:              string
  bin_id:          string
  device_id:       string | null
  fill_percent:    number
  fill_liters:     number | null
  raw_distance_cm: number | null
  data_source:     DataSource
  recorded_at:     string
  created_at:      string
}

export interface DashboardOverview {
  total_bins:                  number
  bins_online:                 number
  bins_warning:                number
  bins_critical:               number
  active_jobs:                 number
  vehicles_available:          number
  today_classifications:       number
  today_bio_count:             number
  today_nonbio_count:          number
  today_waste_collected_liters: number
  compliance_score:            number
  unresolved_alerts:           number
  simulation_active:           boolean
  as_of:                       string
}

export interface AlertCount {
  total_unresolved: number
  info:             number
  warning:          number
  critical:         number
}

export interface DeviceStatus {
  id:               string
  device_label:     string
  device_type:      string
  firmware_version: string
  serial_port:      string | null
  baud_rate:        number
  sensor_mode:      DataSource
  status:           'ONLINE' | 'OFFLINE' | 'ERROR'
  last_seen:        string | null
  last_command:     string | null
  uptime_seconds:   number
  total_commands:   number
}
