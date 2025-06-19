import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, CircularProgress,
  Select, MenuItem, FormControl, InputLabel, Button,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import axios from 'axios';
import { PieChart, Pie, Tooltip, ResponsiveContainer } from 'recharts';
import AdminLayout from '../layouts/AdminLayout';
import { formatDistanceToNow, isPast } from 'date-fns';
import { format, toZonedTime } from 'date-fns-tz';

const extractNameFromEmail = (email) =>
  email?.split('@')[0]?.toLowerCase().replace(/\s+/g, '');

const extractNameFromId = (id) =>
  id?.split(/[\d-]/)[0]?.toLowerCase().replace(/\s+/g, '');

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

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [selectedUserEmail, setSelectedUserEmail] = useState('');
  const [incidents, setIncidents] = useState([]);
  const [serviceRequests, setServiceRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [modalData, setModalData] = useState(null);
  const [modalType, setModalType] = useState('');
  const [action, setAction] = useState('');
  const [noteInput, setNoteInput] = useState('');
  const token = localStorage.getItem('token');
  const adminEmail = localStorage.getItem('email');

  const excludedFields = ['__v', 'notes'];

  // Open modal and update status to 'opened' with deadline if currently 'logged'
  const openDetails = async (type, item) => {
    setModalType(type);
    setModalData(item);
    setAction(item?.actionTaken || '');
    setNoteInput('');
    setOpenModal(true);

    if (item.status.toLowerCase() === 'logged') {
      const url =
        type === 'incident'
          ? `http://localhost:5000/api/incidents/edit/${item._id}`
          : `http://localhost:5000/api/service-requests/edit/${item._id}`;

      try {
        const deadline = new Date();
        deadline.setDate(deadline.getDate() + 1); // 1 day deadline from now

        await axios.put(
          url,
          { status: 'opened', deadline },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const updatedItem = { ...item, status: 'opened', deadline };
        setModalData(updatedItem);

        if (type === 'incident') {
          setIncidents((prev) =>
            prev.map((i) => (i._id === item._id ? updatedItem : i))
          );
        } else {
          setServiceRequests((prev) =>
            prev.map((r) => (r._id === item._id ? updatedItem : r))
          );
        }


      if (item.createdBy) {
  await axios.post(
    'http://localhost:5000/api/notifications',
    {
      recipientId: item.createdBy,
      recipientType: 'user',
      type: type === 'incident' ? 'incident_viewed' : 'service_request_viewed',
      message: `Your ${type === 'incident' ? 'incident' : 'service request'} with ID ${type === 'incident' ? item.incidentId : item.requestId} has been opened by admin.`,
    },
    { headers: { Authorization: `Bearer ${token}` } }
  );
} else {
  console.warn(`Skipping notification: No createdBy found for ${type} ${item._id}`);
}

        
      } catch (error) {
        console.error('Error updating status to opened:', error);
      }
    }
  };

  // Submit new note for incident or service request
  const handleNoteSubmit = async () => {
    if (!noteInput.trim()) return;

    const endpoint =
      modalType === 'incident'
        ? `http://localhost:5000/api/incidents/notes/${modalData._id}`
        : `http://localhost:5000/api/service-requests/notes/${modalData._id}`;

    try {
      await axios.post(
        endpoint,
        {
          text: noteInput,
          addedBy: 'admin',
          addedByEmail: adminEmail,
        role: "admin",
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setModalData((prev) => ({
        ...prev,
        notes: [
          ...(prev.notes || []),
          {
            text: noteInput,
            addedBy: 'admin',
            addedByEmail: adminEmail,
            addedAt: new Date(),
          },
        ],
      }));
      setNoteInput('');
    } catch (err) {
      console.error('Failed to submit note:', err);
    }
  };

  // Save action taken on incident or service request
  const handleAction = async () => {
    try {
      const url =
        modalType === 'incident'
          ? `http://localhost:5000/api/incidents/action/${modalData._id}`
          : `http://localhost:5000/api/service-requests/action/${modalData._id}`;

      await axios.put(
        url,
        { action },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert('Action saved successfully.');

      const updated = { ...modalData, actionTaken: action };
      setModalData(updated);

      if (modalType === 'incident') {
        setIncidents((prev) =>
          prev.map((i) => (i._id === modalData._id ? updated : i))
        );
      } else {
        setServiceRequests((prev) =>
          prev.map((r) => (r._id === modalData._id ? updated : r))
        );
      }

      setOpenModal(false);
    } catch (error) {
      console.error('Failed to submit action:', error);
      alert('Failed to submit action.');
    }
  };

  // Fetch all users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/admin/users', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsers(res.data);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };
    fetchUsers();
  }, [token]);

  // Fetch incidents and service requests, filter by selected user if applicable
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const incidentRes = await axios.get(
          'http://localhost:5000/api/incidents/all',
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const srRes = await axios.get('http://localhost:5000/api/service-requests', {
          headers: { Authorization: `Bearer ${token}` },
        });

        let filteredIncidents = incidentRes.data || [];
        let filteredRequests = srRes.data || [];

        if (selectedUserEmail) {
          const selectedName = extractNameFromEmail(selectedUserEmail);
          filteredIncidents = filteredIncidents.filter(
            (inc) => extractNameFromId(inc.incidentId) === selectedName
          );
          filteredRequests = filteredRequests.filter(
            (req) => extractNameFromId(req.requestId) === selectedName
          );
        }

        setIncidents(filteredIncidents);
        setServiceRequests(filteredRequests);
      } catch (error) {
        console.error('Error fetching data:', error);
        setIncidents([]);
        setServiceRequests([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedUserEmail, token]);

  
  // Calculate time left for deadline
  const getTimeLeftString = (deadline) => {
  if (!deadline) return 'No deadline set';
  
  const deadlineDate = typeof deadline === 'string' ? new Date(deadline) : deadline;
  
  if (isPast(deadlineDate)) {
    return `${formatDistanceToNow(deadlineDate, { addSuffix: true })} (Deadline passed)`;
  }

  return `Due ${formatDistanceToNow(deadlineDate, { addSuffix: true })}`;
};


  return (
    <AdminLayout>
      <Box sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          Admin Dashboard
        </Typography>

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel id="select-user-label">Select User</InputLabel>
          <Select
            labelId="select-user-label"
            value={selectedUserEmail}
            onChange={(e) => setSelectedUserEmail(e.target.value)}
            label="Select User"
          >
            <MenuItem value="">All Users</MenuItem>
            {users.map((user) => (
              <MenuItem key={user._id} value={user.email}>
                {user.email}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {loading ? (
          <CircularProgress />
        ) : (
          <>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Incidents', value: incidents.length },
                    { name: 'Service Requests', value: serviceRequests.length },
                  ]}
                  dataKey="value"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  label
                />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>

            <Typography variant="h6" sx={{ mt: 4 }}>
              Incidents
            </Typography>
            <TableContainer component={Paper} sx={{ mb: 4 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Incident ID</TableCell>
                    <TableCell>Summary</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>
      <Box display="flex" alignItems="center">
        <AccessTimeIcon fontSize="small" sx={{ mr: 0.5 }} />
        Deadline
      </Box>
    </TableCell>
                    <TableCell>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {incidents.map((incident) => (
                    <TableRow key={incident._id}>
                      <TableCell>{incident.incidentId}</TableCell>
                      <TableCell>{incident.summary}</TableCell>
                      <TableCell>{incident.status}</TableCell>
                      <TableCell>
        {['opened', 'logged'].includes(incident.status.toLowerCase()) && incident.deadline
          ? formatIST(incident.deadline)
          : '-'}
      </TableCell>
                      <TableCell>
                        <Button onClick={() => openDetails('incident', incident)}>
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Typography variant="h6">Service Requests</Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Request ID</TableCell>
                    <TableCell>Database Name</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>
      <Box display="flex" alignItems="center">
        <AccessTimeIcon fontSize="small" sx={{ mr: 0.5 }} />
        Deadline
      </Box>
    </TableCell>
                    <TableCell>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {serviceRequests.map((request) => (
                    <TableRow key={request._id}>
                      <TableCell>{request.requestId}</TableCell>
                      <TableCell>{request.dbName}</TableCell>
                      <TableCell>{request.status}</TableCell>
                       <TableCell>
        {['opened', 'logged'].includes(request.status.toLowerCase()) && request.deadline
          ? formatIST(request.deadline)
          : '-'}
      </TableCell>
                      <TableCell>
                        <Button onClick={() => openDetails('service-request', request)}>
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Modal Dialog */}
            <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="md" fullWidth>
              <DialogTitle>
                {modalType === 'incident' ? 'Incident Details' : 'Service Request Details'}
              </DialogTitle>
              <DialogContent dividers>
                {modalData ? (
                  <div>
                    {/* Display editable/non-editable fields */}
                    {Object.entries(modalData)
                      .filter(([key]) => !excludedFields.includes(key) && key !== 'notes')
                      .map(([key, value]) => {
                        const isEditable =
                          (modalType === 'incident' &&
                            ['urgency', 'description'].includes(key)) ||
                          (modalType === 'service-request' &&
                            ['dbName', 'adminName', 'ip', 'permission'].includes(key));

                        return (
                          <Box key={key} sx={{ mb: 2 }}>
                            <Typography variant="body2" fontWeight="bold" sx={{ textTransform: 'capitalize' }}>
                              {key}:
                            </Typography>
                            {isEditable ? (
                              <TextField
                                fullWidth
                                value={modalData[key] || ''}
                                onChange={(e) =>
                                  setModalData((prev) => ({ ...prev, [key]: e.target.value }))
                                }
                                size="small"
                              />
                            ) : (
                              <Typography>
  {key.toLowerCase().includes('date') || key.toLowerCase().includes('at')|| key.toLowerCase() === 'deadline'
    ? formatIST(value)
    : String(value)}
</Typography>


                            )}
                          </Box>
                        );
                      })}

                    {/* Deadline with timeline and clock icon */}
                    {modalData.deadline && (
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          mb: 3,
                          mt: 1,
                        }}
                      >
                        <AccessTimeIcon
                          color={new Date() > new Date(modalData.deadline) ? 'error' : 'primary'}
                          sx={{ mr: 1 }}
                        />
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            Deadline:
                          </Typography>
                          <Typography
  variant="body2"
  fontWeight="medium"
  color={new Date() > new Date(modalData.deadline) ? 'error' : 'primary'}
>
  {getTimeLeftString(modalData.deadline)}
</Typography>

                        </Box>
                      </Box>
                    )}

                    {/* Previous notes */}
                    {modalData.notes?.length > 0 && (
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Previous Notes:
                        </Typography>
                        <ul style={{ paddingLeft: '1.2em' }}>
                          {modalData.notes.map((n) => {
                            const isAdmin = n.addedByEmail === adminEmail;
                            const addedByLabel = isAdmin
                              ? `you (${n.addedByEmail})`
                              : `user (${n.addedByEmail})`;

                            return (
                              <li key={n._id || Math.random()} style={{ marginBottom: '6px' }}>
                                <strong>Added by: {addedByLabel}</strong> (
                                {new Date(n.addedAt).toLocaleString()}):<br />
                                {n.text}
                              </li>
                            );
                          })}
                        </ul>
                      </Box>
                    )}

                    {/* Add new note */}
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="subtitle1">Add Note</Typography>
                      <textarea
                        value={noteInput}
                        onChange={(e) => setNoteInput(e.target.value)}
                        rows={3}
                        style={{
                          width: '100%',
                          padding: '8px',
                          borderRadius: '4px',
                          border: '1px solid #ccc',
                          marginTop: '8px',
                          resize: 'vertical',
                          fontFamily: 'inherit',
                        }}
                        placeholder="Write your note here..."
                      />
                      <Button
                        variant="contained"
                        onClick={handleNoteSubmit}
                        sx={{ mt: 1 }}
                        disabled={!noteInput.trim()}
                      >
                        Submit Note
                      </Button>
                    </Box>

                    {/* Action input */}
                    <Box sx={{ mt: 3 }}>
                      <TextField
                        fullWidth
                        multiline
                        minRows={3}
                        value={action}
                        onChange={(e) => setAction(e.target.value)}
                        placeholder="Enter action..."
                        label="Action Taken"
                      />
                    </Box>
                  </div>
                ) : (
                  <CircularProgress />
                )}
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setOpenModal(false)}>Cancel</Button>
                <Button
                  variant="outlined"
                  onClick={async () => {
                    try {
                      const endpoint =
                        modalType === 'incident'
                          ? `http://localhost:5000/api/incidents/edit/${modalData._id}`
                          : `http://localhost:5000/api/service-requests/edit/${modalData._id}`;

                      const allowedFields =
                        modalType === 'incident'
                          ? {
                              summary: modalData.summary,
                              description: modalData.description,
                              urgency: modalData.urgency,
                              status:modalData.status,
                              deadline:modalData.deadline,
                            }
                          : {
                              dbName: modalData.dbName,
                              adminName: modalData.adminName,
                              ip: modalData.ip,
                              permission: modalData.permission,
                              status:modalData.status,
                              deadline:modalData.deadline,
                            };

                      await axios.put(endpoint, allowedFields, {
                        headers: { Authorization: `Bearer ${token}` },
                      });

                      alert('Updated successfully.');
                    } catch (err) {
                      console.error('Error updating item:', err);
                      alert('Failed to update item.');
                    }
                  }}
                >
                  Update
                </Button>
                <Button variant="contained" onClick={handleAction}>
                  Save Action
                </Button>
              </DialogActions>
            </Dialog>
          </>
        )}
      </Box>
    </AdminLayout>
  );
};

export default AdminDashboard;
