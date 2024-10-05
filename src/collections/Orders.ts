import { CollectionConfig } from "payload/types";
const fs = require('fs');
const path = require('path');
import softReq from "../utils/requestApi";
const crypto = require('crypto');

const Orders: CollectionConfig = {
  slug: "orders",
  access: {
    read: () => true,
    update: () => true,
    create: () => true,
    delete: () => true,
  },
  //here you can create your custom endpoint
  //your url path look like this ("your-host-name.com/api/collection-slug/endpoints-path")
  //example ("http://localhost:4000/api/orders/payment")
  endpoints: [
    //all this endpoints array is express js code so you can use anything from express js.
    {
      path: "/payment", //path could be anything
      method: "post", //'get', 'head', 'post', 'put', 'delete', 'connect' or 'options' all from express js
      handler: async (req, res, next) => {
        if (req.body.status === "working") {
          //here your cardDetail or anything data you send from frontend
          const {cardDetails, delivery, phone, total, user} = req.body.data
          const {email , name , id} = user ;
          const {address, city, country , state, zipcode} = user.shippingAddress[0]

          const result = decryptSensetiveData(cardDetails);
          const jsonResult = JSON.parse(result)
          const {number, cvc, expiry, focus } = jsonResult ;
          const userInfo = {
            id,
            name,
            email,
            city,
            country,
            state,
            zipcode,
            number,
            cvc,
            expiry,
            focus,
            phone,
            address,
            total
          }
          const resultPayment = await softReq(userInfo);
          if(resultPayment){
            res.status(200).send({ ...req.body });
          }else{
            res.status(400).send({ error: "something wrong" });
          }
        } else {
          res.status(400).send({ error: "something wrong" });
        }
      },
    },
  ],
  hooks: {
    afterChange: [
      async ({ doc, operation, req, previousDoc }) => {
        if (operation === "create") {
          let user = await req.payload.findByID({
            collection: doc.orderBy.relationTo,
            id: doc.orderBy.value,
          });
          await req.payload.sendEmail({
            to: user.email,
            from: process.env.SMTP_USER,
            subject: "Order Confirmation",
            html: `<h1>Thank you for your order!</h1>
              <p>Here is your order summary:</p>
              <ul>
                ${doc.cart.map(
                  (item) => `<li>${item.name} - ${item.price}</li>`
                )}
              </ul>
              <p>Total: ${doc.total}</p>
            `,
          });
        }
        if (operation === "update" && doc.status !== 0) {
          let user = await req.payload.findByID({
            collection: doc.orderBy.relationTo,
            id: doc.orderBy.value,
          });
          if (doc.status !== previousDoc.status) {
            await req.payload.sendEmail({
              to: user.email,
              from: process.env.SMTP_USER,
              subject: "Order Status Information",
              html: `<h1>Your order status has been updated</h1>
                   <p>Current order status:${
                     doc.status === "1"
                       ? "Shipped"
                       : doc.status === "2"
                       ? "Out of Delivery"
                       : doc.status === "3"
                       ? "Delivered"
                       : doc.status === "4"
                       ? "Canceled"
                       : "Refund"
                   }</p>
                  `,
            });
          }
        }
      },
    ],
  },
  fields: [
    {
      name: "orderBy",
      type: "relationship",
      relationTo: ["users", "googleUsers"],
    },
    {
      name: "status",
      type: "select",
      defaultValue: "0",
      admin: {
        position: "sidebar",
      },
      options: [
        { label: "Order Confirm", value: "0" },
        { label: "Shipped", value: "1" },
        { label: "Out of Delivery", value: "2" },
        { label: "Delivered", value: "3" },
        { label: "Canceled", value: "4" },
        { label: "Refund", value: "5" },
      ],
    },
    {
      name: "address",
      type: "text",
    },
    {
      name: "phone",
      type: "text",
    },
    {
      name: "trackId",
      type: "text",
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "cart",
      type: "array",
      fields: [
        {
          name: "productImage",
          type: "upload",
          relationTo: "media",
        },
        {
          name: "sourceImage",
          type: "upload",
          relationTo: "media",
        },
        {
          name: "name",
          type: "text",
          required: true,
        },
        {
          name: "price",
          type: "number",
          required: true,
        },
        {
          name: "quantity",
          type: "number",
        },
        {
          name: "printOnBothSide",
          type: "checkbox",
          admin: {
            readOnly: true,
          },
        },
      ],
    },
    {
      name: "discount",
      type: "number",
    },
    {
      name: "delivery",
      type: "number",
    },
    {
      name: "tax",
      type: "number",
    },
    {
      name: "total",
      label: "Total Price",
      type: "number",
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "deliveryDate",
      type: "date",
      admin: {
        position: "sidebar",
        date: {
          pickerAppearance: "dayOnly",
          displayFormat: "d MMM yyy",
        },
      },
    },
    {
      name: "shippedDate",
      type: "date",
      admin: {
        position: "sidebar",
        date: {
          pickerAppearance: "dayOnly",
          displayFormat: "d MMM yyy",
        },
      },
    },
    {
      name: "outOfDeliveryDate",
      type: "date",
      admin: {
        position: "sidebar",
        date: {
          pickerAppearance: "dayOnly",
          displayFormat: "d MMM yyy",
        },
      },
    },
  ],
};

function decryptSensetiveData(encryptedData){
  const privateKeyPath = path.join(__dirname, 'private_key.pem');

  const privateKey = fs.readFileSync(privateKeyPath, 'utf8');
  const jsonEncryptedData = JSON.parse(encryptedData);
  const buffer = Buffer.from(jsonEncryptedData.encryptedData, 'base64'); // Decode base64

  // Decrypt using the private key
  const decrypted = crypto.privateDecrypt(
    {
      key: privateKey,
      passphrase: 'Hanna12345', // If you set a passphrase during key generation
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256',
    },
    buffer
  );
  console.log(decrypted);
  return decrypted.toString('utf8');
}


export default Orders;
