
const { exec } = require('child_process');
const { configureSocketPort } = require('pigpio');
configureSocketPort(8889);

//something about memory leaks *shrug*
require('events').EventEmitter.prototype._maxListeners = 20;

let i = 0;
let recording;
let streaming;

const raspi = require('raspi-io');
const five = require('johnny-five');
const board = new five.Board({io: new raspi.RaspiIO()});

board.on("ready", () => {
    console.log('board is ready');

   //start stream
/*  let command = `raspivid -l -o - -t 0 -vf -hf -w 640 -h 480 -fps 15 -n | cvlc -vvv stream:///dev/stdin --sout '#rtp{sdp=rtsp://:8554/stream,proto=udp,rtcp-mux}' :demux=h264 vlc://quit`;
  let stream = exec(command, (err, stdout, stderr) => {
      if (err) {
      console.error(`exec error: ${err}`);
      return;
      }
    });
      streaming = true;
    stream.on('exit', () => {
     console.log('streaming on port 8554');
    });*/

  const microwave = new five.Sensor.Digital(7);

  microwave.on("change", () => {

    console.log(microwave.value);
     //kill stream
     if (streaming === true) {
      console.log('motion detected... terminating stream');
     let ctlc = 'killall raspivid';
     let killer = exec(ctlc, (err, stdout, stderr) => {
      if (err) {
            console.error(`exec error: ${err}`);
            return;
          };
        });

        killer.on('exit', () => {
          console.log('kill process executed');
        });
              streaming = false;
          } else if (recording === true) {
      console.log('recording already in progress, ignoring new motion');
      return;
    };
          recording = true;
    console.log('motionstart');

    //record
      let filename = 'vid_'+i+'.h264';
      let recCommand = 'raspivid -t 15000 -vf -hf -w 640 -h 480 -sh 20 -ex auto -a 12 -o /home/pi/motion/video/vid_'+i+'.h264';
      let record = exec(recCommand, (err, stdout, stderr) => {
              if (err) {
                      console.error(`exec error: ${err}`);
                      return;
              };
      });

      console.log('recording: 15secs');


      record.on('exit', (code) => {
        recording = false;
        streaming = true;
        command = `raspivid -l -o - -t 0 -vf -hf -w 640 -h 480 -sh 20 -ex auto -n | cvlc -vvv stream:///dev/stdin --sout '#rtp{sdp=rtsp://:8554/stream,proto=udp,rtcp-mux}' :demux=h264 vlc://quit`;
        stream = exec(command, (err, stdout, stderr) => {
         if (err) {
         console.error(`exec error: ${err}`);
         return;
         }

        });
        let now = Date.now();
        let day = new Date(now);
        let timestamp = day.toString();
        console.log(timestamp+ 'A video is being saved as '+filename+' with exit code, ' + code);
              console.log('streaming on port 8554');
        });
        i++;
      });
    });
