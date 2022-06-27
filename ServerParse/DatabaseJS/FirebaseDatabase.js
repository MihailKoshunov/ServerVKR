const { getAuth, signInWithEmailAndPassword,createUserWithEmailAndPassword } = require('@firebase/auth');
const { getDatabase,ref,query, set, onValue,child,get,push,remove} = require('@firebase/database');
const { initializeApp } = require('@firebase/app');

class DatabaseFire{


    constructor(CONFIG_FIREBASE)
    {
        this.CONFIG = CONFIG_FIREBASE;
        this.app = initializeApp(this.CONFIG);
        this.db = getDatabase(this.app);
        this.firebaseauth = getAuth(this.app);
    }

    AuthUser(jsonMessage,wsClient)
    {
        const email = jsonMessage.login;
        const password = jsonMessage.password;
        signInWithEmailAndPassword(this.firebaseauth,email,password)
        .then((resultSign)=>{
            this.CreateTestTask(ref(this.db,'Users/'+resultSign.user.uid+'/Task'));
            wsClient.send(JSON.stringify({action: 'ENT_ACC', result: "succ", uid: resultSign.user.uid}));
        }).catch((error) => {
            console.log(error);
            wsClient.send(JSON.stringify({action: 'ENT_ACC', result: "not_succ"}));
        });
    }

    RegUser(jsonMessage,wsClient){
        const email = jsonMessage.email;
        const password = jsonMessage.password;
        createUserWithEmailAndPassword(this.firebaseauth,email,password)
        .then((resultReg) =>{            
            this.CreateTask(ref(this.db,'Users/'+resultReg.user.uid+'/Task'));
            wsClient.send(JSON.stringify({action: 'REG_ACC', result: "succ" , uid: resultReg.user.uid}));
        })
        .catch(()=>{
            console.log(error);
            wsClient.send(JSON.stringify({action: 'REG_ACC', result: "not_succ"}));
        });
    }

    GetAllTask(jsonMessage,wsClient)
    {
        const uid = jsonMessage.uid;
        const dbRef = ref(this.db);
        get(child(dbRef,'Users/'+ uid+'/Task')).then((snapshot) => {
            if (snapshot.exists())
            {
              console.log(snapshot.val());
              wsClient.send(JSON.stringify({action: 'GET_TASKS', result: snapshot.val()}));
            }
            else{
              console.log("no data available");
              wsClient.send(JSON.stringify({action: 'GET_TASKS', result: "not_succ"}));
            }
        }).catch((error) => {
            console.error(error);
            wsClient.send(JSON.stringify({action: 'GET_TASKS', result: "not_succ"}));
        });

    }

    DeleteTask(jsonMessage,wsClient)
    {
        const task_uid = jsonMessage.uid_task;
        const uid = jsonMessage.uid_us;
        remove(ref(this.db,'Users/'+ uid+'/Task/'+task_uid)).then(()=>{
            wsClient.send(JSON.stringify({action: 'DEL_TASK', result: "succ"}));
        }).catch((error) =>{
            console.log(error);
            wsClient.send(JSON.stringify({action: 'DEL_TASK', result: "not_succ"}));
        });
    }

    EditTask(jsonMessage,wsClient)
    {
        const uid = jsonMessage.uid;
        const uid_taks = jsonMessage.uid_task;
        const dateCreate = jsonMessage.date_start;
        const dateEnd = jsonMessage.date_end;
        try{
            this.CreateData('Users/'+uid+'/Task/'+uid_taks,
            jsonMessage.name_task,
            jsonMessage.description_task,
            dateCreate,dateEnd);
            wsClient.send(JSON.stringify({action: 'CHANGE_TASK', result: "succ"}));

        }
        catch(error){
            console.log(error);
            wsClient.send(JSON.stringify({action: 'CHANGE_TASK', result: "succ"}));
        }

    }


    CreateTask(jsonMessage,wsClient)
    {
        const uid = jsonMessage.uid;
        var today = new Date();
        const dateCreate = today.getDate() + "." + String(today.getMonth() + 1).padStart(2, '0') + "." + today.getFullYear();
        try{
            this.PushTask(ref(this.db,'Users/'+uid+'/Task'),
            jsonMessage.NameTask,jsonMessage.DiscrTask,
            dateCreate,jsonMessage.DateEndTask);
            wsClient.send(JSON.stringify({action: 'CREATE_TASK', result: "succ"}))
        }
        catch(error)
        {
            console.log(error);
            wsClient.send(JSON.stringify({action: 'CREATE_TASK', result: "not_succ"}))
        }
    }

    CreateData(Path,NameTask,DiscrTask,DateStartTask,DateEndTask)
    {
        set(ref(this.db,Path),{
            Name:NameTask,
            Description: DiscrTask,
            DateStart:DateStartTask,
            DateEnd:DateEndTask,
        });
    }

    CreateTestTask(Path)
    {
        push(Path,{
            Name:"TestName",
            Description: "Описание таска",
            DateStart:"19.02.2022",
            DateEnd:"24.02.2022",
        });
    }

    PushTask(Path,NameTask,DiscrTask,DateStartTask,DateEndTask)
    {
        push(Path,{
            Name:NameTask,
            Description: DiscrTask,
            DateStart:DateStartTask,
            DateEnd:DateEndTask,
        });
    }

}


module.exports = DatabaseFire;