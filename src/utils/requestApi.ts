import axios from 'axios';

 const softReq = async function softRequest(userInfo : any){
    const {name, number, cvc, expiry, focus, phone, address, total, email, id, zipcode, state, country, city } = userInfo ;
    const allName = name.split(" ");
    const firstName = allName[0];
    const lastName = allName[1];
    const url = `https://icom.yaad.net/p/?action=soft&Masof=0010287019&PassP=hyp1234&Amount=10&CC=4557430402053712&Tmonth=1&Tyear=2026&cvv=887&Coin=1&Info=test-api&Order=12345678910&Tash=1&UserId=203269535&ClientLName=${firstName}&ClientName=${lastName}&cell=${phone}&phone=${phone}&city=${city}&email=${email}&street=${state} ${city} ${country}&zip=${zipcode}&J5=False&MoreData=True&Postpone=False&Pritim=True&SendHesh=True&heshDesc=%5B0~Item+1~1~8%5D%5B0~Item+2~2~1%5D&sendemail=True&UTF8=True&UTF8out=False`
    let res : any ;
    try{    
      res = await axios.get(url);
      if(res.data.includes("&UID=") && res.data.includes("&BinCard=")){
        return true ;
      }else{
        return false ;
      }
    }catch(err){
      console.log(err)
    }
  }

  export default softReq ;