import CrudList from '../components/CrudList.jsx';

export default function Vehicles() {
  return (
    <CrudList
      title="Vehicles"
      endpoint="/vehicles"
      fields={[
        { key: 'clientId', label: 'Client ID' },
        { key: 'groupId', label: 'Group (fleet)' },
        { key: 'name', label: 'Name' },
        { key: 'plate', label: 'Plate' },
        { key: 'odometerKm', label: 'Odometer (km)' },
        { key: 'maintenanceDueAtKm', label: 'Maintenance due at (km)' },
      ]}
    />
  );
}
