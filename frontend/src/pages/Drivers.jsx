import CrudList from '../components/CrudList.jsx';

export default function Drivers() {
  return (
    <CrudList
      title="Drivers"
      endpoint="/drivers"
      fields={[
        { key: 'clientId', label: 'Client ID' },
        { key: 'name', label: 'Name' },
        { key: 'phoneNumber', label: 'Phone number' },
        { key: 'score', label: 'Score' },
      ]}
    />
  );
}
