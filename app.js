const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const SoundRepository = require('./repositories/sound-repository')
const RegisterRepository = require('./repositories/register-repository');
const { generateId } = require('./helper/generate-key');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
app.use(express.json());
const dayNameOfWeek = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

// Thư mục chứa file HTML và các tài liệu tĩnh
app.use(express.static(path.join(__dirname, 'public')));
// app.get("/", (req, res) => {
//   res.send("Express on Vercel");
// });
const driverConnectList = new Set();
const adminConnectList = new Set();
const getDataForDriver = async () => {
  const listClock = await RegisterRepository.getAllForDriver();
  let data = {
    type: 'driver-init',
    listClock
  }
  for (const item of data.listClock) {
    if (item.Sound && item.Sound.name) {
      item.Sound.name = item.Sound.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d")
    }
    item.week = JSON.parse(item.week);
  }
  return data;
}
const sendDataToDriver = (webSK, data) => {
  driverConnectList.forEach((client) => {
    if (client !== webSK && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}
// Xử lý kết nối WebSocket
wss.on('connection', async (ws, req) => {


  const name = 'Thiết bị không xác định';
  let driver;
  if (req.url.split('=')[0].substring(1) === "driver") {
    driverConnectList.add(ws);
    const dataForDriver = await getDataForDriver();
    ws.send(JSON.stringify(dataForDriver))
  } else {
    adminConnectList.add(ws);
    if (req.url.split('=')[1] === "sound") {
      const listSound = await SoundRepository.getAll();
      const data = {
        type: 'sound-init',
        data: listSound
      }
      ws.send(JSON.stringify(data))
    } else if (req.url.split('=')[1] === "clock") {
      const listSound = await SoundRepository.getAll();
      const listClock = await RegisterRepository.getAll();
      const data = {
        type: 'clock-init',
        data: {
          listSound: listSound,
          listClock: listClock
        }
      }
      ws.send(JSON.stringify(data))
    }
  }
  // Lắng nghe tin nhắn từ client
  ws.on('message', async (message) => {
    try {
      const signal = JSON.parse(`${message}`);
      console.log(signal);
      if (signal.code == "clock-edit-state") {
        try {
          const dataEdit = {
            state: signal.value.state
          }
          const editClock = await RegisterRepository.edit(signal.value.id, dataEdit);

          const dataForDriver = await getDataForDriver();
          sendDataToDriver(ws, dataForDriver);

        } catch (error) {
        }
      } else if (signal.code == "clock-edit-sound") {
        try {
          const dataEdit = {
            sound: signal.value.soundId
          }
          const editClock = await RegisterRepository.edit(signal.value.id, dataEdit);

          const dataForDriver = await getDataForDriver();
          sendDataToDriver(ws, dataForDriver);
        } catch (error) {
          const data = {
            type: "error",
          }
          data.message = "Có lỗi. Vui lòng tải lại trang và thao tác lại "
          ws.send(JSON.stringify(data))
        }
      } else if (signal.code == "clock-edit-time") {
        try {
          const dataEdit = {
            time: signal.value.time
          }
          const editClock = await RegisterRepository.edit(signal.value.id, dataEdit);
          const dataForDriver = await getDataForDriver();
          sendDataToDriver(ws, dataForDriver);
        } catch (error) {
          const data = {
            type: "error",
          }
          data.message = "Có lỗi. Vui lòng tải lại trang và thao tác lại "
          ws.send(JSON.stringify(data))
          const dataForDriver = await getDataForDriver();
          sendDataToDriver(ws, dataForDriver);
        }
      } else if (signal.code == "clock-edit-week") {
        try {
          const clock = await RegisterRepository.getById(signal.value.id);
          const week = JSON.parse(`${clock.week}`);
          if (signal.value.state) {
            week[dayNameOfWeek.indexOf(signal.value.name)] = 1
          } else {
            week[dayNameOfWeek.indexOf(signal.value.name)] = 0
          }

          const dataEdit = {
            week: week
          }
          const editClock = await RegisterRepository.edit(signal.value.id, dataEdit);
          const dataForDriver = await getDataForDriver();
          sendDataToDriver(ws, dataForDriver);
        } catch (error) {
          const data = {
            type: "error",
          }
          data.message = "Có lỗi. Vui lòng tải lại trang và thao tác lại "
          ws.send(JSON.stringify(data))
        }
      } else if (signal.code == "clock-delete") {
        try {
          const deletedClock = await RegisterRepository.delete(signal.value.id)
          if (deletedClock) {
          }
          const dataForDriver = await getDataForDriver();
          sendDataToDriver(ws, dataForDriver);
        } catch (error) {
          console.log(error)
          const data = {
            type: "error",
          }
          data.message = "Có lỗi. Vui lòng tải lại trang và thao tác lại "
          ws.send(JSON.stringify(data))
        }
      } else if (signal.code == "clock-add") {
        try {
          const currentTime = new Date();
          const hours = currentTime.getHours();
          const minutes = currentTime.getMinutes();
          const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
          const listSound = await SoundRepository.getAll();
          const addData = {
            id: generateId(),
            time: formattedTime,
            state: false,
            week: [0, 0, 0, 0, 0, 0, 0]
          }
          if (listSound.length === 0) {
            addData.sound = null;
          } else {
            addData.sound = listSound[0].id;
          }
          const newClock = await RegisterRepository.add(addData)
          const data = {
            type: "new-clock",
            data: newClock
          }
          ws.send(JSON.stringify(data))
        } catch (error) {
          console.log(error);
          const data = {
            type: "error",
          }
          data.message = "Có lỗi. Vui lòng tải lại trang và thao tác lại "
          ws.send(JSON.stringify(data))
        }
      } else if (signal.code == "sound-play") {
        try {
          const data = {
            type: "sound-play-esp",
            data: {
              "sound-id": signal.value.id,
              "sound-name": signal.value.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d")
            }
          }
          driverConnectList.forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify(data));
            }
          });
        } catch (error) {
          console.log(error)
        }
      } else if (signal.code == "sound-delete") {
        try {
          const deletedSound = await SoundRepository.delete(signal.value.id)
          const dataForDriver = await getDataForDriver();
          sendDataToDriver(ws, dataForDriver);
        } catch (error) {
          console.log(error)
        }
      } else if (signal.code == "sound-add") {
        try {
          if (!Number.isNaN(Number(signal.value.id))) {
            const newSound = await SoundRepository.add(signal.value)
            const data = {
              type: "new-sound",
              data: newSound
            }
            ws.send(JSON.stringify(data))
          } else {
            const data = {
              type: "error",
            }
            data.message = "Mã âm thanh là một số. "
            ws.send(JSON.stringify(data))
          }

        } catch (error) {
          console.log(error.errors[0].message);
          const data = {
            type: "error",
          }
          if (error.errors[0].message === "id must be unique") {
            data.message = "Không được đặt trùng tên ID"
          } else {
            data.message = "Lỗi khác"
          }
          ws.send(JSON.stringify(data))
        }

      } else if (signal.code == "sound-edit") {
        try {
          if (!Number.isNaN(Number(signal.value.id))) {
            const soundEdit = {
              id: signal.value.id,
              name: signal.value.name
            }
            const newSound = await SoundRepository.edit(signal.value.oldId, soundEdit);
            const dataForDriver = await getDataForDriver();
            sendDataToDriver(ws, dataForDriver);
          } else {
            const data = {
              type: "error",
            }
            data.message = "Mã âm thanh là một số. Vui lòng tải lại trang và thao tác lại "
            ws.send(JSON.stringify(data))
          }

        } catch (error) {
          console.log(error.errors[0].message);
          const data = {
            type: "error",
          }
          if (error.errors[0].message === "id must be unique") {
            data.message = "Không được đặt trùng tên ID. Vui lòng tải lại trang và thao tác lại"
          } else {
            data.message = "Có lỗi. Vui lòng tải lại trang và thao tác lại "
          }
          ws.send(JSON.stringify(data))
        }


      }
    } catch (error) {
      console.log(error);
    }
  });
  ws.on('close', () => {
    driverConnectList.delete(ws);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
