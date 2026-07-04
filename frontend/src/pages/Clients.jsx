import CrudList from '../components/CrudList.jsx';

export default function Clients() {
  return (
    <CrudList
      title="Clients"
      endpoint="/clients"
      fields={[
        { key: 'name', label: 'Company name' },
        { key: 'contactNumber', label: 'Contact number' },
        { key: 'address', label: 'Address' },
      ]}
    />
  );
}
