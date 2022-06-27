const { CourierClient } = require("@trycourier/courier");
const config = require('../Config/config.js');


class SendMailer{

  #courier
  #codeVeryfication
  constructor(){
    this.#courier = CourierClient({
      authorizationToken: config.tokenMailer});
  }

  getRandomInt() {
    return Math.floor(Math.random() * (9999 - 1000 + 1)) + 1000; //Максимум не включается, минимум включается
  }

  async SendMailVeryfication(toEmail,wsClient,iduser){
    this.#codeVeryfication = this.getRandomInt();
    this.#courier.send({
      message: {
        content: {
          title: "Авторизация аккаунта",
          body: "Код для входа в приложение: {{code}}"
        },
        data:{
          code: this.#codeVeryfication,
        },
        to: { email: toEmail }
      }
    }).then(()=>{
      console.log("Письмо отправленно !");
      wsClient.send(JSON.stringify({action: 'SEND_VERYFICATION', code_very: this.#codeVeryfication,uid: iduser}));
    }).catch((error)=>{
      console.log("Error " + error);
    });
  }
  
}

module.exports = SendMailer;