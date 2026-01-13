const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const cors = require('cors');
const fighters = require('./routes/firefighters');
const equipmentRoutes = require('./routes/equipment');
const locationsRouter = require('./routes/locations');
const vehiclesRouter = require('./routes/vehicles');
const stationEquipmentRouter = require('./routes/station-equipment');
const ranksRouter = require('./routes/ranks');
const groupsRouter = require('./routes/groups');
const trainingsRouter = require('./routes/trainings');
const languagesRouter = require('./routes/languages');
const firefightersExtendedRouter = require('./routes/firefighters-extended');
const alarmsRouter = require('./routes/alarms');
const reportsRouter = require('./routes/reports');
const notificationsRouter = require('./routes/notifications');
const alarmResponseRouter = require('./routes/alarm-response');
const medicalItemsRouter = require('./routes/medical-items');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/firefighters', fighters);

app.use('/api/firefighters-extended', firefightersExtendedRouter);

app.use('/api/ranks', ranksRouter);

app.use('/api/groups', groupsRouter);

app.use('/api/trainings', trainingsRouter);

app.use('/api/languages', languagesRouter);

app.use('/api/equipment', equipmentRoutes);

app.use('/api/location', locationsRouter);

app.use('/api/vehicles', vehiclesRouter);

app.use('/api/station-equipment', stationEquipmentRouter);

app.use('/api/alarms', alarmsRouter);

app.use('/api/reports', reportsRouter);

app.use('/api/notifications', notificationsRouter);

app.use('/api/alarm-response', alarmResponseRouter);

app.use('/api/medical-items', medicalItemsRouter);

app.get('/', (req, res) => res.json({ ok: true, message: 'OSP server running' }));

const PORT = parseInt(process.env.PORT || '4000', 10);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on port ${PORT}`);
});
