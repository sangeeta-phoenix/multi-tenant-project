import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Table, TableHead, TableRow, TableCell,
  TableBody, TableContainer, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, Stack, useMediaQuery
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { format, toZonedTime } from 'date-fns-tz';

const formatIST = (date) => {
  if (!date) return '-';
  const timeZone = 'Asia/Kolkata';
  const zonedDate = toZonedTime(new Date(date), timeZone);
  return format(zonedDate, 'dd MMMM yyyy, h:mm a', { timeZone });
};

const DashboardView = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const query = new URLSearchParams(location.search);
  const type = query.get('type');
  const typeValue = query.get('typeValue');
  const token = localStorage.getItem('token');
  const email = localStorage.getItem('email');
  const tenantId = localStorage.getItem('tenantId');
  const displayName = localStorage.getItem('name');
  const role = localStorage.getItem('role');

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [modalData, setModalData] = useState(null);
  const [noteInput, setNoteInput] = useState('');

  const excludedFields = ['__v', 'createdBy', 'updatedBy', 'createdAt', 'updatedAt'];

  const fetchData = async () => {
    try {
      if (type === 'resource') {
        const res = await axios.get(`http://localhost:5000/api/resources/user?tenantId=${tenantId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const filtered = res.data.filter(r => r.type?.toLowerCase().includes(typeValue.toLowerCase()));
        setData(filtered);
      } else if (type === 'incident') {
        const res = await axios.get(`http://localhost:5000/api/incidents/user/name/${email}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setData(res.data);
      } else if (type === 'service-request') {
        const prefix = email.split('@')[0];
        const res = await axios.get(`http://localhost:5000/api/service-requests/user/${prefix}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setData(res.data);
      }
    } catch (err) {
      console.error('Error loading dashboard view data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [type, typeValue]);

  const openDetails = (item) => {
    setModalData(item);
    setOpenModal(true);
    setNoteInput('');
  };

  const modalType = type === 'service-request' ? 'service-requests' : type === 'incident' ? 'incidents' : 'resources';

  const handleNoteSubmit = async () => {
    if (!noteInput.trim() || !modalData) return;

    const endpoint = modalType === 'incidents'
      ? `http://localhost:5000/api/incidents/notes/${modalData._id}`
      : `http://localhost:5000/api/service-requests/notes/${modalData._id}`;

    try {
      await axios.post(endpoint, {
        text: noteInput,
        addedBy: displayName,
        addedByEmail: email,
        role,
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

  return (
    <Box sx={{ p: isMobile ? 1 : 3 }}>
      <Typography variant={isMobile ? "h6" : "h5"} gutterBottom>
        {type === 'resource' ? `${typeValue} Resources` : type === 'incident' ? 'Incidents' : 'Service Requests'}
      </Typography>

      {loading ? (
        <Typography>Loading...</Typography>
      ) : type === 'resource' ? (
        <Paper elevation={3} sx={{ p: 2, mb: 4, overflowX: 'auto' }}>

          <TableContainer component={Box} sx={{ width: '100%', overflowX: 'auto' }}>
  <Table size={isMobile ? 'small' : 'medium'} sx={{ minWidth: 600 }}>

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
                {data.map(res => (
                  <TableRow key={res._id}>
                    <TableCell>{res.name}</TableCell>
                    <TableCell>{res.provider}</TableCell>
                    <TableCell>{res.cost}</TableCell>
                   <TableCell>
  <Box sx={{ display: 'flex', alignItems: 'center' }}>
    <Box
      sx={{
        width: 10,
        height: 10,
        borderRadius: '50%',
        bgcolor:
          res.status === 'Active'
            ? 'green'
            : res.status === 'Idle'
            ? 'orange'
            : res.status === 'Terminated'
            ? 'red'
            : 'gray',
        mr: 1,
      }}
    />
    {res.status}
  </Box>
</TableCell>

                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => openDetails(res)}
                        >
                          View
                        </Button>
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => navigate(
                            `/incidents?resourceId=${res._id}&resourceName=${encodeURIComponent(res.name)}&provider=${encodeURIComponent(res.provider)}`
                          )}
                          disabled={res.status === 'Terminated'}
                          startIcon={<AddIcon />}
                        >
                          <ReportProblemIcon fontSize="small" />
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      ) : (
        <Paper sx={{ p: 2, overflowX: 'auto' }}>
          <TableContainer component={Box} sx={{ minWidth: isMobile ? 600 : 'auto' }}>
            <Table size={isMobile ? "small" : "medium"}>
              <TableHead>
                <TableRow>
                  {data[0] &&
                    Object.keys(data[0])
                      .filter(k => !excludedFields.includes(k))
                      .slice(0, 4)
                      .map(k => <TableCell key={k}>{k}</TableCell>)}
                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.map((row, idx) => (
                  <TableRow key={idx}>
                    {Object.entries(row)
                      .filter(([k]) => !excludedFields.includes(k))
                      .slice(0, 4)
                      .map(([k, v]) => (
                        <TableCell key={k}>{String(v)}</TableCell>
                      ))}
                    <TableCell>
                      <Button size="small" onClick={() => openDetails(row)}>View</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Modal */}
      <Dialog
        open={openModal}
        onClose={() => setOpenModal(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Details</DialogTitle>
        <DialogContent dividers>
          {modalData ? (
            <>
              {Object.entries(modalData)
                .filter(([key]) => !excludedFields.includes(key) && key !== 'notes')
                .map(([key, value]) => (
                  <Box key={key} sx={{ mb: 2 }}>
                    <Typography variant="body2" fontWeight="bold">{key}:</Typography>
                    <Typography variant="body2">
                      {typeof value === 'string' &&
                        (key.toLowerCase().includes('date') || key.toLowerCase().includes('at') || key.toLowerCase().includes('deadline'))
                        ? formatIST(value)
                        : String(value)}
                    </Typography>
                  </Box>
                ))}

              {modalType === 'resources' && modalData.status !== 'Terminated' && (
                <Box sx={{ mt: 3 }}>
                  <Button
                    variant="contained"
                    color="error"
                    fullWidth={isMobile}
                    onClick={() => {
                      setOpenModal(false);
                      navigate(`/incidents?resourceId=${modalData._id}&resourceName=${encodeURIComponent(modalData.name)}&provider=${encodeURIComponent(modalData.provider)}`);
                    }}
                  >
                    Create Incident
                  </Button>
                </Box>
              )}

              {modalType === 'resources' && modalData.status === 'Terminated' && (
                <Typography color="error" sx={{ mt: 3 }}>
                  Cannot create incident for a terminated resource.
                </Typography>
              )}

              {modalType !== 'resources' && modalData?.notes?.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2">Previous Notes:</Typography>
                  {modalData.notes.map((note, idx) => {
                    const isCurrentUser = note.addedByEmail?.toLowerCase() === email;
                    const addedByDisplay = isCurrentUser ? `You (${note.addedByEmail})` : `${note.addedBy} (${note.addedByEmail})`;
                    return (
                      <Box key={idx} sx={{ mb: 1 }}>
                        <Typography variant="body2">
                          <strong>Added by:</strong> {addedByDisplay}, {formatIST(note.addedAt)}
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
                    fullWidth={isMobile}
                    onClick={handleNoteSubmit}
                    disabled={!noteInput.trim()}
                  >
                    Submit Note
                  </Button>
                </Box>
              )}
            </>
          ) : (
            <Typography>Loading...</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenModal(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DashboardView;
