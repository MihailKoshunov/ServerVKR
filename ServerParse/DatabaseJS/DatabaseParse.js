const { masterKey } = require('parse');
const Parse = require('parse/node');


class DataBaseParse{

    constructor()
    {
        Parse.initialize('ZlsiMZJ6aPKhPV6q3mqvhWGfFjZjoSs6wnufXVOS','vz378sbnVI2IzYiYeYjoddKdUgDyZofyPoeEeQDp');
        Parse.serverURL = 'https://parseapi.back4app.com/';
        Parse.masterKey = 'qAY04OMJOXzRA6wgU7klQ2krUTZdkSDPWkO40AAE';
    }

    async LogInAccount(jsonMessage,wsClient,Mailer) {
        const User = Parse.Object.extend("User");
        const query = new Parse.Query(User);
        query.equalTo('email',jsonMessage.login);
        query.first().then((result)=>{
            const object = result;
            if (result.attributes.EmailIsVeryrified == false){
                Mailer.SendMailVeryfication(jsonMessage.login,wsClient, object.id);
            }
            else {
                Parse.User.logIn(object.attributes.username,jsonMessage.password).then(() =>{
                    wsClient.send(JSON.stringify({action: 'ENT_ACC', result: "succ", uid: object.id}));
                }).catch((error)=>{
                    console.log(error);
                    wsClient.send(message);
                });
            }
        }).catch((error)=>{
            console.log(error);
            let message = JSON.stringify({action: 'ENT_ACC', result: "not_succ"});
            console.log(message);
            wsClient.send(message);
        });
    }


    async SignInAccount(jsonMessage,wsClient,Mailer)
    {
        try{
            const user = new Parse.User();
            user.set("username", "UserTest");
            user.set("password", jsonMessage.password);
            user.set("email",jsonMessage.email);
            user.signUp().then((result) =>{
                Mailer.SendMailVeryfication(jsonMessage.email,wsClient,result.id);
                //wsClient.send(JSON.stringify({action: 'REG_ACC', result: "succ", uid: result.id}));
            })
            .catch((error)=>{
                console.log('Failed to create new object, with error code: ' + error);
                wsClient.send(JSON.stringify({action: 'REG_ACC', result: "not_succ"}));
            });
        }
        catch(error){
            console.log('Failed to create new object, with error code !');
            let error_message = JSON.stringify({action: 'REG_ACC', result: "not_succ"});
            wsClient.send(error_message);
        }
    } 
    
    async GetTasks(jsonMessage,wsClient)
    {
        const Task = Parse.Object.extend("Tasks");
        const query = new Parse.Query(Task);
        const TimezoneRus = "GMT+0300";
        query.equalTo("id_user",{"__type":"Pointer","className": "_User","objectId":jsonMessage.uid});
        query.find().then((result)=>{
            let b = {};
            for (let i = 0; i < result.length; i++) {
                const object = result[i];
                var date_start =  new Date(object.attributes.Start_Date+TimezoneRus);
                var date_end = new Date(object.attributes.End_Date+TimezoneRus);
                var Obj = {
                    [object.id]:{
                        Name: object.attributes.Name,
                        Description: object.attributes.Description,
                        Start_Date: date_start.getFullYear() + "-" + String(date_start.getMonth() + 1).padStart(2,'0') + "-" + String(date_start.getDate()).padStart(2,'0') + " " + String(date_start.getHours()).padStart(2,'0') +":" + String(date_start.getMinutes()).padStart(2,'0'),
                        End_Date: date_end.getFullYear() + "-" + String(date_end.getMonth() + 1).padStart(2,'0') + "-" + String(date_end.getDate()).padStart(2,'0')+ " " + String(date_end.getHours()).padStart(2,'0') +":" +  String(date_end.getMinutes()).padStart(2,'0'),
                        Status: object.attributes.Status_Task
                    } 
                };
                b = Object.assign(b,Obj);
            }
            wsClient.send(JSON.stringify({action: 'GET_TASKS', result:  b}));
        }).catch((error)=>{
            console.log(error);
            wsClient.send(JSON.stringify({action: 'GET_TASKS', result: "not_succ"}));
        }); 
    }

    async DeleteTask(jsonMessage,wsClient,Google)
    {
        const Tasks = Parse.Object.extend("Tasks");
        const query = new Parse.Query(Tasks);
        query.equalTo('objectId',jsonMessage.uid_task);
        query.first().then((result)=>{
            const id_google_event = result.attributes.Event_Google_Id;
            result.destroy().then(() =>{
                if (id_google_event != undefined && id_google_event != ''){
                    Google.DeleteEvent(jsonMessage,wsClient,id_google_event);
                }
                else {
                    wsClient.send(JSON.stringify({action: 'DEL_TASK', result: "succ"}));
                }
            }).catch((error)=>{
                console.log(error);
                wsClient.send(JSON.stringify({action: 'DEL_TASK', result: "not_succ"}));
            });
        }).catch((error)=>{
            console.log(error);
            wsClient.send(JSON.stringify({action: 'DEL_TASK', result: "not_succ"}));
        });
    }

    async AddTask(jsonMessage,wsClient,Google)
    {
        let Tasks = Parse.Object.extend("Tasks");
        let Task = new Tasks();
        Task.set("Start_Date",new Date());
        Task.set("End_Date", new Date(jsonMessage.DateEndTask));
        Task.set("Description",jsonMessage.DiscrTask);
        Task.set("Name",jsonMessage.NameTask);
        Task.set("id_user",{"__type":"Pointer","className": "_User","objectId":jsonMessage.uid});
        if (jsonMessage.auth_code != undefined) {
            Google.InsertEventTask(wsClient,jsonMessage,Task);
        } else {
            Task.save().then(()=>{
                wsClient.send(JSON.stringify({action: 'CREATE_TASK', result: "succ"})) 
             }).catch((error)=>{
                console.log(error);
                wsClient.send(JSON.stringify({action: 'CREATE_TASK', result: "not_succ"}))
            });
        }

    }

    async EditTask(jsonMessage,wsClient,Google)
    {
        var Tasks = Parse.Object.extend("Tasks");
        var query = new Parse.Query(Tasks);
        query.equalTo('objectId',jsonMessage.uid_task);
        query.first().then((result)=>{
            const id_google_event = result.attributes.Event_Google_Id;
            result.set("Start_Date",new Date(jsonMessage.date_start));
            result.set("End_Date",new Date(jsonMessage.date_end));
            result.set("Description",jsonMessage.description_task);
            result.set("Name",jsonMessage.name_task);
            result.save().then(()=>{
                if (id_google_event != undefined && id_google_event != ''){
                    Google.UpdateEventTask(jsonMessage,wsClient,id_google_event);
                } else {
                    let message = JSON.stringify({action: 'CHANGE_TASK', result: "succ"});
                    console.log(message);
                    wsClient.send(message);
                }
            }).catch((error)=>{
                console.log(error);
                wsClient.send(JSON.stringify({action: 'CHANGE_TASK', result: "not_succ"}));
            });
        }).catch((error)=>{
            console.log(error);
            wsClient.send(JSON.stringify({action: 'CHANGE_TASK', result: "not_succ"}));
        });   
    }

    async SignInAccountFromGoogle(jsonMessage,wsClient,Google){
        const User = Parse.Object.extend("User");
        const query = new Parse.Query(User);
        query.equalTo('username',jsonMessage.DisplayName);
            query.first().then((result)=>{
                const object = result;
                if (object != undefined){
                    Parse.User.logIn(object.attributes.username,jsonMessage.password).then(() =>{
                        Google.setAccessToken(jsonMessage);
                        wsClient.send(JSON.stringify({action: 'GOOGLE_ENT_ACC', result: "succ", uid: object.id}));
                   }).catch((error) =>{
                       console.log(error);
                       wsClient.send(JSON.stringify({action: 'GOOGLE_ENT_ACC', result: "not_succ"}));
                    });
                }
                else {
                    const user = new Parse.User();
                    user.set("username", jsonMessage.DisplayName);
                    user.set("password", jsonMessage.password);
                    user.set("email",jsonMessage.email);
                    user.signUp().then((result)=>{
                        Google.setAccessToken(jsonMessage);
                        wsClient.send(JSON.stringify({action: 'GOOGLE_ENT_ACC', result: "succ", uid: result.id}));
                    }).catch((error)=>{
                        console.log(error);
                        wsClient.send(JSON.stringify({action: 'GOOGLE_ENT_ACC', result: "not_succ"}));
                    });
                }
            }).catch((error)=>{
                console.log(error);
                wsClient.send(JSON.stringify({action: 'GOOGLE_ENT_ACC', result: "not_succ"}));
            });
    }

    async SetStatusTask(jsonMessage,wsClient){
        const Task = Parse.Object.extend("Tasks");
        const query = new Parse.Query(Task);
        var isTrueSet = (jsonMessage.change_task === 'True');
        query.equalTo("objectId",jsonMessage.uid_task);
        query.first().then((task)=>{
            task.set("Status_Task",isTrueSet);
            task.save().then(()=>{
                wsClient.send(JSON.stringify({action: 'SET_TASKS_DONE', result: "succ"}));
            });
        }).catch((error) =>{
            console.log(error);
            wsClient.send(JSON.stringify({action: 'SET_TASKS_DONE', result: "not_succ"}));
        });
    }

    async SyncCalendar(jsonMessage,wsClient,googleCalendar){
        const Task = Parse.Object.extend("Tasks");
        const query = new Parse.Query(Task);
        query.equalTo("id_user",{"__type":"Pointer","className": "_User","objectId":jsonMessage.uid});
        query.find().then((result)=>{
            googleCalendar.SyncGoogleCalendar(jsonMessage,result);
        });
    }


    async CodeVeryfication(jsonMessage,wsClient,Mailer){
        var User = Parse.Object.extend("User");
        var query = new Parse.Query(User);
        query.equalTo('objectId',jsonMessage.uid);
        query.first().then((result)=>{
            result.set("EmailIsVeryrified",true);
            result.save(null, {useMasterKey: true}).then(()=>{
              wsClient.send(JSON.stringify({action: 'CHECK_VERYFICATION', result: "succ"}));
            }).catch((error)=>{
                console.log(error);
                wsClient.send(JSON.stringify({action: 'CHECK_VERYFICATION', result: "not_succ"}));
            });
        }).catch((error)=>{
            console.log(error);
            wsClient.send(JSON.stringify({action: 'CHECK_VERYFICATION', result: "not_succ"}));
        });   
    }

}

module.exports = DataBaseParse;


