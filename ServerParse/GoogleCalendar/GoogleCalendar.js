'use strict';
const config = require('../Config/config.js');
const {google} = require('googleapis');


class GoogleCalendarApi {

    #oauth2Client
    #accessTokenClient
    #calendarClient
    constructor(){
        this.#oauth2Client = new google.auth.OAuth2(
            config.CLIENT_ID,
            config.SECRET_CLIENT_ID,
            config.URL_RES);       
    }

    async setAccessToken(jsonMessage){
        const code = jsonMessage.auth_code;
        var tokens = await this.#oauth2Client.getToken(code);
        this.#oauth2Client.setCredentials({access_token: tokens.res.data.access_token});
        this.#accessTokenClient = tokens.res.data.access_token;
        this.#calendarClient = google.calendar({version: 'v3',auth: this.#oauth2Client});
    }



    async SetEvent(calendar,oauth2ClientEx,event){
        let result = await calendar.events.insert({
            auth: oauth2ClientEx,
            calendarId: 'primary',
            resource: event,
        });
        return result;
    }

    async GetAllEvent(calendar,oauth2ClientEx){
        let result = await calendar.events.list({
            calendarId: 'primary',
            timeMin: (new Date(1970, 1, 1)).toISOString(),
            singleEvents: true,
            orderBy: 'startTime',
            auth: oauth2ClientEx

        });
        return result;
    }


    async SetDeleteEvent(calendar,oauth2ClientEx,events){
        let result = await calendar.events.delete({
            auth: oauth2ClientEx,
            calendarId: 'primary',
            eventId: events, });
        return result;
    }

    async InsertEventTask(wsClient,jsonMessage,Task){
        var googleApi = new GoogleCalendarApi;
        var date_start =  new Date();
        var date_end = new Date(jsonMessage.DateEndTask);
        let event = {
            'summary': jsonMessage.NameTask,
            'description': jsonMessage.DiscrTask,
            'start': {
                'dateTime': date_start.toISOString(),
            },
            'end': {
                'dateTime': date_end.toISOString(),
             },
        };
        googleApi.SetEvent(this.#calendarClient,this.#oauth2Client,event).then((result) => {
            Task.set("Event_Google_Id",result.data.id);
            Task.save().then(()=>{
                wsClient.send(JSON.stringify({action: 'CREATE_TASK', result: "succ"})) 
             }).catch((error)=>{
                console.log(error);
                wsClient.send(JSON.stringify({action: 'CREATE_TASK', result: "not_succ"}))
            });
        }).catch((err) => {
            console.log(err);
        });           
    }

    async InsertEventSync(resultData){
        const TimezoneRus = "GMT+0300";
        var googleApi = new GoogleCalendarApi;
        var date_start =  new Date(resultData.attributes.Start_Date+TimezoneRus);
        var date_end = new Date(resultData.attributes.End_Date+TimezoneRus);
        let event = {
            'summary': resultData.attributes.Name,
            'description': resultData.attributes.Description,
            'start': {
                'dateTime': date_start.toISOString(),
            },
            'end': {
                'dateTime': date_end.toISOString(),
            },
        };
        googleApi.SetEvent(this.#calendarClient,this.#oauth2Client,event).then((result) => {
            resultData.set("Event_Google_Id",result.data.id);
            resultData.save();
            return result;
        }).catch((err) => {
            return err;
        });
                
    }

    async DeleteEvent(jsonMessage,wsClient,resultData){     
        var googleApi = new GoogleCalendarApi;
            googleApi.GetAllEvent(this.#calendarClient).then((res) =>{
                const events = res.data.items;
                for (let i = 0; i < events.length;i++){
                    if (events[i].id == resultData){
                        googleApi.SetDeleteEvent(this.#calendarClient,this.#oauth2Client,events[i].id).then(()=>{
                            wsClient.send(JSON.stringify({action: 'DEL_TASK', result: "succ"}));
                        }).catch((err) =>{
                            console.log("Error delete event : " + err);
                        });
                    }
                }
            });
            
    }

    async UpdateEventTask(jsonMessage,wsClient,resultData){
        var googleApi = new GoogleCalendarApi;
        googleApi.GetAllEvent(this.#calendarClient).then((res) =>{
            const events = res.data.items;
            for (let i = 0; i < events.length;i++){
                if (events[i].id == resultData){

                    events[i].summary = jsonMessage.name_task;
                    events[i].description = jsonMessage.description_task;
                    if (jsonMessage.date_end > jsonMessage.date_start){
                        events[i].end.dateTime = new Date(jsonMessage.date_end);
                        events[i].start.dateTime = new Date(jsonMessage.date_start);
                    }
                    else {
                        events[i].end.dateTime = new Date(jsonMessage.date_start);
                        events[i].start.dateTime =  new Date(jsonMessage.date_end);
                    }
                    googleApi.UpdateEventGoogle(events[i],this.#calendarClient,this.#oauth2Client).then(()=>{
                        wsClient.send(JSON.stringify({action: 'CHANGE_TASK', result: "succ"}));
                    }).catch((error)=>{
                        console.log(error);
                        wsClient.send(JSON.stringify({action: 'CHANGE_TASK', result: "not_succ"}));
                    });
                }
            }
        });
        
    }

    async UpdateEventGoogle(value,calendarClientEx,oauth2ClientEx){
        let res = await calendarClientEx.events.update({
            auth: oauth2ClientEx,
            calendarId: 'primary',
            eventId: value.id,
            resource: value,
        });
        return res;
    }

    async UpdateCalendarSync(resultData,event,calendarClientEx,oauth2ClientEx){
        event.summary = resultData.attributes.Name;
        event.description = resultData.attributes.Description;
        if (resultData.attributes.End_Date > resultData.attributes.Start_Date){
            event.end.dateTime = resultData.attributes.End_Date;
            event.start.dateTime =resultData.attributes.Start_Date;
        }
        else {
            event.end.dateTime = resultData.attributes.Start_Date;
            event.start.dateTime = resultData.attributes.End_Date;
        }
        var googleApi = new GoogleCalendarApi;
        googleApi.UpdateEventGoogle(event,calendarClientEx,oauth2ClientEx).then(()=>{
            console.log("It's ok !")
        }).catch((error)=>{
            console.log(error);
        });
    }

    async SyncGoogleCalendar(jsonMessage,resultData){
        var googleApi = new GoogleCalendarApi;
        googleApi.GetAllEvent(this.#calendarClient).then((res) =>{
            const events = res.data.items;
            for (let i = 0; i < resultData.length; i++){
                //Если не занесён в гугл календарь
                if (resultData[i].attributes.Event_Google_Id == undefined){
                    googleApi.InsertEventSync(resultData[i]);
                }
                else if (resultData[i].attributes.Event_Google_Id != undefined && events.length == 0){
                    googleApi.InsertEventSync(resultData[i]);
                }
                //Если есть запись в календаре и в БД
                else {
                    googleApi.UpdateCalendarSync(resultData[i],events[i],this.#calendarClient,this.#oauth2Client);
                }
            }  

        }).catch((error)=>{
                console.log(error);
        });
    }

}


module.exports = GoogleCalendarApi;