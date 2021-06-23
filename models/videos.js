module.exports = function(app) {
	'use strict';

    const Video = app.get('models').Video;

    const Sequelize = require('sequelize');
    const Sequelizito = app.get('sequelize');

	var request = require('request');
	var querystring = require('querystring');
	const Promise = require('promise');
	const config = require('../config');
	const utils = require('../utils/utils')();
	const async = require('async');
	const moment = require('moment');
    const _ = require('lodash');

    const http = require('https');
    const fs = require('fs');
    const editly = require('editly');
    const ffmpeg = require('fluent-ffmpeg');
    const execFile = require('child_process').execFile;
    const crypto = require('crypto');

    var produce_log = {logs:[]};

    function saveLog(label){
        produce_log.logs.push({label: label, date: new Date()});
        console.log("saveLog: " + JSON.stringify({label: label, date: new Date()}));
    }

    function mediaUpdate(token, data) {

        return new Promise((resolve, reject) => {

            var data_update = {
                author_name: data.author_name,
                author_city: data.author_city,
                url_video_raw: data.url_video_raw
            };

            console.log("token: " + token);
            console.log("data_update: " + JSON.stringify(data_update));

            Video.update(data_update, {
                where: {
                    token: token
                }
            }).then(videoUpdated => {
                console.log("videoUpdated: " + videoUpdated);
                if(videoUpdated >= 1){
                    resolve(true);

                    Video.findOne({
                        where: {
                            token: token
                        }
                    }).then(videoData => {
                        startVideoProduce(videoData, data);
                    });

                }else{
                    resolve(false);
                }
            });

        })
    }

    function mediaSign() {

        return new Promise((resolve, reject) => {

            let flow = async () => {
                var created = false;
				while(created == false){
                    var result = await generateSign();
                    if(result.status){
                        created = true;
                        return result.token
                    }
                }
            }
            flow().then((token) => {
                resolve(token);
            });
        })
    }

    function generateSign(){
        return new Promise((resolve, reject) => {
            crypto.randomBytes(48, function(err, buffer) {
                var token = buffer.toString('hex');
                Video.findOrCreate({
                    where: {
                        token: token
                    },
                    defaults: {
                        token: token
                    }
                }).then(videoData => {	
                    if(videoData[1]){
                        resolve({status: true, token: token});
                    }else{
                        resolve({status: false, token: token});
                    }
                });

            });
        });
    }

    function getMedia(token) {

        return new Promise((resolve, reject) => {

            Video.findOne({
                where: {
                    token: token
                }
            }).then(videoData => {	
                resolve(videoData);
            });
        })
    }

    function createVideo(data) {

        return new Promise((resolve, reject) => {

            saveLog("start createVideo");

            Video.create(data).then(videoCreated => {	
                resolve(videoCreated);
                startVideoProduce(videoCreated, data);
            });

        })
    }

    function startVideoProduce(videoCreated, data){
        new Promise((resolve, reject) => {

            saveLog("start startVideoProduce");
            
            let flow = async () => {

                var file_path = "./produce/" + data.video_file_name;

                saveLog("start downloadVideo");

                var result = await downloadVideo(videoCreated.url_video_raw, file_path, downloadVideoCallback);
                console.log("downloadVideo result: " + JSON.stringify(result));
                
                if(data.video_file_name.match(".webm")){

                    saveLog("start convertToMp4");

                    await convertToMp4(file_path);
                    data.video_file_name = data.video_file_name + ".mp4";
                    file_path = file_path + ".mp4";
                }

                saveLog("start createVideoMasterEdited");
                await createVideoMasterEdited(file_path, data.video_file_name, videoCreated);

                saveLog("start generateCoverImage");
                var edited_file_path = "./produce/edited" + data.video_file_name;
                await generateCoverImage(edited_file_path);

                saveLog("start generateGif");
                await generateGif(edited_file_path);

                saveLog("end");

                /*
                try {
                    fs.unlinkSync(path)
                    //file removed
                } catch(err) {
                    console.error(err)
                }*/

                return true;               
            }
            
            flow().then((value) => {
                console.log("startVideoProduce: " + value)
            });	
            
        })
        
    }

    function downloadVideo(url, dest, cb){
        return new Promise(function (resolve, reject) {
            var file = fs.createWriteStream(dest);
            var request = http.get(url, function(response) {
                response.pipe(file);
                file.on('finish', function() {
                    file.close(cb);  // close() is async, call cb after close completes.
                    resolve({status: true});
                });
            }).on('error', function(err) { // Handle errors
                fs.unlink(dest); // Delete the file async. (But we don't check the result)
                if (cb) cb(err.message);
                resolve({status: false, err: err.message});
            });
        })
    }

    function downloadVideoCallback(err, data) {
        if (err) return console.error(err);
        //console.log(data.toString());
    }

    function createVideoMasterEdited(file_path, file_name, video_data){

        return new Promise(function (resolve, reject) {

            async function func({ width, height, fabric }) {
    
                var rectName = new fabric.Rect({
                    originX: 'center',
                    originY: 'center',
                    left: width / 2,
                    top: (height * 87) / 100,
                    fill: 'black',
                    width: 0,
                    height: 150,
                    rx:80,
                    ry:80
                });
                var textName = new fabric.Text(video_data.author_name, {
                    originX: 'center',
                    originY: 'center',
                    left: width / 2,
                    top: (height * 87) / 100,
                    fontSize: 40,
                    fontWeight: 800,
                    textAlign: 'center',
                    fill: 'white',
                    fontFamily: 'Open Sans'
                });
                var textCity = new fabric.Text(video_data.author_city, {
                    originX: 'center',
                    originY: 'center',
                    left: width / 2,
                    top: (height * 85) / 100,
                    fontSize: 30,
                    fontWeight: 800,
                    textAlign: 'center',
                    fill: 'white',
                    fontFamily: 'Open Sans'
                });
                var textDate = new fabric.Text("Março 2, 2021", {
                    originX: 'center',
                    originY: 'center',
                    left: width / 2,
                    top: (height * 88) / 100,
                    fontSize: 30,
                    fontWeight: 800,
                    textAlign: 'center',
                    fill: 'white',
                    fontFamily: 'Open Sans'
                });
                async function onRender(progress, canvas) {
        
                    var progressAux = progress * 100;
        
                    if(progressAux <= 5.67){
        
                        var progressRectOpen = (progressAux * 100) / 5.67;
                        rectName.set('width', (800 * progressRectOpen) / 100);
                        canvas.add(rectName);
        
                        if(progressRectOpen >= 90){
                            canvas.add(textName);
                        }
                    }else if(progressAux > 5.67 && progressAux <= 33.33){
        
                        rectName.set('width', 800);
                        canvas.add(rectName);
                        canvas.add(textName);
        
                    }else if(progressAux > 33.33 && progressAux <= 55.56){
        
                        rectName.set('width', 800);
                        canvas.add(rectName);
                        canvas.add(textCity);
                        canvas.add(textDate);
        
                        var fab_video = new fabric.Image("./hypnomaster.mp4", {left: width / 2, top: height / 2, width: 200, height: 200});
                        canvas.add(fab_video);
        
                    }else if(progressAux > 55.56 && progressAux <= 61.23){
        
                        var progressRestTotal = 61.23 - 55.56; 
                        var progressRectClose = (  ( progressAux - 55.56 )  * 100) / progressRestTotal;
                        rectName.set('width', 800 - (800 * progressRectClose) / 100);
                        canvas.add(rectName);
                        
                        if(progressRectClose <= 50){
                            canvas.add(textCity);
                            canvas.add(textDate);
                        }
        
                    }else if(progressAux > 61.23){
                        /*
                        var videoClone = fabric.util.object.clone(canvas.item(0));
                        videoClone.set("width", 800);
                        videoClone.set("height", 1100);
                        videoClone.set("left", width / 2);
                        videoClone.set("top", height / 2);
                        videoClone.set("originX", 'center');
                        videoClone.set("originY", 'center');
                        videoClone.set("strokeLineCap", "round");
                        videoClone.set("strokeLineJoin", "round");
                        videoClone.set("strokeWidth", 40);
                        videoClone.set("rx", 80);
                        videoClone.set("ry", 80);
                        //videoClone.set("stroke", "#000");
                        canvas.add(videoClone);
                        canvas.renderAll();
                        
                        canvas.item(1).bringToFront();
                        try {
                            var object = canvas.item(0);
                            var filter = new fabric.Image.filters.Blur({
                                blur: 0.5
                            });
                            object.filters.push(filter);
                            object.applyFilters();
                            canvas.renderAll();
                        } catch (error) {
                            console.log("error c: " + error);
                        }*/
                    }
        
                }
            
                function onClose() {
                // Cleanup if you initialized anything
                }
            
                return { onRender, onClose };
            }

            let flow = async () => {

                var master_script = require("./script_video_master.json");
                master_script.outPath = "./produce/edited" + file_name;
                master_script.clips[0].layers[0].path = file_path;
                //master_script.clips[0].layers.push({ type: 'fabric', func });
                await editly(master_script).catch(console.error);

                return true;               
            }
            
            flow().then((value) => {
                //console.log("startVideoProduce: " + value)
                resolve(true);

                const {Storage} = require('@google-cloud/storage');

                // Creates a client
                const storage = new Storage();
                var bucket = storage.bucket('odin-prod-f0853.appspot.com');

                async function uploadFile() {
                    console.log("UP FILE TO FIREBASE");
                    /*
                    await bucket.upload("./produce/edited" + file_name, function(err, file) {
                        if(err)
                        {
                            console.log(err);
                            return;
                        }
                        console.log("UP FILE TO FIREBASE -------> DONE");
                    });*/

                    await bucket.upload("./produce/edited" + file_name);
                    
                    console.log("MAKE PUBLIC");
                    await bucket.file("edited" + file_name).makePublic();

                    console.log("MAKE PUBLIC -------> DONE");
                    Video.update({url_video_master: "https://storage.googleapis.com/odin-prod-f0853.appspot.com/edited" + file_name}, {
                        where: {
                            id: video_data.id
                        }
                    }).then(videoUpdated => {
                        console.log("videoUpdated: " + "./produce/edited" + file_name);
                    });

                }
                uploadFile().catch(console.error);

            });	
        })

    }
    
    function convertToMp4(inputFile){
        return new Promise(async (resolve, reject) => {
            ffmpeg(inputFile)
            .outputOptions("-c:v", "copy") // this will copy the data instead or reencode it
            .save(inputFile + ".mp4")
            .on('end', resolve)
            .on('error', reject)
            .run();
            /*
            ffmpeg()
            .input(inputFile)
            .outputOptions([`-preset veryfast`])
            .output(inputFile + ".mp4")
            .on('end', resolve)
            .on('error', reject)
            .run();*/
        });
    }

    function generateCoverImage(inputFile){
        return new Promise(async (resolve, reject) => {

            let flow = async () => {

                const getVideoInfo = (inputPath) => {
                    return new Promise((resolve, reject) => {
                      return ffmpeg.ffprobe(inputPath, (error, videoInfo) => {
                        if (error) {
                          return reject(error);
                        }
                  
                        const { duration, size } = videoInfo.format;
                  
                        return resolve({
                          size,
                          durationInSeconds: Math.floor(duration),
                        });
                      });
                    });
                };

                const getStartTimeInSeconds = (
                    videoDurationInSeconds,
                    fragmentDurationInSeconds,
                ) => {
                    // by subtracting the fragment duration we can be sure that the resulting
                    // start time + fragment duration will be less than the video duration
                    const safeVideoDurationInSeconds =
                    videoDurationInSeconds - fragmentDurationInSeconds;
                
                    // if the fragment duration is longer than the video duration
                    if (safeVideoDurationInSeconds <= 0) {
                    return 0;
                    }
                
                    return getRandomIntegerInRange(
                    0.25 * safeVideoDurationInSeconds,
                    0.75 * safeVideoDurationInSeconds,
                    );
                };

                const getRandomIntegerInRange = (min, max) => {
                    const minInt = Math.ceil(min);
                    const maxInt = Math.floor(max);
                
                    return Math.floor(Math.random() * (maxInt - minInt + 1) + minInt);
                };

                const { durationInSeconds: videoDurationInSeconds } = await getVideoInfo(
                    inputFile,
                );
            
                const startTimeInSeconds = getStartTimeInSeconds(
                    videoDurationInSeconds,
                    4,
                );
            
                return ffmpeg()
                .input(inputFile)
                .inputOptions([`-ss ${startTimeInSeconds}`])
                .outputOptions([`-t ${4}`])
                .noAudio()
                .output(inputFile + ".jpg")
                .on('end', resolve)
                .on('error', reject)
                .run();

            }
            
            flow().then((value) => {
                //console.log("startVideoProduce: " + value)
                resolve(true);
            });	

        });
    }

    function generateGif(edited_file_path){

        return new Promise(function (resolve, reject) {

            let flow = async () => {

                var gif_pre_script = require("./script_pre_gif.json");
                gif_pre_script.outPath = edited_file_path + "pre.gif";
                gif_pre_script.clips[0].layers[0].path = edited_file_path;
                await editly(gif_pre_script).catch(console.error);

                return ffmpeg()
				  .input(edited_file_path + "pre.gif")
				  .output(edited_file_path + "final.gif")
				  .outputOptions([`-filter_complex`, '[0]reverse[r];[0][r]concat=n=2:v=1:a=0,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse'])
				  .on('end', resolve)
				  .on('error', reject)
				  .run();

                /*
                //ffmpeg -i hypno02fps30.gif -filter_complex "[0]reverse[r];[0][r]concat=n=2:v=1:a=0,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse" output2.gif
                const str = "[0]reverse[r];[0][r]concat=n=2:v=1:a=0,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse";
                const child = execFile('ffmpeg', ['-i', edited_file_path + "pre.gif", '-filter_complex' , '[0]reverse[r];[0][r]concat=n=2:v=1:a=0,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse' , edited_file_path + "final.gif" ], (error, stdout, stderr) => {
                    console.log("dale");
                    if (error) {
                        console.error('stderr: =============================', stderr);
                        //throw error;
                    }
                    console.log('stdout: ==========================', stdout);

                    return true;
                });     */          
            }
            
            flow().then((value) => {
                //console.log("startVideoProduce: " + value)
                resolve(true);
            });	

        })

    }

	return {
        createVideo,
        mediaSign,
        mediaUpdate,
        getMedia
	};
};
