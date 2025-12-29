import { Button } from '@/components/ui/button';
import { getOwner, getOwnerDocuments, getVehiclesByOwner, uploadOwnerDocument } from '@/lib/api';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

export default function OwnerDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [owner, setOwner] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [docType, setDocType] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!id) return;
    getOwner(id).then(setOwner);
    getOwnerDocuments(id).then(setDocuments);
    getVehiclesByOwner(id).then(setVehicles);
  }, [id]);

  const handleUpload = async (e) => {
    e.preventDefault();
    setUploading(true);
    try {
      await uploadOwnerDocument(id, { doc_type: docType, file_url: fileUrl });
      setDocType('');
      setFileUrl('');
      setDocuments(await getOwnerDocuments(id));
    } finally {
      setUploading(false);
    }
  };

  if (!owner) return <div>Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-2">Owner Details</h1>
      <div className="mb-4">
        <div><b>Name:</b> {owner.full_name}</div>
        <div><b>Phone:</b> {owner.phone || 'N/A'}</div>
        <div><b>Address:</b> {owner.address || 'N/A'}</div>
        <div><b>TIN:</b> {owner.tin_number || 'N/A'}</div>
        <div><b>FAN:</b> {owner.fan_number || 'N/A'}</div>
        <Button onClick={() => navigate(`/admin/owners/${id}/edit`)} className="mt-2">Edit Owner</Button>
      </div>
      <h2 className="text-xl font-semibold mt-6 mb-2">Documents</h2>
      <form onSubmit={handleUpload} className="mb-4 flex gap-2 items-end">
        <div>
          <label>Type</label>
          <input value={docType} onChange={e => setDocType(e.target.value)} className="border px-2 py-1" required />
        </div>
        <div>
          <label>File URL</label>
          <input value={fileUrl} onChange={e => setFileUrl(e.target.value)} className="border px-2 py-1" required />
        </div>
        <Button type="submit" disabled={uploading}>{uploading ? 'Uploading...' : 'Upload'}</Button>
      </form>
      <ul className="mb-6">
        {documents.length === 0 && <li className="text-muted-foreground">No documents uploaded.</li>}
        {documents.map(doc => (
          <li key={doc.id} className="mb-2 border-b pb-2">
            <div><b>Type:</b> {doc.doc_type}</div>
            <div><b>Status:</b> {doc.status}</div>
            <div><b>File:</b> <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">View</a></div>
            {doc.rejection_reason && <div className="text-red-600">Rejected: {doc.rejection_reason}</div>}
          </li>
        ))}
      </ul>
      <h2 className="text-xl font-semibold mb-2">Vehicles Owned</h2>
      <ul>
        {vehicles.length === 0 && <li className="text-muted-foreground">No vehicles registered.</li>}
        {vehicles.map(v => (
          <li key={v.id} className="mb-2">
            <Link to={`/admin/vehicles/${v.id}`} className="text-blue-600 underline">{v.plate_number} ({v.side_number || 'No side #'})</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
