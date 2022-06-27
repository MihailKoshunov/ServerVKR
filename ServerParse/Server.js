const config = require('./Config/config.js');
const CreateConnectParseDatabase = require('./DatabaseJS/DatabaseParse.js');
const CreateConnectDatabse = require('./DatabaseJS/FirebaseDatabase.js');
const GoogleCalendarApi = require('./GoogleCalendar/GoogleCalendar.js');
const WebSocket = require('ws');
const  SendMailer = require('./SenderMail/Mail.js');


class ServerJS{

    #wsServer;
    constructor(PORT,HOST)
    {
      this.PORT = parseInt(PORT);
      this.HOST = HOST;
    }

    CreateServer()
    {
        this.#wsServer = new WebSocket.Server({ port:this.PORT });
        this.#wsServer.on('connection',this.onConnect);
        console.log("Я включён на 9000 порте !")
    }

    onConnect(wsClient)
    {
        console.log('Новый пользователь');
        let Parse = new CreateConnectParseDatabase();
        let Google = new GoogleCalendarApi();
        let Mailer = new SendMailer();
        //let Firebase = new CreateConnectDatabse(config.firebaseConfig);

        wsClient.on('close',function() {
            console.log("User close connection");
        });

        wsClient.on('message', function(message) {
            try {
                const jsonMessage = JSON.parse(message);
                console.log(jsonMessage);
                switch (jsonMessage.action) {
                    case 'ENT_ACC':
                        Parse.LogInAccount(jsonMessage,wsClient,Mailer);
                        break;
                    case 'REG_ACC':
                        Parse.SignInAccount(jsonMessage,wsClient,Mailer);
                        break;
                    
                    case "GET_TASKS":
                        Parse.GetTasks(jsonMessage,wsClient);
                        break;

                    case "DEL_TASK":
                        Parse.DeleteTask(jsonMessage,wsClient,Google);
                        break;
                    
                    case "CHANGE_TASK":
                        Parse.EditTask(jsonMessage,wsClient,Google);
                        break;

                    case "CREATE_TASK":
                        Parse.AddTask(jsonMessage,wsClient,Google);
                        break;
                    
                    case "GOOGLE_ENT_ACC":
                        Parse.SignInAccountFromGoogle(jsonMessage,wsClient,Google);     
                        break;

                    case "SET_TASKS_DONE":
                        Parse.SetStatusTask(jsonMessage,wsClient);
                        break;
                    
                    case "SYNC_CALENDAR":
                        Parse.SyncCalendar(jsonMessage,wsClient,Google);
                        break;
                    
                    case "CHECK_VERYFICATION":
                        Parse.CodeVeryfication(jsonMessage,wsClient,Mailer);
                        break;
                     
                        
                    default:
                        console.log('Неизвестная команда');
                        break;
                }
            } catch (error) {
                console.log('Ошибка: ', error);
            }
        });


    }

}

const SetupServer = new ServerJS(config.port,config.host);
SetupServer.CreateServer();