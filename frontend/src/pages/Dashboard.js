import React, { useState, useEffect } from 'react';
import {
  Typography, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, TextField, MenuItem, Stack
} from '@mui/material';
import UserLayout from '../layouts/UserLayout';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import AddIcon from '@mui/icons-material/Add';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import { format, toZonedTime } from 'date-fns-tz';
import AccessTimeIcon from '@mui/icons-material/AccessTime';


const sections = {
  Analytics: ['Redshift', 'Synapse', 'BigQuery'],
  Compute: ['EC2 Web Server', 'VM Scale Set', 'Compute Engine', 'Droplet'],
  Containers: ['EKS Cluster', 'AKS', 'GKE'],
  Database: ['RDS MySQL', 'Cosmos DB', 'Cloud SQL'],
  Networking: ['VPC', 'Virtual Network', 'VPC Network'],
  Security: ['WAF', 'Sentinel', 'Security Command'],
  Serverless: ['Lambda Function', 'Azure Functions', 'Cloud Functions'],
  Storage: [],
};

const providers = ['AWS', 'Azure', 'GCP', 'OCI'];



const formatIST = (date) => {
  try {
    if (!date) return '-';
    const timeZone = 'Asia/Kolkata';
    const zonedDate = toZonedTime(new Date(date), timeZone);
    if (isNaN(zonedDate)) return '-'; // Handle invalid dates
    return format(zonedDate, 'dd MMMM yyyy, h:mm a', { timeZone });
  } catch (err) {
    console.error('Invalid date passed to formatIST:', date);
    return '-';
  }
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [resources, setResources] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [serviceRequests, setServiceRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [modalData, setModalData] = useState(null);
  const [modalType, setModalType] = useState('');
  const [noteInput, setNoteInput] = useState('');
 const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState('all');
  const [selectedSection, setSelectedSection] = useState('all');
  const [search, setSearch] = useState('');
const [selectedRegion, setSelectedRegion] = useState('all');

  const excludedFields = ['__v', 'additionalInfo', 'createdBy', 'updatedBy', 'createdAt', 'updatedAt'];
  const email = localStorage.getItem('email')?.toLowerCase();
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  const tenantId = localStorage.getItem('tenantId');
const displayName = localStorage.getItem('name'); // ✅ Get the user’s name

  const fetchData = async () => {
    try {
      if (!tenantId || !token || !email) {
        console.error('Missing tenantId, token, or email');
        return;
      }

      const emailPrefix = email.split('@')[0];

      const [resourceRes, incidentRes, serviceRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/resources/user?tenantId=${tenantId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`http://localhost:5000/api/incidents/user/name/${email}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`http://localhost:5000/api/service-requests/user/${emailPrefix}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setResources(Array.isArray(resourceRes.data) ? resourceRes.data : []);
      setIncidents(Array.isArray(incidentRes.data) ? incidentRes.data : []);
      setServiceRequests(Array.isArray(serviceRes.data) ? serviceRes.data : []);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const intervalId = setInterval(fetchData, 30000); // Fetch every 30 seconds
    return () => clearInterval(intervalId);
  }, []);

  const openDetails = (type, item) => {
    setModalData(item);
    setModalType(type);
    setOpenModal(true);
    setNoteInput('');
  };
const regions = [...new Set(resources.map(res => res.region))].filter(Boolean);

  const handleNoteSubmit = async () => {
    if (!noteInput.trim()) return;

    const endpoint = modalType === 'incidents'
      ? `http://localhost:5000/api/incidents/notes/${modalData._id}`
      : `http://localhost:5000/api/service-requests/notes/${modalData._id}`;

    try {
      await axios.post(endpoint, {
        text: noteInput,
        addedBy: displayName,
        addedByEmail: email,
        role:role
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setModalData(prev => ({
        ...prev,
        notes: [
          ...(prev.notes || []),
          {
            text: noteInput,
            addedBy: displayName,
            addedByEmail: email,
            addedAt: new Date().toISOString(),
          }
        ],
      }));

      setNoteInput('');
    } catch (err) {
      console.error('Failed to submit note:', err);
    }
  };

  const filteredResources = resources.filter(res => {
  const providerMatch = selectedProvider === 'all' || res.provider === selectedProvider;
  
  let sectionMatch = true;
  if (selectedSection !== 'all') {
    if (selectedSection === 'Compute') {
      sectionMatch = res.type === 'Compute';
    } else if (selectedSection === 'Network') {
      sectionMatch = res.type === 'VM';
    }
  }

  const regionMatch = selectedRegion === 'all' || res.region === selectedRegion;
  const searchMatch = search === '' || res.name.toLowerCase().includes(search.toLowerCase());

  return providerMatch && sectionMatch && regionMatch && searchMatch;
});


const autofitColumns = (data) => {
  const keys = Object.keys(data[0] || {});
  return keys.map((key) => ({
    wch: Math.max(
      key.length + 2,
      ...data.map((row) => (row[key] ? row[key].toString().length : 0)),
      12
    )
  }));
};

const exportDashboardReport = () => {
  const workbook = XLSX.utils.book_new();

  const pad = (n) => n.toString().padStart(2, '0');
  const formatDate = (date) =>
    `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()}`;

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  const todayDate = today.getDate();
  const isAfter9AM = today.getHours() >= 9;

  // 1️⃣ Combine Incidents & Service Requests
  const combinedData = [];

  incidents.forEach((inc) => {
    combinedData.push({
      'Date': formatDate(new Date(inc.createdAt)),
      'incident: id': inc.incidentId || '',
      'Service Requests:ID': '',
      'Logged': inc.status?.toLowerCase() === 'logged' ? 'LOGGED' : '',
      'Opened': inc.status?.toLowerCase() === 'opened' ? 'OPENED' : '',
      'Resolved': inc.status?.toLowerCase() === 'resolved' ? 'RESOLVED' : '',
      'Remarks': inc.description || '',
      'ADDITIONAL INFO': inc.additionalInfo || '-',
      'Deadline': inc.deadline ? formatDate(new Date(inc.deadline)) : ''
    });
  });

  serviceRequests.forEach((sr) => {
    combinedData.push({
      'Date': formatDate(new Date(sr.createdAt)),
      'incident: id': '',
      'Service Requests:ID': sr.requestId || '',
      'Logged': sr.status?.toLowerCase() === 'logged' ? 'LOGGED' : '',
      'Opened': sr.status?.toLowerCase() === 'opened' ? 'OPENED' : '',
      'Resolved': sr.status?.toLowerCase() === 'resolved' ? 'RESOLVED' : '',
      'Remarks': sr.dbName || '',
      'ADDITIONAL INFO': sr.additionalInfo || '',
      'Deadline': sr.deadline ? formatDate(new Date(sr.deadline)) : ''
    });
  });

  const incidentSheet = XLSX.utils.json_to_sheet(combinedData);
  incidentSheet['!cols'] = autofitColumns(combinedData);
  XLSX.utils.book_append_sheet(workbook, incidentSheet, 'Incidents & Requests');

  // 2️⃣ Health Check Resource Report
  const monthDates = [];
  for (let day = 1; day < todayDate; day++) {
    const date = new Date(currentYear, currentMonth, day);
    monthDates.push(formatDate(date));
  }
  if (isAfter9AM) {
    monthDates.push(formatDate(today));
  }

  const monthKey = `${today.toLocaleString('default', { month: 'short' })}-${currentYear}`;
  const headers = [
    'Sr. No',
    'Resource',
    'Compartment',
    'Health Check Activity',
    ...monthDates,
  ];

  const data = resources.map((res, index) => {
    const row = {
      'Sr. No': index + 1,
      Resource: res.name || 'instance',
      Compartment: res.tenantName || 'Unknown',
      'Health Check Activity': res.name || '',
    };

    monthDates.forEach((d) => {
      let status = 'Stopped';
      if (res.status === 'Active' || res.status === 'Idle') {
        status = 'OK';
      } else if (res.status === 'Terminated') {
        status = 'Stopped';
      }
      row[d] = status;
    });

    return row;
  });

  const resourceSheet = XLSX.utils.json_to_sheet(data, { header: headers });
  resourceSheet['!cols'] = autofitColumns(data);
  XLSX.utils.book_append_sheet(workbook, resourceSheet, monthKey);

  // 💾 Download Excel
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
  saveAs(blob, 'Health_Check_Report.xlsx');
};

// Optional: Preview table render logic (unchanged)
const handleViewExcelSheet = () => {
  setPreviewOpen(true);
};

const renderTable = (title, data) => (
  <Box sx={{ mb: 4 }}>
    <Typography variant="h6" gutterBottom>{title}</Typography>
    <TableContainer component={Paper}>
      <Table size="small">
        <TableHead>
          <TableRow>
            {Object.keys(data[0] || {}).map((key, idx) => (
              <TableCell key={idx}>{key}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((row, rowIndex) => (
            <TableRow key={rowIndex}>
              {Object.values(row).map((val, idx) => (
                <TableCell key={idx}>{String(val)}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  </Box>
);

  return (
    <UserLayout>
      <Box sx={{ marginLeft: '260px', marginTop: '60px', maxWidth: '1000px', marginRight: 'auto', marginBottom: '40px' }}>
        <Typography variant="h4" gutterBottom>Dashboard Report</Typography>
      {loading ? (
        <CircularProgress />
      ) : (
        <>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <Button variant="contained" color="primary" onClick={exportDashboardReport}>
              Download Health Check Report
            </Button>
            <Button variant="outlined" color="secondary" onClick={handleViewExcelSheet}>
              View Excel Sheet
            </Button>
          </Box>
        </>
      )}

      {/* Preview Modal */}
      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="xl" fullWidth>
        <DialogTitle>Excel Sheet Preview</DialogTitle>
        <DialogContent dividers>
          {resources.length > 0 && renderTable('Resources', resources)}
          {incidents.length > 0 && renderTable('Incidents', incidents)}
          {serviceRequests.length > 0 && renderTable('Service Requests', serviceRequests)}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    


        <Box sx={{ mb: 3 }}>
          <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
            <TextField
              select
              label="Provider"
              size="small"
              sx={{ width: 180 }}
              value={selectedProvider}
              onChange={e => setSelectedProvider(e.target.value)}
            >
              <MenuItem value="all">All Providers</MenuItem>
              {providers.map(prov => (
                <MenuItem key={prov} value={prov}>{prov}</MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Section"
              size="small"
              sx={{ width: 180 }}
              value={selectedSection}
              onChange={e => setSelectedSection(e.target.value)}
            >
              <MenuItem value="all">All Sections</MenuItem>
              {Object.keys(sections).map(section => (
                <MenuItem key={section} value={section}>{section}</MenuItem>
              ))}
            </TextField>
            <TextField
  select
  label="Region"
  size="small"
  sx={{ width: 180 }}
  value={selectedRegion}
  onChange={e => setSelectedRegion(e.target.value)}
>
  <MenuItem value="all">All Regions</MenuItem>
  {regions.map(region => (
    <MenuItem key={region} value={region}>{region}</MenuItem>
  ))}
</TextField>

            <TextField
              size="small"
              placeholder="Search resources..."
              sx={{ flex: 1 }}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </Stack>
        </Box>

        {loading ? (
          <CircularProgress />
        ) : (
          <>
            {/* Resources Table */}
            <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
              <Typography variant='h6'>Resources</Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Provider</TableCell>
                      <TableCell>Cost</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredResources.map(res => (
                      <TableRow key={res._id}>
                        <TableCell>{res.name}</TableCell>
                        <TableCell>{res.provider}</TableCell>
                        <TableCell>{res.cost}</TableCell>
                        <TableCell>{res.status}</TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1}>
                            <Button
                              variant="outlined"
                              onClick={() => openDetails('resources', res)}
                            >
                              View
                            </Button>
                            <Button
                              variant="contained"
                              
                              onClick={() => navigate(`/incidents?resourceId=${res._id}&resourceName=${encodeURIComponent(res.name)}&provider=${encodeURIComponent(res.provider)}`)}
                            >
                              <AddIcon />
                              <ReportProblemIcon />

                            </Button>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>

            {/* Incidents Table */}
            <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
              <Typography variant='h6'>Incidents</Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Incident ID</TableCell>
                      <TableCell>Summary</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Deadline</TableCell>
                      <TableCell>Actions</TableCell>

                    </TableRow>
                  </TableHead>
                  <TableBody>
  {incidents.map(incident => (
    <TableRow key={incident._id}>
      <TableCell>{incident.incidentId}</TableCell>
      <TableCell>{incident.summary}</TableCell>
      <TableCell>{incident.status}</TableCell>
      <TableCell>
        {incident.deadline && (
          <Stack direction="row" alignItems="center" spacing={1}>
            <AccessTimeIcon fontSize="small" color="action" />
            <Typography variant="body2">
              {formatIST(incident.deadline)}
            </Typography>
          </Stack>
        
          
        )}
      </TableCell>
      <TableCell>
        <Button onClick={() => openDetails('incidents', incident)}>View</Button>
      </TableCell>
    </TableRow>
  ))}
</TableBody>

                </Table>
              </TableContainer>
            </Paper>

            {/* Service Requests Table */}
            <Paper elevation={3} sx={{ p: 3 }}>
              <Typography variant='h6'>Service Requests</Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Request ID</TableCell>
                      <TableCell>Admin Name</TableCell>
                      <TableCell>Status</TableCell>
                         <TableCell>Deadline</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
 <TableBody>
  {serviceRequests.map(req => (
    <TableRow key={req._id}>
      <TableCell>{req.requestId}</TableCell>
      <TableCell>{req.adminName}</TableCell>
      <TableCell>{req.status}</TableCell>
      <TableCell>
        {req.deadline && (
          <Stack direction="row" alignItems="center" spacing={1}>
            <AccessTimeIcon fontSize="small" color="action" />
            <Typography variant="body2">
              {formatIST(req.deadline)}
            </Typography>
          </Stack>
        
        )}
      </TableCell>
      <TableCell>
        <Button onClick={() => openDetails('service-requests', req)}>View</Button>
      </TableCell>
    </TableRow>
  ))}
</TableBody>

                </Table>
              </TableContainer>
            </Paper>


  
            {/* Details Modal */}
            <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth>
              <DialogTitle>Details</DialogTitle>
              <DialogContent dividers>
                {modalData ? (
                  <>
                    {Object.entries(modalData)
                      .filter(([key]) => !excludedFields.includes(key) && key !== 'notes')
                      .map(([key, value]) => (
                        <Box key={key} sx={{ mb: 2 }}>
                          <Typography variant="body2" fontWeight="bold">{key}:</Typography>
                          <Typography>
  {typeof value === 'string' &&
  (key.toLowerCase().includes('date') || key.toLowerCase().includes('at') || key.toLowerCase().includes('deadline'))
    ? formatIST(value)
    : String(value)}
</Typography>

                        </Box>
                      ))}

                    {modalType === 'resources' && (
                      <Box sx={{ mt: 3 }}>
                        <Stack direction="row" spacing={2}>
                          <Button
                            variant="contained"
                            color="error"
                            onClick={() => {
                              setOpenModal(false);
                              navigate(`/incidents?resourceId=${modalData._id}&resourceName=${encodeURIComponent(modalData.name)}&provider=${encodeURIComponent(modalData.provider)}`);
                            }}
                          >
                            Create Incident
                          </Button>
                          
                        </Stack>
                      </Box>
                    )}

                    {modalType !== 'resources' && modalData.notes?.length > 0 && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2">Previous Notes:</Typography>
                        {modalData.notes.map((note, idx) => {
                          const isCurrentUser = note.addedByEmail?.toLowerCase() === email;
                          const addedByDisplay = isCurrentUser ? `You (${note.addedByEmail})` : `${note.addedBy} (${note.addedByEmail})`;
                          return (
                            <Box key={idx} sx={{ mb: 1 }}>
                              <Typography variant="body2">
                                <strong>Added by:</strong> {addedByDisplay}, {new Date(note.addedAt).toLocaleString()}
                              </Typography>
                              <Typography sx={{ ml: 2 }}>{note.text}</Typography>
                            </Box>
                          );
                        })}
                      </Box>
                    )}

                    {modalType !== 'resources' && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle1">Add Note</Typography>
                        <textarea
                          value={noteInput}
                          onChange={e => setNoteInput(e.target.value)}
                          rows={3}
                          style={{
                            width: '100%',
                            padding: '8px',
                            borderRadius: '4px',
                            border: '1px solid #ccc',
                            marginTop: '8px'
                          }}
                          placeholder="Write your note here..."
                        />
                        <Button
                          variant="contained"
                          sx={{ mt: 1 }}
                          onClick={handleNoteSubmit}
                          disabled={!noteInput.trim()}
                        >
                          Submit Note
                        </Button>
                      </Box>
                    )}
                  </>
                ) : (
                  <CircularProgress />
                )}
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setOpenModal(false)}>Close</Button>
              </DialogActions>
            </Dialog>
          </>
        )}
      </Box>
    </UserLayout>
  );
};

export default Dashboard;


